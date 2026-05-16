import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/auth";
import FormularioLogin from "./FormularioLogin";

export const dynamic = "force-dynamic";

export default function PaginaLogin() {
  const usuario = sesionActual();
  if (usuario) redirect(`/empresas/${usuario.empresaId}`);

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-slate-600">
        Accede al equipo de mantenimiento de tu empresa.
      </p>
      <FormularioLogin />
      <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-medium text-slate-600">Cuentas de prueba (contraseña: demo1234)</p>
        <ul className="mt-1 space-y-0.5">
          <li>admin@trans.mx — plan Pequeña</li>
          <li>admin@logimax.mx — plan Mediana</li>
          <li>admin@flota.mx — plan Grande</li>
        </ul>
      </div>
    </div>
  );
}
