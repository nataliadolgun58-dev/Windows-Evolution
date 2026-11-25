const router = require('express').Router();
const multer = require('multer');
const c = require('../controllers/importController');
const { HttpError } = require('../utils/errorHandler');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => /\.(csv|json|xlsx)$/i.test(file.originalname)
    ? cb(null, true) : cb(new HttpError(400, 'Непідтримуваний формат. Дозволено: CSV, JSON, XLSX'))
});
// Помилки multer (занадто великий файл тощо) -> зрозуміле повідомлення
const single = (req, res, next) => upload.single('file')(req, res, err => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') return next(new HttpError(400, 'Файл завеликий. Максимум — 2 МБ'));
  next(err.status ? err : new HttpError(400, 'Не вдалося завантажити файл: ' + err.message));
});

router.post('/preview', single, c.preview);
router.post('/', single, c.commit);
router.get('/template/:kind', c.template);

module.exports = router;
