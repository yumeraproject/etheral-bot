const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const translate = require('@iamtraction/google-translate');
const wait = require('util').promisify(setTimeout);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('translate')
		.setDescription('Translates any message into the specified language.')
		.setDefaultPermission(true)
		.addStringOption(option =>
			option.setName('message')
				.setDescription('The message that is put through the translator.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('language')
				.setDescription('The language to translate the specified message to.')
				.setRequired(true)
				.addChoice('English', 'English')
				.addChoice('Japanese', 'Japanese')
				.addChoice('Korean', 'Korean')),
	async execute(interaction) {
		const { guild, options } = interaction;
		const message = options.getString('message');
		const language = options.getString('language');

		translate(message, { to: language }).then(async result => {
			const didYouMeanBoolean = result.from.text.didYouMean;
			const autoCorrectedBoolean = result.from.text.autoCorrected;
			const correctionValue = result.from.text.value;

			const translateEmbed = new MessageEmbed()
				.setColor('2F3137')
				.setDescription(`**Translate to ${language}**\n\n" ${result.text} "`)
				.setFooter({ text: autoCorrectedBoolean ? `Your input was autocorrected: "${correctionValue}"` : didYouMeanBoolean ? `Did you mean "${correctionValue}"` : 'No spelling issues were detected.' });

			let translateRow;
			if (didYouMeanBoolean) {
				translateRow = new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setCustomId('didYouMean')
							.setStyle('SUCCESS')
							.setLabel('Re-translate'),
					);
				await interaction.reply({ embeds: [translateEmbed], components: [translateRow], fetchReply: true }).then(async translateMessage => {
					const translateCollector = translateMessage.createMessageComponentCollector({ componentType: 'BUTTON', time: 5000 });

					translateCollector.on('collect', async button => {
						if (button.user.id === interaction.user.id) {
							if (button.customId === 'didYouMean') {
								await button.update({ components: [new MessageActionRow().addComponents(button.component.setLabel('Translating..').setStyle('SECONDARY').setDisabled(true))] });
								await translate(correctionValue.replace(/[\[\]']+/g, ''), { to: language }).then(async result2 => {
									await button.message.edit({ embeds: [new MessageEmbed().setColor('2F3137')
										.setDescription(`**Translate to ${language}**\n\n" ${result2.text} "`)
										.setFooter({ text: `Re-translated from "${message}"` })], components: [] });
								});
								translateCollector.stop('stopped');
							}
						}
					});

					translateCollector.on('end', async (collected, reason) => {
						if (reason !== 'stopped') {
							await translateMessage.edit({ components: [new MessageActionRow().setComponents(new MessageButton().setLabel('Timed-out').setStyle('SECONDARY').setDisabled(true).setCustomId('timedOut'))] });
							await wait(2000);
							await translateMessage.edit({ components: [] });
						}

					});
				});
			}
			else {
				await interaction.reply({ embeds: [translateEmbed] });
			}
		});

	},
};