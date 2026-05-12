import { createInitialState } from '@/lib/game/state';
import type { GameState } from '@/lib/game/types';

const sessions = new Map<string, GameState>();

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
