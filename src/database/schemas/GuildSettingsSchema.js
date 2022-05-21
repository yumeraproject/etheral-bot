const mongoose = require('mongoose');

const guildSettingsSchema = mongoose.Schema({
	_id: { type: String },
	configuration: new mongoose.Schema({
		ticketCategoryId: { type: String },
		ticketStaffId: { type: String },
		ticketLogId: { type: String },
		suggestionChannelId: { type: String },
		verificationEnabled: { type: Boolean, default: false },
		verificationEmbedTitle: { type: String, default: 'Verification System' },
		verificationEmbedMessage: { type: String, default: 'Please click the button below to start the Verification Process.' },
		verificationRoleId: { type:String },
		verificationChannelId: { type: String },
	}),
});

module.exports = mongoose.model('guild-settings', guildSettingsSchema);