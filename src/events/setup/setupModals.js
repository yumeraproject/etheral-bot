const { ButtonInteraction, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const guildSettingsSchema = require('../../database/schemas/GuildSettingsSchema');
const mongo = require('../../database/Mongo');

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		if (interaction.isModalSubmit()) {
            const { guild } = interaction;
            let titleInput = interaction.fields.getTextInputValue('verificationMessageTitle');
            let messageInput = interaction.fields.getTextInputValue('verificationMessageInput');

            let channelId;
            await mongo().then(async (mongoose) => {
				try {
                    const results = await guildSettingsSchema.find({ _id: guild.id });
					for (const result of results) {
                        if (!(titleInput.length >= 1)) {
                            titleInput = result.configuration.verificationEmbedTitle;
                        } else {
                            await guildSettingsSchema.findOneAndUpdate({ _id: guild.id }, { 'configuration.verificationEmbedTitle': titleInput }, { upsert: true });
                        }
                        if (!(messageInput.length >= 1)) {
                            messageInput = result.configuration.verificationEmbedMessage;
                        } else {
                            await guildSettingsSchema.findOneAndUpdate({ _id: guild.id }, { 'configuration.verificationEmbedMessage': messageInput }, { upsert: true });
                        }

						channelId = result.configuration.verificationChannelId;
					}
				}
				finally {
					mongoose.connection.close();
				}
			});

            await interaction.reply({ content: `✅ Successfully modified the **Verification System**.`, ephemeral: true });
            
            const channel = await guild.channels.cache.get(channelId);

            const verifyEmbed = new MessageEmbed()
                .setColor('2F3137')
                .setTitle(titleInput)
                .setDescription(messageInput);

            const actionRow = new MessageActionRow()
                .addComponents(
                    new MessageButton()
						.setCustomId('verifyUser')
						.setStyle('PRIMARY')
						.setLabel('Verify'),
                );

            channel.send({ embeds: [verifyEmbed], components: [actionRow] });
        };
	},
};