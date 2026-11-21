import { z } from 'zod';

const esquema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1).transform((k) => k.replace(/\\n/g, '\n')),
  FIREBASE_WEB_API_KEY: z.string().min(1),
});

export function entorno() {
  return esquema.parse(process.env);
}
