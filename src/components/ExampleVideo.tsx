import { useState } from 'react';

/** A video player that fails gracefully. The assessment and workout
 * example clips are deferred (the files are not hosted yet), so a plain
 * <video> would sit there black and broken. If the file does not load,
 * show a short honest note instead of a dead player. */
export default function ExampleVideo({ src, label }: { src?: string; label?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <p className="small muted">Example video coming later. Read the steps above for now.</p>;
  }
  return (
    <>
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        style={{ width: '100%', maxHeight: 320, borderRadius: 8 }}
        onError={() => setFailed(true)}
      />
      {label && <p className="small muted">Video: {label}</p>}
    </>
  );
}
