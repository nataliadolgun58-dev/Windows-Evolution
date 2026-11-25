const router = require('express').Router();
const c = require('../controllers/compareController');

router.get('/', c.compare);
router.get('/export/pdf', c.exportPdf);
router.get('/export/xlsx', c.exportXlsx);

module.exports = router;
