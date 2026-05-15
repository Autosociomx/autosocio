import type { TamanoEmpresa } from "@/lib/domain/planes";
import type { EstadoOrden, EstadoVehiculo, PrioridadOrden } from "@/lib/domain/tipos";
import {
  ETIQUETA_ESTADO_ORDEN,
  ETIQUETA_ESTADO_VEHICULO,
  ETIQUETA_PRIORIDAD,
} from "@/lib/etiquetas";
import { obtenerPlan } from "@/lib/domain/planes";

function Pill({ texto, clase }: { texto: string; clase: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${clase}`}>
      {texto}
    </span>
  );
}

export function BadgePlan({ plan }: { plan: TamanoEmpresa }) {
  const clases: Record<TamanoEmpresa, string> = {
    pequena: "bg-sky-100 text-sky-800",
    mediana: "bg-violet-100 text-violet-800",
    grande: "bg-amber-100 text-amber-900",
  };
  return <Pill texto={obtenerPlan(plan).nombre} clase={clases[plan]} />;
}

export function BadgeEstadoVehiculo({ estado }: { estado: EstadoVehiculo }) {
  const clases: Record<EstadoVehiculo, string> = {
    operativo: "bg-emerald-100 text-emerald-800",
    en_taller: "bg-amber-100 text-amber-800",
    fuera_de_servicio: "bg-rose-100 text-rose-800",
  };
  return <Pill texto={ETIQUETA_ESTADO_VEHICULO[estado]} clase={clases[estado]} />;
}

export function BadgePrioridad({ prioridad }: { prioridad: PrioridadOrden }) {
  const clases: Record<PrioridadOrden, string> = {
    baja: "bg-slate-100 text-slate-700",
    media: "bg-sky-100 text-sky-800",
    alta: "bg-orange-100 text-orange-800",
    critica: "bg-rose-100 text-rose-800",
  };
  return <Pill texto={ETIQUETA_PRIORIDAD[prioridad]} clase={clases[prioridad]} />;
}

export function BadgeEstadoOrden({ estado }: { estado: EstadoOrden }) {
  const clases: Record<EstadoOrden, string> = {
    abierta: "bg-sky-100 text-sky-800",
    en_proceso: "bg-amber-100 text-amber-800",
    completada: "bg-emerald-100 text-emerald-800",
    cancelada: "bg-slate-200 text-slate-600",
  };
  return <Pill texto={ETIQUETA_ESTADO_ORDEN[estado]} clase={clases[estado]} />;
}
