// Store en memoria con datos semilla. Es la única fuente de verdad de la
// app por ahora; se sustituirá por una base de datos cuando se defina la
// capa de persistencia. Se guarda en globalThis para sobrevivir al
// hot-reload de Next.js en desarrollo.

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

interface BaseDatos {
  empresas: Empresa[];
  vehiculos: Vehiculo[];
  tecnicos: Tecnico[];
  ordenes: OrdenMantenimiento[];
}

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

const globalConStore = globalThis as unknown as { __autosocioDb?: BaseDatos };

function generarSemilla(): BaseDatos {
  const empresas: Empresa[] = [
    { id: "emp-trans", nombre: "Transportes del Bajío", plan: "pequena", creadaEn: iso(-120) },
    { id: "emp-log", nombre: "LogiMax Distribución", plan: "mediana", creadaEn: iso(-90) },
    { id: "emp-flota", nombre: "FlotaNacional S.A.", plan: "grande", creadaEn: iso(-200) },
  ];

  const vehiculos: Vehiculo[] = [
    veh("emp-trans", "ABC-101", "Nissan", "NP300", 2021, 84000, "operativo"),
    veh("emp-trans", "ABC-204", "Toyota", "Hilux", 2022, 41000, "en_taller"),
    veh("emp-log", "LMX-330", "Freightliner", "M2 106", 2020, 198000, "operativo"),
    veh("emp-log", "LMX-331", "International", "DuraStar", 2019, 240000, "operativo"),
    veh("emp-flota", "FN-900", "Kenworth", "T680", 2023, 65000, "operativo"),
    veh("emp-flota", "FN-901", "Volvo", "VNL 760", 2022, 120000, "fuera_de_servicio"),
  ];

  const tecnicos: Tecnico[] = [
    tec("emp-trans", "Mauricio Reyes", "mecanica_general"),
    tec("emp-log", "Brenda Sandoval", "diagnostico"),
    tec("emp-log", "Iván Cortez", "electrica"),
    tec("emp-flota", "Patricia Núñez", "diagnostico"),
    tec("emp-flota", "Hugo Lara", "mecanica_general"),
  ];

  const db: BaseDatos = { empresas, vehiculos, tecnicos, ordenes: [] };

  crearOrden(db, {
    empresaId: "emp-trans",
    vehiculoId: vehiculos[1].id,
    tecnicoId: tecnicos[0].id,
    titulo: "Servicio de 40 mil km",
    descripcion: "Cambio de aceite, filtros y revisión de frenos.",
    prioridad: "media",
  });
  crearOrden(db, {
    empresaId: "emp-flota",
    vehiculoId: vehiculos[5].id,
    tecnicoId: tecnicos[3].id,
    titulo: "Falla en sistema de inyección",
    descripcion: "Unidad fuera de servicio, diagnóstico urgente.",
    prioridad: "critica",
  });

  return db;
}

function db(): BaseDatos {
  if (!globalConStore.__autosocioDb) {
    globalConStore.__autosocioDb = generarSemilla();
  }
  return globalConStore.__autosocioDb;
}

// --- Helpers de semilla ---

function iso(diasOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + diasOffset);
  return d.toISOString();
}

let contador = 0;
function id(prefijo: string): string {
  contador += 1;
  return `${prefijo}-${Date.now().toString(36)}${contador}`;
}

function veh(
  empresaId: string,
  placa: string,
  marca: string,
  modelo: string,
  anio: number,
  km: number,
  estado: Vehiculo["estado"],
): Vehiculo {
  return { id: id("veh"), empresaId, placa, marca, modelo, anio, kilometraje: km, estado };
}

function tec(
  empresaId: string,
  nombre: string,
  especialidad: EspecialidadTecnico,
): Tecnico {
  return { id: id("tec"), empresaId, nombre, especialidad };
}

// --- Consultas ---

export function listarEmpresas(): Empresa[] {
  return [...db().empresas];
}

export function obtenerEmpresa(empresaId: string): Empresa {
  const empresa = db().empresas.find((e) => e.id === empresaId);
  if (!empresa) throw new ErrorNoEncontrado(`Empresa ${empresaId} no encontrada`);
  return empresa;
}

export function vehiculosDe(empresaId: string): Vehiculo[] {
  return db().vehiculos.filter((v) => v.empresaId === empresaId);
}

export function tecnicosDe(empresaId: string): Tecnico[] {
  return db().tecnicos.filter((t) => t.empresaId === empresaId);
}

