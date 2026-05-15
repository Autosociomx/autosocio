import Link from "next/link";
import { resumenEmpresas } from "@/lib/store";
import { obtenerPlan, describirLimite } from "@/lib/domain/planes";
import { BadgePlan } from "@/components/Badges";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const resumen = resumenEmpresas();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Equipos de mantenimiento de flotillas</h1>
        <p className="mt-1 text-slate-600">
          Empresas administradas en AutoSocio, segmentadas por plan de servicio.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resumen.map(({ empresa, totalVehiculos, totalTecnicos, ordenesAbiertas }) => {
          const plan = obtenerPlan(empresa.plan);
          return (
            <Link
              key={empresa.id}
              href={`/empresas/${empresa.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-semibold">{empresa.nombre}</h2>
                <BadgePlan plan={empresa.plan} />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <dt className="text-slate-500">Vehículos</dt>
                  <dd className="font-semibold">
                    {totalVehiculos}/{describirLimite(plan.maxVehiculos)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Técnicos</dt>
                  <dd className="font-semibold">
                    {totalTecnicos}/{describirLimite(plan.maxTecnicos)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Órdenes</dt>
                  <dd className="font-semibold">{ordenesAbiertas} abiertas</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-slate-500">SLA {plan.slaHoras} h · {plan.soporte}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
