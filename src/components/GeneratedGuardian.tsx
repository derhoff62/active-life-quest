// GeneratedGuardian — TRY-OUT (Nov 22, 2026). Shows one of the 3 finished
// generated-guardian composites (guardian cut out onto its detailed
// background) instead of the SVG GuardianAvatar. Only 3 combos exist as
// generated art; every other combo returns null and the caller falls back
// to the SVG, which stays the default and the fallback. The picture is a
// flat image, so animation is CSS only: a gentle idle bob and a whole-image
// glow shimmer (brightness + gold drop-shadow). That brightens the whole
// figure, not just the gems — a masked gem glow needs a second glow-variant
// image, which does not exist for these composites. Cape sway is NOT done:
// rotating a flat image tilts the head, sword and shield too.
// Reduced motion: the app's FAQ toggle (.reduced-motion) and the OS
// prefers-reduced-motion setting both turn the animation off.
import type { GuardianState } from '../lib/store';
import { generatedImageFor, generatedLabelFor } from '../lib/generatedGuardians';

export default function GeneratedGuardian({
  guardian,
  label,
}: {
  guardian: GuardianState | null | undefined;
  label?: string;
}) {
  const src = generatedImageFor(guardian);
  if (!src || !guardian) return null;
  const alt = label || generatedLabelFor(guardian) || 'Your guardian';
  return (
    <div className="gen-guardian-wrap">
      <img className="gen-guardian-bob gen-glow-pulse-single" src={src} alt={alt} />
    </div>
  );
}
