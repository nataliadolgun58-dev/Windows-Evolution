const router = require('express').Router();
const c = require('../controllers/knowledgeController');

router.get('/', c.overview);

module.exports = router;
