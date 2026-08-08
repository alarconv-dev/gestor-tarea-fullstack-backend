const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);

  res.json(tasks);
});

router.post('/', auth, (req, res) => {
  const title=req.body.title;
  const description=req.body.description;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'El título es obligatorio' });
  }

  const result = db.prepare(
    'INSERT INTO tasks (user_id, title, description, completed) VALUES (?, ?, ?, 0)'
  ).run(req.user.id, title.trim(), description || '');

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json(task);
});

router.put('/:id', auth, (req, res) => {
  const { title, description, completed } = req.body;

  const existing = db.prepare(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!existing) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  db.prepare(
    'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ? AND user_id = ?'
  ).run(
    title?.trim() ?? existing.title,
    description ?? existing.description,
    completed !== undefined ? (completed ? 1 : 0) : existing.completed,
    req.params.id,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

  return res.json(updated);
});

router.delete('/:id', auth, (req, res) => {
  const result = db.prepare(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  res.json({ message: 'Tarea eliminada' });
});

module.exports = router;