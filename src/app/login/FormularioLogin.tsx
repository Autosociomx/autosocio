"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FormularioLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contrasena }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "No se pudo iniciar sesión");
      router.replace(`/empresas/${data.empresaId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setCargando(false);
    }
  }

  const input =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-marca-acento focus:outline-none";

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      <input
        className={input}
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className={input}
        type="password"
        placeholder="Contraseña"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        required
      />
      <button
        className="w-full rounded-md bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        disabled={cargando}
      >
        {cargando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
