import fs from 'node:fs';
import path from 'node:path';

const enabled = process.env.PARTYQUEST_DEV_LOGS === 'true';

export function writeDevLog(event: unknown): void {
  if (!enabled) return;
  const dir = path.resolve(process.cwd(), '.logs');
  fs.mkdirSync(dir, { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), ...asObject(event) });
  fs.appendFileSync(path.join(dir, 'turns.jsonl'), `${line}\n`, 'utf8');
}

function asObject(event: unknown): Record<string, unknown> {
  return typeof event === 'object' && event !== null ? (event as Record<string, unknown>) : { value: event };
}
