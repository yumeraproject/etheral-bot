const guildSettingsSchema = require('../../database/schemas/GuildSettingsSchema');
const mongo = require('../../database/Mongo');

module.exports = {
	name: 'guildDelete',
	async execute(guild) {
		console.log(`[LEFT] Left server ${guild.id}.`);

		await mongo().then(async (mongoose) => {
            try {
                await guildSettingsSchema.deleteOne({ _id: guild.id });
            }
            finally {
                mongoose.connection.close();
            }
        });
	},
};