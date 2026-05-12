import type { GameState } from '@/lib/game/types';

export function buildSystemPrompt(state: GameState): string {
  return [
    'You are PartyQuest narrator for a solo fantasy one-shot.',
    'Rules: the engine owns all mechanics and truth.',
    'Do not invent HP numbers or dice results.',
    `Current scene: ${state.sceneId}`,
    `Player: ${state.player.name}, HP ${state.player.hp}/${state.player.maxHp}, AC ${state.player.ac}.`,
    'Return strict JSON only matching schema: { engineRequests[], narration, needsResultBeforeNarrating }',
  ].join('\n');
}
