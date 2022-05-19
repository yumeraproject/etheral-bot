const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');
const canvas = require('canvas');
const RectUtil = require('../../util/RectUtil');
const osuAPI = require('../../util/OsuAPI');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('osu')
		.setDescription('Fetches information from the Osu!API')
		.setDefaultPermission(true)
		.addSubcommand(subcommand =>
			subcommand.setName('user')
				.setDescription('Fetch information on a specific user')
				.addStringOption(option =>
					option.setName('username')
						.setDescription('The desired user\'s username or ID.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('mode')
						.setDescription('The osu!mode to fetch for this user')
						.addChoice('osu!Standard', 'osu')
						.addChoice('osu!Taiko', 'taiko')
						.addChoice('osu!Catch', 'fruits')
						.addChoice('osu!Mania', 'mania')
						.setRequired(true))
				.addBooleanOption(option =>
					option.setName('show-links')
						.setDescription('Show user\'s osu!profile links'))),
	async execute(interaction) {
		const { guild, options } = interaction;
		const username = options.getString('username');
		const mode = options.getString('mode');
		const showLinks = options.getBoolean('show-links');

		// Get osu!API
		const API = await osuAPI.getUser(username, mode);

		// If the user selected the User Subcommand
		if (options.getSubcommand() === 'user') {
			if (API.id !== undefined) {
				const profile = canvas.createCanvas(700, 200);
				const context = profile.getContext('2d');

				const background = await canvas.loadImage(__dirname + './../../../images/Osu-Background.png');
				context.drawImage(background, 0, 0, profile.width, profile.height);

				// Specified Mode
				context.shadowColor = 'transparent';
				const icon = await canvas.loadImage(__dirname + `./../../../images/Osu-${mode}.png`);
				context.globalAlpha = '0.2';
				context.drawImage(icon, 450, 40, 300, 300);

				// User's Name
				context.font = 'Bold 35px Kanit';
				context.fillStyle = 'white';
				context.shadowColor = 'white';
				context.shadowBlur = 7;
				context.fillText(API.username, 188, 80);

				// User's Flag
				// flagCode Source: https://github.com/omkelderman/osu-flags-proxy/blob/master/index.js#L76
				context.globalAlpha = '1';
				const flagCode = [...Array(API.country_code.length).keys()].map(i => (API.country_code.charCodeAt(i) + 127397).toString(16)).join('-');
				const userFlag = await canvas.loadImage(`https://osu.ppy.sh/assets/images/flags/${flagCode}.svg`);
				context.shadowColor = 'black';
				context.shadowBlur = 2;
				context.drawImage(userFlag, context.measureText(API.username).width + 195, 56, 28, 28);

				// User's Supporter level
				if (API.is_supporter) {
					const supporter = await canvas.loadImage(__dirname + './../../../images/Osu-Supporter.png');
					context.fillStyle = '#ff66ab';
					context.shadowColor = '#ff66ab';
					context.shadowBlur = 5;
					if (API.support_level == 1) {
						RectUtil(context, 210, 35, 30, 15, 10);
						context.fill();
						context.shadowColor = 'white';
						context.shadowBlur = 2;
						context.drawImage(supporter, 220, 38, 10, 10);
					}
					else if (API.support_level == 2) {
						RectUtil(context, 200, 35, 35, 15, 7);
						context.fill();
						context.shadowColor = 'white';
						context.shadowBlur = 2;
						context.drawImage(supporter, 206, 38, 10, 10);
						context.drawImage(supporter, 219, 38, 10, 10);
					}
					else if (API.support_level == 3) {
						RectUtil(context, 200, 35, 48, 15, 7);
						context.fill();
						context.shadowColor = 'white';
						context.shadowBlur = 2;
						context.drawImage(supporter, 206, 38, 10, 10);
						context.drawImage(supporter, 219, 38, 10, 10);
						context.drawImage(supporter, 232, 38, 10, 10);
					}
				}

				// User's Level
				context.shadowColor = 'transparent';
				const levelIcon = await canvas.loadImage(__dirname + './../../../images/Osu-Level.png');
				const level = API.statistics.level.current;

				// Determine text properties based off of length
				let font;
				let levelX;
				let levelY;
				switch (level.toString().length) {
				case 1:
					font = 'Bold 42px Calibri';
					levelX = 211;
					levelY = 138;
					break;
				case 2:
					font = 'Bold 42px Calibri';
					levelX = 201;
					levelY = 138;
					break;
				case 3:
					font = 'Bold 32px Calibri';
					levelX = 197;
					levelY = 134;
					break;
				}
				context.drawImage(levelIcon, 0, 0, profile.width, profile.height);
				context.font = font;
				context.fillStyle = '#ffffff';
				context.shadowColor = 'white';
				context.shadowBlur = 7;
				context.fillText(level, levelX, levelY);

				// Level progress bar
				const levelProgress = API.statistics.level.progress;
				context.strokeStyle = '#e5e5e5';
				context.lineWidth = '2';
				RectUtil(context, 272, 110, 204, 29, 7);
				context.stroke();
				context.fillStyle = '#f0d646';
				context.shadowColor = '#f0d646';
				context.shadowBlur = 6;
				RectUtil(context, 274, 112, 200 / 100 * levelProgress, 25, 7);
				context.fill();

				// Avatar
				context.shadowColor = 'transparent';
				RectUtil(context, 25, 25, 150, 150, 30);
				context.clip();
				const userAvatar = await canvas.loadImage(API.avatar_url);
				context.drawImage(userAvatar, 25, 25, 150, 150);

				const attachment = new MessageAttachment(profile.toBuffer(), 'osu-user.png');

				// Add links to the response
				const osuRow = new MessageActionRow();
				if (API.twitter || API.website) {
					if (API.twitter) {
						osuRow.addComponents(
							new MessageButton()
								.setURL(`https://twitter.com/${API.twitter}`)
								.setStyle('LINK')
								.setEmoji('871792592801660978'),
						);
					}
					if (API.website) {
						osuRow.addComponents(
							new MessageButton()
								.setURL(API.website)
								.setStyle('LINK')
								.setEmoji('🔗'),
						);
					}
				}
				else {
					osuRow.addComponents(
						new MessageButton()
							.setCustomId('noLinksFound')
							.setStyle('SECONDARY')
							.setLabel('No links found')
							.setDisabled(true),
					);
				}
				await interaction.reply({ files: [attachment], components: showLinks ? [osuRow] : [] });
				console.log(API);
			}
			else {
				await interaction.reply({ embeds: [new MessageEmbed()
					.setColor('RED')
					.setDescription('**<:error:939392259160416307> User not found**\nThe provided user could not be found, did you spell it incorrectly?\n```ㅤ```')], ephemeral: true });
				return;
			}
		}

	},
};