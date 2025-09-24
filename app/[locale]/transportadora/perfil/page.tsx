"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

export default function PerfilEmpresaPage() {
  const t = useTranslations("Perfil");
  const { token, user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "" });
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", email: user.email || "" });
    }
  }, [user]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/utilizador", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setMensagem(t("erroAtualizar"));
      } else {
        setMensagem(t("sucesso"));
      }
    } catch {
      setMensagem(t("erroServidor"));
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">{t("titulo")}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>{t("nome")}</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="input w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label>{t("email")}</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="input w-full border px-3 py-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {t("guardar")}
        </button>
        {mensagem && <p className="text-sm mt-2">{mensagem}</p>}
      </form>
    </main>
  );
}
