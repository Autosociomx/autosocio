"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/lib/domain/planes";
import { dentroDelLimite } from "@/lib/domain/planes";
import type {
  EspecialidadTecnico,
  OrdenMantenimiento,
  PrioridadOrden,
  Tecnico,
  Vehiculo,
} from "@/lib/domain/tipos";
import {
  ETIQUETA_ESPECIALIDAD,
  ETIQUETA_PRIORIDAD,
  formatearFecha,
} from "@/lib/etiquetas";
import {
  BadgeEstadoOrden,
  BadgeEstadoVehiculo,
  BadgePrioridad,
} from "@/components/Badges";

interface Props {
  empresaId: string;
  plan: Plan;
  vehiculos: Vehiculo[];
  tecnicos: Tecnico[];
  ordenes: OrdenMantenimiento[];
}

type Pestana = "flotilla" | "equipo" | "ordenes";

export default function PanelEmpresa({
  empresaId,
  plan,
  vehiculos,
  tecnicos,
  ordenes,
}: Props) {
  const router = useRouter();
  const [pestana, setPestana] = useState<Pestana>("flotilla");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(url: string, metodo: string, cuerpo: unknown) {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Ocurrió un error");
      }
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      return false;
    } finally {
      setCargando(false);
    }
  }

  const puedeVehiculo = dentroDelLimite(vehiculos.length, plan.maxVehiculos);
  const puedeTecnico = dentroDelLimite(tecnicos.length, plan.maxTecnicos);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex border-b border-slate-200 text-sm">
        <Tab activo={pestana === "flotilla"} onClick={() => setPestana("flotilla")}>
          Flotilla ({vehiculos.length})
        </Tab>
        <Tab activo={pestana === "equipo"} onClick={() => setPestana("equipo")}>
          Equipo de mantenimiento ({tecnicos.length})
        </Tab>
        <Tab activo={pestana === "ordenes"} onClick={() => setPestana("ordenes")}>
          Órdenes ({ordenes.length})
        </Tab>
      </div>

      {error && (
        <p className="m-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="p-4">
        {pestana === "flotilla" && (
          <FlotillaTab
            vehiculos={vehiculos}
            puedeAgregar={puedeVehiculo}
            limite={plan.maxVehiculos}
            cargando={cargando}
            onAgregar={(v) =>
              enviar(`/api/empresas/${empresaId}/vehiculos`, "POST", v)
            }
          />
        )}
        {pestana === "equipo" && (
          <EquipoTab
            tecnicos={tecnicos}
            puedeAgregar={puedeTecnico}
            limite={plan.maxTecnicos}
            cargando={cargando}
            onAgregar={(t) =>
              enviar(`/api/empresas/${empresaId}/tecnicos`, "POST", t)
            }
          />
        )}
        {pestana === "ordenes" && (
          <OrdenesTab
            ordenes={ordenes}
            vehiculos={vehiculos}
            tecnicos={tecnicos}
            slaHoras={plan.slaHoras}
            cargando={cargando}
            onCrear={(o) =>
              enviar(`/api/empresas/${empresaId}/ordenes`, "POST", o)
            }
            onCambiarEstado={(id, estado) =>
              enviar(`/api/ordenes/${id}`, "PATCH", { estado })
            }
          />
        )}
      </div>
    </div>
  );
}

