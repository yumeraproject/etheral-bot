const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton, CommandInteractionOptionResolver } = require('discord.js');
const mongo = require('../../database/Mongo');
const guildSettingsSchema = require('../../database/schemas/GuildSettingsSchema');

module.exports = {
	/**
	 * @param {CommandInteractionOptionResolver} interaction
	 */
	data: new SlashCommandBuilder()
		.setName('ticket')
		.setDescription('The main command used to manage the ticket system')
		.setDefaultPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('setup')
				.setDescription('Creates a ticket panel in the specified channel and set values')
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('The channel which the ticket panel will be sent into.')
						.setRequired(true))
				.addChannelOption(option =>
					option.setName('category')
						.setDescription('The default category that all tickets will be created in.')
						.setRequired(true))
				.addRoleOption(option =>
					option.setName('role')
						.setDescription('The role that will serve as the Staff Role in the Ticket System.')
						.setRequired(true))
				.addChannelOption(option =>
					option.setName('log_channel')
						.setDescription('(Optional) The channel to log all tickets inside of.'))
				.addStringOption(option =>
					option.setName('description')
						.setDescription('(Optional) The message that is put on the Ticket Creation Panel.'))
				.addStringOption(option =>
					option.setName('rules_link')
						.setDescription('(Optional) The Message Link for the rules message.')))
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription('Add a user to a specific ticket.')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('The user to add to this ticket.')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setDescription('Remove a user from a specific ticket.')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('The user to remove from this ticket.')
						.setRequired(true))),
	async execute(interaction) {
		const { guild } = interaction;
		const memberToAdd = interaction.options.getMember('user');

		// Check if the user picked the Setup Subcommand
		if (interaction.options.getSubcommand() === 'setup') {
			const channel = interaction.options.getChannel('channel');
			const category = interaction.options.getChannel('category');
			const staffRole = interaction.options.getRole('role');
			const logChannel = interaction.options.getChannel('log_channel');
			const description = interaction.options.getString('description');
			const rulesLink = interaction.options.getString('rules_link');

			// Make sure all values are the correct type
			if (channel.type !== 'GUILD_TEXT') {
				await interaction.reply({ embeds: [new MessageEmbed()
					.setColor('RED')
					.setDescription('**<:Error:939392259160416307> Incorrect Channel Type**\nYou can only specify a **Text Channel** for the ``channel`` parameter.\n```ㅤ```')], ephemeral: true });
				return;
			}
			if (category.type !== 'GUILD_CATEGORY') {
				await interaction.reply({ embeds: [new MessageEmbed()
					.setColor('RED')
					.setDescription('**<:Error:939392259160416307> Incorrect Channel Type**\nYou can only specify a **Category** for the ``category`` parameter.\n```ㅤ```')], ephemeral: true });
				return;
			}
			if (staffRole === guild.roles.everyone) {
				await interaction.reply({ embeds: [new MessageEmbed()
					.setColor('RED')
					.setDescription('**<:Error:939392259160416307> Incorrect Staff Role**\nYou cannot set the Ticket Staff Role to ``@everyone``.\n```ㅤ```')], ephemeral: true });
				return;
			}
			if (logChannel) {
				if (logChannel.type !== 'GUILD_TEXT') {
					await interaction.reply({ embeds: [new MessageEmbed()
						.setColor('RED')
						.setDescription('**<:Error:939392259160416307> Incorrect Channel Type**\nYou can only specify a **Text Channel** for the ``log_channel`` parameter.\n```ㅤ```')], ephemeral: true });
					return;
				}
			}
			if (rulesLink) {
				if (!rulesLink.startsWith('https://' || 'http://')) {
					await interaction.reply({ embeds: [new MessageEmbed()
						.setColor('RED')
						.setDescription('**<:Error:939392259160416307> Invalid URL**\nThe value provided for the ``rules_link`` parameter,\nmust start with either ``"https://"`` or ``"http://"``.\n```ㅤ```')], ephemeral: true });
					return;
				}
			}

			// The ticket panel sent in the specifed channel
			const createPanel = new MessageEmbed()
				.setColor('2F3137')
				.setTitle('Contact Support')
				.setDescription(`${description ? description : 'If you require support, please select the button below to open a support ticket.'}${rulesLink ? '\n\n*Make sure that you have read our **Ticket Rules** before creating a ticket.*' : ''}`)
				.setFooter({ text: 'Ticket System • Select the button below to open a ticket.' });

			// The buttons sent with the ticket panel
			const openId = 'createTicket';
			const openButton = new MessageButton({
				style: 'PRIMARY',
				emoji: '944796664667971594',
				customId: openId,
			});
			const ruleButton = new MessageButton({
				style: 'LINK',
				label: 'Ticket Rules',
				url: rulesLink,
			});


			// Save data to guild-settings database
			await mongo().then(async (mongoose) => {
				try {
					await guildSettingsSchema.findOneAndUpdate({ _id: guild.id }, { 'configuration.ticketCategoryId': category.id, 'configuration.ticketStaffId': staffRole.id, 'configuration.ticketLogId': logChannel ? logChannel : 'Not Specified' }, { upsert: true });
				}
				finally {
					mongoose.connection.close();
				}
			});

			// Send the panel to the specified channel
			await guild.channels.cache.get(channel.id).send({ embeds: [createPanel], components: rulesLink ? [new MessageActionRow({ components: [openButton, ruleButton] })] : [new MessageActionRow({ components: [openButton] })] });
			await interaction.reply({ embeds: [new MessageEmbed()
				.setColor('GREEN')
				.setDescription(`**<:notify:939432612282372148> Success!**\nThe ticket panel was sent into <#${channel.id}>, and database values were updated.\n\`\`\`ㅤ\`\`\``)], ephemeral: true });
		}

		if (interaction.options.getSubcommand() === 'add') {
			const { channel } = interaction;

			// Retrieve log channel id from the database.
			let logChannelId;
			await mongo().then(async (mongoose) => {
				try {
					const results = await guildSettingsSchema.find({ _id: guild.id });
					for (const result of results) {
						logChannelId = result.configuration.ticketLogId;
					}
				}
				finally {
					mongoose.connection.close();
				}
			});

			if (channel.name.includes('ticket-')) {
				if (!memberToAdd.permissionsIn(channel).has('VIEW_CHANNEL')) {
					channel.permissionOverwrites.edit(memberToAdd.id, { VIEW_CHANNEL: true, SEND_MESSAGES: true, READ_MESSAGE_HISTORY: true });
					await interaction.reply({ embeds: [new MessageEmbed().setColor('2F3137').setDescription(`<:add:945281125016805437> **${memberToAdd.user.tag} was added to this ticket**`)] });
					await guild.channels.cache.get(logChannelId).send({ embeds: [new MessageEmbed().setColor('2F3137').setDescription(`**Updated - ${channel.name}**\n${memberToAdd.user.tag} was added to this support ticket.`)] });
				}
				else {
					await interaction.reply({ embeds: [new MessageEmbed().setColor('RED').setDescription('**<:Error:939392259160416307> Command Error**\nThe provided user already has access to this ticket.\n```ㅤ```')], ephemeral: true });
					return;
				}
			}
			else {
				await interaction.reply({ embeds: [new MessageEmbed().setColor('RED').setDescription('**<:Error:939392259160416307> Command Error**\nYou are not inside of a ticket, please run this command inside of a ticket.\n```ㅤ```')], ephemeral: true });
				return;
			}

		}

		if (interaction.options.getSubcommand() === 'remove') {
			const { channel } = interaction;

			// Retrieve log channel id from the database.
			let logChannelId;
			await mongo().then(async (mongoose) => {
				try {
					const results = await guildSettingsSchema.find({ _id: guild.id });
					for (const result of results) {
						logChannelId = result.configuration.ticketLogId;
					}
				}
				finally {
					mongoose.connection.close();
				}
			});

			if (channel.name.includes('ticket-')) {
				if (memberToAdd.permissionsIn(channel).has('VIEW_CHANNEL')) {
					channel.permissionOverwrites.edit(memberToAdd.id, { VIEW_CHANNEL: false, SEND_MESSAGES: false, READ_MESSAGE_HISTORY: false });
					await interaction.reply({ embeds: [new MessageEmbed().setColor('2F3137').setDescription(`<:remove:945285567518744596> **${memberToAdd.user.tag} was removed from this ticket**`)] });
					await guild.channels.cache.get(logChannelId).send({ embeds: [new MessageEmbed().setColor('2F3137').setDescription(`**Updated - ${channel.name}**\n${memberToAdd.user.tag} was removed from this support ticket.`)] });
				}
				else {
					await interaction.reply({ embeds: [new MessageEmbed().setColor('RED').setDescription('**<:Error:939392259160416307> Command Error**\nThe provided user doesn\'t have access to this ticket.\n```ㅤ```')], ephemeral: true });
					return;
				}
			}
			else {
				await interaction.reply({ embeds: [new MessageEmbed().setColor('RED').setDescription('**<:Error:939392259160416307> Command Error**\nYou are not inside of a ticket, please run this command inside of a ticket.\n```ㅤ```')], ephemeral: true });
				return;
			}

		}
	},
};