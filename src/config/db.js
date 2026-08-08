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

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title nvarchar(255) NOT NULL,
    description nvarchar(255) DEFAULT '',
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

`);

console.log('Base de datos SQLite lista');

module.exports = db;