const { ButtonInteraction, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const guildSettingsSchema = require('../../database/schemas/GuildSettingsSchema');
const ticketSchema = require('../../database/schemas/TicketSchema');
const mongo = require('../../database/Mongo');

module.exports = {
	name: 'interactionCreate',
	/**
     *
     * @param {ButtonInteraction} interaction
     */
	async execute(interaction) {
		if (interaction.isButton()) {
			const { guild, member } = interaction;

			// Check if interaction is the Create Ticket Button
			if (interaction.customId === 'createTicket') {
				const ticketId = Math.floor(Math.random() * 90000) + 10000;
				const everyoneId = guild.roles.everyone.id;

				// Get the Category ID for this guild.
				let categoryId;
				let staffRoleId;
				let logChannelId;
				await mongo().then(async (mongoose) => {
					try {
						const results = await guildSettingsSchema.find({ _id: guild.id });
						for (const result of results) {
							categoryId = result.configuration.ticketCategoryId;
							staffRoleId = result.configuration.ticketStaffId;
							logChannelId = result.configuration.ticketLogId;
						}
					}
					finally {
						mongoose.connection.close();
					}
				});

				// Create the channel
				await guild.channels.create(`Ticket - ${ticketId}`, {
					type: 'GUILD_TEXT',
					parent: categoryId,
					permissionOverwrites: [
						{
							id: everyoneId,
							deny: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
						},
						{
							id: member.id,
							allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
						},
						{
							id: staffRoleId,
							allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
						},
					],
				}).then(async (channel) => {
					// Send a ticket creation notification to the creator
					interaction.reply({ embeds: [new MessageEmbed()
						.setColor('GREEN')
						.setDescription(`<:notify:939432612282372148> **Ticket Created**\nYour ticket has been opened in <#${channel.id}>.\n\`\`\`ㅤ\`\`\``)], ephemeral: true });

					// Send the ticket embed inside of the ticket
					const ticketEmbed = new MessageEmbed()
						.setDescription(`**Ticket ${ticketId}**\n\nPlease explain your issue in as much detail as possible, and our staff will respond when next avalible.`)
						.setColor('2F3137');
					const ticketCloseEmbed = new MessageEmbed()
						.setColor('RED')
						.setDescription('<:Error:939392259160416307> " If you wish to close this ticket, please select the button below. "');
					const ticketRow = new MessageActionRow()
						.addComponents(new MessageButton()
							.setCustomId('closeTicket')
							.setEmoji('944827108214079498')
							.setStyle('DANGER'));
					channel.send({ content: `<@${member.id}>`, embeds: [ticketEmbed, ticketCloseEmbed], components: [ticketRow] });
					if (logChannelId !== 'Not Specified') {
						const logEmbed = new MessageEmbed().setColor('2F3137').setDescription(`**Opened - ${channel.name}**\nThis support ticket was opened by *${member.user.tag}* (<@${member.id}>).`);
						await guild.channels.cache.get(logChannelId).send({ embeds: [logEmbed] }).catch(console.error);
					}
				});

			}
		}
	},
};