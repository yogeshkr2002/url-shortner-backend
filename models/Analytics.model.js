const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    linkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Link',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String,
        default: '192.158.1.38'
    },
    userAgent: String,
    userDevice: {
        type: String,
        enum: ['Android', 'iOS', 'Chrome', 'Firefox', 'Safari', 'Unknown'],
        default: 'Chrome'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Analytics', analyticsSchema); 