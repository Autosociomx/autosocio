import { NextRequest, NextResponse } from "next/server";
import { exigirEmpresa, manejarError } from "@/lib/api";
import { crearOrdenMantenimiento } from "@/lib/store";
import type { PrioridadOrden } from "@/lib/domain/tipos";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    exigirEmpresa(params.id);
    const b = await req.json();
    const titulo = String(b?.titulo ?? "").trim();
    const vehiculoId = String(b?.vehiculoId ?? "").trim();
    if (!titulo) throw new Error("El título de la orden es obligatorio");
    if (!vehiculoId) throw new Error("Debe seleccionar un vehículo");
    const orden = crearOrdenMantenimiento({
      empresaId: params.id,
      vehiculoId,
      tecnicoId: b?.tecnicoId ? String(b.tecnicoId) : null,
      titulo,
      descripcion: String(b?.descripcion ?? "").trim(),
      prioridad: (b?.prioridad as PrioridadOrden) ?? "media",
    });
    return NextResponse.json(orden, { status: 201 });
  } catch (error) {
    return manejarError(error);
  }
}
