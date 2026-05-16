import { NextRequest, NextResponse } from "next/server";
import { abrirSesion, autenticar } from "@/lib/auth";
import { manejarError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const email = String(b?.email ?? "").trim();
    const contrasena = String(b?.contrasena ?? "");
    if (!email || !contrasena) throw new Error("Email y contraseña son obligatorios");
    const usuario = autenticar(email, contrasena);
    if (!usuario) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 },
      );
    }
    abrirSesion(usuario);
    return NextResponse.json({ empresaId: usuario.empresaId });
  } catch (error) {
    return manejarError(error);
  }
}
