# PartyQuest V0

Initial scaffold for the PartyQuest V0 prototype.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Zod
- Vitest

## Current status
- ✅ Project scaffolded with pnpm
- ✅ `/play` route created
- ✅ `/api/turn` route stub created
- ✅ Basic engine contract + resolver scaffold in `src/lib/engine`
- ✅ First Vitest test running
- ✅ Source planning docs copied into `docs/`
- ✅ API route now supports Groq-first provider flow (with OpenAI fallback) plus local mock DM fallback

## Environment
```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
PARTYQUEST_LLM_PROVIDER=groq
PARTYQUEST_DEV_LOGS=true
```

## Run
```bash
pnpm dev
```

## Test
```bash
pnpm test
```
