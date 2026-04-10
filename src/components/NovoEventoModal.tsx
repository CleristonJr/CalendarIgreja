"use client";

import React, { useState } from "react";
import { X, CalendarPlus } from "lucide-react";
import { criarEvento } from "@/app/[igrejaSlug]/actions";
import { createClient } from "@/utils/supabase/client";

interface Departamento {
  id: string;
  nome: string;
  cor_identificacao: string;
}

export default function NovoEventoModal({
  igreja_id,
  slug,
  departamentos
}: {
  igreja_id: string;
  slug: string;
  departamentos: Departamento[]
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAction(formData: FormData) {
    setLoading(true);
    try {
      const arquivoImagem = formData.get("imagem") as File | null;
      if (arquivoImagem && arquivoImagem.size > 0) {
        const supabase = createClient();
        const extensao = arquivoImagem.name.split('.').pop();
        const nomeArquivo = `${igreja_id}_evento_${Date.now()}.${extensao}`;
        
        const { error: uploadError } = await supabase.storage
          .from("arquivos_igreja")
          .upload(nomeArquivo, arquivoImagem);

        if (uploadError) throw new Error("Falha no upload da imagem: " + uploadError.message);

        const { data: { publicUrl } } = supabase.storage.from("arquivos_igreja").getPublicUrl(nomeArquivo);
        formData.set("imagem_url", publicUrl);
      }

      await criarEvento(formData);
      setOpen(false);
      window.location.reload();
    } catch (error: any) {
      alert("Erro ao criar evento: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
      >
        + Novo Evento
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 flex flex-col max-h-[95vh] sm:max-h-[85vh]">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold flex items-center text-slate-800">
                <CalendarPlus className="w-5 h-5 mr-2 text-indigo-600" /> 
                Novo Evento
              </h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={handleAction} className="p-5 space-y-4 overflow-y-auto flex-1">
              <input type="hidden" name="igreja_id" value={igreja_id} />
              <input type="hidden" name="slug" value={slug} />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Título do Evento *</label>
                <input
                  type="text"
                  name="titulo"
                  required
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  placeholder="Ex: Culto de Jovens"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Início *</label>
                  <input
                    type="datetime-local"
                    name="data_inicio"
                    required
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Término *</label>
                  <input
                    type="datetime-local"
                    name="data_fim"
                    required
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Departamento Organizador (Opcional)</label>
                <select
                  name="departamento_id"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                >
                  <option value="">Geral (Sem departamento específico)</option>
                  {departamentos.map(d => (
                    <option key={d.id} value={d.id}>{d.nome}</option>
                  ))}
                </select>
              </div>

              {departamentos.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Departamentos Colaboradores</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                    {departamentos.map(d => (
                      <label key={d.id} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded transition">
                        <input type="checkbox" name="colaboradores_ids" value={d.id} className="rounded text-indigo-600 focus:ring-indigo-600" />
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: d.cor_identificacao }}></span>
                          <span className="truncate">{d.nome}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição Adicional</label>
                <textarea
                  name="descricao"
                  rows={2}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  placeholder="Convidados, detalhes locais, o que levar..."
                />
              </div>

              {/* Upload de Imagem */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Banner / Imagem <span className="text-slate-400 font-normal">(Opcional)</span></label>
                <input
                  type="file"
                  name="imagem"
                  accept="image/png, image/jpeg, image/webp"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                />
                <p className="text-xs text-slate-500 mt-1">Será exibida com destaque no Portal Eventos.</p>
              </div>

              {/* Recorrência Semanal */}
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_recurring"
                    value="true"
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-600 border-slate-300"
                  />
                  <div>
                    <span className="text-sm font-semibold text-indigo-900">Repetir semanalmente</span>
                    <p className="text-xs text-indigo-700 mt-0.5">
                      O evento será replicado toda semana, no mesmo horário, por 6 meses (26 semanas). Cada ocorrência poderá ser editada individualmente.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg shadow disabled:opacity-50 transition"
                >
                  {loading ? 'Salvando...' : 'Completar Cadastro do Evento'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
