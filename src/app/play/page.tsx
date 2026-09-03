'use client';

import { useState } from 'react';

type TurnResponse = {
  ok: boolean;
  sessionId: string;
  mode: 'ai_director' | 'table_rules';
  sceneId: string;
  sceneGoal: string;
  sceneStarter?: string;
  nextChoices: string[];
  nextHook: string;
  narration: string;
  engineResults: { kind: string; summary: string; ok: boolean; breakdown?: unknown; critical?: boolean }[];
  state: {
    player: { id: string; name: string; hp: number; maxHp: number; ac: number; features: { id: string; name: string; usesRemaining: number }[] };
    monsters: { id: string; name: string; hp: number; maxHp: number; ac: number }[];
    combat: { active: boolean; initiative: { actorId: string; roll: number }[]; turnIndex: number; round: number };
    log: string[];
  };
  recap: { turnNumber: number };
};

export default function PlayPage() {
  const [sessionId] = useState(() => `sess-${crypto.randomUUID().slice(0, 8)}`);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(['Welcome to PartyQuest.']);
  const [state, setState] = useState<TurnResponse['state'] | null>(null);
  const [sceneId, setSceneId] = useState('social');
  const [sceneGoal, setSceneGoal] = useState('Learn where the missing courier went.');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'ai_director' | 'table_rules'>('table_rules');
  const [choices, setChoices] = useState<string[]>([]);

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
      setMode(data.mode);
      setChoices(data.nextChoices);

      const lines = [
        ...(data.sceneStarter ? [`\n--- SCENE: ${data.sceneStarter} ---`] : []),
        `\nDM: ${data.narration}`
      ];
      
      for (const r of data.engineResults) {
        if (r.breakdown) {
          const bd = r.breakdown as any;
          const rollStr = `[DICE] ${bd.formula}: rolled [${bd.rolls.join(', ')}] + ${bd.modifier} = ${bd.total}`;
          lines.push(`🎲 ${rollStr}`);
          if (r.critical) lines.push(`⭐ CRITICAL HIT!`);
        }
        lines.push(`⚙️ ${r.summary}`);
      }

      lines.push(`\n${data.nextHook}`);
      
      setHistory((h) => [...h, ...lines]);
    } catch {
      setHistory((h) => [...h, '\nDM: The guide pauses, then resumes. Try that action again.']);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-6 md:grid-cols-[2fr_1fr]">
      <section className="rounded border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold">PartyQuest — V0 Playtest</h1>
        <p className="mt-1 text-sm text-zinc-600">Scene: <b>{sceneId}</b> · Goal: {sceneGoal}</p>
        <p className="mt-1 text-xs text-zinc-500">Mode: {mode === 'ai_director' ? 'AI Director' : 'Table Rules'}</p>

        <div className="mt-4 h-[430px] overflow-y-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950">
          {history.map((line, i) => <p key={`${line}-${i}`} className="mb-2 whitespace-pre-wrap">{line}</p>)}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendTurn()}
            className="flex-1 rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Try: I ask Mira about the courier / I attack"
          />
          <button onClick={sendTurn} disabled={busy} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
            {busy ? '...' : 'Send'}
          </button>
        </div>
        {choices.length > 0 && (
          <div className="mt-3 text-xs text-zinc-600">
            <p className="font-semibold">Suggested actions</p>
            <ul className="ml-4 list-disc">
              {choices.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
        )}
      </section>

      <aside className="rounded border border-zinc-300 bg-white p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="font-semibold">Character</h2>
        {!state ? <p className="mt-2 text-zinc-600">No turn yet.</p> : (
          <>
            <p className="mt-2 font-bold">{state.player.name}</p>
            <p>HP: {state.player.hp}/{state.player.maxHp}</p>
            <p>AC: {state.player.ac}</p>
            <p className="mt-2 font-semibold">Features</p>
            {state.player.features.map((f) => <p key={f.id}>{f.name}: {f.usesRemaining} use(s)</p>)}
            
            {state.combat?.active ? (
              <div className="mt-4 rounded bg-zinc-100 p-2 dark:bg-zinc-800">
                <p className="font-bold">Combat — Round {state.combat.round}</p>
                <div className="mt-2 flex flex-col gap-1">
                  {state.combat.initiative.map((init, idx) => {
                    const isTurn = idx === state.combat.turnIndex;
                    const name = init.actorId === state.player.id 
                      ? state.player.name 
                      : state.monsters.find(m => m.id === init.actorId)?.name || 'Unknown';
                    const hp = init.actorId === state.player.id
                      ? state.player.hp
                      : state.monsters.find(m => m.id === init.actorId)?.hp || 0;
                    
                    return (
                      <div key={init.actorId} className={`flex items-center gap-2 ${isTurn ? 'font-bold text-blue-600 dark:text-blue-400' : hp <= 0 ? 'opacity-50 line-through' : ''}`}>
                        <span className="w-4">{isTurn ? '→' : ''}</span>
                        <span>{name} ({init.roll})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <p className="mt-3 font-semibold">Enemies</p>
                {state.monsters.map((m) => <p key={m.id}>{m.name}: {m.hp}/{m.maxHp} HP</p>)}
              </>
            )}
          </>
        )}
      </aside>
    </main>
  );
}
