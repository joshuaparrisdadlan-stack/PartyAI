'use client';

import { useMemo, useState } from 'react';

type TurnResponse = {
  ok: boolean;
  sessionId: string;
  sceneId: string;
  sceneGoal: string;
  sceneStarter?: string;
  narration: string;
  engineResults: { kind: string; summary: string; ok: boolean }[];
  state: {
    player: { name: string; hp: number; maxHp: number; ac: number; features: { id: string; name: string; usesRemaining: number }[] };
    monsters: { id: string; name: string; hp: number; maxHp: number; ac: number }[];
    log: string[];
  };
};

export default function PlayPage() {
  const sessionId = useMemo(() => `sess-${Math.random().toString(36).slice(2, 10)}`, []);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(['Welcome to PartyQuest.']);
  const [state, setState] = useState<TurnResponse['state'] | null>(null);
  const [sceneId, setSceneId] = useState('social');
  const [sceneGoal, setSceneGoal] = useState('Learn where the missing courier went.');
  const [busy, setBusy] = useState(false);

  async function sendTurn() {
    if (!input.trim() || busy) return;
    const nextInput = input;
    setInput('');
    setBusy(true);
    setHistory((h) => [...h, `> ${nextInput}`]);

    try {
      const res = await fetch('/api/turn', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, playerInput: nextInput }),
      });
      const data = (await res.json()) as TurnResponse;
      if (!data.ok) throw new Error('Turn failed');

      setSceneId(data.sceneId);
      setSceneGoal(data.sceneGoal);
      setState(data.state);

      const lines = [
        ...(data.sceneStarter ? [`Scene shift: ${data.sceneStarter}`] : []),
        data.narration,
        ...data.engineResults.map((r) => `• ${r.summary}`),
      ];
      setHistory((h) => [...h, ...lines]);
    } catch (err) {
      setHistory((h) => [...h, `Error: ${(err as Error).message}`]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-6 md:grid-cols-[2fr_1fr]">
      <section className="rounded border bg-white p-4">
        <h1 className="text-2xl font-bold">PartyQuest — V0 Playtest</h1>
        <p className="mt-1 text-sm text-zinc-600">Scene: <b>{sceneId}</b> · Goal: {sceneGoal}</p>

        <div className="mt-4 h-[430px] overflow-y-auto rounded border bg-zinc-50 p-3 text-sm">
          {history.map((line, i) => <p key={`${line}-${i}`} className="mb-2 whitespace-pre-wrap">{line}</p>)}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendTurn()}
            className="flex-1 rounded border px-3 py-2"
            placeholder="Try: I ask Mira about the courier / I attack"
          />
          <button onClick={sendTurn} disabled={busy} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
            {busy ? '...' : 'Send'}
          </button>
        </div>
      </section>

      <aside className="rounded border bg-white p-4 text-sm">
        <h2 className="font-semibold">Character</h2>
        {!state ? <p className="mt-2 text-zinc-600">No turn yet.</p> : (
          <>
            <p className="mt-2">{state.player.name}</p>
            <p>HP: {state.player.hp}/{state.player.maxHp}</p>
            <p>AC: {state.player.ac}</p>
            <p className="mt-2 font-semibold">Features</p>
            {state.player.features.map((f) => <p key={f.id}>{f.name}: {f.usesRemaining} use(s)</p>)}
            <p className="mt-3 font-semibold">Enemies</p>
            {state.monsters.map((m) => <p key={m.id}>{m.name}: {m.hp}/{m.maxHp} HP</p>)}
          </>
        )}
      </aside>
    </main>
  );
}
