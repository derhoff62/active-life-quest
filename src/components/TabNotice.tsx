// The "what needs doing" notice at the top of a tab: what the gold badge
// on that tab means, in plain words, with a button that takes you to the
// thing to do. Only renders when the tab has a badge; it disappears the
// moment the thing is done, because the notice is recomputed from the
// profile on every render.
import type { NoticeAction, TabNotice } from '../lib/tabNotices';

export default function TabNoticeCard({
  notice,
  onAction,
}: {
  notice: TabNotice;
  onAction: (action: NoticeAction) => void;
}) {
  return (
    <div className="notice" role="status">
      <strong>To do:</strong> {notice.text}
      <div className="row" style={{ marginTop: 8 }}>
        {notice.actions.map((a) => (
          <button key={a.label} className="primary" onClick={() => onAction(a)}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
