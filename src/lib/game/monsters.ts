import type { Monster } from './types';

export function buildCombatMonsters(): Monster[] {
  return [
    { id: 'bandit-1', name: 'Dockside Ruffian', ac: 12, maxHp: 11, hp: 11, attackBonus: 3, damage: '1d6+1' },
    { id: 'bandit-2', name: 'Lantern Thug', ac: 12, maxHp: 11, hp: 11, attackBonus: 3, damage: '1d6+1' },
  ];
}
