const express = require('express');// framework de nodejs para crear servidores web
const bcrypt = require('bcryptjs');// contraseña encriptada
const jwt = require('jsonwebtoken');// token de autenticacion (el guardia de la puerta xd verifica que el usuario tenga acceso a la ruta)
const db = require('../config/db');

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '3d' });
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (existingUser) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
    console.error('ERROR REGISTER:', error.message);
    return res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

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
    return res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

module.exports = router;