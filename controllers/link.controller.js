const Link = require('../models/Link.model');
const crypto = require('crypto');

// Generate a random hash for short URL
const generateHash = () => {
    return crypto.randomBytes(4).toString('hex');
};

exports.createLink = async (req, res) => {
    try {
        const { originalUrl, remarks, expirationDate } = req.body;
        const shortHash = generateHash();

        const link = new Link({
            userId: req.user._id,
            originalUrl,
            shortHash,
            remarks,
            expirationDate,
        });

        await link.save();
        res.status(201).json(link);
    } catch (error) {
        res.status(500).json({ message: 'Error creating link', error: error.message });
    }
};

exports.getLinks = async (req, res) => {
    try {
        const links = await Link.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching links', error: error.message });
    }
};

exports.updateLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks, expirationDate } = req.body;

        const link = await Link.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { remarks, expirationDate },
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

exports.redirectToOriginal = async (req, res) => {
    try {
        const { hash } = req.params;
        const link = await Link.findOne({ shortHash: hash });

        if (!link) {
            return res.status(404).json({ message: 'Link not found' });
        }

        if (link.expirationDate && new Date() > new Date(link.expirationDate)) {
            return res.status(410).json({ message: 'Link has expired' });
        }

        // Increment clicks
        link.clicks += 1;
        await link.save();

        res.redirect(link.originalUrl);
    } catch (error) {
        res.status(500).json({ message: 'Error redirecting', error: error.message });
    }
}; 