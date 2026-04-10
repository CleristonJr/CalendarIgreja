"use client";

import React, { useState } from "react";
import { Plus, Trash2, ListOrdered, Edit3, GripVertical, X } from "lucide-react";
import { adicionarTemplateDoxologia, editarTemplateDoxologia, deletarTemplateDoxologia } from "@/app/[igrejaSlug]/configuracoes/actions";

interface DoxologiaItem {
  hora: string;
  descricao: string;
}

interface TemplateRow {
  id: string;
  titulo: string;
  itens: DoxologiaItem[];
}

export default function GerenciadorDoxologiaTemplates({
  igreja,
  slug,
  templates
}: {
  igreja: any;
  slug: string;
  templates: TemplateRow[];
}) {
  const [modoEdicao, setModoEdicao] = useState<TemplateRow | null>(null);
  
  // Estado local para construir a grade
  const [itens, setItens] = useState<DoxologiaItem[]>([{ hora: "09:00", descricao: "" }]);
  const [titulo, setTitulo] = useState("");

  function iniciarCriacao() {
    setModoEdicao(null);
    setTitulo("");
    setItens([{ hora: "09:00", descricao: "" }]);
  }

  function iniciarEdicao(t: TemplateRow) {
    setModoEdicao(t);
    setTitulo(t.titulo);
    setItens(t.itens || []);
  }

  function atualizarItem(index: number, campo: keyof DoxologiaItem, valor: string) {
    const novos = [...itens];
    novos[index][campo] = valor;
    setItens(novos);
  }

  function adicionarLinha() {
    // Tenta sugerir a próxima hora (+15 mins) baseando na última
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
    if (itens.length === 1) return; // Nao deixa remover as todas
    const novos = [...itens];
    novos.splice(index, 1);
    setItens(novos);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <ListOrdered className="w-5 h-5 mr-2 text-indigo-600" />
          Pre-Saves de Doxologia (Modelos)
        </h2>
        
        {modoEdicao && (
          <button onClick={iniciarCriacao} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-bold hover:bg-indigo-100 transition">
            Voltar para Criação
          </button>
        )}
      </div>

      <div className="p-6 md:flex md:space-x-8">
        
        {/* Lado Esquerdo: Formulário */}
        <div className="md:w-[45%] mb-8 md:mb-0">
          <form action={modoEdicao ? editarTemplateDoxologia : adicionarTemplateDoxologia} className="space-y-5">
            <input type="hidden" name="igreja_id" value={igreja.id} />
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="itens_json" value={JSON.stringify(itens)} />
            {modoEdicao && <input type="hidden" name="template_id" value={modoEdicao.id} />}

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
               {modoEdicao ? (
                 <p className="text-sm font-semibold text-slate-700 flex items-center">
                   <Edit3 className="w-4 h-4 mr-2 text-indigo-500"/> Editando Template
                 </p>
               ) : (
                 <p className="text-sm font-semibold text-slate-700 flex items-center">
                   <Plus className="w-4 h-4 mr-2 text-green-500"/> Criando Novo Modelo
                 </p>
               )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Título do Modelo</label>
              <input
                name="titulo"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Culto Divino Padrão"
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition uppercase"
              />
            </div>

            {/* Editor de Slots */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Itens da Doxologia</label>
              
              <div className="space-y-2 mb-3">
                {itens.map((item, idx) => (
                  <div key={idx} className="flex space-x-2 items-center group">
                    <GripVertical className="w-4 h-4 text-slate-300 shrink-0 cursor-move" />
                    
                    <input
                      type="time"
                      required
                      value={item.hora}
                      onChange={e => atualizarItem(idx, 'hora', e.target.value)}
                      className="w-[110px] shrink-0 text-sm border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-600"
                    />

                    <input
                      type="text"
                      required
                      placeholder="Ex: Oração Invocatória"
                      value={item.descricao}
                      onChange={e => atualizarItem(idx, 'descricao', e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-600"
                    />

                    {itens.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removerLinha(idx)}
                        className="text-red-300 hover:text-red-500 transition p-1 shrink-0"
                      >
                       <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                onClick={adicionarLinha}
                className="text-sm text-indigo-600 font-bold hover:text-indigo-800 transition flex items-center"
              >
                + Adicionar Etapa
              </button>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition"
            >
              {modoEdicao ? 'Salvar Alterações' : 'Salvar Novo Modelo'}
            </button>
          </form>
        </div>

        {/* Lado Direito: Lista de Templates */}
        <div className="md:w-[55%] border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 pt-8 md:pt-0">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Templates Cadastrados ({templates?.length})</h3>

          {templates?.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
              Nenhum template salvo. Crie o primeiro ao lado.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {templates?.map(t => (
                <div key={t.id} className="p-4 border border-slate-200 rounded-xl bg-white hover:border-indigo-200 transition shadow-sm group">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-slate-800 text-sm uppercase">{t.titulo}</h4>
                    
                    <div className="flex space-x-2">
                       <button 
                         onClick={() => iniciarEdicao(t)} 
                         title="Editar" 
                         className="text-slate-400 hover:text-indigo-600 transition"
                       >
                         <Edit3 className="w-4 h-4" />
                       </button>

                       <form action={deletarTemplateDoxologia}>
                         <input type="hidden" name="template_id" value={t.id} />
                         <input type="hidden" name="igreja_id" value={igreja.id} />
                         <input type="hidden" name="slug" value={slug} />
                         <button type="submit" title="Excluir" className="text-slate-400 hover:text-red-500 transition">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </form>
                    </div>
                  </div>
                  
                  {/* Visao compacta dos itens */}
                  <div className="flex flex-wrap gap-1.5">
                     {t.itens?.slice(0, 5).map((item, idx) => (
                       <div key={idx} className="bg-slate-50 text-[11px] font-medium text-slate-500 px-2 py-1 rounded truncate max-w-[150px]">
                         <span className="font-bold mr-1">{item.hora}</span> 
                         {item.descricao}
                       </div>
                     ))}
                     {(t.itens?.length || 0) > 5 && (
                       <div className="bg-slate-50 text-[11px] font-bold text-slate-400 px-2 py-1 rounded">
                         +{t.itens.length - 5}
                       </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
