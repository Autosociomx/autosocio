import { NextRequest, NextResponse } from "next/server";
import { manejarError } from "@/lib/api";
import { agregarVehiculo } from "@/lib/store";
import type { EstadoVehiculo } from "@/lib/domain/tipos";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const b = await req.json();
    const placa = String(b?.placa ?? "").trim();
    const marca = String(b?.marca ?? "").trim();
    const modelo = String(b?.modelo ?? "").trim();
    if (!placa || !marca || !modelo) {
      throw new Error("Placa, marca y modelo son obligatorios");
    }
    const vehiculo = agregarVehiculo(params.id, {
      placa,
      marca,
      modelo,
      anio: Number(b?.anio) || new Date().getFullYear(),
      kilometraje: Number(b?.kilometraje) || 0,
      estado: (b?.estado as EstadoVehiculo) ?? "operativo",
    });
    return NextResponse.json(vehiculo, { status: 201 });
  } catch (error) {
    return manejarError(error);
  }
}
