const { ButtonInteraction, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const guildSettingsSchema = require('../../database/schemas/GuildSettingsSchema');
const ticketSchema = require('../../database/schemas/TicketSchema');
const mongo = require('../../database/Mongo');
const discordTranscripts = require('discord-html-transcripts');

module.exports = {
	name: 'interactionCreate',
	/**
     *
     * @param {ButtonInteraction} interaction
     */
	async execute(interaction) {
		if (interaction.isButton()) {
			const { guild, member, channel } = interaction;

			// Check if interaction is the Close Ticket Button
			if (interaction.customId === 'closeTicket') {
				// The message that is sent in the ticket when it's going to close
				const closeEmbed = new MessageEmbed()
					.setColor('YELLOW')
					.setDescription(`<:warn:939441727851343872> **Ticket Closed by ${interaction.user.tag}**\nThis support ticket will close in 8 seconds, the transcript will be sent to your DM.\`\`\`ㅤ\`\`\``);
				const closeRow = new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setCustomId('cancelCloseTicket')
							.setLabel('Reopen')
							.setEmoji('944566098471301151')
							.setStyle('SECONDARY'));
				const oldCloseButton = new MessageButton()
					.setEmoji('944827108214079498')
					.setCustomId('closeTicket')
					.setStyle('DANGER');

				// Retrieve data from the database.
				let logChannelId;
				let staffRoleId;
				await mongo().then(async (mongoose) => {
					try {
						const results = await guildSettingsSchema.find({ _id: guild.id });
						for (const result of results) {
							logChannelId = result.configuration.ticketLogId;
							staffRoleId = result.configuration.ticketStaffId;
						}
					}
					finally {
						mongoose.connection.close();
					}
				});
				// Disable close button
				await interaction.message.edit({ components: [new MessageActionRow().addComponents(oldCloseButton.setDisabled(true))] });

				// Get all non-staff members that participated in the ticket
				const contributors = [];
				channel.messages.fetch({ limit: 100 }).then(messages => {
					messages.forEach(message => {
						if (message.author.bot) return;
						if (!message.member.roles.cache?.has(staffRoleId)) {
							if (!contributors.includes(message.author)) {
								contributors.push(message.author);
							}
						}
					});
				});

				// Send the closing notification
				await interaction.reply({ embeds: [closeEmbed], components: [closeRow], fetchReply: true }).then(async (message) => {
					const reopenCollector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 8000 });

					reopenCollector.on('collect', async () => {
						// Cancel the ticket closure
						reopenCollector.stop('Cancelled');
						message.edit({ embeds: [new MessageEmbed().setColor('GREEN').setDescription('<:notify:939432612282372148> **Operation Cancelled**')], components: [] }).then(async (msg) => {
							setTimeout(() => msg.delete().catch(console.error), 3000);
						}).catch(console.error);
						await interaction.message.edit({ components: [new MessageActionRow().addComponents(oldCloseButton.setDisabled(false))] });
					});
					reopenCollector.on('end', async (collected, reason) => {
						// Check to make sure collector wasn't stopped manually
						if (reason === 'Cancelled') {
							return;
						}
						else {
							// Delete the channel, and send logs and transcripts
							try {
								const transcript = await discordTranscripts.createTranscript(channel, { returnBuffer: false, fileName: `${channel.name}.html` }).catch(console.error);
								if (logChannelId !== 'Not Specified') {
									const logEmbed = new MessageEmbed().setColor('2F3137').setDescription(`**Closed - ${channel.name}**\nThis support ticket was closed by *${member.user.tag}* (<@${member.id}>).`);
									await guild.channels.cache.get(logChannelId).send({ embeds: [logEmbed], files: [transcript] }).catch(console.error);
								}
								contributors.forEach(async contributor => {
									const dmEmbed = new MessageEmbed().setColor('2F3137').setDescription(`**Closed - ${channel.name}**\nYour support ticket was closed by *${member.user.tag}* (<@${member.id}>).`).setFooter({ text: 'Your ticket transcript is attached to this message.' });
									await contributor.send({ embeds: [dmEmbed], files: [transcript] }).catch(console.error);
								});
								channel.delete();
							}
							catch (err) {
								console.log(err);
							}
						}
					});
				}).catch(console.error);
			}
		}
	},
};