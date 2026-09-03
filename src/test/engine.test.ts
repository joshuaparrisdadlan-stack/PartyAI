import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/lib/game/state';
import { resolveEngineRequest } from '@/lib/engine';
import { runTurn } from '@/lib/orchestrator/run-turn';

describe('engine combat and initiative', () => {
  it('starts combat and sorts combatants by initiative (player wins on tie)', () => {
    const state = createInitialState('t1');
    const out = resolveEngineRequest(state, { kind: 'start_combat' });
    expect(out.state.combat.active).toBe(true);
    expect(out.state.combat.initiative.length).toBe(3); // Player + 2 monsters
    expect(out.state.combat.turnIndex).toBe(0);
    expect(out.state.combat.round).toBe(1);
    
    // Check sorting
    for (let i = 0; i < out.state.combat.initiative.length - 1; i++) {
      expect(out.state.combat.initiative[i].roll).toBeGreaterThanOrEqual(out.state.combat.initiative[i+1].roll);
    }
  });

  it('1. player wins initiative and can act', () => {
    let state = createInitialState('t2');
    state.sceneId = 'combat';
    state.combat = {
      active: true,
      round: 1,
      turnIndex: 0,
      initiative: [
        { actorId: state.player.id, roll: 20 },
        { actorId: 'bandit-1', roll: 10 }
      ]
    };
    
    const out = resolveEngineRequest(state, { kind: 'player_attack', targetId: 'bandit-1' });
    expect(out.result.ok).toBe(true);
    expect(out.state.combat.turnIndex).toBe(1); // Turn advanced
  });

  it('2. monster wins initiative (player cannot act if not their turn)', () => {
    let state = createInitialState('t3');
    state.sceneId = 'combat';
    state.combat = {
      active: true,
      round: 1,
      turnIndex: 0,
      initiative: [
        { actorId: 'bandit-1', roll: 20 },
        { actorId: state.player.id, roll: 10 }
      ]
    };
    
    const out = resolveEngineRequest(state, { kind: 'player_attack', targetId: 'bandit-1' });
    expect(out.result.ok).toBe(false);
    expect(out.result.summary).toBe('It is not your turn.');
    expect(out.state.combat.turnIndex).toBe(0); // Turn did not advance
  });

  it('3. two monsters both receive turns via orchestrator auto-cycling', () => {
    let state = createInitialState('t4');
    state.sceneId = 'combat';
    state.combat = {
      active: true,
      round: 1,
      turnIndex: 0,
      initiative: [
        { actorId: 'bandit-1', roll: 20 },
        { actorId: 'bandit-2', roll: 15 },
        { actorId: state.player.id, roll: 10 }
      ]
    };
    
    const { state: nextState, response } = runTurn(state, { engineRequests: [], narration: 'Wait', needsResultBeforeNarrating: false }, { mode: 'table_rules', aiUsed: false, fallbackUsed: false });
    
    expect(nextState.combat.turnIndex).toBe(2);
    expect(nextState.combat.initiative[nextState.combat.turnIndex].actorId).toBe(state.player.id);
    expect(response.engineResults.filter(r => r.kind === 'monster_turn').length).toBe(2);
  });

  it('4. player cannot act twice in one round', () => {
    let state = createInitialState('t5');
    state.sceneId = 'combat';
    state.combat = {
      active: true,
      round: 1,
      turnIndex: 0,
      initiative: [
        { actorId: state.player.id, roll: 20 },
        { actorId: 'bandit-1', roll: 10 }
      ]
    };
    
    let out = resolveEngineRequest(state, { kind: 'player_attack', targetId: 'bandit-1' });
    expect(out.result.ok).toBe(true);
    expect(out.state.combat.turnIndex).toBe(1);
    
    let out2 = resolveEngineRequest(out.state, { kind: 'player_attack', targetId: 'bandit-1' });
    expect(out2.result.ok).toBe(false);
    expect(out2.result.summary).toBe('It is not your turn.');
  });

  it('5. dead monster is skipped', () => {
    let state = createInitialState('t6');
    state.sceneId = 'combat';
    state.monsters[0].hp = 0; 
    state.combat = {
      active: true,
      round: 1,
      turnIndex: 0,
      initiative: [
        { actorId: state.monsters[0].id, roll: 20 }, 
        { actorId: state.player.id, roll: 10 }
      ]
    };
    
    const out = resolveEngineRequest(state, { kind: 'monster_turn' });
    expect(out.result.ok).toBe(true);
    expect(out.result.summary).toBe('Monster is dead or missing, skipping turn.');
    expect(out.state.combat.turnIndex).toBe(1);
  });

  it('6. initiative cycles into the next round', () => {
    let state = createInitialState('t7');
    state.sceneId = 'combat';
    state.combat = {
      active: true,
      round: 1,
      turnIndex: 1,
      initiative: [
        { actorId: state.player.id, roll: 20 },
        { actorId: 'bandit-1', roll: 10 } 
      ]
    };
    
    const out = resolveEngineRequest(state, { kind: 'monster_turn' });
    expect(out.result.ok).toBe(true);
    expect(out.state.combat.turnIndex).toBe(0);
    expect(out.state.combat.round).toBe(2);
  });

  it('7. killing the last monster ends combat', () => {
    let state = createInitialState('t8');
    state.sceneId = 'combat';
    state.monsters[0].hp = 1; 
    state.monsters[1].hp = 0; 
    state.combat = {
      active: true,
      round: 1,
      turnIndex: 0,
      initiative: [
        { actorId: state.player.id, roll: 20 },
        { actorId: state.monsters[0].id, roll: 10 }
      ]
    };
    
    state.monsters[0].ac = -100;
    
    const out = resolveEngineRequest(state, { kind: 'player_attack', targetId: state.monsters[0].id });
    expect(out.result.ok).toBe(true);
    expect(out.state.combat.active).toBe(false); 
    expect(out.state.sceneId).toBe('ending'); 
  });

  it('8. player reaching 0 HP ends/prevents normal player action appropriately', () => {
    let state = createInitialState('t9');
    state.sceneId = 'combat';
    state.player.hp = 0;
    state.combat = {
      active: true,
      round: 1,
      turnIndex: 0,
      initiative: [
        { actorId: 'bandit-1', roll: 20 },
        { actorId: state.player.id, roll: 10 }
      ]
    };
    
    const out = resolveEngineRequest(state, { kind: 'monster_turn' });
    expect(out.result.ok).toBe(false);
    expect(out.result.summary).toBe('Player is unconscious.');
    
    const out2 = resolveEngineRequest(state, { kind: 'player_attack', targetId: 'bandit-1' });
    expect(out2.result.ok).toBe(false);
  });

  it('9. initiative order remains valid when a combatant dies', () => {
    let state = createInitialState('t10');
    state.sceneId = 'combat';
    state.monsters[0].hp = 1;
    state.combat = {
      active: true,
      round: 1,
      turnIndex: 0,
      initiative: [
        { actorId: state.player.id, roll: 20 },
        { actorId: state.monsters[0].id, roll: 15 },
        { actorId: state.monsters[1].id, roll: 10 }
      ]
    };
    
    state.monsters[0].ac = -100; 
    const out = resolveEngineRequest(state, { kind: 'player_attack', targetId: state.monsters[0].id });
    expect(out.state.combat.turnIndex).toBe(1);
    
    const out2 = resolveEngineRequest(out.state, { kind: 'monster_turn' });
    expect(out2.result.summary).toBe('Monster is dead or missing, skipping turn.');
    expect(out2.state.combat.turnIndex).toBe(2); 
  });
  
  it('10. narration cannot alter authoritative engine state', () => {
    const state = createInitialState('t11');
    const hpBefore = state.player.hp;
    
    const rawTurn = {
      engineRequests: [{ kind: 'player_attack', targetId: 'fake-id' }],
      narration: 'The DM narrates that you completely destroy the enemy and heal fully!',
      needsResultBeforeNarrating: false,
    };
    
    const { state: nextState, response } = runTurn(state, rawTurn, { mode: 'ai_director', aiUsed: true, fallbackUsed: false });
    
    expect(response.narration).toBe(rawTurn.narration);
    expect(nextState.player.hp).toBe(hpBefore);
    expect(response.engineResults[0].ok).toBe(false);
  });
});
