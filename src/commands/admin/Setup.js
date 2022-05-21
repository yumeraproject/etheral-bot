const { SlashCommandBuilder} = require('@discordjs/builders');
const { Modal, TextInputComponent, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const guildSettingsSchema = require('../../database/schemas/GuildSettingsSchema');
const mongo = require('../../database/Mongo');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup a feature.')
		.setDefaultPermission(false)
        .addSubcommand(subcommand =>
			subcommand
				.setName('verification')
				.setDescription('Setup / Configure the Verification Command')
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('The channel which the verification panel will be sent into.')
						.setRequired(true))
                .addRoleOption(option => 
                    option.setName('role')
                        .setDescription('The role to grant to user\'s that verify.')
                        .setRequired(true))
                .addBooleanOption(option =>
                        option.setName('enabled')
                        .setDescription('Do you want the verification system to be enabled?')
                        .setRequired(true))),
	async execute(interaction) {
		const guild = interaction.guild;
        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');
        const enabled = interaction.options.getBoolean('enabled');

        if (interaction.options.getSubcommand() === 'verification') {

            if (channel.type !== 'GUILD_TEXT') {
                await interaction.reply({ embeds: [new MessageEmbed()
                    .setColor('RED')
                    .setDescription('**<:Error:939392259160416307> Incorrect Channel Type**\nYou can only specify a **Text Channel** for the ``channel`` parameter.\n```ㅤ```')], ephemeral: true });
                return;
            }

            if (enabled) {
                const verificationModal = new Modal().setCustomId('verificationSetup').setTitle('Configure Verification Embed');

                const titleInput = new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setLabel('Embed Title')
                        .setCustomId('verificationMessageTitle')
                        .setStyle('SHORT')
                        .setPlaceholder('Verification System'));

                const messageInput = new MessageActionRow().addComponents( 
                    new TextInputComponent()
                        .setLabel('Embed Message')
                        .setCustomId('verificationMessageInput')
                        .setStyle('PARAGRAPH')
                        .setPlaceholder('Please click the button below to start the Verification Process.'));

                verificationModal.addComponents(titleInput, messageInput);
                await interaction.showModal(verificationModal);

                await mongo().then(async (mongoose) => {
                    try {
                        await guildSettingsSchema.findOneAndUpdate({ _id: guild.id }, { 'configuration.verificationEnabled': enabled }, { upsert: true });
                        await guildSettingsSchema.findOneAndUpdate({ _id: guild.id }, { 'configuration.verificationRoleId': role }, { upsert: true });
                        await guildSettingsSchema.findOneAndUpdate({ _id: guild.id }, { 'configuration.verificationChannelId': channel.id }, { upsert: true });
                    }
                    finally {
                        mongoose.connection.close();
                    }
                });
            } else {
                await mongo().then(async (mongoose) => {
                    try {
                        await guildSettingsSchema.findOneAndUpdate({ _id: guild.id }, { 'configuration.verificationEnabled': enabled }, { upsert: true });
                        await guildSettingsSchema.findOneAndUpdate({ _id: guild.id }, { 'configuration.verificationRoleId': role }, { upsert: true });
                        await guildSettingsSchema.findOneAndUpdate({ _id: guild.id }, { 'configuration.verificationChannelId': channel.id }, { upsert: true });
                    }
                    finally {
                        mongoose.connection.close();
                    }
                });
    
                await interaction.reply({ content: `✅ Successfully modified the **Verification System**.`, ephemeral: true });
            }
        }
	},
};