const guildSettingsSchema = require('../../database/schemas/GuildSettingsSchema');
const mongo = require('../../database/Mongo');

module.exports = {
	name: 'guildCreate',
	async execute(guild) {
		console.log(`[JOINED] Joined server ${guild.id}.`);

		await mongo().then(async (mongoose) => {
            try {
                await guildSettingsSchema.create({ _id: guild.id });
            }
            finally {
                mongoose.connection.close();
            }
        });
	},
};