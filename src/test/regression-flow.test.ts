import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '@/lib/game/state';
import { deriveDmTurnFromInput } from '@/lib/orchestrator/mock-dm';
import { runTurn } from '@/lib/orchestrator/run-turn';

describe('regression flow', () => {
  afterEach(() => vi.restoreAllMocks());

  it('progresses social -> exploration -> combat -> ending under deterministic high rolls', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    let state = createInitialState('flow-1');

    // social check succeeds -> exploration
    state = runTurn(state, deriveDmTurnFromInput(state, 'I ask Mira about the courier')).state;
    expect(state.sceneId).toBe('exploration');

    // exploration check succeeds -> combat
    state = runTurn(state, deriveDmTurnFromInput(state, 'I inspect the tracks')).state;
    expect(state.sceneId).toBe('combat');

    // two crit attacks (with 2d8+3 on nat20) remove both monsters
    state = runTurn(state, deriveDmTurnFromInput(state, 'I attack')).state;
    state = runTurn(state, deriveDmTurnFromInput(state, 'I attack again')).state;

    expect(state.monsters.every((m) => m.hp <= 0)).toBe(true);
    expect(state.sceneId).toBe('ending');
  });
});
