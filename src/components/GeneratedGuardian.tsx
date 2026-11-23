// GeneratedGuardian — ALL 18 COMBOS (Nov 22, 2026). Layered render: one of
// the 3 detailed class backgrounds, with the cut-out generated figure on
// top (transparent WebP, 600px tall). The figure bobs (CSS, 2s, -8px) and
// glows (whole-image shimmer, brightness + gold drop-shadow) while the
// ground shadow stays put, like the SVG's shadow. A flat image cannot do
// cape sway or a masked gem glow. Reduced motion: the app's FAQ toggle
// (.reduced-motion) and the OS prefers-reduced-motion setting both turn
// the animation off. Any combo with no picture returns null and the caller
// falls back to the SVG GuardianAvatar, which stays the default.
// Skin: the figure is recolored at runtime on a canvas, using
// lib/generatedSkin (colour-range mask: face + hands only, background
// untouched because it is a separate layer). Light is the baked-in tone,
// so it is used as-is with no recolor pass.
import { useEffect, useState } from 'react';
import type { GuardianState } from '../lib/store';
import { SKIN_HEX } from '../lib/guardianOptions';
import { recolorGeneratedSkinImage } from '../lib/generatedSkin';
import {
  BACKGROUND_ASPECT,
  generatedBackgroundFor,
  generatedFigureFor,
  generatedLabelFor,
} from '../lib/generatedGuardians';

export default function GeneratedGuardian({
  guardian,
  label,
}: {
  guardian: GuardianState | null | undefined;
  label?: string;
}) {
  const figure = generatedFigureFor(guardian);
  const background = generatedBackgroundFor(guardian);
  const skin = guardian?.skinColor || 'Light';
  const [figureSrc, setFigureSrc] = useState<string | null>(figure);

  useEffect(() => {
    if (!figure) {
      setFigureSrc(null);
      return;
    }
    if (!skin || skin === 'Light') {
      setFigureSrc(figure);
      return;
    }
    const target = SKIN_HEX[skin];
    if (!target) {
      setFigureSrc(figure);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setFigureSrc(figure);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        recolorGeneratedSkinImage(imageData.data, canvas.width, canvas.height, target);
        ctx.putImageData(imageData, 0, 0);
        setFigureSrc(canvas.toDataURL('image/webp', 0.9));
      } catch {
        setFigureSrc(figure);
      }
    };
    img.onerror = () => {
      if (!cancelled) setFigureSrc(figure);
    };
    img.src = figure;
    return () => {
      cancelled = true;
    };
  }, [figure, skin]);

  if (!figureSrc || !background || !guardian) return null;
  const alt = label || generatedLabelFor(guardian) || 'Your guardian';
  const aspect = BACKGROUND_ASPECT[guardian.classId] || '3 / 2';
  return (
    <div className="gen-guardian-wrap" style={{ aspectRatio: aspect }}>
      <img className="gen-guardian-bg" src={background} alt="" aria-hidden="true" />
      <div className="gen-guardian-shadow" aria-hidden="true" />
      <div className="gen-guardian-bob gen-guardian-figure">
        <img className="gen-glow-pulse-single" src={figureSrc} alt={alt} />
      </div>
    </div>
  );
}