function Tab({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 font-medium ${
        activo
          ? "border-b-2 border-marca-acento text-marca"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

const input =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-marca-acento focus:outline-none";
const boton =
  "rounded-md bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50";

function LimiteAviso({ limite }: { limite: number | null }) {
  return (
    <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
      Alcanzaste el límite de {limite} de tu plan. Actualiza de plan para
      agregar más.
    </p>
  );
}

function FlotillaTab({
  vehiculos,
  puedeAgregar,
  limite,
  cargando,
  onAgregar,
}: {
  vehiculos: Vehiculo[];
  puedeAgregar: boolean;
  limite: number | null;
  cargando: boolean;
  onAgregar: (v: Record<string, unknown>) => Promise<boolean>;
}) {
  const [f, setF] = useState({ placa: "", marca: "", modelo: "", anio: "", kilometraje: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onAgregar({
      ...f,
      anio: Number(f.anio) || undefined,
      kilometraje: Number(f.kilometraje) || 0,
    });
    if (ok) setF({ placa: "", marca: "", modelo: "", anio: "", kilometraje: "" });
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-slate-100">
        {vehiculos.map((v) => (
          <li key={v.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">
                {v.placa} · {v.marca} {v.modelo} ({v.anio})
              </p>
              <p className="text-sm text-slate-500">
                {v.kilometraje.toLocaleString("es-MX")} km
              </p>
            </div>
            <BadgeEstadoVehiculo estado={v.estado} />
          </li>
        ))}
        {vehiculos.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-500">
            Sin vehículos registrados.
          </li>
        )}
      </ul>

      {puedeAgregar ? (
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-5">
          <input
            className={input}
            placeholder="Placa"
            value={f.placa}
            onChange={(e) => setF({ ...f, placa: e.target.value })}
            required
          />
          <input
            className={input}
            placeholder="Marca"
            value={f.marca}
            onChange={(e) => setF({ ...f, marca: e.target.value })}
            required
          />
          <input
            className={input}
            placeholder="Modelo"
            value={f.modelo}
            onChange={(e) => setF({ ...f, modelo: e.target.value })}
            required
          />
          <input
            className={input}
            placeholder="Año"
            type="number"
            value={f.anio}
            onChange={(e) => setF({ ...f, anio: e.target.value })}
          />
          <button className={boton} disabled={cargando}>
            Agregar vehículo
          </button>
        </form>
      ) : (
        <LimiteAviso limite={limite} />
      )}
    </div>
  );
}

const ESPECIALIDADES: EspecialidadTecnico[] = [
  "mecanica_general",
  "electrica",
  "diagnostico",
  "carroceria",
  "llantas",
];

function EquipoTab({
  tecnicos,
  puedeAgregar,
  limite,
  cargando,
  onAgregar,
}: {
  tecnicos: Tecnico[];
  puedeAgregar: boolean;
  limite: number | null;
  cargando: boolean;
  onAgregar: (t: Record<string, unknown>) => Promise<boolean>;
}) {
  const [nombre, setNombre] = useState("");
  const [especialidad, setEspecialidad] = useState<EspecialidadTecnico>("mecanica_general");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onAgregar({ nombre, especialidad });
    if (ok) setNombre("");
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-slate-100">
        {tecnicos.map((t) => (
          <li key={t.id} className="flex items-center justify-between py-3">
            <p className="font-medium">{t.nombre}</p>
            <span className="text-sm text-slate-500">
              {ETIQUETA_ESPECIALIDAD[t.especialidad]}
            </span>
          </li>
        ))}
        {tecnicos.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-500">
            Equipo de mantenimiento vacío.
          </li>
        )}
      </ul>

      {puedeAgregar ? (
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-3">
          <input
            className={input}
            placeholder="Nombre del técnico"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <select
            className={input}
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value as EspecialidadTecnico)}
          >
            {ESPECIALIDADES.map((esp) => (
              <option key={esp} value={esp}>
                {ETIQUETA_ESPECIALIDAD[esp]}
              </option>
            ))}
          </select>
          <button className={boton} disabled={cargando}>
            Agregar al equipo
          </button>
        </form>
      ) : (
        <LimiteAviso limite={limite} />
      )}
    </div>
  );
}

const PRIORIDADES: PrioridadOrden[] = ["baja", "media", "alta", "critica"];

