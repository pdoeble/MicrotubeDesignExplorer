import type { LinkGroup } from "../state/simulationStore";

export function LinkedGroupNotice({
  group,
  sourceLabel,
  title,
  onUnlink,
}: {
  group: LinkGroup;
  sourceLabel: string;
  title: string;
  onUnlink: (group: LinkGroup) => void;
}) {
  return (
    <section className="linked-group-notice" aria-label={`${title} linked`}>
      <div>
        <strong>{title} is linked</strong>
        <p>These values follow {sourceLabel}. Unlink to configure this design independently.</p>
      </div>
      <button className="text-button" type="button" onClick={() => onUnlink(group)}>
        Edit separately
      </button>
    </section>
  );
}
