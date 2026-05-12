import type { Character } from './types';

export const pregenFighter: Character = {
  id: 'pc-fighter-1',
  name: 'Seren Ashfall',
  level: 3,
  className: 'Fighter',
  ac: 17,
  maxHp: 28,
  hp: 28,
  proficiencyBonus: 2,
  abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 11, cha: 13 },
  skills: { athletics: 5, perception: 2, intimidation: 3, history: 2 },
  features: [{ id: 'second_wind', name: 'Second Wind', usesMax: 1, usesRemaining: 1, rechargeOn: 'short_rest' }],
  weapon: { name: 'Longsword', attackBonus: 5, damage: '1d8+3' },
};
