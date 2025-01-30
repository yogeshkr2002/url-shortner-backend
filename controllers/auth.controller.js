const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const Link = require('../models/Link.model');
const Analytics = require('../models/Analytics.model');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email); // Debug log

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email); // Debug log
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Invalid password for:', email); // Debug log
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);
        console.log('Token generated for:', email); // Debug log

        // Send response without setting cookie
        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                mobileNumber: user.mobileNumber
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password'); // This should include mobileNumber
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, email, mobileNumber } = req.body;
        const user = await User.findById(req.user._id);

        if (username) user.username = username;
        if (email) user.email = email;
        if (mobileNumber) user.mobileNumber = mobileNumber;

        await user.save();
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        // Delete user's links and analytics
        const links = await Link.find({ userId: req.user._id });
        await Analytics.deleteMany({ linkId: { $in: links.map(link => link._id) } });
        await Link.deleteMany({ userId: req.user._id });
        
        // Delete user
        await User.findByIdAndDelete(req.user._id);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting account', error: error.message });
    }
}; 