const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, 'database.db'));

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name nvarchar(255) NOT NULL,
    email nvarchar(255) NOT NULL UNIQUE,
    password nvarchar(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name nvarchar(255) NOT NULL,
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER,
    title nvarchar(255) NOT NULL,
    description TEXT DEFAULT '',
    completed INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pendiente',
    priority TEXT NOT NULL DEFAULT 'Media',
    due_date TEXT,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS task_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const taskColumns = new Set(db.prepare('PRAGMA table_info(tasks)').all().map((column) => column.name));

if (!taskColumns.has('project_id')) {
  db.exec('ALTER TABLE tasks ADD COLUMN project_id INTEGER');
}

if (!taskColumns.has('status')) {
  db.exec("ALTER TABLE tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'Pendiente'");
  db.exec("UPDATE tasks SET status = CASE WHEN completed = 1 THEN 'Completado' ELSE 'Pendiente' END");
}

if (!taskColumns.has('priority')) {
  db.exec("ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'Media'");
}

if (!taskColumns.has('due_date')) {
  db.exec('ALTER TABLE tasks ADD COLUMN due_date TEXT');
}

if (!taskColumns.has('notes')) {
  db.exec("ALTER TABLE tasks ADD COLUMN notes TEXT DEFAULT ''");
}

console.log('Base de datos SQLite lista');

module.exports = db;