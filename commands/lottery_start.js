const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('lottery_start')
      .setDescription('Start a new lottery')
      .addStringOption(option =>
        option.setName('item')
        .setDescription('The type of item being given away (i.e. +Str Ring)')
      	.setRequired(true)),
    async execute(interaction, client) {
        const database = client.db('lotterybot');
        const lotteries = database.collection('lotteries');

        if(!interaction.member.roles.cache.some(role => role.name === 'Lottery Moderator')) {
          interaction.reply({ content: `Can not start a new lottery without the Lottery Moderator role.`});
          return;
        }

        const item = interaction.options.getString('item');

        const existingLottery = await lotteries.findOne({guildId: interaction.guildId, rolledDate:null});
        if (existingLottery) {
          interaction.reply({ content: `Can not start a new lottery. A lottery for ${existingLottery.item} is already in progress.`});
          return;
        }

        const newLottery = {
          item: item,
          guildId: interaction.guildId,
          startDate: new Date(),
          rolledDate: null,
          entrants: []
        };

        const result = await lotteries.insertOne(newLottery);
        interaction.reply({ content: `Started new Lottery for ${item}!` });
    }
};