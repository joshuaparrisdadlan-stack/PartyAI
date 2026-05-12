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
  },
} as const;
