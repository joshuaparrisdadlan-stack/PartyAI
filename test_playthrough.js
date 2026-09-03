
async function play() {
  const sessionId = 'test-' + Date.now();
  
  async function turn(input) {
    const res = await fetch('http://localhost:3000/api/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, playerInput: input })
    });
    const data = await res.json();
    console.log('\n--- Input:', input);
    console.log('Scene:', data.sceneId);
    if (data.sceneStarter) console.log('STARTER:', data.sceneStarter);
    console.log('DM:', data.narration);
    for (const r of data.engineResults) {
      console.log('ENGINE:', r.summary);
    }
  }

  await turn('I look around the inn');
  await turn('I ask Mira about the courier');
  await turn('I search the ground for tracks');
  await turn('I sneak towards the boathouse'); // start combat
  await turn('I draw my sword and attack the closest one');
  await turn('I attack');
  await turn('I attack');
  await turn('I attack');
  await turn('I attack');
  await turn('I attack');
  await turn('I attack'); // just spam attack until combat ends
}

play().catch(console.error);

