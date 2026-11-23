// generatedSkin — skin-tone recolour for the GENERATED guardians (Nov 22, 2026).
//
// Derek: "Can you figure out how to keep customization with the generated ones?"
//
// What was tried, honestly, before this was picked:
// - Armour / overall colour: REJECTED. The generated armour is silver-grey,
//   the same colour as the sword blade and shield, so colourising "silver"
//   turns the sword and shield green/red too (verified on a render: a Forest
//   armour test gave the guardian a green sword). The torso cannot be
//   separated from the weapons by colour.
// - Gem: REJECTED. The gem red is the same hue as the crimson legs, so a
//   gem recolour would recolour the legs too.
// - Cape: REJECTED. The cape is near-black, the same as every outline in
//   the picture, so recolouring black would tint all the outlines.
// - Build: REJECTED. A raster figure can only be squashed wider/narrower,
//   which distorts the face; the SVG's true build change is torso-only.
// - Key-colour regeneration (regenerate all 18 with skin/hair/armour in
//   unique placeholder colours, then swap at runtime): the only route that
//   would bring armour/gem/cape back, but it needs all 18 regenerated AND
//   a real host (R2, which Derek must create in the dashboard). Not
//   buildable from here today, so it stays open, not faked.
// - Skin: WORKS. The generated skin is a distinct light peach
//   (measured ~#fdad7a on Guardian Male, ~#fbceab on Spellweaver Female):
//   bright, warm, R well above B, G well above B. Hair is much darker
//   brown, armour is grey (R~G~B), legs are crimson (G~20), the cape is
//   near-black, the glow is golden-white (G too high). So a colour-range
//   mask picks out face + hands and almost nothing else. Verified in
//   Python on all 3 live composites, recolored to Deep and to Fair and
//   read back: face and hands change tone, the sandy castle path, the
//   forest, the moon, the runes and the weapon glows are untouched.
//   The one limit: the Ranger's brown leather outfit has a few light
//   highlights that fall in the skin range, so a couple of small outfit
//   patches shift tone slightly with the skin. At preview size it reads
//   as shading, not as a fault, and the face/hands are the clear change.
//
// How it works: for each pixel in the top 78% of the picture (the sandy
// path sits below that, so it is never touched even if a path pixel
// matched), if it matches the skin range, replace it with the picked skin
// tone scaled by the pixel's own luminance relative to the measured base
// skin luminance. That keeps the picked tone's hue exactly, and keeps the
// original shading (cheeks lighter, shadows darker). Pure functions, so
// they can be unit-tested without a browser canvas.

export function isGeneratedSkinPixel(r: number, g: number, b: number): boolean {
  // Tightened after a unit test caught a gold glow colour (255, 215, 140)
  // matching the first draft: real glow pixels are either brighter
  // (star glow 255, 247, 145 — g too high) or more yellow (arrow-tip glow
  // 246, 208, 104 — b too low and g-b too high), so b >= 100 and
  // g-b <= 100 exclude them while keeping every measured skin tone.
  return r > 200 && g > 140 && g < 225 && b >= 100 && b < 190 && r - b > 65 && g - b > 25 && g - b <= 100 && r - g > 35;
}

// Luminance of the measured base skin colour (253, 173, 122).
const BASE_SKIN_LUM = 0.299 * 253 + 0.587 * 173 + 0.114 * 122;

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function recolorGeneratedSkinPixel(
  r: number,
  g: number,
  b: number,
  targetHex: string,
): [number, number, number] {
  const [tr, tg, tb] = hexToRgb(targetHex);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const f = lum / BASE_SKIN_LUM;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return [clamp(tr * f), clamp(tg * f), clamp(tb * f)];
}

// Recolour the skin pixels of an ImageData in place. Only the top
// `topFraction` of the image is scanned (default 0.78): the class
// backgrounds' sandy paths and ground sit below that line.
export function recolorGeneratedSkinImage(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  targetHex: string,
  topFraction = 0.78,
): void {
  const maxY = Math.floor(height * topFraction);
  for (let y = 0; y < maxY; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (isGeneratedSkinPixel(r, g, b)) {
        const [nr, ng, nb] = recolorGeneratedSkinPixel(r, g, b, targetHex);
        data[i] = nr;
        data[i + 1] = ng;
        data[i + 2] = nb;
      }
    }
  }
}
