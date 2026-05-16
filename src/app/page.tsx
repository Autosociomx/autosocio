import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function Inicio() {
  const usuario = sesionActual();
  redirect(usuario ? `/empresas/${usuario.empresaId}` : "/login");
}
