// Capa de acceso a datos y reglas de negocio. Persiste en SQLite (ver
// src/lib/db.ts) y es la ÚNICA capa que aplica los límites de plan.
// Su superficie pública es estable: la UI y las rutas API dependen de
// estas firmas, no del motor de almacenamiento.

import { db } from "./db";
import {
  dentroDelLimite,
  obtenerPlan,
  type TamanoEmpresa,
} from "./domain/planes";
import type {
  Empresa,
  EspecialidadTecnico,
  OrdenMantenimiento,
  PrioridadOrden,
  Tecnico,
  Vehiculo,
} from "./domain/tipos";

export class ErrorLimitePlan extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorLimitePlan";
  }
}

export class ErrorNoEncontrado extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorNoEncontrado";
  }
}

let contador = 0;
function nuevoId(prefijo: string): string {
  contador += 1;
  return `${prefijo}-${Date.now().toString(36)}${contador}`;
}

// --- Mapeo fila SQLite -> tipo de dominio ---

interface FilaEmpresa {
  id: string;
  nombre: string;
  plan: string;
  creada_en: string;
}
interface FilaVehiculo {
  id: string;
  empresa_id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  estado: string;
}
interface FilaTecnico {
  id: string;
  empresa_id: string;
  nombre: string;
  especialidad: string;
}
interface FilaOrden {
  id: string;
  empresa_id: string;
  vehiculo_id: string;
  tecnico_id: string | null;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  sla_horas: number;
  creada_en: string;
  vence_en: string;
}

const aEmpresa = (f: FilaEmpresa): Empresa => ({
  id: f.id,
  nombre: f.nombre,
  plan: f.plan as TamanoEmpresa,
  creadaEn: f.creada_en,
});
const aVehiculo = (f: FilaVehiculo): Vehiculo => ({
  id: f.id,
  empresaId: f.empresa_id,
  placa: f.placa,
  marca: f.marca,
  modelo: f.modelo,
  anio: f.anio,
  kilometraje: f.kilometraje,
  estado: f.estado as Vehiculo["estado"],
});
const aTecnico = (f: FilaTecnico): Tecnico => ({
  id: f.id,
  empresaId: f.empresa_id,
  nombre: f.nombre,
  especialidad: f.especialidad as EspecialidadTecnico,
});
const aOrden = (f: FilaOrden): OrdenMantenimiento => ({
  id: f.id,
  empresaId: f.empresa_id,
  vehiculoId: f.vehiculo_id,
  tecnicoId: f.tecnico_id,
  titulo: f.titulo,
  descripcion: f.descripcion,
  prioridad: f.prioridad as PrioridadOrden,
  estado: f.estado as OrdenMantenimiento["estado"],
  slaHoras: f.sla_horas,
  creadaEn: f.creada_en,
  venceEn: f.vence_en,
});

// --- Consultas ---

export function listarEmpresas(): Empresa[] {
  return (db().prepare("SELECT * FROM empresas ORDER BY creada_en").all() as FilaEmpresa[]).map(
    aEmpresa,
  );
}

export function obtenerEmpresa(empresaId: string): Empresa {
  const fila = db()
    .prepare("SELECT * FROM empresas WHERE id = ?")
    .get(empresaId) as FilaEmpresa | undefined;
  if (!fila) throw new ErrorNoEncontrado(`Empresa ${empresaId} no encontrada`);
  return aEmpresa(fila);
}

export function vehiculosDe(empresaId: string): Vehiculo[] {
  return (
    db().prepare("SELECT * FROM vehiculos WHERE empresa_id = ?").all(empresaId) as FilaVehiculo[]
  ).map(aVehiculo);
}

export function tecnicosDe(empresaId: string): Tecnico[] {
  return (
    db().prepare("SELECT * FROM tecnicos WHERE empresa_id = ?").all(empresaId) as FilaTecnico[]
  ).map(aTecnico);
}

export function ordenesDe(empresaId: string): OrdenMantenimiento[] {
  return (
    db()
      .prepare("SELECT * FROM ordenes WHERE empresa_id = ? ORDER BY creada_en DESC")
      .all(empresaId) as FilaOrden[]
  ).map(aOrden);
}

function contar(tabla: "vehiculos" | "tecnicos", empresaId: string): number {
  const { c } = db()
    .prepare(`SELECT COUNT(*) c FROM ${tabla} WHERE empresa_id = ?`)
    .get(empresaId) as { c: number };
  return c;
}

export interface ResumenEmpresa {
  empresa: Empresa;
  totalVehiculos: number;
  totalTecnicos: number;
  ordenesAbiertas: number;
}

export function resumenEmpresas(): ResumenEmpresa[] {
  return listarEmpresas().map((empresa) => {
    const { c } = db()
      .prepare(
        "SELECT COUNT(*) c FROM ordenes WHERE empresa_id = ? AND estado IN ('abierta','en_proceso')",
      )
      .get(empresa.id) as { c: number };
    return {
      empresa,
      totalVehiculos: contar("vehiculos", empresa.id),
      totalTecnicos: contar("tecnicos", empresa.id),
      ordenesAbiertas: c,
    };
  });
}

// --- Mutaciones con reglas de plan ---

