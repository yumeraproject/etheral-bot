const { io } = require('socket.io-client');
const client = require('../../index.js');
const { MessageEmbed } = require('discord.js');

const socket = io('http://localhost:3001');

socket.on('verify_user', async (data) => {
	const { status, userId, userName, guildId } = data;

	const guild = await client.guilds.cache.get(guildId);

	if (guild == undefined) return;

	const channel = await guild.channels.cache.get('944106283991183360');

	if (status === 'Successful') {
		const embed = new MessageEmbed()
			.setColor('2F3137')
			.setTitle(`Verified ${userName}`)
			.setDescription(`${userName} \`\`(${userId})\`\` has successfully verified.`);
		channel.send({ embeds: [embed] });
	}
	else if (status === 'Error') {
		const embed = new MessageEmbed()
			.setColor('2F3137')
			.setTitle(`Error verifying ${userName}`)
			.setDescription(`${userName} \`\`(${userId})\`\` was unable to verify.`);
		channel.send({ embeds: [embed] });
	}
});
