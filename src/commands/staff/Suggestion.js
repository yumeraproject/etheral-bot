const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');
const mongo = require('../../database/Mongo');
const guildSettingsSchema = require('../../database/schemas/GuildSettingsSchema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('suggestion')
		.setDescription('The main command for the Suggestion System')
		.setDefaultPermission(true)
		.addSubcommand(subcommand =>
			subcommand.setName('setup')
				.setDescription('Intiates the Suggestion setup procedure')
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('The channel to set for the suggestion system.')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand.setName('submit')
				.setDescription('Submit a suggestion')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Your suggestion\'s title.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('message')
						.setDescription('Your suggestion\'s message.')
						.setRequired(true)),
		),
	async execute(interaction) {
		const { guild, member, user } = interaction;

		if (interaction.options.getSubcommand() === 'setup') {
			const channel = interaction.options.getChannel('channel');

			// Make sure all values are the correct type
			if (channel.type !== 'GUILD_TEXT') {
				await interaction.reply({ embeds: [new MessageEmbed()
					.setColor('RED')
					.setDescription('**<:Error:939392259160416307> Incorrect Channel Type**\nYou can only specify a **Text Channel** for the ``channel`` parameter.\n```ㅤ```')], ephemeral: true });
				return;
			}

			// Save data to guild-settings database
			await mongo().then(async (mongoose) => {
				try {
					await guildSettingsSchema.findOneAndUpdate({ _id: guild.id }, { 'configuration.suggestionChannelId': channel.id }, { upsert: true });
				}
				finally {
					mongoose.connection.close();
				}
			});

			// Send success message
			await interaction.reply({ embeds: [new MessageEmbed()
				.setColor('GREEN')
				.setDescription(`**<:notify:939432612282372148> Success!**\nThe suggestion channel was set to <#${channel.id}>, and database values were updated.\n\`\`\`ㅤ\`\`\``)], ephemeral: true });
		}

		if (interaction.options.getSubcommand() === 'submit') {
			const title = interaction.options.getString('title');
			const suggestion = interaction.options.getString('message');
			const Id = Math.floor(Math.random() * 90000) + 10000;

			// Retrieve log channel id from the database.
			let suggestionChannelId;
			await mongo().then(async (mongoose) => {
				try {
					const results = await guildSettingsSchema.find({ _id: guild.id });
					for (const result of results) {
						suggestionChannelId = result.configuration.suggestionChannelId;
					}
				}
				finally {
					mongoose.connection.close();
				}
			});

			if (!suggestionChannelId) {
				await interaction.reply({ embeds: [new MessageEmbed()
					.setColor('RED')
					.setDescription('**<:Error:939392259160416307> The suggestion channel has not been setup**\nIf you\'re a Server Admin, please use the ``/suggestion setup`` command.\n```ㅤ```')], ephemeral: true });
				return;
			}

			// Embed
			const suggestionEmbed = new MessageEmbed()
				.setColor('2F3137')
				.setDescription(`**${title.length > 28 ? title.slice(0, 28) + '...' : title}**
                "\n ${suggestion} "`)
				.setFooter({ text: `Submitted by ${user.tag} • ID: ${Id}` });

			await guild.channels.cache.get(suggestionChannelId).send({ embeds: [suggestionEmbed], fetchReply: true }).then(message => {
				message.react('<:upvote:946972354695815268>').then(() => message.react('<:downvote:946972460182560788>')).catch(error => console.error(`[Error] Failed to react to message in ${guild.id}:`, error));
			});
			await interaction.reply({ content: `Your suggestion was submitted in <#${suggestionChannelId}>, with the ID of \`\`${Id}\`\`.`, ephemeral: true });

		}
	},
};