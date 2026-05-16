import { NextRequest, NextResponse } from "next/server";
import { exigirEmpresa, manejarError } from "@/lib/api";
import { cambiarEstadoOrden, empresaDeOrden } from "@/lib/store";
import type { EstadoOrden } from "@/lib/domain/tipos";

const ESTADOS: EstadoOrden[] = ["abierta", "en_proceso", "completada", "cancelada"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    exigirEmpresa(empresaDeOrden(params.id));
    const b = await req.json();
    const estado = b?.estado as EstadoOrden;
    if (!ESTADOS.includes(estado)) throw new Error("Estado inválido");
    return NextResponse.json(cambiarEstadoOrden(params.id, estado));
  } catch (error) {
    return manejarError(error);
  }
}
