import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ErrorNoEncontrado,
  obtenerEmpresa,
  ordenesDe,
  tecnicosDe,
  vehiculosDe,
} from "@/lib/store";
import { obtenerPlan, describirLimite } from "@/lib/domain/planes";
import { BadgePlan } from "@/components/Badges";
import PanelEmpresa from "./PanelEmpresa";

export const dynamic = "force-dynamic";

export default function PaginaEmpresa({ params }: { params: { id: string } }) {
  let empresa;
  try {
    empresa = obtenerEmpresa(params.id);
  } catch (error) {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  }

  const plan = obtenerPlan(empresa.plan);
  const vehiculos = vehiculosDe(empresa.id);
  const tecnicos = tecnicosDe(empresa.id);
  const ordenes = ordenesDe(empresa.id);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
        ← Volver a empresas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{empresa.nombre}</h1>
          <p className="mt-1 text-slate-600">
            Plan {plan.nombre} · SLA {plan.slaHoras} h · {plan.soporte}
          </p>
        </div>
        <BadgePlan plan={empresa.plan} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metrica
          titulo="Vehículos"
          valor={`${vehiculos.length}/${describirLimite(plan.maxVehiculos)}`}
        />
        <Metrica
          titulo="Técnicos"
          valor={`${tecnicos.length}/${describirLimite(plan.maxTecnicos)}`}
        />
        <Metrica
          titulo="Órdenes abiertas"
          valor={String(
            ordenes.filter((o) => o.estado === "abierta" || o.estado === "en_proceso")
              .length,
          )}
        />
        <Metrica titulo="Órdenes totales" valor={String(ordenes.length)} />
      </div>

      <PanelEmpresa
        empresaId={empresa.id}
        plan={plan}
        vehiculos={vehiculos}
        tecnicos={tecnicos}
        ordenes={ordenes}
      />
    </div>
  );
}

function Metrica({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 text-xl font-bold">{valor}</p>
    </div>
  );
}
