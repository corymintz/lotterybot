const { SlashCommandBuilder } = require('@discordjs/builders');

async function updatePlayer(collection, playerName, guildId, incValue) {
  const filter = {
    playerName: playerName,
    guildId: guildId
  };
  const playerUpdate = {
    $set : {
      guildId: guildId
    },
    $inc : {
      orbBalance : incValue
     }
  };
  const options = { upsert: true };

  await collection.updateOne(filter, playerUpdate, options);
}

module.exports = {
    data: new SlashCommandBuilder()
      .setName('mutation_record')
      .setDescription('Log a mutated expedition run')
      .addStringOption(option =>
        option.setName('player-with-orb')
        .setDescription('Name of the player using their mutation orb')
        .setRequired(true))
      .addStringOption(option =>
        option.setName('player-2')
        .setDescription('Another player in the company (not using their orb)')
        .setRequired(true))
      .addStringOption(option =>
        option.setName('player-3')
        .setDescription('Another player in the company (not using their orb)')
        .setRequired(true))
      .addStringOption(option =>
        option.setName('player-4')
        .setDescription('Another player in the company (not using their orb)')
        .setRequired(true))
      .addStringOption(option =>
        option.setName('player-5')
        .setDescription('Another player in the company (not using their orb)')
        .setRequired(true)),
    async execute(interaction, client) {
      const database = client.db('mutations');
      const runs = database.collection('runs');
      const players = database.collection('players');

      const playerWithOrb = interaction.options.getString('player-with-orb');
      const player2 = interaction.options.getString('player-2');
      const player3 = interaction.options.getString('player-3');
      const player4 = interaction.options.getString('player-4');
      const player5 = interaction.options.getString('player-5');

      const otherPlayers = [
        player2,
        player3,
        player4,
        player5
      ];

      const newRun = {
        guildId: interaction.guildId,
        startDate: new Date(),
        playerWithOrb: playerWithOrb,
        otherPlayers: otherPlayers
       };

      const result = await runs.insertOne(newRun);

      // A run is a group of 5, so the person using the orb is owned 4 runs, one for each of the
      // other people.
      updatePlayer(players, playerWithOrb, interaction.guildId, 4);

      for(let n = 0; n < otherPlayers.length; n++) {
        // Similarly for each run you go on you owe a single orb. All together going on 4 runs and
        // then using your orb on the 5th puts you back at net 0.
        updatePlayer(players, otherPlayers[n], interaction.guildId, -1);
      }

      interaction.reply({ content: `Mutation run with ${playerWithOrb}'s orb recorded!` });
    }
};