const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('mutation_player_merge')
      .setDescription('Merged a typoed player name into another player')
      .addStringOption(option =>
        option.setName('src-player-name')
        .setDescription('The wrong player name copy orbs owned and delete')
        .setRequired(true))
      .addStringOption(option =>
        option.setName('dest-player-name')
        .setDescription('The correct player name to receive the orb count')
        .setRequired(true)),
    async execute(interaction, client) {
      const database = client.db('mutations');
      const players = database.collection('players');

      const srcPlayerName = interaction.options.getString('src-player-name');
      const destPlayerName = interaction.options.getString('dest-player-name');

      const srcPlayer = await players.findOne({guildId: interaction.guildId, playerName:srcPlayerName});
      if (!srcPlayer) {
        interaction.reply({ content: `The source player ${srcPlayerName} does not exist.`});
        return;
      }

      const destPlayer = await players.findOne({guildId: interaction.guildId, playerName:destPlayerName});
      if (!destPlayer) {
        interaction.reply({ content: `The destination player ${destPlayerName} does not exist.`});
        return;
      }

      // Add the orb balance from the source into the destination. Don't worry about coping roles
      // and levels because the assumption is those things are correct on the destination and the
      // source was only a typo.
      const filter = {
        playerName: destPlayerName,
        guildId: interaction.guildId
      };

      const playerUpdate = {
        $inc : {
          orbBalance: srcPlayer.orbBalance
        }
      };

      await players.updateOne(filter, playerUpdate);

      const delFilter = {
        playerName: srcPlayerName,
        guildId: interaction.guildId
      };

      await players.deleteOne(delFilter);

      interaction.reply({ content: `${srcPlayerName} deleted!` });
    }
};