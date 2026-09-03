import type { GameState } from '@/lib/game/types';
import { advanceScene } from '@/lib/game/state';
import type { EngineRequest, EngineResult, RollBreakdown } from './types';

export function resolveEngineRequest(state: GameState, request: EngineRequest): { state: GameState; result: EngineResult } {
  switch (request.kind) {
    case 'skill_check': {
      const mod = state.player.skills[request.skill] ?? 0;
      const breakdown = rollFormula('1d20', mod);
      const ok = breakdown.total >= request.dc;
      const next = ok && state.sceneId !== 'combat' ? advanceScene(state) : state;
      return {
        state: appendLog(next, `${request.skill} check ${ok ? 'passed' : 'failed'} (${breakdown.total} vs DC ${request.dc})`),
        result: { ok, summary: `${request.reason}: ${ok ? 'success' : 'failure'}`, breakdown },
      };
    }
    case 'start_combat': {
      const init = [
        { actorId: state.player.id, roll: d20() + state.player.abilities.dex },
        ...state.monsters.map((m) => ({ actorId: m.id, roll: d20() + 2 })), // Add a default dex mod of 2 for monsters
      ].sort((a, b) => {
        if (a.roll === b.roll) return a.actorId === state.player.id ? -1 : 1; // Player wins ties
        return b.roll - a.roll;
      });
      const next = { ...state, combat: { active: true, initiative: init, turnIndex: 0, round: 1 }, sceneId: 'combat' as const };
      return { state: appendLog(next, 'Combat started.'), result: { ok: true, summary: 'Initiative rolled.' } };
    }
    case 'player_attack': {
      if (!state.combat.active) return { state, result: { ok: false, summary: 'Combat is not active.' } };
      
      const currentActor = state.combat.initiative[state.combat.turnIndex];
      if (currentActor?.actorId !== state.player.id) {
         return { state, result: { ok: false, summary: 'It is not your turn.' } };
      }

      const target = state.monsters.find((m) => m.id === request.targetId && m.hp > 0);
      if (!target) return { state, result: { ok: false, summary: 'No valid target.' } };
      const toHit = rollFormula('1d20', state.player.weapon.attackBonus);
      const critical = toHit.rolls[0] === 20;
      let nextState = state;
      let resultSummary = '';
      
      if (toHit.total < target.ac && !critical) {
        nextState = appendLog(nextState, `Attack missed ${target.name}.`);
        resultSummary = `Attack missed.`;
        return { state: advanceTurn(nextState), result: { ok: false, summary: resultSummary, breakdown: toHit } };
      }
      
      const damage = rollFormula(critical ? '2d8' : '1d8', 3);
      const monsters = nextState.monsters.map((m) => m.id === target.id ? { ...m, hp: Math.max(0, m.hp - damage.total) } : m);
      nextState = { ...nextState, monsters };
      nextState = appendLog(nextState, `${state.player.name} hit ${target.name} for ${damage.total}.`);
      
      const allDown = monsters.every((m) => m.hp <= 0);
      if (allDown) {
        nextState = advanceScene({ ...nextState, combat: { ...nextState.combat, active: false } });
        return { state: nextState, result: { ok: true, summary: `Hit ${target.name} for ${damage.total} damage. Combat ends!`, breakdown: damage, critical } };
      }
      
      return {
        state: advanceTurn(nextState),
        result: { ok: true, summary: `Hit ${target.name} for ${damage.total} damage.`, breakdown: damage, critical },
      };
    }
    case 'monster_turn': {
      if (!state.combat.active) return { state, result: { ok: false, summary: 'Combat is not active.' } };
      
      const currentActor = state.combat.initiative[state.combat.turnIndex];
      if (!currentActor || currentActor.actorId === state.player.id) {
         return { state, result: { ok: false, summary: 'It is not a monster turn.' } };
      }
      
      const attacker = state.monsters.find((m) => m.id === currentActor.actorId);
      if (!attacker || attacker.hp <= 0) {
        return { state: advanceTurn(state), result: { ok: true, summary: 'Monster is dead or missing, skipping turn.' } };
      }

      if (state.player.hp <= 0) {
        return { state, result: { ok: false, summary: 'Player is unconscious.' } };
      }

      const toHit = rollFormula('1d20', attacker.attackBonus);
      if (toHit.total < state.player.ac) {
        const nextState = appendLog(state, `${attacker.name} missed.`);
        return { state: advanceTurn(nextState), result: { ok: false, summary: `${attacker.name} missed.`, breakdown: toHit } };
      } else {
        const dmg = rollFormula('1d6', 1);
        const hp = Math.max(0, state.player.hp - dmg.total);
        let nextState = { ...state, player: { ...state.player, hp } };
        nextState = appendLog(nextState, `${attacker.name} hit for ${dmg.total}.`);
        if (hp <= 0) {
          nextState = advanceScene({ ...nextState, combat: { ...nextState.combat, active: false } });
          return { state: nextState, result: { ok: true, summary: `${attacker.name} knocked you unconscious!`, breakdown: dmg } };
        }
        return { state: advanceTurn(nextState), result: { ok: true, summary: `${attacker.name} hit you for ${dmg.total}.`, breakdown: dmg } };
      }
    }
    case 'use_feature': {
      const idx = state.player.features.findIndex((f) => f.id === request.featureId);
      if (idx < 0) return { state, result: { ok: false, summary: 'Feature not found.' } };
      const feature = state.player.features[idx];
      if (feature.usesRemaining <= 0) return { state, result: { ok: false, summary: 'No uses remaining.' } };
      const heal = rollFormula('1d10', state.player.level);
      const hp = Math.min(state.player.maxHp, state.player.hp + heal.total);
      const features = state.player.features.map((f, i) => i === idx ? { ...f, usesRemaining: f.usesRemaining - 1 } : f);
      const next = { ...state, player: { ...state.player, hp, features } };
      return { state: appendLog(next, `Second Wind restored ${heal.total} HP.`), result: { ok: true, summary: 'Second Wind used.', breakdown: heal } };
    }
  }
}

function appendLog(state: GameState, line: string): GameState {
  return { ...state, log: [...state.log, line] };
}

function advanceTurn(state: GameState): GameState {
  if (!state.combat.active || state.combat.initiative.length === 0) return state;
  let nextIndex = state.combat.turnIndex + 1;
  let nextRound = state.combat.round;
  
  if (nextIndex >= state.combat.initiative.length) {
    nextIndex = 0;
    nextRound += 1;
  }
  
  return {
    ...state,
    combat: {
      ...state.combat,
      turnIndex: nextIndex,
      round: nextRound
    }
  };
}

function d20() {
  return Math.floor(Math.random() * 20) + 1;
}

function rollFormula(formula: string, fallbackMod = 0): RollBreakdown {
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return { formula, rolls: [], modifier: fallbackMod, total: fallbackMod };
  const count = Number(match[1]);
  const sides = Number(match[2]);
  const inlineMod = match[3] ? Number(match[3]) : fallbackMod;
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((a, b) => a + b, 0) + inlineMod;
  return { formula, rolls, modifier: inlineMod, total };
}
