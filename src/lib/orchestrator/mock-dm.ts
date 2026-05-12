import type { DmTurn } from '@/lib/llm/contracts';
import type { GameState } from '@/lib/game/types';

export function deriveDmTurnFromInput(state: GameState, playerInput: string): DmTurn {
  const input = playerInput.toLowerCase();

  if (state.sceneId === 'social') {
    return {
      engineRequests: [{ kind: 'skill_check', skill: 'persuasion', dc: 12, reason: 'Convince Mira to share what she knows.' }],
      narration: 'Mira narrows her eyes, weighing your tone before speaking.',
      needsResultBeforeNarrating: true,
    };
  }

  if (state.sceneId === 'exploration') {
    return {
      engineRequests: [{ kind: 'skill_check', skill: 'perception', dc: 12, reason: 'Track signs near the boathouse.' }],
      narration: 'You sweep the shoreline for clues while the tide pulls back.',
      needsResultBeforeNarrating: true,
    };
  }

  if (input.includes('second wind')) {
    return {
      engineRequests: [{ kind: 'use_feature', featureId: 'second_wind' }],
      narration: 'You draw a deep breath and steady your stance.',
      needsResultBeforeNarrating: true,
    };
  }

  if (state.sceneId !== 'combat') {
    return {
      engineRequests: [{ kind: 'start_combat' }],
      narration: 'Steel flashes in the rain as two ruffians close in.',
      needsResultBeforeNarrating: false,
    };
  }

  if (input.includes('attack') || input.includes('strike') || input.includes('hit')) {
    const living = state.monsters.find((m) => m.hp > 0);
    return {
      engineRequests: living ? [{ kind: 'player_attack', targetId: living.id }, { kind: 'monster_turn' }] : [],
      narration: 'You lunge forward with your blade.',
      needsResultBeforeNarrating: true,
    };
  }

  return {
    engineRequests: [],
    narration: 'The storm drums overhead. What do you do next?',
    needsResultBeforeNarrating: false,
  };
}
