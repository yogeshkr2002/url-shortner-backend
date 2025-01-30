const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const auth = require('../middleware/auth.middleware');

router.get('/dashboard', auth, analyticsController.getDashboardStats);
router.get('/all', auth, analyticsController.getAllAnalytics);

module.exports = router; 