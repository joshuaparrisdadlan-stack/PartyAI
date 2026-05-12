import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/lib/game/state';
import { resolveEngineRequest } from '@/lib/engine';

describe('engine', () => {
  it('resolves skill checks with valid shape', () => {
    const state = createInitialState('t1');
    const out = resolveEngineRequest(state, { kind: 'skill_check', skill: 'history', dc: 10, reason: 'Recall lore' });
    expect(typeof out.result.ok).toBe('boolean');
    expect(out.result.breakdown?.formula).toBe('1d20');
  });

  it('starts combat with initiative order', () => {
    const state = createInitialState('t2');
    const out = resolveEngineRequest(state, { kind: 'start_combat' });
    expect(out.state.combat.active).toBe(true);
    expect(out.state.combat.initiative.length).toBe(3);
  });
});
