// Etiquetas legibles en español para los enums del dominio.

import type {
  EspecialidadTecnico,
  EstadoOrden,
  EstadoVehiculo,
  PrioridadOrden,
} from "./domain/tipos";

export const ETIQUETA_ESTADO_VEHICULO: Record<EstadoVehiculo, string> = {
  operativo: "Operativo",
  en_taller: "En taller",
  fuera_de_servicio: "Fuera de servicio",
};

export const ETIQUETA_ESPECIALIDAD: Record<EspecialidadTecnico, string> = {
  mecanica_general: "Mecánica general",
  electrica: "Eléctrica",
  diagnostico: "Diagnóstico",
  carroceria: "Carrocería",
  llantas: "Llantas",
};

export const ETIQUETA_PRIORIDAD: Record<PrioridadOrden, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

export const ETIQUETA_ESTADO_ORDEN: Record<EstadoOrden, string> = {
  abierta: "Abierta",
  en_proceso: "En proceso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
