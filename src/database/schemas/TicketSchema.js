const mongoose = require('mongoose');

// For later on (Donator Thing)
const ticketSchema = mongoose.Schema({
	_id: { type: String },
	categoryId: { type: String },
	creatorId: { type: String },
	ticketId: { type: String },
	channelId: { type: String },
	closed: { type: Boolean },
	locked: { type: Boolean },
});

module.exports = mongoose.model('ticket-information', ticketSchema);