export function crearEmpresa(nombre: string, plan: TamanoEmpresa): Empresa {
  const empresa: Empresa = {
    id: nuevoId("emp"),
    nombre,
    plan,
    creadaEn: new Date().toISOString(),
  };
  db()
    .prepare("INSERT INTO empresas (id, nombre, plan, creada_en) VALUES (?,?,?,?)")
    .run(empresa.id, empresa.nombre, empresa.plan, empresa.creadaEn);
  return empresa;
}

export function agregarVehiculo(
  empresaId: string,
  datos: Omit<Vehiculo, "id" | "empresaId">,
): Vehiculo {
  const empresa = obtenerEmpresa(empresaId);
  const plan = obtenerPlan(empresa.plan);
  if (!dentroDelLimite(contar("vehiculos", empresaId), plan.maxVehiculos)) {
    throw new ErrorLimitePlan(
      `El plan "${plan.nombre}" permite máximo ${plan.maxVehiculos} vehículos. ` +
        `Actualiza de plan para agregar más.`,
    );
  }
  const vehiculo: Vehiculo = { id: nuevoId("veh"), empresaId, ...datos };
  db()
    .prepare(
      "INSERT INTO vehiculos (id, empresa_id, placa, marca, modelo, anio, kilometraje, estado) VALUES (?,?,?,?,?,?,?,?)",
    )
    .run(
      vehiculo.id,
      empresaId,
      vehiculo.placa,
      vehiculo.marca,
      vehiculo.modelo,
      vehiculo.anio,
      vehiculo.kilometraje,
      vehiculo.estado,
    );
  return vehiculo;
}

export function agregarTecnico(
  empresaId: string,
  nombre: string,
  especialidad: EspecialidadTecnico,
): Tecnico {
  const empresa = obtenerEmpresa(empresaId);
  const plan = obtenerPlan(empresa.plan);
  if (!dentroDelLimite(contar("tecnicos", empresaId), plan.maxTecnicos)) {
    throw new ErrorLimitePlan(
      `El plan "${plan.nombre}" permite máximo ${plan.maxTecnicos} técnicos en el ` +
        `equipo de mantenimiento. Actualiza de plan para agregar más.`,
    );
  }
  const tecnico: Tecnico = { id: nuevoId("tec"), empresaId, nombre, especialidad };
  db()
    .prepare("INSERT INTO tecnicos (id, empresa_id, nombre, especialidad) VALUES (?,?,?,?)")
    .run(tecnico.id, empresaId, nombre, especialidad);
  return tecnico;
}

interface DatosOrden {
  empresaId: string;
  vehiculoId: string;
  tecnicoId: string | null;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadOrden;
}

export function crearOrdenMantenimiento(datos: DatosOrden): OrdenMantenimiento {
  const empresa = obtenerEmpresa(datos.empresaId);
  const veh = db()
    .prepare("SELECT empresa_id FROM vehiculos WHERE id = ?")
    .get(datos.vehiculoId) as { empresa_id: string } | undefined;
  if (!veh || veh.empresa_id !== datos.empresaId) {
    throw new ErrorNoEncontrado("Vehículo no pertenece a la empresa indicada");
  }
  if (datos.tecnicoId) {
    const tec = db()
      .prepare("SELECT empresa_id FROM tecnicos WHERE id = ?")
      .get(datos.tecnicoId) as { empresa_id: string } | undefined;
    if (!tec || tec.empresa_id !== datos.empresaId) {
      throw new ErrorNoEncontrado("Técnico no pertenece a la empresa indicada");
    }
  }

  const plan = obtenerPlan(empresa.plan);
  const creada = new Date();
  const orden: OrdenMantenimiento = {
    id: nuevoId("ord"),
    empresaId: datos.empresaId,
    vehiculoId: datos.vehiculoId,
    tecnicoId: datos.tecnicoId,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    prioridad: datos.prioridad,
    estado: "abierta",
    slaHoras: plan.slaHoras,
    creadaEn: creada.toISOString(),
    venceEn: new Date(creada.getTime() + plan.slaHoras * 3600 * 1000).toISOString(),
  };
  db()
    .prepare(
      "INSERT INTO ordenes (id, empresa_id, vehiculo_id, tecnico_id, titulo, descripcion, prioridad, estado, sla_horas, creada_en, vence_en) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    )
    .run(
      orden.id,
      orden.empresaId,
      orden.vehiculoId,
      orden.tecnicoId,
      orden.titulo,
      orden.descripcion,
      orden.prioridad,
      orden.estado,
      orden.slaHoras,
      orden.creadaEn,
      orden.venceEn,
    );
  return orden;
}

export function cambiarEstadoOrden(
  ordenId: string,
  estado: OrdenMantenimiento["estado"],
): OrdenMantenimiento {
  const res = db()
    .prepare("UPDATE ordenes SET estado = ? WHERE id = ?")
    .run(estado, ordenId);
  if (res.changes === 0) {
    throw new ErrorNoEncontrado(`Orden ${ordenId} no encontrada`);
  }
  return aOrden(db().prepare("SELECT * FROM ordenes WHERE id = ?").get(ordenId) as FilaOrden);
}
