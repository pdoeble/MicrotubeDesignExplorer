import type { ChangeEvent } from "react";
import {
  specDisplayValue,
  specInternalValue,
  valueOutsideSpec,
  type ParameterSpec,
} from "../features/input/parameterManifest";

type ParameterControlProps = {
  id: string;
  spec: ParameterSpec;
  value: number;
  onChange: (value: number) => void;
  onReset: () => void;
};

export function ParameterControl({ id, spec, value, onChange, onReset }: ParameterControlProps) {
  const displayValue = specDisplayValue(spec, value);
  const displayMinimum = specDisplayValue(spec, spec.minimum);
  const displayMaximum = specDisplayValue(spec, spec.maximum);
  const sliderValue = sliderPosition(spec, displayValue);
  const invalid = valueOutsideSpec(spec, value);

  const onNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (Number.isFinite(next)) onChange(specInternalValue(spec, next));
  };

  const onSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = Number(event.target.value);
    const next = spec.scale === "log" ? 10 ** raw : raw;
    onChange(specInternalValue(spec, next));
  };

  return (
    <div className="parameter-control">
      <div className="parameter-control__header">
        <label htmlFor={`${id}-number`}>{spec.label}</label>
        <button type="button" className="text-button" onClick={onReset}>
          Reset
        </button>
      </div>
      <div className="parameter-control__inputs">
        <input
          id={`${id}-range`}
          type="range"
          min={sliderPosition(spec, displayMinimum)}
          max={sliderPosition(spec, displayMaximum)}
          step={spec.scale === "log" ? 0.001 : (spec.step_display ?? "any")}
          value={sliderValue}
          onChange={onSliderChange}
          aria-label={`${spec.label} slider`}
        />
        <div className="number-with-unit">
          <input
            id={`${id}-number`}
            type="number"
            min={displayMinimum}
            max={displayMaximum}
            step={spec.step_display ?? "any"}
            value={formatDisplayValue(displayValue)}
            onChange={onNumberChange}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${id}-error` : undefined}
          />
          <span>{spec.display_unit}</span>
        </div>
      </div>
      {spec.description ? (
        <p className="parameter-control__description">{spec.description}</p>
      ) : null}
      {invalid ? (
        <p id={`${id}-error`} className="field-error">
          Value must remain between {formatDisplayValue(displayMinimum)} and{" "}
          {formatDisplayValue(displayMaximum)} {spec.display_unit}.
        </p>
      ) : null}
    </div>
  );
}

function sliderPosition(spec: ParameterSpec, displayValue: number): number {
  if (spec.scale === "linear") return displayValue;
  return Math.log10(Math.max(displayValue, Number.MIN_VALUE));
}

function formatDisplayValue(value: number): string {
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toPrecision(6);
  return Number(value.toPrecision(8)).toString();
}
