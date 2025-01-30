const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // increase from 100 to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

module.exports = limiter; 