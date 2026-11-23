// Shared guardian look options, used by GuardianAvatar, Onboarding, and
// Armor (Customize guardian), so the three screens can never drift apart.
// Colors are tunic colors; they must read clearly with the gold border,
// white text, and gem glow, in light and dark mode.
export const GUARDIAN_COLORS = [
  'Navy',
  'Forest',
  'Crimson',
  'Gold',
  'Teal',
  'Purple',
  'Silver',
  'Orange',
  'Pink',
  'Brown',
  'Black',
] as const;

export const COLOR_HEX: Record<string, string> = {
  Navy: '#124571',
  Forest: '#1e7a46',
  Crimson: '#a83232',
  Gold: '#c9a227',
  Teal: '#0e7a7a',
  Purple: '#6b3fa0',
  Silver: '#8a9aa8',
  Orange: '#c96a1e',
  Pink: '#c94f7c',
  Brown: '#7a4a21',
  Black: '#2b2f33',
};

export const GUARDIAN_GEMS = [
  'Sapphire',
  'Ruby',
  'Emerald',
  'Topaz',
  'Amethyst',
  'Diamond',
] as const;

export const GEM_HEX: Record<string, string> = {
  Sapphire: '#2f6fd0',
  Ruby: '#c22747',
  Emerald: '#1e9e5a',
  Topaz: '#e8a91c',
  Amethyst: '#8b5cf6',
  Diamond: '#9fc8e8',
};

export const GEM_LIGHT_HEX: Record<string, string> = {
  Sapphire: '#8db4f2',
  Ruby: '#f08a9d',
  Emerald: '#7ed3a4',
  Topaz: '#f7cf6b',
  Amethyst: '#c4a5f5',
  Diamond: '#ffffff',
};

// Hair styles, per look. Male "Short + beard" is the beard look; "Short"
// is clean-shaven; "Bald" is shaved with a beard, so the face is never bare.
// "Long" for Male is long hair with a beard. Female never has a beard.
export type GuardianLook = 'Female' | 'Male';
export const HAIR_OPTIONS: Record<GuardianLook, string[]> = {
  Female: ['Long', 'Ponytail', 'Bun', 'Curly', 'Braided', 'ShortBob', 'Topknot'],
  Male: ['Short', 'ShortBeard', 'Bald', 'Curly', 'Buzz', 'Long', 'ManBun'],
};
export const HAIR_LABELS: Record<string, string> = {
  Long: 'Long',
  Ponytail: 'Ponytail',
  Bun: 'Bun',
  Curly: 'Curly',
  Braided: 'Braided',
  ShortBob: 'Short bob',
  Topknot: 'Topknot',
  Short: 'Short',
  ShortBeard: 'Short + beard',
  Bald: 'Bald',
  Buzz: 'Buzz cut',
  ManBun: 'Man bun',
};
// Which hair styles have a beard (Male only, never Female).
export const HAIR_WITH_BEARD = ['ShortBeard', 'Bald', 'Long'];
export const DEFAULT_HAIR: Record<GuardianLook, string> = {
  Female: 'Long',
  Male: 'ShortBeard',
};
export function hairForLook(look: GuardianLook | undefined, hair: string | undefined): string {
  const l: GuardianLook = look === 'Male' ? 'Male' : 'Female';
  const opts = HAIR_OPTIONS[l];
  return hair && opts.includes(hair) ? hair : DEFAULT_HAIR[l];
}

// Body shape: Slim, Athletic, Strong. A small width change only, heroic
// and respectful, never a joke or a body-warping effect.
export const BUILD_OPTIONS = ['Slim', 'Athletic', 'Strong'] as const;
export type BuildType = (typeof BUILD_OPTIONS)[number];
export function buildWidth(build: string | undefined): number {
  if (build === 'Slim') return 0.88;
  if (build === 'Strong') return 1.14;
  return 1;
}
