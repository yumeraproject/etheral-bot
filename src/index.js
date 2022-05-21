const fs = require('fs');
const { Client, Collection, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();

// Create Client Instance and grant permissions
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_PRESENCES], partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
module.exports = client;

// Get and Register all commands
const commandList = [];
client.commands = new Collection();
const commandFolders = fs.readdirSync(__dirname + '/commands');
for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(__dirname + `/commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.data.name, command);
		commandList.push(command.data.toJSON());
	}
}
const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
(async () => {
	try {
		console.log('[STARTUP] Registering application commands.');

		// Update to Routes#applicationCommands(clientId) when publically released
		await rest.put(Routes.applicationGuildCommands('944395901475098665', '921657537336574002'), { body: commandList });

		console.log('[STARTUP] Successfully registered application commands.');
	}
	catch (error) {
		console.error(error);
	}
})();

// On command
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction, client);
		console.log(`[COMMAND] ${interaction.commandName} was issued in ${interaction.guild.id}.`);
	}
	catch (error) {
		console.log(`[ERROR] Command Error in ${interaction.guild.id}, with ${interaction.commandName} issued by ${interaction.user.id}:`);
		console.error(error);
		const errorEmbed = new MessageEmbed()
			.setColor('RED')
			.setDescription('**<:error:939392259160416307> Command Error**\nThere was an error running this command, please report it in our [Discord](https://discord.gg/9puqhcUVZJ).\n```ㅤ```');
		const errorRow = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setURL('https://discord.gg/9puqhcUVZJ')
					.setLabel('Go to our Discord')
					.setStyle('LINK'),
			);
		await interaction.reply({ embeds: [errorEmbed], components: [errorRow], ephemeral: true });
	}
});

// Get all events
const eventFolders = fs.readdirSync(__dirname + '/events');
for (const folder of eventFolders) {
	const eventFiles = fs.readdirSync(__dirname + `/events/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of eventFiles) {
		const event = require(`./events/${folder}/${file}`);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args, client));
		}
		else {
			client.on(event.name, (...args) => event.execute(...args, client));
		}
	}
}

// Login to the bot
client.login(process.env.TOKEN);