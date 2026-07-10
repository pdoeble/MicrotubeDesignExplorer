import { useCallback, useRef, type KeyboardEvent, type ReactNode } from "react";

export interface TabDefinition {
  /** Stable kebab-case identifier, also used in the URL hash. */
  id: string;
  label: string;
  panel: ReactNode;
}

interface TabsProps {
  tabs: readonly TabDefinition[];
  activeId: string;
  onActivate: (id: string) => void;
  /** Accessible name of the tablist. */
  ariaLabel: string;
}

/**
 * WAI-ARIA Tabs pattern (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):
 * roving tabindex, arrow-key navigation with automatic activation
 * (panels are preloaded, so activation is instantaneous), Home/End support.
 */
export function Tabs({ tabs, activeId, onActivate, ariaLabel }: TabsProps) {
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const ids = tabs.map((t) => t.id);
      const currentIndex = ids.indexOf(activeId);
      if (currentIndex < 0) return;

      let nextIndex: number | undefined;
      switch (event.key) {
        case "ArrowRight":
          nextIndex = (currentIndex + 1) % ids.length;
          break;
        case "ArrowLeft":
          nextIndex = (currentIndex - 1 + ids.length) % ids.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = ids.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      const nextId = ids[nextIndex];
      if (nextId !== undefined) {
        onActivate(nextId);
        tabRefs.current.get(nextId)?.focus();
      }
    },
    [tabs, activeId, onActivate],
  );

  return (
    <>
      <div className="tablist" role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}>
        {tabs.map((tab) => {
          const selected = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
                else tabRefs.current.delete(tab.id);
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={selected ? "tab tab--active" : "tab"}
              onClick={() => onActivate(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== activeId}
          className="tabpanel"
          tabIndex={0}
        >
          {tab.panel}
        </div>
      ))}
    </>
  );
}
