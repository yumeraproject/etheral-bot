const { io } = require('socket.io-client');
const client = require('../../index.js');
const { MessageEmbed } = require('discord.js');
const guildSettingsSchema = require('../../database/schemas/GuildSettingsSchema');
const mongo = require('../../database/Mongo');

const socket = io('http://localhost:3001');

socket.on('verification', async (data) => {
	const { status, userId, userName, guildId } = data;
	if (status === 'Pending') {

		const guild = await client.guilds.cache.get(guildId);
	
		if (guild === undefined) {
			socket.emit('verification', {
				"status": "Failed",
				"error": "Invalid guildId",
				"userId": userId,
			});
			return;
		};

		const member = await guild.members.cache.get(userId);

		if (member === undefined) {
			socket.emit('verification', {
				"status": "Failed",
				"error": "Invalid userId",
				"userId": userId,
			});
			return;
		};
	
		let verifiedRoleId;
		await mongo().then(async (mongoose) => {
			try {
				const results = await guildSettingsSchema.find({ _id: guild.id });
				for (const result of results) {
					verifiedRoleId = result.configuration.verificationRoleId;
				}
			}
			finally {
				mongoose.connection.close();
			}
		});

		if (member.roles.cache.some(role => role.id === verifiedRoleId)) {
			socket.emit('verification', {
				"status": "Redundant",
				"userId": userId,
			});
			return;
		} 

		const role = await guild.roles.cache.find(role => role.id === verifiedRoleId);
		member.roles.add(role);

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

	};
});
