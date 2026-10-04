const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();
const taskStatuses = ['Pendiente', 'En proceso', 'Completado'];
const priorities = ['Baja', 'Media', 'Alta'];

router.get('/', auth, (req, res) => {
  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);

  res.json(tasks);
});

router.get('/:id/notes', auth, (req, res) => {
  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!task) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  const notes = db.prepare(
    'SELECT id, body, created_at FROM task_notes WHERE task_id = ? AND user_id = ? ORDER BY created_at DESC, id DESC'
  ).all(task.id, req.user.id);

  return res.json(notes);
});

router.post('/:id/notes', auth, (req, res) => {
  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!task) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  const body = req.body.body?.trim();
  if (!body) {
    return res.status(400).json({ message: 'La anotación no puede estar vacía' });
  }

  const result = db.prepare('INSERT INTO task_notes (task_id, user_id, body) VALUES (?, ?, ?)')
    .run(task.id, req.user.id, body);
  const note = db.prepare('SELECT id, body, created_at FROM task_notes WHERE id = ?').get(result.lastInsertRowid);

  return res.status(201).json(note);
});

router.post('/', auth, (req, res) => {
  const { title, description = '', project_id: projectId = null, status = 'Pendiente', priority = 'Media', due_date: dueDate = null, notes = '' } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'El título es obligatorio' });
  }

  if (!taskStatuses.includes(status) || !priorities.includes(priority)) {
    return res.status(400).json({ message: 'Estado o prioridad no válidos' });
  }

  if (projectId !== null && !db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(projectId, req.user.id)) {
    return res.status(400).json({ message: 'El proyecto seleccionado no existe' });
  }

  const result = db.prepare(
    'INSERT INTO tasks (user_id, project_id, title, description, completed, status, priority, due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, projectId, title.trim(), description, status === 'Completado' ? 1 : 0, status, priority, dueDate || null, notes);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json(task);
});

router.put('/:id', auth, (req, res) => {
  const { title, description, completed, status, priority, due_date: dueDate, notes, project_id: projectId } = req.body;

  const existing = db.prepare(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!existing) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  const nextStatus = status ?? (completed !== undefined ? (completed ? 'Completado' : 'Pendiente') : existing.status);
  const nextPriority = priority ?? existing.priority;

  if (!taskStatuses.includes(nextStatus) || !priorities.includes(nextPriority)) {
    return res.status(400).json({ message: 'Estado o prioridad no válidos' });
  }

  const nextProjectId = projectId === undefined ? existing.project_id : projectId;
  if (nextProjectId !== null && !db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(nextProjectId, req.user.id)) {
    return res.status(400).json({ message: 'El proyecto seleccionado no existe' });
  }

  db.prepare(
    'UPDATE tasks SET project_id = ?, title = ?, description = ?, completed = ?, status = ?, priority = ?, due_date = ?, notes = ? WHERE id = ? AND user_id = ?'
  ).run(
    nextProjectId,
    title?.trim() ?? existing.title,
    description ?? existing.description,
    nextStatus === 'Completado' ? 1 : 0,
    nextStatus,
    nextPriority,
    dueDate === undefined ? existing.due_date : dueDate || null,
    notes ?? existing.notes,
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