const express = require('express');
const auth = require('../middleware/auth');
const Task = require('../models/Task');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'No se pudieron cargar las tareas' });
  }
});

router.post('/', auth, async (req, res) => {
  const { title, description } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'El título es obligatorio' });
  }

  try {
    const task = await Task.create({
      user: req.user.id,
      title: title.trim(),
      description: description || '',
      completed: false
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'No se pudo crear la tarea' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { title, description, completed } = req.body;

  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title: title?.trim(), description: description ?? '', completed },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    return res.json(task);
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo actualizar la tarea' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo eliminar la tarea' });
  }
});

module.exports = router;
