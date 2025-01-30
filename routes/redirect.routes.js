const router = require('express').Router();
const { redirectToOriginalUrl } = require('../controllers/links.controller');

router.get('/:shortHash', redirectToOriginalUrl);

module.exports = router; 