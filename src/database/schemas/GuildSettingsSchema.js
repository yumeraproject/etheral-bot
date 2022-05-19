const mongoose = require('mongoose');

const guildSettingsSchema = mongoose.Schema({
	_id: { type: String },
	configuration: new mongoose.Schema({
		ticketCategoryId: { type: String },
		ticketStaffId: { type: String },
		ticketLogId: { type: String },
		suggestionChannelId: { type: String },
	}),
});

module.exports = mongoose.model('guild-settings', guildSettingsSchema);