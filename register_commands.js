require('dotenv').config();

const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Intents } = require('discord.js');
const bot = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

bot.login(process.env.DISCORD_BOT_TOKEN);
bot.on('ready', async () => {
    console.log('Ready!');
    const rest = new REST({version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
      if (!process.env.DISCORD_BOT_TEST_GUILD_ID) {
        await rest.put(
          Routes.applicationCommands(bot.user.id), {
              body: commands
          },
         );
         console.log('Successfully registered application commands globally');
       } else {
         await rest.put(
           Routes.applicationGuildCommands(bot.user.id, process.env.DISCORD_BOT_TEST_GUILD_ID), {
             body: commands
            },
          );
         console.log('Successfully registered application commands for development guild');
      }
    } catch (error) {
      if (error) console.error(error);
    }
    process.exit(0);
});