# Series pendientes (API)

API de la app de series pendientes. Autentica con Firebase Auth (vía API REST), guarda datos en Firestore (Admin SDK) y consulta TVMaze.

Ver también AGENTS.md (generado por Next.js).

## Stack
Next.js (App Router, Route Handlers en app/api/**/route.ts con `export const runtime = "nodejs"`), firebase-admin, zod, vitest. Despliegue en Vercel.

## Comandos
- `npm run dev` · `npm run lint` · `npm run typecheck` · `npm run format:check` · `npm test`

## Sí
- Validar TODO con Zod y descartar campos no declarados.
- Verificar el ID token (verifyIdToken) en cada ruta privada; el uid sale del token, nunca del cuerpo ni de la URL.
- Errores con formato { "error": "...", "detalles"?: [...] }; los internos responden 500 "Error interno" sin detalles.
- Borrado lógico (deleted_at) y campos base puestos por el servidor.

## No
- Nunca leer ni escribir .env*, claves, cuentas de servicio ni credenciales.
- Nunca registrar contraseñas, tokens ni datos personales en logs.
- Nunca poner secretos en Git.
- Nunca salir de esta carpeta.
- Acciones con efecto fuera de la máquina (push, deploy, vercel) solo con permiso explícito.
- No agregar funciones extra antes de cumplir los requisitos del documento del proyecto.
