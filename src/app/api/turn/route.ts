import { NextResponse } from 'next/server';
import { generateDmTurn } from '@/lib/llm/provider';
import { buildSystemPrompt } from '@/lib/llm/system-prompt';
import { deriveDmTurnFromInput } from '@/lib/orchestrator/mock-dm';
import { runTurn } from '@/lib/orchestrator/run-turn';
import { getOrCreateSession, saveSession } from '@/lib/orchestrator/session-store';
import { writeDevLog } from '@/lib/logging/dev-log';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const sessionId = typeof body?.sessionId === 'string' && body.sessionId.length > 0 ? body.sessionId : 'local-default';
  const playerInput = typeof body?.playerInput === 'string' ? body.playerInput.slice(0, 800) : '';

  let state = getOrCreateSession(sessionId);
  const rawTurn =
    (await generateDmTurn({
      systemPrompt: buildSystemPrompt(state),
      playerInput,
    })) ?? deriveDmTurnFromInput(state, playerInput);
  const turn = runTurn(state, rawTurn);
  state = turn.state;

  saveSession(state);
  const response = { ...turn.response, sessionId };

  writeDevLog({ type: 'turn', sessionId, playerInput, response });

  return NextResponse.json(response);
}
