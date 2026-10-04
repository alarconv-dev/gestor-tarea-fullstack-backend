const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    audience: 'taskflow-client',
    expiresIn: '1h',
    issuer: 'taskflow-api'
  });
}

router.post('/register', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name || name.length > 80) {
    return res.status(400).json({ message: 'El nombre es obligatorio y debe tener hasta 80 caracteres' });
  }

  if (email.length > 254 || !emailPattern.test(email)) {
    return res.status(400).json({ message: 'Ingresa un correo válido' });
  }

  const passwordBytes = Buffer.byteLength(password, 'utf8');
  if ([...password].length < 12 || passwordBytes > 72) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 12 caracteres y hasta 72 bytes' });
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (existingUser) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = db.prepare(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
    ).run(name, email, hashedPassword);

    const token = createToken(result.lastInsertRowid);

    return res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        name,
        email
      }
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }
    console.error('Error al registrar usuario');
    return res.status(500).json({ message: 'No se pudo crear la cuenta' });
  }
});

router.post('/login', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (email.length > 254 || !emailPattern.test(email) || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Correo o contraseña no válidos' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = createToken(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión');
    return res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

module.exports = router;