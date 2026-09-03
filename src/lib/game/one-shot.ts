export const oneShot = {
  title: 'The Last Lantern at Brindlehook Inn',
  scenes: {
    social: {
      id: 'social',
      goal: 'Learn where the missing courier went.',
      starter: 'Rain taps the windows of Brindlehook Inn. Mira the innkeeper dries a mug and watches you carefully.',
    },
    exploration: {
      id: 'exploration',
      goal: 'Track the courier to the old boathouse and uncover the ambush.',
      starter: 'The tide is low. Muddy bootprints run from the quay toward a weather-beaten boathouse.',
    },
    combat: {
      id: 'combat',
      goal: 'Defeat the ruffians and recover the courier satchel.',
      starter: 'Two ruffians step from behind stacked nets, blades drawn. "Coin or blood," one growls.',
    },
    ending: {
      id: 'ending',
      goal: 'You have recovered the satchel and solved the mystery.',
      starter: 'With the ruffians defeated, you recover the water-logged satchel from the mud. The missing courier is nowhere to be found, but you have secured the parcel and survived the night. This concludes the V0 vertical slice of PartyQuest.',
    },
  },
} as const;
