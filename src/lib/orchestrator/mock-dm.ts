import type { DmTurn } from '@/lib/llm/contracts';
import type { GameState } from '@/lib/game/types';

export function deriveDmTurnFromInput(state: GameState, playerInput: string): DmTurn {
  const input = playerInput.toLowerCase();

  // Common intents
  const wantsLook = input.includes('look') || input.includes('inspect') || input.includes('see') || input.includes('search');
  const wantsTalk = input.includes('who') || input.includes('ask') || input.includes('talk') || input.includes('speak') || input.includes('buy');
  const wantsMove = input.includes('go') || input.includes('sneak') || input.includes('walk') || input.includes('approach') || input.includes('follow');
  const wantsAttack = input.includes('attack') || input.includes('strike') || input.includes('hit') || input.includes('fight') || input.includes('kill') || input.includes('draw');
  const wantsDefend = input.includes('protect') || input.includes('defend') || input.includes('dodge') || input.includes('hide');
  const wantsHeal = input.includes('second wind') || input.includes('heal') || input.includes('recover');

  if (state.sceneId === 'social') {
    if (wantsLook) {
      return {
        engineRequests: [],
        narration: 'The Brindlehook Inn is dimly lit and smells of stale ale. Mira, the barkeep, is wiping a mug and eyeing you. A few patrons mutter in the corners.',
        needsResultBeforeNarrating: false,
      };
    }
    if (wantsTalk) {
      return {
        engineRequests: [{ kind: 'skill_check', skill: 'persuasion', dc: 12, reason: 'Coax information from Mira' }],
        narration: 'You lean in to ask about the missing courier. Mira narrows her eyes, weighing your tone before answering.',
        needsResultBeforeNarrating: true,
      };
    }
    if (wantsMove || wantsAttack) {
      return {
        engineRequests: [],
        narration: 'You could do that, but you came here to find the missing courier. Perhaps someone at the bar knows something?',
        needsResultBeforeNarrating: false,
      };
    }
    return {
      engineRequests: [],
      narration: 'The rain lashes against the inn windows. Mira stands behind the bar. What would you like to do?',
      needsResultBeforeNarrating: false,
    };
  }

  if (state.sceneId === 'exploration') {
    if (wantsTalk) {
      return {
        engineRequests: [],
        narration: 'There is no one friendly here to speak with. Only the wind and the crashing waves.',
        needsResultBeforeNarrating: false,
      };
    }
    if (wantsLook || wantsMove) {
      const skill = wantsMove ? 'stealth' : 'perception';
      const reason = wantsMove ? 'Sneak towards the boathouse' : 'Search for signs of the courier';
      return {
        engineRequests: [{ kind: 'skill_check', skill, dc: 12, reason }],
        narration: 'You advance toward the abandoned boathouse, keeping your wits about you.',
        needsResultBeforeNarrating: true,
      };
    }
    return {
      engineRequests: [],
      narration: 'The shoreline is cold and empty. The old boathouse looms ahead in the mist. How do you approach?',
      needsResultBeforeNarrating: false,
    };
  }

  if (state.sceneId === 'combat') {
    if (!state.combat.active) {
      if (wantsTalk) {
        return {
          engineRequests: [],
          narration: 'They sneer at you. "Too late for talking, fool!" They draw their weapons. Prepare yourself!',
          needsResultBeforeNarrating: false,
        };
      }
      return {
        engineRequests: [{ kind: 'start_combat' }],
        narration: 'Steel flashes in the rain as the ruffians close in!',
        needsResultBeforeNarrating: false,
      };
    }

    if (wantsHeal) {
      return {
        engineRequests: [{ kind: 'use_feature', featureId: 'second_wind' }],
        narration: 'You draw a deep breath, tapping into your reserves.',
        needsResultBeforeNarrating: true,
      };
    }

    if (wantsAttack) {
      const living = state.monsters.find((m) => m.hp > 0);
      return {
        engineRequests: living ? [{ kind: 'player_attack', targetId: living.id }] : [],
        narration: 'You lunge forward with your blade.',
        needsResultBeforeNarrating: true,
      };
    }
    
    if (wantsDefend) {
      return {
        engineRequests: [],
        narration: 'You hold your ground defensively, watching for an opening. (Dodge action not fully implemented in V0)',
        needsResultBeforeNarrating: false,
      };
    }

    return {
      engineRequests: [],
      narration: 'The battle rages. You need to act! (Try: "I attack" or "Use Second Wind")',
      needsResultBeforeNarrating: false,
    };
  }

  if (state.sceneId === 'ending') {
    return {
      engineRequests: [],
      narration: 'Your adventure has concluded. Thank you for playing PartyQuest V0!',
      needsResultBeforeNarrating: false,
    };
  }

  return {
    engineRequests: [],
    narration: 'The storm drums overhead. What do you do next?',
    needsResultBeforeNarrating: false,
  };
}
