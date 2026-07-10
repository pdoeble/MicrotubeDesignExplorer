/// <reference lib="webworker" />

import { loadPyodide } from "pyodide";
import type { PyBuffer, PyCallable, PyProxy } from "pyodide/ffi";
import type { PyodideInterface } from "pyodide";
import type { SimulationResultPayload } from "../contracts/generated/simulation-result";
import { MICROTUBES_CORE_WHEEL_PATH, PYODIDE_RUNTIME_PATH } from "./runtime-config";
import {
  WORKER_PROTOCOL_VERSION,
  type WorkerComputeRequest,
  type WorkerErrorCode,
  type WorkerProgressStage,
  type WorkerRequestMessage,
  type WorkerResponseMessage,
} from "./protocol";

const PYTHON_BRIDGE = `
from microtubes_core.api import simulate
from microtubes_core.contracts import SimulationRequest

def __microtubes_run_simulation(request_json):
    request = SimulationRequest.model_validate_json(request_json)
    result = simulate(request)
    return {
        "payload": result.payload.model_dump(mode="json"),
        "arrays": list(result.arrays),
    }
`;

type Runtime = {
  pyodide: PyodideInterface;
  runSimulation: PyCallable;
};

let runtimePromise: Promise<Runtime> | null = null;
const cancelledRequests = new Set<string>();

self.onmessage = (event: MessageEvent<WorkerRequestMessage>) => {
  void handleMessage(event.data);
};

async function handleMessage(message: WorkerRequestMessage): Promise<void> {
  if (!isValidRequestEnvelope(message)) {
    postError("unknown", "WORKER_PROTOCOL_ERROR", "Invalid worker message envelope.");
    return;
  }

  if (message.type === "cancel") {
    cancelledRequests.add(message.target_request_id);
    postMessageToMain({
      protocol_version: WORKER_PROTOCOL_VERSION,
      type: "cancelled",
      request_id: message.target_request_id,
      message: "Cancellation recorded; an in-flight Python call may finish before it is observed.",
    });
    return;
  }

  if (message.type === "init") {
    try {
      await ensureRuntime(message.request_id);
      postMessageToMain({
        protocol_version: WORKER_PROTOCOL_VERSION,
        type: "ready",
        request_id: message.request_id,
      });
    } catch (error) {
      postError(message.request_id, "WORKER_INIT_FAILED", "Pyodide initialization failed.", error);
    }
    return;
  }

  await compute(message);
}

async function compute(message: WorkerComputeRequest): Promise<void> {
  if (cancelledRequests.has(message.request_id)) {
    cancelledRequests.delete(message.request_id);
    postCancelled(message.request_id);
    return;
  }

  try {
    const runtime = await ensureRuntime(message.request_id);
    if (cancelledRequests.has(message.request_id)) {
      cancelledRequests.delete(message.request_id);
      postCancelled(message.request_id);
      return;
    }

    postProgress(message.request_id, "computing", "Evaluating Python scientific core.");
    const resultProxy = runtime.runSimulation(JSON.stringify(message.request)) as PyProxy;
    try {
      postProgress(message.request_id, "serializing", "Serializing payload and numeric arrays.");
      const payloadProxy = resultProxy.get("payload") as PyProxy;
      const arraysProxy = resultProxy.get("arrays") as PyProxy;
      try {
        const payload = payloadProxy.toJs({
          dict_converter: Object.fromEntries,
        }) as SimulationResultPayload;
        const { buffers, transfer } = copyFloat64ArrayBuffers(arraysProxy);
        if (cancelledRequests.has(message.request_id)) {
          cancelledRequests.delete(message.request_id);
          postCancelled(message.request_id);
          return;
        }
        postMessageToMain(
          {
            protocol_version: WORKER_PROTOCOL_VERSION,
            type: "result",
            request_id: message.request_id,
            payload,
            arrays: buffers,
          },
          transfer,
        );
      } finally {
        payloadProxy.destroy();
        arraysProxy.destroy();
      }
    } finally {
      resultProxy.destroy();
    }
  } catch (error) {
    postError(message.request_id, "WORKER_COMPUTE_FAILED", "Python simulation failed.", error);
  }
}

