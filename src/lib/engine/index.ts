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
        { actorId: state.player.id, roll: d20() + 1 },
        ...state.monsters.map((m) => ({ actorId: m.id, roll: d20() + 1 })),
      ].sort((a, b) => b.roll - a.roll);
      const next = { ...state, combat: { active: true, initiative: init, turnIndex: 0 }, sceneId: 'combat' as const };
      return { state: appendLog(next, 'Combat started.'), result: { ok: true, summary: 'Initiative rolled.' } };
    }
    case 'player_attack': {
      const target = state.monsters.find((m) => m.id === request.targetId && m.hp > 0);
      if (!target) return { state, result: { ok: false, summary: 'No valid target.' } };
      const toHit = rollFormula('1d20', state.player.weapon.attackBonus);
      const critical = toHit.rolls[0] === 20;
      if (toHit.total < target.ac && !critical) {
        return { state: appendLog(state, `Attack missed ${target.name}.`), result: { ok: false, summary: 'Attack missed.', breakdown: toHit } };
      }
      const damage = rollFormula(critical ? '2d8' : '1d8', 3);
      const monsters = state.monsters.map((m) => m.id === target.id ? { ...m, hp: Math.max(0, m.hp - damage.total) } : m);
      let next = { ...state, monsters };
      const allDown = monsters.every((m) => m.hp <= 0);
      if (allDown) next = advanceScene({ ...next, combat: { ...next.combat, active: false } });
      return {
        state: appendLog(next, `${state.player.name} hit ${target.name} for ${damage.total}.`),
        result: { ok: true, summary: `Hit ${target.name} for ${damage.total} damage.`, breakdown: damage, critical },
      };
    }
    case 'monster_turn': {
      const attacker = state.monsters.find((m) => m.hp > 0);
      if (!attacker) return { state, result: { ok: true, summary: 'No monsters remain.' } };
      const toHit = rollFormula('1d20', attacker.attackBonus);
      if (toHit.total < state.player.ac) {
        return { state: appendLog(state, `${attacker.name} missed.`), result: { ok: false, summary: `${attacker.name} missed.`, breakdown: toHit } };
      }
      const dmg = rollFormula('1d6', 1);
      const hp = Math.max(0, state.player.hp - dmg.total);
      const next = { ...state, player: { ...state.player, hp } };
      return { state: appendLog(next, `${attacker.name} hit for ${dmg.total}.`), result: { ok: true, summary: `${attacker.name} hit you.`, breakdown: dmg } };
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
