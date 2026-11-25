// Єдина обробка помилок API
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function notFound(req, res) {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Маршрут API не знайдено' });
  res.status(404).sendFile(require('path').join(__dirname, '..', 'public', 'index.html'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Внутрішня помилка сервера' : err.message });
}

module.exports = { HttpError, notFound, errorHandler };
