# Evidencia: hook de pre-commit (API)

El hook (.husky/pre-commit) ejecuta lint, typecheck y pruebas (vitest) antes de cada commit.

Prueba: se agregó `const x: number = 'texto';` en lib/errores.ts.
Resultado: el commit fue bloqueado por el typecheck (TS2322: Type 'string' is not assignable to type 'number').
Se revirtió el cambio y el commit siguiente pasó.
