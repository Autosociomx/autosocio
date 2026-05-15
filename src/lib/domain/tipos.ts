import type { TamanoEmpresa } from "./planes";

export type EstadoVehiculo = "operativo" | "en_taller" | "fuera_de_servicio";

export type PrioridadOrden = "baja" | "media" | "alta" | "critica";

export type EstadoOrden = "abierta" | "en_proceso" | "completada" | "cancelada";

export type EspecialidadTecnico =
  | "mecanica_general"
  | "electrica"
  | "diagnostico"
  | "carroceria"
  | "llantas";

export interface Empresa {
  id: string;
  nombre: string;
  plan: TamanoEmpresa;
  creadaEn: string;
}

export interface Vehiculo {
  id: string;
  empresaId: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  estado: EstadoVehiculo;
}

export interface Tecnico {
  id: string;
  empresaId: string;
  nombre: string;
  especialidad: EspecialidadTecnico;
}

export interface OrdenMantenimiento {
  id: string;
  empresaId: string;
  vehiculoId: string;
  tecnicoId: string | null;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadOrden;
  estado: EstadoOrden;
  slaHoras: number;
  creadaEn: string;
  venceEn: string;
}