async function ensureRuntime(requestId: string): Promise<Runtime> {
  runtimePromise ??= initializeRuntime(requestId);
  return runtimePromise;
}

async function initializeRuntime(requestId: string): Promise<Runtime> {
  const baseUrl = new URL(import.meta.env.BASE_URL, self.location.origin);
  const indexURL = new URL(PYODIDE_RUNTIME_PATH, baseUrl).toString();
  const wheelURL = new URL(MICROTUBES_CORE_WHEEL_PATH, baseUrl).toString();

  postProgress(requestId, "loading-pyodide", "Loading Pyodide runtime.");
  const pyodide = await loadPyodide({ indexURL });

  postProgress(requestId, "loading-packages", "Loading NumPy and Pydantic packages.");
  await pyodide.loadPackage(["numpy", "pydantic"], {
    errorCallback: (message) => postProgress(requestId, "loading-packages", message),
    messageCallback: (message) => postProgress(requestId, "loading-packages", message),
  });

  postProgress(requestId, "loading-core", "Loading microtubes_core wheel.");
  await pyodide.loadPackage(wheelURL, {
    errorCallback: (message) => postProgress(requestId, "loading-core", message),
    messageCallback: (message) => postProgress(requestId, "loading-core", message),
  });

  await pyodide.runPythonAsync(PYTHON_BRIDGE);
  const runSimulation = pyodide.globals.get("__microtubes_run_simulation") as PyCallable;
  postProgress(requestId, "ready", "Python worker is ready.");
  return { pyodide, runSimulation };
}

function copyFloat64ArrayBuffers(arraysProxy: PyProxy): {
  buffers: ArrayBuffer[];
  transfer: Transferable[];
} {
  const proxies = arraysProxy.toJs({ create_pyproxies: true, depth: 1 }) as PyBuffer[];
  const buffers: ArrayBuffer[] = [];
  const transfer: Transferable[] = [];
  try {
    for (const proxy of proxies) {
      const view = proxy.getBuffer("f64");
      try {
        if (!view.c_contiguous) {
          throw new Error("Expected C-contiguous float64 arrays from microtubes_core.");
        }
        if (!(view.data instanceof Float64Array)) {
          throw new Error("Expected float64 array buffer from microtubes_core.");
        }
        const copy = new Float64Array(view.data);
        buffers.push(copy.buffer);
        transfer.push(copy.buffer);
      } finally {
        view.release();
      }
    }
  } finally {
    for (const proxy of proxies) {
      proxy.destroy();
    }
  }
  return { buffers, transfer };
}

function postProgress(requestId: string, stage: WorkerProgressStage, message: string): void {
  postMessageToMain({
    protocol_version: WORKER_PROTOCOL_VERSION,
    type: "progress",
    request_id: requestId,
    stage,
    message,
  });
}

function postCancelled(requestId: string): void {
  postMessageToMain({
    protocol_version: WORKER_PROTOCOL_VERSION,
    type: "cancelled",
    request_id: requestId,
    message: "Request was cancelled before its result was delivered.",
  });
}

function postError(
  requestId: string,
  code: WorkerErrorCode,
  message: string,
  error?: unknown,
): void {
  postMessageToMain({
    protocol_version: WORKER_PROTOCOL_VERSION,
    type: "error",
    request_id: requestId,
    code,
    detail: error instanceof Error ? (error.stack ?? error.message) : String(error ?? ""),
    message,
  });
}

function postMessageToMain(message: WorkerResponseMessage, transfer?: Transferable[]): void {
  self.postMessage(message, transfer ?? []);
}

function isValidRequestEnvelope(value: unknown): value is WorkerRequestMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Partial<WorkerRequestMessage>;
  return (
    message.protocol_version === WORKER_PROTOCOL_VERSION &&
    typeof message.request_id === "string" &&
    (message.type === "init" || message.type === "compute" || message.type === "cancel")
  );
}
