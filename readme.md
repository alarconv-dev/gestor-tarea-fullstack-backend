# Taskflow API

API REST para autenticación, proyectos, tareas y anotaciones. La persistencia usa SQLite mediante `better-sqlite3`; la base `src/config/database.db` y sus migraciones se inicializan al arrancar.

## Requisitos

- Node.js 20 o superior
- `JWT_SECRET` definido en `backend/.env` (mínimo 32 bytes en producción)
- `FRONTEND_ORIGIN` con el origen exacto del frontend en producción, por ejemplo `https://app.ejemplo.com`

## Ejecución

```bash
npm install
npm run dev
```

El servidor escucha en `http://localhost:4000`.

## Rutas

- `POST /api/auth/register` y `POST /api/auth/login`
- `GET`, `POST`, `PUT` y `DELETE /api/projects`
- `GET`, `POST`, `PUT` y `DELETE /api/tasks`
- `GET` y `POST /api/tasks/:id/notes`
- `GET /api/health`

Las rutas de proyectos, tareas y anotaciones requieren un token JWT en `Authorization: Bearer <token>`. Las tareas admiten estados Pendiente, En proceso y Completado, prioridades Baja, Media y Alta, fechas límite y pertenencia opcional a un proyecto.

El registro requiere una contraseña de al menos 12 caracteres. Los endpoints de autenticación limitan los intentos por IP; en desarrollo se permiten los orígenes localhost 3000 y 3001. El frontend usa el proxy de Vite en desarrollo y `/api` en producción; configura un proxy HTTPS hacia el backend para el despliegue.