import { createInitialState } from '@/lib/game/state';
import type { PartyQuestRecap } from '@/lib/game/recap';
import type { GameState } from '@/lib/game/types';

const sessions = new Map<string, GameState>();
const turnCounters = new Map<string, number>();
const latestRecaps = new Map<string, PartyQuestRecap>();

export function getOrCreateSession(sessionId: string): GameState {
  const current = sessions.get(sessionId);
  if (current) return current;
  const next = createInitialState(sessionId);
  sessions.set(sessionId, next);
  return next;
}

export function saveSession(state: GameState): void {
  sessions.set(state.sessionId, state);
}

export function nextTurnNumber(sessionId: string): number {
  const current = turnCounters.get(sessionId) ?? 0;
  const next = current + 1;
  turnCounters.set(sessionId, next);
  return next;
}

export function saveRecap(sessionId: string, recap: PartyQuestRecap): void {
  latestRecaps.set(sessionId, recap);
}

export function getRecap(sessionId: string): PartyQuestRecap | null {
  return latestRecaps.get(sessionId) ?? null;
}
