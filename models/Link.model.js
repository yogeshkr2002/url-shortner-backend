const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalUrl: {
        type: String,
        required: true
    },
    shortHash: {
        type: String,
        required: true,
        unique: true
    },
    remarks: String,
    clicks: {
        type: Number,
        default: 0
    },
    expirationDate: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Link', linkSchema); 