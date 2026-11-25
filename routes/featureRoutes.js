const router = require('express').Router();
const c = require('../controllers/featureController');

router.get('/', c.matrix);

module.exports = router;
