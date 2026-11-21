import type { Query } from 'firebase-admin/firestore';

import type { DatosSerieUsuario } from './esquemasSerie';
import { adminDb } from './firebaseAdmin';

export const LIMITE_SINCRONIZACION = 500;

export type SerieUsuario = DatosSerieUsuario & {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type CamposGuardados = Omit<SerieUsuario, 'id'>;

const coleccion = (uid: string) => adminDb().collection('usuarios').doc(uid).collection('serie_usuario');

// Incluye los borrados lógicos para que el cliente pueda sincronizarlos.
export async function listar(uid: string, since: string | null): Promise<SerieUsuario[]> {
  let consulta: Query = coleccion(uid);
  if (since) consulta = consulta.where('updated_at', '>', since);
  const snap = await consulta.orderBy('updated_at').limit(LIMITE_SINCRONIZACION).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as CamposGuardados) }));
}

// Crea o reemplaza (idempotente). Las fechas las pone el servidor.
export async function guardar(uid: string, id: string, datos: DatosSerieUsuario): Promise<SerieUsuario> {
  const ref = coleccion(uid).doc(id);
  const ahora = new Date().toISOString();
  return adminDb().runTransaction(async (t) => {
    const previo = await t.get(ref);
    const creado = previo.exists ? ((previo.data() as CamposGuardados).created_at ?? ahora) : ahora;
    const doc: CamposGuardados = { ...datos, created_at: creado, updated_at: ahora, deleted_at: null };
    t.set(ref, doc);
    return { id, ...doc };
  });
}

// Borrado lógico. Devuelve false si el documento no existe.
export async function borrar(uid: string, id: string): Promise<boolean> {
  const ref = coleccion(uid).doc(id);
  const ahora = new Date().toISOString();
  return adminDb().runTransaction(async (t) => {
    const previo = await t.get(ref);
    if (!previo.exists) return false;
    t.update(ref, { deleted_at: ahora, updated_at: ahora });
    return true;
  });
}

// Series que el usuario ya decidió (cualquier estado, sin borrar).
export async function idsDecididas(uid: string): Promise<Set<number>> {
  const snap = await coleccion(uid).where('deleted_at', '==', null).select().get();
  return new Set(snap.docs.map((d) => Number(d.id)));
}
