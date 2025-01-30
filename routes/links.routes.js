const router = require('express').Router();
const linksController = require('../controllers/links.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth, linksController.getLinks);
router.post('/', auth, linksController.createLink);
router.put('/:id', auth, linksController.updateLink);
router.delete('/:id', auth, linksController.deleteLink);

module.exports = router;