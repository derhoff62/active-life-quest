// Equip system (Derek, Nov 22 8:53 PM: "I want the armor and weapons to
// change the avatar when equipped"). One weapon slot + one armor slot.
// A piece is a WEAPON if its name is a weapon kind (sword/blade, bow,
// staff, hammer, dagger, claws, lasso, shield); everything else is ARMOR.
// Only earned pieces can be equipped (enforced in Armor.tsx); the avatar
// only needs the id, and falls back to the class weapon when none is set.
import { ARMOR } from './data';
import type { ArmorPiece, ArmorTier } from './types';

export type EquipSlot = 'weapon' | 'armor';
export type WeaponKind =
  | 'sword'
  | 'bow'
  | 'staff'
  | 'hammer'
  | 'dagger'
  | 'claws'
  | 'lasso'
  | 'shield';
export type ArmorKind =
  | 'helm'
  | 'crown'
  | 'chest'
  | 'boots'
  | 'cloak'
  | 'hands'
  | 'belt'
  | 'pauldrons'
  | 'trim';

export function equipSlot(piece: ArmorPiece): EquipSlot {
  return weaponKind(piece) ? 'weapon' : 'armor';
}

export function weaponKind(piece: ArmorPiece): WeaponKind | null {
  const n = piece.name.toLowerCase();
  if (n.includes('claw')) return 'claws';
  if (n.includes('hammer')) return 'hammer';
  if (n.includes('shield')) return 'shield';
  if (n.includes('lasso')) return 'lasso';
  if (n.includes('dagger')) return 'dagger';
  if (n.includes('bow')) return 'bow';
  if (n.includes('staff')) return 'staff';
  if (n.includes('sword') || n.includes('blade')) return 'sword';
  return null;
}

export function armorKind(piece: ArmorPiece): ArmorKind {
  const n = piece.name.toLowerCase();
  if (n.includes('circlet') || n.includes('crown')) return 'crown';
  if (n.includes('helm')) return 'helm';
  if (n.includes('chestplate') || n.includes('tabard')) return 'chest';
  if (n.includes('boots') || n.includes('greaves') || n.includes('leggings')) return 'boots';
  if (n.includes('cloak') || n.includes('mantle')) return 'cloak';
  if (n.includes('glove') || n.includes('gauntlet') || n.includes('bracer')) return 'hands';
  if (n.includes('belt')) return 'belt';
  if (n.includes('pauldron')) return 'pauldrons';
  return 'trim';
}

// Tier accent colour for equipped gear: the trim / pauldrons / glow on
// the SVG guardian. Common is steel-grey, Rare blue, Legendary gold,
// Mythical purple — the same colours as the tier pills in the vault.
export function tierColor(tier: ArmorTier): string {
  if (tier === 'Mythical') return '#7b2fbe';
  if (tier === 'Legendary') return '#c9a227';
  if (tier === 'Rare') return '#2f6fd0';
  return '#7d93a8';
}

export function armorPieceById(id: string | undefined | null): ArmorPiece | undefined {
  if (!id) return undefined;
  return ARMOR.find((a) => a.id === id);
}

export function equippedWeaponName(guardian: { equippedWeaponId?: string } | null | undefined): string | undefined {
  return armorPieceById(guardian?.equippedWeaponId)?.name;
}

export function equippedArmorName(guardian: { equippedArmorId?: string } | null | undefined): string | undefined {
  return armorPieceById(guardian?.equippedArmorId)?.name;
}
