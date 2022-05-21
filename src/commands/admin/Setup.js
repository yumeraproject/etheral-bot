const { SlashCommandBuilder} = require('@discordjs/builders');
const { CommandInteractionOptionResolver } = require('discord.js');
const { Modal, TextInputComponent, MessageActionRow } = require('discord.js');

module.exports = {
    /**
	 * @param {CommandInteractionOptionResolver} interaction
	 */
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup a feature. ')
		.setDefaultPermission(false)
        .add,
	async execute(interaction) {
		const guild = interaction.guild;

		const myModal = new Modal().setCustomId('myModal').setTitle('Test');

		const favoriteColorInput = new TextInputComponent()
        .setPlaceholder('ratio lil bro')
			.setCustomId('favoriteColorInput')
		    // The label is the prompt the user sees for this input
			.setLabel('What\'s your favorite color?')
		    // Short means only a single line of text
			.setStyle('SHORT');
        
        const buttoninput = new TextInputComponent()
        .setRequired(true)
			.setCustomId('favoritffeColorInput')
		    // The label is the prompt the user sees for this input
			.setLabel('grrr')
            .setStyle('PARAGRAPH');

		const firstActionRow = new MessageActionRow().addComponents(favoriteColorInput);
        const secondtActionRow = new MessageActionRow().addComponents(buttoninput);

		myModal.addComponents(firstActionRow, secondtActionRow);

		await interaction.showModal(myModal);

	},
};