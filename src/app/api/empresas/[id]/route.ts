import { NextResponse } from "next/server";
import { exigirEmpresa, manejarError } from "@/lib/api";
import {
  obtenerEmpresa,
  ordenesDe,
  tecnicosDe,
  vehiculosDe,
} from "@/lib/store";
import { obtenerPlan } from "@/lib/domain/planes";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    exigirEmpresa(params.id);
    const empresa = obtenerEmpresa(params.id);
    return NextResponse.json({
      empresa,
      plan: obtenerPlan(empresa.plan),
      vehiculos: vehiculosDe(params.id),
      tecnicos: tecnicosDe(params.id),
      ordenes: ordenesDe(params.id),
    });
  } catch (error) {
    return manejarError(error);
  }
}
