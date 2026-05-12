import { z } from 'zod';

const skillSchema = z.enum([
  'acrobatics', 'animal_handling', 'arcana', 'athletics',
  'deception', 'history', 'insight', 'intimidation',
  'investigation', 'medicine', 'nature', 'perception',
  'performance', 'persuasion', 'religion', 'sleight_of_hand',
  'stealth', 'survival',
]);

const engineRequestSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('skill_check'), skill: skillSchema, dc: z.number().int().min(1).max(30), reason: z.string() }),
  z.object({ kind: z.literal('start_combat') }),
  z.object({ kind: z.literal('player_attack'), targetId: z.string() }),
  z.object({ kind: z.literal('monster_turn') }),
  z.object({ kind: z.literal('use_feature'), featureId: z.literal('second_wind') }),
]);

export const dmTurnSchema = z.object({
  engineRequests: z.array(engineRequestSchema).max(2),
  narration: z.string().min(1).max(2000),
  needsResultBeforeNarrating: z.boolean(),
});

export type DmTurn = z.infer<typeof dmTurnSchema>;
