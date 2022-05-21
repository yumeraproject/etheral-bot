const { io } = require('socket.io-client');
const client = require('../../index.js');
const { MessageEmbed } = require('discord.js');

const socket = io('http://localhost:3001');

socket.on('verification', async (data) => {
	const { status, userId, userName, guildId } = data;
	if (status === 'Pending') {

		const guild = await client.guilds.cache.get(guildId);
	
		if (guild === undefined) {
			socket.emit('verification', {
				"status": "Failed",
				"error": "Invalid GuildId",
				"userId": userId,
			});
			return;
		};
	
		const channel = await guild.channels.cache.get('944106283991183360');
	
		const embed = new MessageEmbed()
			.setColor('2F3137')
			.setTitle(`Verified ${userName}`)
			.setDescription(`${userName} \`\`(${userId})\`\` has successfully verified.`);
		channel.send({ embeds: [embed] });

		socket.emit('verification', {
			"status": "Successful",
			"userId": userId,
		});

		//TODO: If user already has verified role, respond back to server and display on client
	};
});
