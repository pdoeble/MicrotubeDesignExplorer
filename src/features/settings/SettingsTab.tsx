export function SettingsTab() {
  return (
    <section aria-labelledby="settings-heading">
      <h2 id="settings-heading">Settings</h2>
      <p className="placeholder-note" role="status">
        Display-only options (typography, axis behavior, export resolution, plot layout) are
        implemented in milestone M5. Settings never change model parameters.
      </p>
    </section>
  );
}
