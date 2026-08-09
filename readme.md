# ⚙️ Gestor de Tareas — Backend API

Servidor RESTful backend diseñado para la aplicación de gestión de tareas. Proporciona autenticación segura, operaciones CRUD para la administración de tareas y persistencia de datos mediante una base de datos NoSQL.

## 🚀 Tecnologías y Librerías

* **Entorno de ejecución:** Node.js
* **Framework Web:** Express, Cors
* **Base de Datos:** MySQL
* **Autenticación:** JSON Web Tokens (JWT) & bcryptjs (encriptación de contraseñas)
* **Seguridad y Utilidades:** `dotenv`, `cors`

## 🛠️ Arquitectura y Estructura del Proyecto

```text
backend/
├── src/
│   ├── config/        # Configuración de base de datos (db.js)
│   ├── middleware/    # Middlewares de autenticación y validación
│   ├── routes/        # Definición de rutas API (authRoutes, taskRoutes)
│   └── server.js
├── package-lock.json
├── package.json
└── README.md