// Autenticación por empresa. Sesión = cookie httpOnly con el id de
// usuario firmado por HMAC; el aislamiento multi-empresa se aplica
// comparando `empresaId` de la sesión contra el recurso solicitado.

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { verificarContrasena } from "./password";

export const COOKIE_SESION = "autosocio_sesion";

function secreto(): string {
  const s = process.env.AUTOSOCIO_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTOSOCIO_SECRET es obligatorio en producción");
  }
  return "dev-secret-no-usar-en-produccion";
}

export interface Usuario {
  id: string;
  empresaId: string;
  email: string;
  nombre: string;
}

interface FilaUsuario {
  id: string;
  empresa_id: string;
  email: string;
  hash: string;
  nombre: string;
}

function firmar(valor: string): string {
  return createHmac("sha256", secreto()).update(valor).digest("hex");
}

function token(usuarioId: string): string {
  return `${usuarioId}.${firmar(usuarioId)}`;
}

function usuarioDeToken(tok: string | undefined): Usuario | null {
  if (!tok) return null;
  const i = tok.lastIndexOf(".");
  if (i < 1) return null;
  const id = tok.slice(0, i);
  const recibida = Buffer.from(tok.slice(i + 1));
  const esperada = Buffer.from(firmar(id));
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) {
    return null;
  }
  const fila = db()
    .prepare("SELECT id, empresa_id, email, nombre FROM usuarios WHERE id = ?")
    .get(id) as Omit<FilaUsuario, "hash"> | undefined;
  return fila
    ? { id: fila.id, empresaId: fila.empresa_id, email: fila.email, nombre: fila.nombre }
    : null;
}

export function autenticar(email: string, contrasena: string): Usuario | null {
  const fila = db()
    .prepare("SELECT * FROM usuarios WHERE email = ?")
    .get(email.trim().toLowerCase()) as FilaUsuario | undefined;
  if (!fila || !verificarContrasena(contrasena, fila.hash)) return null;
  return {
    id: fila.id,
    empresaId: fila.empresa_id,
    email: fila.email,
    nombre: fila.nombre,
  };
}

export function abrirSesion(usuario: Usuario) {
  cookies().set(COOKIE_SESION, token(usuario.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function cerrarSesion() {
  cookies().delete(COOKIE_SESION);
}

// Usuario de la petición actual, o null si no hay sesión válida.
export function sesionActual(): Usuario | null {
  return usuarioDeToken(cookies().get(COOKIE_SESION)?.value);
}
