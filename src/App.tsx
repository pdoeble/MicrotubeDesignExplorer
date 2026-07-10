import { useCallback, useEffect, useState } from "react";
import { Tabs, type TabDefinition } from "./components/Tabs";
import { StartTab } from "./features/start/StartTab";
import { InputTab } from "./features/input/InputTab";
import { MaterialsTab } from "./features/materials/MaterialsTab";
import { ResultPlotsTab } from "./features/plots/ResultPlotsTab";
import { SettingsTab } from "./features/settings/SettingsTab";

const TAB_IDS = ["start", "input", "materials", "result-plots", "settings"] as const;
type TabId = (typeof TAB_IDS)[number];

function isTabId(value: string): value is TabId {
  return (TAB_IDS as readonly string[]).includes(value);
}

function tabIdFromHash(): TabId {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return isTabId(hash) ? hash : "start";
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => tabIdFromHash());

  useEffect(() => {
    const onHashChange = () => setActiveTab(tabIdFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const activate = useCallback((id: string) => {
    if (isTabId(id)) {
      setActiveTab(id);
      window.history.replaceState(null, "", `#/${id}`);
    }
  }, []);

  const tabs: TabDefinition[] = [
    { id: "start", label: "Start", panel: <StartTab /> },
    { id: "input", label: "Input", panel: <InputTab /> },
    { id: "materials", label: "Materials", panel: <MaterialsTab /> },
    { id: "result-plots", label: "Result Plots", panel: <ResultPlotsTab /> },
    { id: "settings", label: "Settings", panel: <SettingsTab /> },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Microtube Design Explorer</h1>
        <p className="app-subtitle">
          Companion to “Local Resistance-Based Design-Space Analysis of Polyamide Microtubes for
          Compact Heat Exchangers”
        </p>
      </header>
      <main>
        <Tabs tabs={tabs} activeId={activeTab} onActivate={activate} ariaLabel="Main sections" />
      </main>
    </div>
  );
}
