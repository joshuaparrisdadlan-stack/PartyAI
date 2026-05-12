export type Skill =
  | 'acrobatics' | 'animal_handling' | 'arcana' | 'athletics'
  | 'deception' | 'history' | 'insight' | 'intimidation'
  | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleight_of_hand'
  | 'stealth' | 'survival';

export type EngineRequest =
  | { kind: 'skill_check'; skill: Skill; dc: number; reason: string }
  | { kind: 'start_combat' }
  | { kind: 'player_attack'; targetId: string }
  | { kind: 'monster_turn' }
  | { kind: 'use_feature'; featureId: 'second_wind' };

export type RollBreakdown = {
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
};

export type EngineResult = {
  ok: boolean;
  summary: string;
  breakdown?: RollBreakdown;
  critical?: boolean;
};
