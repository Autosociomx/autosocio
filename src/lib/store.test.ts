import { afterEach, describe, expect, it } from "vitest";
import {
  ErrorLimitePlan,
  agregarTecnico,
  agregarVehiculo,
  crearEmpresa,
  crearOrdenMantenimiento,
  vehiculosDe,
} from "./store";
import { reiniciarBaseDeDatos } from "./db";

afterEach(() => {
  reiniciarBaseDeDatos();
});

function vehiculoBase() {
  return {
    placa: "TEST-1",
    marca: "Nissan",
    modelo: "Versa",
    anio: 2022,
    kilometraje: 1000,
    estado: "operativo" as const,
  };
}

describe("límites por plan", () => {
  it("bloquea agregar vehículos al superar el plan pequeño (10)", () => {
    const e = crearEmpresa("Test Chica", "pequena");
    for (let i = 0; i < 10; i++) {
      agregarVehiculo(e.id, { ...vehiculoBase(), placa: `T-${i}` });
    }
    expect(vehiculosDe(e.id)).toHaveLength(10);
    expect(() => agregarVehiculo(e.id, vehiculoBase())).toThrow(ErrorLimitePlan);
  });

  it("permite vehículos ilimitados en plan grande", () => {
    const e = crearEmpresa("Test Grande", "grande");
    for (let i = 0; i < 60; i++) {
      agregarVehiculo(e.id, { ...vehiculoBase(), placa: `G-${i}` });
    }
    expect(vehiculosDe(e.id)).toHaveLength(60);
  });

  it("bloquea agregar técnicos al superar el plan mediano (10)", () => {
    const e = crearEmpresa("Test Mediana", "mediana");
    for (let i = 0; i < 10; i++) {
      agregarTecnico(e.id, `Tec ${i}`, "mecanica_general");
    }
    expect(() => agregarTecnico(e.id, "Extra", "electrica")).toThrow(
      ErrorLimitePlan,
    );
  });

  it("asigna el SLA del plan a la orden creada", () => {
    const e = crearEmpresa("Test SLA", "grande");
    const v = agregarVehiculo(e.id, vehiculoBase());
    const orden = crearOrdenMantenimiento({
      empresaId: e.id,
      vehiculoId: v.id,
      tecnicoId: null,
      titulo: "Servicio",
      descripcion: "",
      prioridad: "media",
    });
    expect(orden.slaHoras).toBe(4);
    expect(orden.estado).toBe("abierta");
  });
});
