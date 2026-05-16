import { afterEach, describe, expect, it } from "vitest";
import { autenticar } from "./auth";
import { hashContrasena, verificarContrasena } from "./password";
import { reiniciarBaseDeDatos } from "./db";

afterEach(() => {
  reiniciarBaseDeDatos();
});

describe("password", () => {
  it("verifica una contraseña correcta y rechaza la incorrecta", () => {
    const h = hashContrasena("secreta123");
    expect(verificarContrasena("secreta123", h)).toBe(true);
    expect(verificarContrasena("otra", h)).toBe(false);
  });
});

describe("autenticar (usuarios semilla)", () => {
  it("acepta credenciales válidas y devuelve la empresa del usuario", () => {
    const u = autenticar("admin@trans.mx", "demo1234");
    expect(u).not.toBeNull();
    expect(u?.empresaId).toBe("emp-trans");
  });

  it("rechaza contraseña incorrecta", () => {
    expect(autenticar("admin@trans.mx", "mala")).toBeNull();
  });

  it("rechaza usuario inexistente", () => {
    expect(autenticar("nadie@ejemplo.mx", "demo1234")).toBeNull();
  });
});
