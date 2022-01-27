const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('mutation_register')
      .setDescription('Update information about yourself to help people find you when they are looking for more players')
      .addIntegerOption(option =>
        option.setName('level-unlocked')
        .setDescription('The highest mutation level you have unlocked')
        .setRequired(true))
      .addStringOption(option =>
        option.setName('primary-role')
        .setDescription('The role you most prefer to play')
        .setRequired(true)
        .addChoice("Tank", "Tank")
        .addChoice("Healer", "Healer")
        .addChoice("DPS", "DPS"))
      .addStringOption(option =>
        option.setName('secondary-role')
        .setDescription('Another role you can play (OPTIONAL)')
        .setRequired(false)
        .addChoice("Tank", "Tank")
        .addChoice("Healer", "Healer")
        .addChoice("DPS", "DPS")),
    async execute(interaction, client) {
      const database = client.db('mutations');
      const players = database.collection('players');

      const levelUnlocked = interaction.options.getInteger('level-unlocked');
      const primaryRole = interaction.options.getString('primary-role');
      const secondaryRole = interaction.options.getString('secondary-role');

      const username = interaction.member.nickname ?
        interaction.member.nickname : interaction.user.username;

      const roles = [primaryRole];
      if (secondaryRole) {
        roles.push(secondaryRole);
      }

      const filter = {
        playerName: username,
        guildId: interaction.guildId
      };

      const playerUpdate = {
        $set : {
          guildId: interaction.guildId,
          roles: roles,
          levelUnlocked: levelUnlocked
        },
        $setOnInsert : {
           orbBalance: 0
        }
      };

      const options = { upsert: true };

      await players.updateOne(filter, playerUpdate, options);


      interaction.reply({ content: `Updated registration for ${username}!` });
    }
};