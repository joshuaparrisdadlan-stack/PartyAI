import { dmTurnSchema, type DmTurn } from './contracts';

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    engineRequests: {
      type: 'array',
      items: {
        oneOf: [
          { type: 'object', additionalProperties: false, properties: { kind: { const: 'skill_check' }, skill: { type: 'string' }, dc: { type: 'integer' }, reason: { type: 'string' } }, required: ['kind', 'skill', 'dc', 'reason'] },
          { type: 'object', additionalProperties: false, properties: { kind: { const: 'start_combat' } }, required: ['kind'] },
          { type: 'object', additionalProperties: false, properties: { kind: { const: 'player_attack' }, targetId: { type: 'string' } }, required: ['kind', 'targetId'] },
          { type: 'object', additionalProperties: false, properties: { kind: { const: 'monster_turn' } }, required: ['kind'] },
          { type: 'object', additionalProperties: false, properties: { kind: { const: 'use_feature' }, featureId: { const: 'second_wind' } }, required: ['kind', 'featureId'] },
        ],
      },
      maxItems: 2,
    },
    narration: { type: 'string' },
    needsResultBeforeNarrating: { type: 'boolean' },
  },
  required: ['engineRequests', 'narration', 'needsResultBeforeNarrating'],
} as const;

type Input = { systemPrompt: string; playerInput: string };

export async function generateDmTurn(input: Input): Promise<DmTurn | null> {
  const provider = (process.env.PARTYQUEST_LLM_PROVIDER ?? 'groq').toLowerCase();

  if (provider === 'openai') {
    return generateWithOpenAI(input);
  }

  const groqTurn = await generateWithGroq(input);
  if (groqTurn) return groqTurn;

  return generateWithOpenAI(input);
}

async function generateWithGroq(input: Input): Promise<DmTurn | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.playerInput },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'partyquest_turn',
          schema: responseSchema,
        },
      },
      temperature: 0.4,
    }),
  });

  if (!r.ok) return null;
  const data = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content;
  if (!text) return null;

  return parseTurn(text);
}

async function generateWithOpenAI(input: Input): Promise<DmTurn | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';

  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.playerInput },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'partyquest_turn',
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  if (!r.ok) return null;
  const data = (await r.json()) as { output_text?: string };
  if (!data.output_text) return null;

  return parseTurn(data.output_text);
}

function parseTurn(raw: string): DmTurn | null {
  try {
    const parsedJson = JSON.parse(raw);
    const parsed = dmTurnSchema.safeParse(parsedJson);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
