import { NextRequest, NextResponse } from "next/server";
import { exigirEmpresa, manejarError } from "@/lib/api";
import { agregarTecnico } from "@/lib/store";
import type { EspecialidadTecnico } from "@/lib/domain/tipos";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    exigirEmpresa(params.id);
    const b = await req.json();
    const nombre = String(b?.nombre ?? "").trim();
    if (!nombre) throw new Error("El nombre del técnico es obligatorio");
    const especialidad = (b?.especialidad as EspecialidadTecnico) ?? "mecanica_general";
    const tecnico = agregarTecnico(params.id, nombre, especialidad);
    return NextResponse.json(tecnico, { status: 201 });
  } catch (error) {
    return manejarError(error);
  }
}
