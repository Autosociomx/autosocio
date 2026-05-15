import { NextRequest, NextResponse } from "next/server";
import { manejarError } from "@/lib/api";
import { cambiarEstadoOrden } from "@/lib/store";
import type { EstadoOrden } from "@/lib/domain/tipos";

const ESTADOS: EstadoOrden[] = ["abierta", "en_proceso", "completada", "cancelada"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const b = await req.json();
    const estado = b?.estado as EstadoOrden;
    if (!ESTADOS.includes(estado)) throw new Error("Estado inválido");
    return NextResponse.json(cambiarEstadoOrden(params.id, estado));
  } catch (error) {
    return manejarError(error);
  }
}
