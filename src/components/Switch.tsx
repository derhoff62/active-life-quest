/** A large, obvious slider switch: track + sliding thumb, OFF left, ON right. */
export default function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <span className="switch-wrap">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch ${checked ? 'switch-on' : 'switch-off'}`}
        onClick={onChange}
      >
        <span className="switch-track-label switch-off-label" aria-hidden>OFF</span>
        <span className="switch-thumb" aria-hidden />
        <span className="switch-track-label switch-on-label" aria-hidden>ON</span>
      </button>
      <span className="switch-state">{checked ? 'On' : 'Off'}</span>
      {hint && <span className="switch-hint">{hint}</span>}
    </span>
  );
}
