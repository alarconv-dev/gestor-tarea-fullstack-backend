const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const projects = db.prepare(`
    SELECT projects.*, COUNT(tasks.id) AS task_count
    FROM projects
    LEFT JOIN tasks ON tasks.project_id = projects.id AND tasks.user_id = projects.user_id
    WHERE projects.user_id = ?
    GROUP BY projects.id
    ORDER BY projects.created_at DESC
  `).all(req.user.id);

  res.json(projects);
});

router.post('/', auth, (req, res) => {
  const { name, description = '' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'El nombre del proyecto es obligatorio' });
  }

  const result = db.prepare(
    'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)'
  ).run(req.user.id, name.trim(), description);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ ...project, task_count: 0 });
});

router.put('/:id', auth, (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!existing) {
    return res.status(404).json({ message: 'Proyecto no encontrado' });
  }

  const { name, description } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ message: 'El nombre del proyecto es obligatorio' });
  }

  db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ? AND user_id = ?')
    .run(name?.trim() ?? existing.name, description ?? existing.description, req.params.id, req.user.id);

  const project = db.prepare(`
    SELECT projects.*, COUNT(tasks.id) AS task_count
    FROM projects LEFT JOIN tasks ON tasks.project_id = projects.id AND tasks.user_id = projects.user_id
    WHERE projects.id = ? AND projects.user_id = ?
    GROUP BY projects.id
  `).get(req.params.id, req.user.id);

  return res.json(project);
});

router.delete('/:id', auth, (req, res) => {
  const existing = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!existing) {
    return res.status(404).json({ message: 'Proyecto no encontrado' });
  }

  db.transaction(() => {
    db.prepare('UPDATE tasks SET project_id = NULL WHERE project_id = ? AND user_id = ?').run(req.params.id, req.user.id);
    db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  })();

  return res.json({ message: 'Proyecto eliminado; las tareas se conservaron' });
});

module.exports = router;