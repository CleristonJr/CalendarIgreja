"use client";

import React, { useState } from "react";
import { Plus, X, GripVertical, FileText } from "lucide-react";

interface DoxologiaItem {
  hora: string;
  descricao: string;
}

export default function DoxologiaEditor({
  templates,
  doxologiaInicial = []
}: {
  templates: any[];
  doxologiaInicial?: DoxologiaItem[];
}) {
  const [itens, setItens] = useState<DoxologiaItem[]>(
    doxologiaInicial.length > 0 ? doxologiaInicial : []
  );

  function carregarTemplate(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    const t = templates.find((t: any) => t.id === id);
    if (t) {
       // Merge ou substituir
       setItens(t.itens);
    }
  }

  function atualizarItem(index: number, campo: keyof DoxologiaItem, valor: string) {
    const novos = [...itens];
    novos[index][campo] = valor;
    setItens(novos);
  }

  function adicionarLinha() {
    let proxHora = "09:00";
    if (itens.length > 0) {
      const u = itens[itens.length - 1].hora;
      if (u && u.includes(":")) {
        const [h, m] = u.split(":").map(Number);
        const next = new Date();
        next.setHours(h, m + 15, 0, 0);
        proxHora = `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;
      }
    }
    setItens([...itens, { hora: proxHora, descricao: "" }]);
  }

  function removerLinha(index: number) {
    const novos = [...itens];
    novos.splice(index, 1);
    setItens(novos);
  }

  return (
    <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-sm mt-4">
      {/* Retorno do JSON pro formData nativo: */}
      <input type="hidden" name="doxologia_json" value={JSON.stringify(itens)} />

      <div className="bg-white p-4 border-b border-slate-200 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
         <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-indigo-600" /> Doxologia / Cronograma
         </h3>
         
         {templates && templates.length > 0 && (
           <select 
             onChange={carregarTemplate}
             defaultValue=""
             className="text-sm bg-slate-100 border-none text-slate-700 py-1.5 px-3 rounded-lg outline-none cursor-pointer font-medium hover:bg-slate-200 transition"
           >
              <option value="" disabled>Carregar Pre-save...</option>
              {templates.map(t => (
                <option value={t.id} key={t.id}>{t.titulo}</option>
              ))}
           </select>
         )}
      </div>

      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        {itens.length === 0 && (
           <div className="text-center text-sm text-slate-400 py-4">
              Nenhuma atividade descrita. Clique abaixo ou carregue um pre-save.
           </div>
        )}

        {itens.map((item, idx) => (
          <div key={idx} className="flex space-x-2 items-center group">
            <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
            
            <input
              type="time"
              required
              value={item.hora}
              onChange={e => atualizarItem(idx, 'hora', e.target.value)}
              className="w-[110px] shrink-0 text-sm border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-600 bg-white"
            />

            <input
              type="text"
              required
              placeholder="Ex: Sermão principal"
              value={item.descricao}
              onChange={e => atualizarItem(idx, 'descricao', e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-600 bg-white"
            />

            <button 
              type="button" 
              onClick={() => removerLinha(idx)}
              className="text-slate-300 hover:text-red-500 transition p-1 shrink-0"
              title="Remover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <button 
          type="button" 
          onClick={adicionarLinha}
          className="text-sm text-indigo-600 font-bold hover:text-indigo-800 transition flex items-center pt-2"
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar Linha
        </button>
      </div>

    </div>
  );
}
