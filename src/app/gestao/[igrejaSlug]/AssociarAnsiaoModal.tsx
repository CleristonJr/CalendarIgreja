"use client";

import React, { useState } from "react";
import { X, UserPlus, Fingerprint } from "lucide-react";
import { associarAnsiao } from "../actions";
import { useRouter } from "next/navigation";

export default function AssociarAnsiaoModal({
  igreja_id,
  slug,
}: {
  igreja_id: string;
  slug: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await associarAnsiao(formData);
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Erro ao associar ancião.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition"
      >
        + Associar Ancião
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold flex items-center text-slate-800">
                <Fingerprint className="w-5 h-5 mr-2 text-indigo-600" /> 
                Novo Ancião
              </h2>
              <button 
                onClick={() => setOpen(false)} 
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <input type="hidden" name="igreja_id" value={igreja_id} />
              <input type="hidden" name="slug" value={slug} />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  name="nome"
                  required
                  placeholder="Ex: João Silva"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email de Acesso</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@exemplo.com"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Senha Padrão (Mín. 6)</label>
                <input
                  type="text"
                  name="password"
                  required
                  minLength={6}
                  placeholder="******"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow disabled:opacity-50 transition"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {loading ? 'Criando Conta...' : 'Cadastrar Ancião'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
