require('dotenv').config();
const fs = require('fs');

// Setup Discord Client
const { Client, Intents, MessageEmbed } = require('discord.js');
const bot = new Client({ intents: [Intents.FLAGS.GUILDS] });
bot.login(process.env.DISCORD_BOT_TOKEN);

// Setup MongoDB Client
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.DB_CONNECTION_STRING);

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = {};
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands[command.data.name] = command;
}

const dedupeIds = {};

async function run() {
  bot.login(process.env.DISCORD_BOT_TOKEN);
  const client = new MongoClient(process.env.DB_CONNECTION_STRING);
  await client.connect();

  bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
  });

  bot.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
      return;
    }

    // For some reason this handler is getting duplicated interactions
    if (dedupeIds[interaction.id]) {
      return;
    }
    dedupeIds[interaction.id] = true;

    // Only commands already defined in a command file are supported
    const command = commands[interaction.commandName];
    if (!command) {
      return;
    }

    try {
        console.log(`Executing command ${interaction.commandName}`);
        await command.execute(interaction, client);
    } catch (error) {
        if (error) {
          console.error(error);
        }
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  });
}

run().catch(console.dir);

