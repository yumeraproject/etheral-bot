const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Displays information about the specified user')
		.setDefaultPermission(true)
		.addUserOption(option =>
			option.setName('user')
				.setDescription('The user to fetch the information on.')
				.setRequired(false)),
	async execute(interaction) {
		const member = interaction.options.getMember('user') || interaction.member;
		const devices = member.presence?.clientStatus;
		const createdAt = member.user.createdAt;

		// Determine specified user's language
		let locale;
		switch (interaction.locale) {
		case 'en-US':
			locale = '🇺🇸';
			break;
		case 'en-GB':
			locale = '🇬🇧';
			break;
		case 'bg':
			locale = '🇧🇬';
			break;
		case 'zh-CN':
			locale = '🇨🇳';
			break;
		case 'zh-TW':
			locale = '🇹🇼';
			break;
		case 'hr':
			locale = '🇭🇷';
			break;
		case 'cs':
			locale = '🇨🇿';
			break;
		case 'da':
			locale = '🇩🇰';
			break;
		case 'nl':
			locale = '🇳🇱';
			break;
		case 'fi':
			locale = '🇫🇮';
			break;
		case 'fr':
			locale = '🇫🇷';
			break;
		case 'de':
			locale = '🇩🇪';
			break;
		case 'el':
			locale = '🇬🇷';
			break;
		case 'hi':
			locale = '🇮🇳';
			break;
		case 'hu':
			locale = '🇭🇺';
			break;
		case 'it':
			locale = '🇮🇹';
			break;
		case 'ja':
			locale = '🇯🇵';
			break;
		case 'ko':
			locale = '🇰🇵/🇰🇷';
			break;
		case 'lt':
			locale = '🇱🇹';
			break;
		case 'no':
			locale = '🇳🇴';
			break;
		case 'pl':
			locale = '🇵🇱';
			break;
		case 'pt-BR':
			locale = '🇵🇹';
			break;
		case 'ro':
			locale = '🇷🇴';
			break;
		case 'ru':
			locale = '🇷🇺';
			break;
		case 'es-ES':
			locale = '🇪🇸';
			break;
		case 'sv-SE':
			locale = '🇸🇪';
			break;
		case 'th':
			locale = '🇹🇭';
			break;
		case 'tr':
			locale = '🇹🇷';
			break;
		case 'uk':
			locale = '🇺🇦';
			break;
		case 'vi':
			locale = '🇻🇳';
			break;
		}

		let status;
		if (devices) {
			const entries = Object.entries(devices).map(
				(value) => {
					if (member.user.bot) return '<:bot:945599604328632410>';

					if (value[0] === 'desktop') {
						return '<:desktop:945594746301214761>';
					}
					else if (value[0] === 'mobile') {
						return '<:mobile:945594316900925450>';
					}
					else if (value[0] === 'web') {
						return '<:browser:945593772979388426>';
					}
					else { return '<:offline:946639965360640012>'; }
				});
			status = entries.join('');
		}
		else {
			status = '<:offline:946639965360640012>';
		}

		// The embed that is sent when the command is ran
		const embed = new MessageEmbed()
			.setColor('2F3137')
			.setTitle(`${member.user.tag}`)
			.setDescription(`${locale} ${status}\n\n**Account Created**\n<t:${moment(createdAt).unix()}:f> | <t:${moment(createdAt).unix()}:R>`)
			.setThumbnail(member.displayAvatarURL({ dynamic: true }));

		// Reply to the command with the above embed
		await interaction.reply({ embeds: [embed] });
	},
};