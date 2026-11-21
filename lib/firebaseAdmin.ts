import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { entorno } from './entorno';

function app() {
  const existente = getApps()[0];
  if (existente) return existente;
  const e = entorno();
  return initializeApp({
    credential: cert({
      projectId: e.FIREBASE_PROJECT_ID,
      clientEmail: e.FIREBASE_CLIENT_EMAIL,
      privateKey: e.FIREBASE_PRIVATE_KEY,
    }),
  });
}

export const adminAuth = () => getAuth(app());
export const adminDb = () => getFirestore(app());
