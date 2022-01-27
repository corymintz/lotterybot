const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

function generateMessageLotteryResult(lottery) {
  let messageEmbed = new MessageEmbed();
  messageEmbed.description = `Result of ${lottery.item} on ${lottery.rolledDate.toLocaleDateString("en-US")}`;

  let orderString = "";
  let nameString = "";
  let index = 1;

  lottery.entrants.forEach(name => {
    orderString += `${index++}\n`;
    nameString += `${name}\n`;
  });

  messageEmbed.fields = [
    {name : 'Order', value: orderString, inline:true},
    {name : 'Name', value: nameString, inline: true}
  ];

  return messageEmbed;
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

module.exports = {
    data: new SlashCommandBuilder()
      .setName('lottery_close')
      .setDescription('Close an open lottery and roll the results'),
    async execute(interaction, client) {

        const database = client.db('lotterybot');
        const lotteries = database.collection('lotteries');

        if(!interaction.member.roles.cache.some(role => role.name === 'Lottery Moderator')) {
          interaction.reply({ content: `Can not start a new lottery without the Lottery Moderator role.`});
          return;
        }

        const existingLottery = await lotteries.findOne({guildId: interaction.guildId, rolledDate:null});
        if (!existingLottery) {
           interaction.reply({ content: `No lottery is in progress to close.`});
          return;
        }

        shuffleArray(existingLottery.entrants);

        const filter = {
          _id: existingLottery._id
        };
        const update = {
          $set: {
            rolledDate: new Date(),
            entrants: existingLottery.entrants
          }
        };

        if (existingLottery.entrants.length == 0) {
          interaction.reply({ content: `Lottery ${existingLottery.item} closed with no entrants.`});
          return;
        }

        await lotteries.updateOne(filter, update);

        const finalLottery = await lotteries.findOne(filter);
        const message = generateMessageLotteryResult(finalLottery);

        interaction.reply({ embeds: [message] });
    }
};