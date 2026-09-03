'use client';

import { useState, useRef, useEffect } from 'react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

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

      if (data.sceneStarter) {
        lines.push(`\n--- SCENE: ${data.sceneStarter} ---`);
      }

      setHistory((h) => [...h, ...lines]);
    } catch {
      setHistory((h) => [...h, '\nDM: The guide pauses, then resumes. Try that action again.']);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <header className="mb-8 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <h1 className="text-3xl font-serif tracking-tight text-zinc-900 dark:text-zinc-100">PartyQuest</h1>
        <p className="mt-1 text-sm italic text-zinc-500">The Last Lantern at Brindlehook Inn</p>
      </header>

      {state && (
        <details className="mb-6 rounded border border-zinc-200 bg-white p-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <summary className="cursor-pointer font-semibold select-none">
            {state.player.name} (HP: {state.player.hp}/{state.player.maxHp} | AC: {state.player.ac})
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <div>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">Features</p>
              {state.player.features.map((f) => <p key={f.id} className="text-zinc-600 dark:text-zinc-400">{f.name}: {f.usesRemaining} use(s)</p>)}
            </div>
          </div>
        </details>
      )}

      {state?.combat?.active && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
          <p className="font-bold text-red-800 dark:text-red-400">Combat — Round {state.combat.round}</p>
          <div className="mt-3 flex flex-col gap-2">
            {state.combat.initiative.map((init, idx) => {
              const isTurn = idx === state.combat.turnIndex;
              const name = init.actorId === state.player.id 
                ? state.player.name 
                : state.monsters.find(m => m.id === init.actorId)?.name || 'Unknown';
              const hp = init.actorId === state.player.id
                ? state.player.hp
                : state.monsters.find(m => m.id === init.actorId)?.hp || 0;
              
              return (
                <div key={init.actorId} className={`flex items-center gap-3 text-sm ${isTurn ? 'font-bold text-blue-700 dark:text-blue-400' : hp <= 0 ? 'opacity-40 line-through' : 'text-zinc-800 dark:text-zinc-300'}`}>
                  <span className="w-4 text-center">{isTurn ? '▶' : ''}</span>
                  <span className="w-8 text-right font-mono text-xs text-zinc-500">{init.roll}</span>
                  <span>{name}</span>
                  <span className="ml-auto font-mono text-xs opacity-75">{hp} HP</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div ref={scrollRef} className="h-[50vh] min-h-[400px] overflow-y-auto p-5 pb-8 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-300 scroll-smooth">
          {history.map((line, i) => (
            <p key={`${line}-${i}`} className="mb-4 whitespace-pre-wrap">{line}</p>
          ))}
        </div>

        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendTurn()}
              className="flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-600"
              placeholder="What do you do?"
              autoFocus
            />
            <button onClick={sendTurn} disabled={busy} className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              {busy ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
