import { pregenFighter } from './pregens';
import { buildCombatMonsters } from './monsters';
import type { GameState, SceneId } from './types';

export function createInitialState(sessionId: string): GameState {
  return {
    sessionId,
    sceneId: 'social',
    log: [],
    player: structuredClone(pregenFighter),
    monsters: buildCombatMonsters(),
    combat: { active: false, initiative: [], turnIndex: 0 },
  };
}

export function advanceScene(state: GameState): GameState {
  const order: SceneId[] = ['social', 'exploration', 'combat', 'ending'];
  const i = order.indexOf(state.sceneId);
  if (i < 0 || i === order.length - 1) return state;
  return { ...state, sceneId: order[i + 1] };
}
