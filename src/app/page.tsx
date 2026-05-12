import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">PartyQuest V0</h1>
      <p className="mt-3 text-zinc-600">
        Deterministic rules engine + AI narrator. Solo, text-only prototype.
      </p>
      <div className="mt-6">
        <Link className="rounded bg-black px-4 py-2 text-white" href="/play">
          Start One-Shot
        </Link>
      </div>
    </main>
  );
}
