const mongoose = require('mongoose');
require('dotenv').config();

module.exports = async () => {
	await mongoose.connect(process.env.MONGO);
	return mongoose;
};