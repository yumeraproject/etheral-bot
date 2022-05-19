module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		console.log(`[SUCCESS] Successfully logged into ${client.user.tag}.`);
		client.user.setStatus('dnd');
	},
};