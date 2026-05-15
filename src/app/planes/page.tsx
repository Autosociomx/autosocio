import { listarPlanes, describirLimite } from "@/lib/domain/planes";

export default function PaginaPlanes() {
  const planes = listarPlanes();

  function si(valor: boolean) {
    return valor ? "Sí" : "—";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planes de servicio</h1>
        <p className="mt-1 text-slate-600">
          El tamaño de la empresa define los límites del equipo de mantenimiento
          y el SLA de atención de órdenes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {planes.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold">{plan.nombre}</h2>
            <p className="mt-1 text-sm text-slate-600">{plan.descripcion}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <strong>{describirLimite(plan.maxVehiculos)}</strong> vehículos
              </li>
              <li>
                <strong>{describirLimite(plan.maxTecnicos)}</strong> técnicos
              </li>
              <li>
                SLA de <strong>{plan.slaHoras} h</strong>
              </li>
              <li>{plan.soporte}</li>
              <li>Reportes avanzados: {si(plan.reportesAvanzados)}</li>
              <li>Acceso API: {si(plan.accesoApi)}</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
