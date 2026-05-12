import { NextResponse } from 'next/server';
import { generateDmTurn } from '@/lib/llm/provider';
import { buildSystemPrompt } from '@/lib/llm/system-prompt';
import { buildRecap } from '@/lib/game/recap';
import { deriveDmTurnFromInput } from '@/lib/orchestrator/mock-dm';
import { runTurn } from '@/lib/orchestrator/run-turn';
import { getOrCreateSession, nextTurnNumber, saveRecap, saveSession } from '@/lib/orchestrator/session-store';
import { writeDevLog } from '@/lib/logging/dev-log';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const sessionId = typeof body?.sessionId === 'string' && body.sessionId.length > 0 ? body.sessionId : 'local-default';
  const playerInput = typeof body?.playerInput === 'string' ? body.playerInput.slice(0, 800) : '';

  let state = getOrCreateSession(sessionId);
  const aiTurn = await generateDmTurn({
      systemPrompt: buildSystemPrompt(state),
      playerInput,
    });
  const fallbackUsed = !aiTurn;
  const rawTurn = aiTurn ?? deriveDmTurnFromInput(state, playerInput);
  const turn = runTurn(state, rawTurn, {
    mode: fallbackUsed ? 'table_rules' : 'ai_director',
    aiUsed: Boolean(aiTurn),
    fallbackUsed,
  });
  state = turn.state;

  saveSession(state);
  const turnNumber = nextTurnNumber(sessionId);
  const recap = buildRecap({
    state,
    turnNumber,
    outcome: turn.response.engineResults[0]?.summary ?? turn.response.narration,
    consequences: turn.response.engineResults.map((r) => r.summary),
    nextChoices: turn.response.nextChoices,
    nextHook: turn.response.nextHook,
    mode: turn.response.mode,
    aiUsed: turn.response.aiUsed,
    fallbackUsed: turn.response.fallbackUsed,
  });
  saveRecap(sessionId, recap);

  const narration = fallbackUsed
    ? `The wind shifts and the tale steadies itself. ${turn.response.narration}`
    : turn.response.narration;

  const response = { ...turn.response, narration, sessionId, recap };

  writeDevLog({ type: 'turn', sessionId, playerInput, response });

  return NextResponse.json(response);
}
