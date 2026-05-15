// Planes de servicio de AutoSocio segmentados por tamaño de empresa.
// Cada plan define los límites operativos del equipo de mantenimiento de
// flotillas y el SLA de atención de órdenes.

export type TamanoEmpresa = "pequena" | "mediana" | "grande";

export interface Plan {
  id: TamanoEmpresa;
  nombre: string;
  descripcion: string;
  // null = ilimitado
  maxVehiculos: number | null;
  maxTecnicos: number | null;
  // Horas objetivo para resolver una orden de mantenimiento.
  slaHoras: number;
  soporte: string;
  reportesAvanzados: boolean;
  accesoApi: boolean;
}

export const PLANES: Record<TamanoEmpresa, Plan> = {
  pequena: {
    id: "pequena",
    nombre: "Pequeña empresa",
    descripcion: "Flotillas en crecimiento que necesitan control básico de mantenimiento.",
    maxVehiculos: 10,
    maxTecnicos: 3,
    slaHoras: 72,
    soporte: "Soporte estándar (horario laboral)",
    reportesAvanzados: false,
    accesoApi: false,
  },
  mediana: {
    id: "mediana",
    nombre: "Mediana empresa",
    descripcion: "Operaciones con varias flotillas y un equipo de mantenimiento dedicado.",
    maxVehiculos: 50,
    maxTecnicos: 10,
    slaHoras: 24,
    soporte: "Soporte prioritario",
    reportesAvanzados: true,
    accesoApi: false,
  },
  grande: {
    id: "grande",
    nombre: "Gran empresa",
    descripcion: "Flotillas a gran escala con disponibilidad crítica y SLA agresivo.",
    maxVehiculos: null,
    maxTecnicos: null,
    slaHoras: 4,
    soporte: "Soporte 24/7 con gerente de cuenta",
    reportesAvanzados: true,
    accesoApi: true,
  },
};

export function obtenerPlan(tamano: TamanoEmpresa): Plan {
  return PLANES[tamano];
}

export function listarPlanes(): Plan[] {
  return [PLANES.pequena, PLANES.mediana, PLANES.grande];
}

export function dentroDelLimite(actual: number, max: number | null): boolean {
  return max === null || actual < max;
}

export function describirLimite(max: number | null): string {
  return max === null ? "Ilimitado" : String(max);
}
