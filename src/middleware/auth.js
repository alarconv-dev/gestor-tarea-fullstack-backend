// protege las rutas de las conexiones APIs
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  // contiene todos los encabezados HTTP req.headers[]
  // Propiedad donde vive la cabecera Authorization req.headers.authorization
  const authHeader = req.headers.authorization;
 
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticación faltante' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

module.exports = auth;
