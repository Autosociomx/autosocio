// Hash y verificación de contraseñas con scrypt (node:crypto). Módulo
// aislado para que db.ts (semilla) y auth.ts lo compartan sin ciclos.

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashContrasena(plana: string): string {
  const salt = randomBytes(16);
  const derivada = scryptSync(plana, salt, 32);
  return `scrypt$${salt.toString("hex")}$${derivada.toString("hex")}`;
}

export function verificarContrasena(plana: string, almacenado: string): boolean {
  const [algo, saltHex, hashHex] = almacenado.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const derivada = scryptSync(plana, Buffer.from(saltHex, "hex"), esperado.length);
  return esperado.length === derivada.length && timingSafeEqual(esperado, derivada);
}
