import { NextRequest, NextResponse } from "next/server";
import { manejarError } from "@/lib/api";
import { crearEmpresa, resumenEmpresas } from "@/lib/store";
import type { TamanoEmpresa } from "@/lib/domain/planes";

export async function GET() {
  return NextResponse.json(resumenEmpresas());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nombre = String(body?.nombre ?? "").trim();
    const plan = body?.plan as TamanoEmpresa;
    if (!nombre) throw new Error("El nombre de la empresa es obligatorio");
    if (!["pequena", "mediana", "grande"].includes(plan)) {
      throw new Error("Plan inválido");
    }
    return NextResponse.json(crearEmpresa(nombre, plan), { status: 201 });
  } catch (error) {
    return manejarError(error);
  }
}
