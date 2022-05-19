const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('guildinfo')
		.setDescription('Displays information about the current guild')
		.setDefaultPermission(true),
	async execute(interaction) {
		const guild = interaction.guild;

		// To avoid a timeout when fetching data
		await interaction.deferReply();

		const guildOwner = await guild.fetchOwner();
		const guildBans = await guild.bans.fetch();

		// Get the Boost Tier of the Guild
		let guildTier = 'No Level';
		switch (guild.premiumTier) {
		case 'TIER_1':
			guildTier = 'Level I';
			break;
		case 'TIER_2':
			guildTier = 'Level II';
			break;
		case 'TIER_3':
			guildTier = 'Level III';
			break;
		}

		// The embed that is sent when the command is ran
		const embed = new MessageEmbed()
			.setColor('2F3137')
			.setTitle(`${guild.name}`)
			.setDescription(`This guild is owned by ${guildOwner.user.tag}
				It was created around <t:${moment(guild.createdTimestamp).unix()}:R>
				\n**Members**\n<:users:944475367782105088> ${guild.memberCount} users and ${guildBans.size} bans
				\n**Boost Status**\n<:boost:944481273693491200> ${guildTier} with ${guild.premiumSubscriptionCount} active boosts`)
			.setImage(guild.bannerURL({ format: 'jpg', size: 4096 }))
			.setThumbnail(guild.iconURL({ dynamic: true }));

		// Reply to the command with the above embed
		await interaction.editReply({ embeds: [embed] });
	},
};