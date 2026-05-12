import { resolveEngineRequest } from '@/lib/engine';
import { dmTurnSchema, type DmTurn } from '@/lib/llm/contracts';
import { oneShot } from '@/lib/game/one-shot';
import type { GameState } from '@/lib/game/types';

export type TurnResult = {
  ok: boolean;
  sceneId: GameState['sceneId'];
  sceneGoal: string;
  sceneStarter?: string;
  narration: string;
  engineResults: Array<{ kind: string; summary: string; ok: boolean; breakdown?: unknown; critical?: boolean }>;
  state: {
    player: {
      name: string;
      hp: number;
      maxHp: number;
      ac: number;
      features: GameState['player']['features'];
    };
    monsters: { id: string; name: string; hp: number; maxHp: number; ac: number }[];
    combat: GameState['combat'];
    log: string[];
  };
};

export function runTurn(state: GameState, rawTurn: unknown): { state: GameState; response: TurnResult } {
  const prevScene = state.sceneId;
  const parsed = dmTurnSchema.safeParse(rawTurn);
  const fallback: DmTurn = {
    engineRequests: [],
    narration: 'I could not interpret that action. Try a clear intent like "I attack" or "I ask Mira about the courier."',
    needsResultBeforeNarrating: false,
  };
  const turn = parsed.success ? parsed.data : fallback;

  const engineResults = [] as TurnResult['engineResults'];
  const limitedRequests = turn.engineRequests.slice(0, 2);

  for (const request of limitedRequests) {
    const resolved = resolveEngineRequest(state, request);
    state = resolved.state;
    engineResults.push({ kind: request.kind, ...resolved.result });
  }

  const sceneData = oneShot.scenes[state.sceneId as keyof typeof oneShot.scenes];
  const sceneStarter = state.sceneId !== prevScene ? sceneData?.starter : undefined;

  return {
    state,
    response: {
      ok: true,
      sceneId: state.sceneId,
      sceneGoal: sceneData?.goal ?? 'Finish the adventure.',
      sceneStarter,
      narration: turn.narration,
      engineResults,
      state: {
        player: {
          name: state.player.name,
          hp: state.player.hp,
          maxHp: state.player.maxHp,
          ac: state.player.ac,
          features: state.player.features,
        },
        monsters: state.monsters.map((m) => ({ id: m.id, name: m.name, hp: m.hp, maxHp: m.maxHp, ac: m.ac })),
        combat: state.combat,
        log: state.log.slice(-10),
      },
    },
  };
}
