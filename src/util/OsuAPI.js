const fetch = require('node-fetch');

/**
 * @param {string} username - The user's ID or Name
 * @param {string} mode - The mode to fetch for this user
 */
exports.getUser = async (username, mode) => {
	if (!username || !mode) return;

	const grantData = await fetch('https://osu.ppy.sh/oauth/token', {
		method: 'post',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			'grant_type': 'client_credentials',
			'client_id': parseInt(process.env.OSU_CLIENT_ID),
			'client_secret': process.env.OSU_CLIENT_SECRET,
			'scope': 'public',
		}),
	});
	const clientGrant = await grantData.json();
	const apiLink = `https://osu.ppy.sh/api/v2/users/${encodeURIComponent(username)}/${mode}`;
	const resoulution = await fetch(apiLink, {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application.json',
			'Authorization': `Bearer ${clientGrant.access_token}`,
		},
	});
	return await resoulution.json();
};