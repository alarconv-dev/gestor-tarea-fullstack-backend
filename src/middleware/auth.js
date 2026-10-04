const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticación faltante' });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: 'Token de autenticación faltante' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      audience: 'taskflow-client',
      issuer: 'taskflow-api'
    });

    if (!Number.isSafeInteger(decoded.id) || decoded.id < 1) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

module.exports = auth;
