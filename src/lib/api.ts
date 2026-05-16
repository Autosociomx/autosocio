import { NextResponse } from "next/server";
import { ErrorLimitePlan, ErrorNoEncontrado } from "./store";
import { sesionActual, type Usuario } from "./auth";

export class ErrorNoAutorizado extends Error {
  constructor(mensaje = "No autorizado") {
    super(mensaje);
    this.name = "ErrorNoAutorizado";
  }
}

export function manejarError(error: unknown): NextResponse {
  if (error instanceof ErrorNoAutorizado) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ErrorLimitePlan) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof ErrorNoEncontrado) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  const mensaje = error instanceof Error ? error.message : "Error inesperado";
  return NextResponse.json({ error: mensaje }, { status: 400 });
}

// Exige sesión válida cuya empresa coincida con la solicitada. Devuelve
// el mismo error 401 ante "sin sesión" y "empresa ajena" para no filtrar
// la existencia de recursos de otras empresas.
export function exigirEmpresa(empresaId: string): Usuario {
  const usuario = sesionActual();
  if (!usuario || usuario.empresaId !== empresaId) {
    throw new ErrorNoAutorizado();
  }
  return usuario;
}
