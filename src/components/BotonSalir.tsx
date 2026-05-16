"use client";

import { useRouter } from "next/navigation";

export default function BotonSalir() {
  const router = useRouter();

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button onClick={salir} className="hover:text-marca-acento">
      Cerrar sesión
    </button>
  );
}
