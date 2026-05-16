// Conexión SQLite y esquema. El store (src/lib/store.ts) es el único
// consumidor: aplica las reglas de plan sobre estos datos.
//
// Ruta de la BD vía AUTOSOCIO_DB. ":memory:" (default en tests) crea una
// base efímera por proceso. En dev/prod se usa un archivo en data/.

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { hashContrasena } from "./password";

const RUTA =
  process.env.AUTOSOCIO_DB ??
  (process.env.NODE_ENV === "test" ? ":memory:" : "data/autosocio.db");

const globalConDb = globalThis as unknown as { __autosocioSqlite?: Database.Database };

function abrir(): Database.Database {
  if (RUTA !== ":memory:") {
    mkdirSync(dirname(RUTA), { recursive: true });
  }
  const conn = new Database(RUTA);
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  crearEsquema(conn);
  if (filasVacias(conn)) sembrar(conn);
  return conn;
}

export function db(): Database.Database {
  if (!globalConDb.__autosocioSqlite) {
    globalConDb.__autosocioSqlite = abrir();
  }
  return globalConDb.__autosocioSqlite;
}

function crearEsquema(conn: Database.Database) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS empresas (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      plan TEXT NOT NULL,
      creada_en TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL REFERENCES empresas(id),
      email TEXT NOT NULL UNIQUE,
      hash TEXT NOT NULL,
      nombre TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS vehiculos (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL REFERENCES empresas(id),
      placa TEXT NOT NULL,
      marca TEXT NOT NULL,
      modelo TEXT NOT NULL,
      anio INTEGER NOT NULL,
      kilometraje INTEGER NOT NULL,
      estado TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tecnicos (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL REFERENCES empresas(id),
      nombre TEXT NOT NULL,
      especialidad TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ordenes (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL REFERENCES empresas(id),
      vehiculo_id TEXT NOT NULL REFERENCES vehiculos(id),
      tecnico_id TEXT REFERENCES tecnicos(id),
      titulo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      prioridad TEXT NOT NULL,
      estado TEXT NOT NULL,
      sla_horas INTEGER NOT NULL,
      creada_en TEXT NOT NULL,
      vence_en TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_veh_empresa ON vehiculos(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_tec_empresa ON tecnicos(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_ord_empresa ON ordenes(empresa_id);
  `);
}

function filasVacias(conn: Database.Database): boolean {
  const { c } = conn.prepare("SELECT COUNT(*) c FROM empresas").get() as { c: number };
  return c === 0;
}

// Reinicia la BD a la semilla. Solo para pruebas.
export function reiniciarBaseDeDatos() {
  const conn = db();
  conn.exec(
    "DELETE FROM ordenes; DELETE FROM tecnicos; DELETE FROM vehiculos; DELETE FROM usuarios; DELETE FROM empresas;",
  );
  sembrar(conn);
}

function iso(diasOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + diasOffset);
  return d.toISOString();
}

function sembrar(conn: Database.Database) {
  const insEmp = conn.prepare(
    "INSERT INTO empresas (id, nombre, plan, creada_en) VALUES (?,?,?,?)",
  );
  const insVeh = conn.prepare(
    "INSERT INTO vehiculos (id, empresa_id, placa, marca, modelo, anio, kilometraje, estado) VALUES (?,?,?,?,?,?,?,?)",
  );
  const insTec = conn.prepare(
    "INSERT INTO tecnicos (id, empresa_id, nombre, especialidad) VALUES (?,?,?,?)",
  );
  const insOrd = conn.prepare(
    "INSERT INTO ordenes (id, empresa_id, vehiculo_id, tecnico_id, titulo, descripcion, prioridad, estado, sla_horas, creada_en, vence_en) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  );
  const insUsr = conn.prepare(
    "INSERT INTO usuarios (id, empresa_id, email, hash, nombre) VALUES (?,?,?,?,?)",
  );

  conn.transaction(() => {
    insEmp.run("emp-trans", "Transportes del Bajío", "pequena", iso(-120));
    insEmp.run("emp-log", "LogiMax Distribución", "mediana", iso(-90));
    insEmp.run("emp-flota", "FlotaNacional S.A.", "grande", iso(-200));

    const clave = hashContrasena("demo1234");
    insUsr.run("usr-1", "emp-trans", "admin@trans.mx", clave, "Admin Transportes");
    insUsr.run("usr-2", "emp-log", "admin@logimax.mx", clave, "Admin LogiMax");
    insUsr.run("usr-3", "emp-flota", "admin@flota.mx", clave, "Admin FlotaNacional");

    insVeh.run("veh-1", "emp-trans", "ABC-101", "Nissan", "NP300", 2021, 84000, "operativo");
    insVeh.run("veh-2", "emp-trans", "ABC-204", "Toyota", "Hilux", 2022, 41000, "en_taller");
    insVeh.run("veh-3", "emp-log", "LMX-330", "Freightliner", "M2 106", 2020, 198000, "operativo");
    insVeh.run("veh-4", "emp-log", "LMX-331", "International", "DuraStar", 2019, 240000, "operativo");
    insVeh.run("veh-5", "emp-flota", "FN-900", "Kenworth", "T680", 2023, 65000, "operativo");
    insVeh.run("veh-6", "emp-flota", "FN-901", "Volvo", "VNL 760", 2022, 120000, "fuera_de_servicio");

    insTec.run("tec-1", "emp-trans", "Mauricio Reyes", "mecanica_general");
    insTec.run("tec-2", "emp-log", "Brenda Sandoval", "diagnostico");
    insTec.run("tec-3", "emp-log", "Iván Cortez", "electrica");
    insTec.run("tec-4", "emp-flota", "Patricia Núñez", "diagnostico");
    insTec.run("tec-5", "emp-flota", "Hugo Lara", "mecanica_general");

    const c1 = new Date();
    insOrd.run(
      "ord-1", "emp-trans", "veh-2", "tec-1", "Servicio de 40 mil km",
      "Cambio de aceite, filtros y revisión de frenos.", "media", "abierta",
      72, c1.toISOString(), new Date(c1.getTime() + 72 * 3600000).toISOString(),
    );
    const c2 = new Date();
    insOrd.run(
      "ord-2", "emp-flota", "veh-6", "tec-4", "Falla en sistema de inyección",
      "Unidad fuera de servicio, diagnóstico urgente.", "critica", "abierta",
      4, c2.toISOString(), new Date(c2.getTime() + 4 * 3600000).toISOString(),
    );
  })();
}
