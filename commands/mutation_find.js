const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

function generateMessageFindResult(role, minLevel, players) {
  let messageEmbed = new MessageEmbed();
  messageEmbed.description = `Result of find`;
  if (role) {
    messageEmbed.description += ` for ${role}`;
  }
  if (minLevel) {
        messageEmbed.description += ` with at least level ${minLevel}`;
  }

  let orderString = "";
  let nameString = "";
  let roleString = "";
  let minLevelString = "";
  let index = 1;

  players.forEach(player => {
    orderString += `${player.orbBalance++}\n`;
    nameString += `${player.playerName}\n`;

    // This fields are not guaranteed to exist on the player document. The document could have
    // have been created only because of a /mutation_log rather than a /mutation_register
    let infoString = "";
    if (player.roles) {
      infoString += `${player.roles.join('/')}`;
    } else {
      infoString += `(Unregistered)`;
    }
    if (player.levelUnlocked) {
      infoString += `/${player.levelUnlocked}`;
    }
    infoString += `\n`;
    roleString += infoString;

  });

  messageEmbed.fields = [
    {name : 'Orb Balance', value: orderString, inline:true},
    {name : 'Player Name', value: nameString, inline: true},
    {name : 'Role(s) / Level', value: roleString, inline: true}
  ];

  return messageEmbed;
}

module.exports = {
    data: new SlashCommandBuilder()
      .setName('mutation_find')
      .setDescription('Find a player to join you on a mutation')
      .addStringOption(option =>
        option.setName('role')
        .setDescription('The role you are looking to join you (OPTIONAL)')
        .setRequired(false)
        .addChoice("Tank", "Tank")
        .addChoice("Healer", "Healer")
        .addChoice("DPS", "DPS"))
      .addIntegerOption(option =>
        option.setName('min-level')
        .setDescription('The minimum mutation level you would like this player to have unlocked (OPTIONAL)')
        .setRequired(false)),
    async execute(interaction, client) {
      const database = client.db('mutations');
      const players = database.collection('players');

      const role = interaction.options.getString('role');
      const minLevel = interaction.options.getInteger('min-level');

      const filter = {
        guildId: interaction.guildId
      };

      if (role) {
        filter['roles'] = role;
      }

      if (minLevel) {
        filter['levelUnlocked'] = {$gte : minLevel};
      }

      const options = {
        sort : {
          orbBalance : -1,
          playerName: 1
        }
      };

      const cursor = players.find(filter, options);

      if ((await cursor.count()) === 0) {
        interaction.reply({ content: `No players matched the find` });
        return;
      }

      var playerDocs = await cursor.toArray();
      var message = generateMessageFindResult(role, minLevel, playerDocs);

      interaction.reply({ embeds: [message] });
    }
};