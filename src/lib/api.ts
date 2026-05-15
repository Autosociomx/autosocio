import { NextResponse } from "next/server";
import { ErrorLimitePlan, ErrorNoEncontrado } from "./store";

export function manejarError(error: unknown): NextResponse {
  if (error instanceof ErrorLimitePlan) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof ErrorNoEncontrado) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  const mensaje = error instanceof Error ? error.message : "Error inesperado";
  return NextResponse.json({ error: mensaje }, { status: 400 });
}