export function ordenesDe(empresaId: string): OrdenMantenimiento[] {
  return db()
    .ordenes.filter((o) => o.empresaId === empresaId)
    .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
}

export interface ResumenEmpresa {
  empresa: Empresa;
  totalVehiculos: number;
  totalTecnicos: number;
  ordenesAbiertas: number;
}

export function resumenEmpresas(): ResumenEmpresa[] {
  return listarEmpresas().map((empresa) => ({
    empresa,
    totalVehiculos: vehiculosDe(empresa.id).length,
    totalTecnicos: tecnicosDe(empresa.id).length,
    ordenesAbiertas: ordenesDe(empresa.id).filter(
      (o) => o.estado === "abierta" || o.estado === "en_proceso",
    ).length,
  }));
}

// --- Mutaciones con reglas de plan ---

export function crearEmpresa(nombre: string, plan: TamanoEmpresa): Empresa {
  const empresa: Empresa = { id: id("emp"), nombre, plan, creadaEn: new Date().toISOString() };
  db().empresas.push(empresa);
  return empresa;
}

export function agregarVehiculo(
  empresaId: string,
  datos: Omit<Vehiculo, "id" | "empresaId">,
): Vehiculo {
  const empresa = obtenerEmpresa(empresaId);
  const plan = obtenerPlan(empresa.plan);
  const actuales = vehiculosDe(empresaId).length;
  if (!dentroDelLimite(actuales, plan.maxVehiculos)) {
    throw new ErrorLimitePlan(
      `El plan "${plan.nombre}" permite máximo ${plan.maxVehiculos} vehículos. ` +
        `Actualiza de plan para agregar más.`,
    );
  }
  const vehiculo: Vehiculo = { id: id("veh"), empresaId, ...datos };
  db().vehiculos.push(vehiculo);
  return vehiculo;
}

export function agregarTecnico(
  empresaId: string,
  nombre: string,
  especialidad: EspecialidadTecnico,
): Tecnico {
  const empresa = obtenerEmpresa(empresaId);
  const plan = obtenerPlan(empresa.plan);
  const actuales = tecnicosDe(empresaId).length;
  if (!dentroDelLimite(actuales, plan.maxTecnicos)) {
    throw new ErrorLimitePlan(
      `El plan "${plan.nombre}" permite máximo ${plan.maxTecnicos} técnicos en el ` +
        `equipo de mantenimiento. Actualiza de plan para agregar más.`,
    );
  }
  const tecnico: Tecnico = { id: id("tec"), empresaId, nombre, especialidad };
  db().tecnicos.push(tecnico);
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

function crearOrden(base: BaseDatos, datos: DatosOrden): OrdenMantenimiento {
  const empresa = base.empresas.find((e) => e.id === datos.empresaId);
  if (!empresa) throw new ErrorNoEncontrado(`Empresa ${datos.empresaId} no encontrada`);
  const plan = obtenerPlan(empresa.plan);
  const creadaEn = new Date();
  const vence = new Date(creadaEn.getTime() + plan.slaHoras * 3600 * 1000);
  const orden: OrdenMantenimiento = {
    id: id("ord"),
    empresaId: datos.empresaId,
    vehiculoId: datos.vehiculoId,
    tecnicoId: datos.tecnicoId,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    prioridad: datos.prioridad,
    estado: "abierta",
    slaHoras: plan.slaHoras,
    creadaEn: creadaEn.toISOString(),
    venceEn: vence.toISOString(),
  };
  base.ordenes.push(orden);
  return orden;
}

export function crearOrdenMantenimiento(datos: DatosOrden): OrdenMantenimiento {
  const vehiculo = db().vehiculos.find((v) => v.id === datos.vehiculoId);
  if (!vehiculo || vehiculo.empresaId !== datos.empresaId) {
    throw new ErrorNoEncontrado("Vehículo no pertenece a la empresa indicada");
  }
  if (datos.tecnicoId) {
    const tecnico = db().tecnicos.find((t) => t.id === datos.tecnicoId);
    if (!tecnico || tecnico.empresaId !== datos.empresaId) {
      throw new ErrorNoEncontrado("Técnico no pertenece a la empresa indicada");
    }
  }
  return crearOrden(db(), datos);
}

export function cambiarEstadoOrden(
  ordenId: string,
  estado: OrdenMantenimiento["estado"],
): OrdenMantenimiento {
  const orden = db().ordenes.find((o) => o.id === ordenId);
  if (!orden) throw new ErrorNoEncontrado(`Orden ${ordenId} no encontrada`);
  orden.estado = estado;
  return orden;
}
