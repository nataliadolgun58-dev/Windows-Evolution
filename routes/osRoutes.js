const router = require('express').Router();
const c = require('../controllers/osController');

router.get('/stats', c.stats);
router.get('/os-images', c.images);
router.get('/os', c.list);
router.get('/os/:slug', c.get);

module.exports = router;
