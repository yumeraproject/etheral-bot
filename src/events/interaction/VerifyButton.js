module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
        if (interaction.isButton()) {
            if (interaction.customId === 'verifyUser') {
                await interaction.reply(
                    { content: `Please verify through the following [link](http://localhost:3000/verify?userId=${interaction.user.id}&userName=${encodeURIComponent(interaction.user.tag)}&guildId=${interaction.guild.id}).`, ephemeral: true });
            } 
        }
	},
};