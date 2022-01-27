const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('lottery_enter')
      .setDescription('Enter the running lottery'),
    async execute(interaction, client) {
      const database = client.db('lotterybot');
      const lotteries = database.collection('lotteries');

      // Only 1 lottery is allowed a time per Discord server. Maybe in the future this could
      // be enhanced to per Discord channel, per server.
      const existingLottery = await lotteries.findOne({guildId: interaction.guildId, rolledDate:null});
      if (!existingLottery) {
        interaction.reply({ content: `No lottery is in progress to enter.`});
        return;
      }

      const username = interaction.member.nickname ?
        interaction.member.nickname : interaction.user.username;

      if (existingLottery.entrants.includes(username)) {
        interaction.reply({ content: `${username} is already entered in the running lottery.`});
        return;
      }

      const filter = {
        _id: existingLottery._id
      };
      const update = {
        $addToSet: {
          entrants: username
        }
      };

      await lotteries.updateOne(filter, update);
      interaction.reply({ content: `${username} entered in the running lottery.`});
    }
};