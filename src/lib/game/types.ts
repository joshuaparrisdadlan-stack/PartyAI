export type SceneId = 'social' | 'exploration' | 'combat' | 'ending';

export type Character = {
  id: string;
  name: string;
  level: number;
  className: string;
  ac: number;
  maxHp: number;
  hp: number;
  proficiencyBonus: number;
  abilities: Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>;
  skills: Partial<Record<string, number>>;
  features: { id: string; name: string; usesMax: number; usesRemaining: number; rechargeOn: 'short_rest' | 'long_rest' }[];
  weapon: { name: string; attackBonus: number; damage: string };
};

export type Monster = {
  id: string;
  name: string;
  ac: number;
  maxHp: number;
  hp: number;
  attackBonus: number;
  damage: string;
};

export type CombatState = {
  active: boolean;
  initiative: { actorId: string; roll: number }[];
  turnIndex: number;
};

export type GameState = {
  sessionId: string;
  sceneId: SceneId;
  log: string[];
  player: Character;
  monsters: Monster[];
  combat: CombatState;
};