function OrdenesTab({
  ordenes,
  vehiculos,
  tecnicos,
  slaHoras,
  cargando,
  onCrear,
  onCambiarEstado,
}: {
  ordenes: OrdenMantenimiento[];
  vehiculos: Vehiculo[];
  tecnicos: Tecnico[];
  slaHoras: number;
  cargando: boolean;
  onCrear: (o: Record<string, unknown>) => Promise<boolean>;
  onCambiarEstado: (id: string, estado: string) => Promise<boolean>;
}) {
  const [f, setF] = useState({
    titulo: "",
    descripcion: "",
    vehiculoId: "",
    tecnicoId: "",
    prioridad: "media" as PrioridadOrden,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onCrear({
      ...f,
      tecnicoId: f.tecnicoId || null,
    });
    if (ok) setF({ titulo: "", descripcion: "", vehiculoId: "", tecnicoId: "", prioridad: "media" });
  }

  const nombreVehiculo = (id: string) => {
    const v = vehiculos.find((x) => x.id === id);
    return v ? `${v.placa} (${v.marca} ${v.modelo})` : "—";
  };
  const nombreTecnico = (id: string | null) =>
    tecnicos.find((x) => x.id === id)?.nombre ?? "Sin asignar";

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {ordenes.map((o) => (
          <li key={o.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{o.titulo}</p>
                <p className="text-sm text-slate-600">{o.descripcion}</p>
              </div>
              <div className="flex gap-2">
                <BadgePrioridad prioridad={o.prioridad} />
                <BadgeEstadoOrden estado={o.estado} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {nombreVehiculo(o.vehiculoId)} · {nombreTecnico(o.tecnicoId)} · Vence{" "}
              {formatearFecha(o.venceEn)} (SLA {o.slaHoras} h)
            </p>
            {o.estado !== "completada" && o.estado !== "cancelada" && (
              <div className="mt-3 flex gap-2">
                {o.estado === "abierta" && (
                  <button
                    className="text-xs font-medium text-sky-700 hover:underline"
                    disabled={cargando}
                    onClick={() => onCambiarEstado(o.id, "en_proceso")}
                  >
                    Marcar en proceso
                  </button>
                )}
                <button
                  className="text-xs font-medium text-emerald-700 hover:underline"
                  disabled={cargando}
                  onClick={() => onCambiarEstado(o.id, "completada")}
                >
                  Completar
                </button>
                <button
                  className="text-xs font-medium text-slate-500 hover:underline"
                  disabled={cargando}
                  onClick={() => onCambiarEstado(o.id, "cancelada")}
                >
                  Cancelar
                </button>
              </div>
            )}
          </li>
        ))}
        {ordenes.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-500">
            Sin órdenes de mantenimiento.
          </li>
        )}
      </ul>

      {vehiculos.length === 0 ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Registra al menos un vehículo para crear órdenes.
        </p>
      ) : (
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
          <input
            className={input}
            placeholder="Título"
            value={f.titulo}
            onChange={(e) => setF({ ...f, titulo: e.target.value })}
            required
          />
          <select
            className={input}
            value={f.vehiculoId}
            onChange={(e) => setF({ ...f, vehiculoId: e.target.value })}
            required
          >
            <option value="">Vehículo…</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa} · {v.marca} {v.modelo}
              </option>
            ))}
          </select>
          <select
            className={input}
            value={f.tecnicoId}
            onChange={(e) => setF({ ...f, tecnicoId: e.target.value })}
          >
            <option value="">Sin asignar</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
          <select
            className={input}
            value={f.prioridad}
            onChange={(e) => setF({ ...f, prioridad: e.target.value as PrioridadOrden })}
          >
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {ETIQUETA_PRIORIDAD[p]}
              </option>
            ))}
          </select>
          <input
            className={`${input} sm:col-span-2`}
            placeholder="Descripción"
            value={f.descripcion}
            onChange={(e) => setF({ ...f, descripcion: e.target.value })}
          />
          <button className={`${boton} sm:col-span-2`} disabled={cargando}>
            Crear orden (SLA {slaHoras} h)
          </button>
        </form>
      )}
    </div>
  );
}
