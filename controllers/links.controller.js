const Link = require('../models/Link.model');
const Analytics = require('../models/Analytics.model');

exports.getLinks = async (req, res) => {
    try {
        const links = await Link.find({ userId: req.user._id });
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching links', error: error.message });
    }
};

exports.createLink = async (req, res) => {
    try {
        const { originalUrl, remarks, expirationDate } = req.body;
        const shortHash = Math.random().toString(36).substring(2, 8);

        const link = await Link.create({
            userId: req.user._id,
            originalUrl,
            shortHash,
            remarks,
            expirationDate
        });

        res.status(201).json(link);
    } catch (error) {
        res.status(500).json({ message: 'Error creating link', error: error.message });
    }
};

exports.updateLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { originalUrl, remarks, expirationDate } = req.body;

        const link = await Link.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { 
                originalUrl,
                remarks,
                expirationDate
            },
            { new: true }
        );

        if (!link) {
            return res.status(404).json({ message: 'Link not found' });
        }

        res.json(link);
    } catch (error) {
        res.status(500).json({ message: 'Error updating link', error: error.message });
    }
};

exports.deleteLink = async (req, res) => {
    try {
        const { id } = req.params;
        const link = await Link.findOneAndDelete({ _id: id, userId: req.user._id });

        if (!link) {
            return res.status(404).json({ message: 'Link not found' });
        }

        res.json({ message: 'Link deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting link', error: error.message });
    }
};

exports.redirectToOriginalUrl = async (req, res) => {
    try {
        const { shortHash } = req.params;
        const link = await Link.findOne({ shortHash });

        if (!link) {
            return res.status(404).json({ message: 'Link not found' });
        }

        // Check expiration
        if (link.expirationDate && new Date() > new Date(link.expirationDate)) {
            return res.status(410).json({ message: 'Link has expired' });
        }

        // Detect device type from user agent
        const userAgent = req.headers['user-agent']?.toLowerCase() || '';
        let userDevice = 'Chrome'; // Default device

        if (userAgent.includes('android')) {
            userDevice = 'Android';
        } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
            userDevice = 'iOS';
        } else if (userAgent.includes('chrome')) {
            userDevice = 'Chrome';
        } else if (userAgent.includes('firefox')) {
            userDevice = 'Firefox';
        } else if (userAgent.includes('safari')) {
            userDevice = 'Safari';
        }

        // Create analytics record
        await Analytics.create({
            linkId: link._id,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: userAgent,
            userDevice: userDevice,
            timestamp: new Date()
        });

        // Increment clicks
        await Link.findByIdAndUpdate(link._id, { $inc: { clicks: 1 } });

        res.redirect(link.originalUrl);
    } catch (error) {
        console.error('Redirect error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 