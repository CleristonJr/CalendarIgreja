"use client";

import { useState } from "react";
import { Plus, Trash2, Users, Save } from "lucide-react";
import { atualizarEquipeDepartamento } from "@/app/[igrejaSlug]/configuracoes/actions";

interface Membro {
  nome: string;
  telefone: string;
}

export default function GerenciadorEquipe({
  igreja,
  slug,
  departamentos,
  perfil,
}: {
  igreja: any;
  slug: string;
  departamentos: any[];
  perfil: any;
}) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    perfil.role === "lider" ? perfil.departamento_id : departamentos[0]?.id || ""
  );

  const selectedDept = departamentos.find((d) => d.id === selectedDeptId);
  const equipeAtual = selectedDept?.equipe_json || [];

  const [equipe, setEquipe] = useState<Membro[]>(equipeAtual);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Se trocar o departamento, recarrega a equipe
  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDeptId(id);
    const dept = departamentos.find((d) => d.id === id);
    setEquipe(dept?.equipe_json || []);
  };

  const adcionarMembro = () => {
    if (!nome.trim()) return;
    setEquipe([...equipe, { nome: nome.trim(), telefone: telefone.trim() }]);
    setNome("");
    setTelefone("");
  };

  const removerMembro = (index: number) => {
    setEquipe(equipe.filter((_, i) => i !== index));
  };

  const salvarAction = async () => {
    if (!selectedDeptId) return;
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("departamento_id", selectedDeptId);
      fd.append("igreja_id", igreja.id);
      fd.append("slug", slug);
      fd.append("equipe_json", JSON.stringify(equipe));

      await atualizarEquipeDepartamento(fd);
      alert("Equipe atualizada com sucesso!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedDeptId && perfil.role === 'lider') {
      return (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm max-w-2xl mx-auto">
              <p className="text-slate-500">Você não possui um departamento atribuído para gerenciar a equipe.</p>
          </div>
      )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8 w-full">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Users className="w-5 h-5 mr-2 text-indigo-600" />
          Minha Equipe
        </h2>
        
        {perfil.role !== "lider" && (
          <select
            value={selectedDeptId}
            onChange={handleDeptChange}
            className="text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-600 outline-none"
          >
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="p-6 md:flex md:space-x-8">
        {/* Lado Esquerdo: Formulário */}
        <div className="md:w-1/3 mb-8 md:mb-0">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Nome do Integrante
              </label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') adcionarMembro(); }}
                placeholder="Ex: João da Silva"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Telefone (Opcional)
              </label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') adcionarMembro(); }}
                placeholder="(00) 00000-0000"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={adcionarMembro}
              disabled={!nome.trim()}
              className="w-full flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar à Lista
            </button>
          </div>
        </div>

        {/* Lado Direito: Lista */}
        <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 pt-8 md:pt-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              Integrantes ({equipe.length})
            </h3>
            <button
              onClick={salvarAction}
              disabled={isSaving}
              className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
            {equipe.length === 0 ? (
              <p className="text-sm text-slate-400 italic col-span-2">
                Nenhum membro cadastrado nesta equipe.
              </p>
            ) : (
              equipe.map((m, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-lg group"
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-bold text-slate-800 text-sm truncate">{m.nome}</span>
                    {m.telefone && (
                      <span className="text-xs text-slate-500">{m.telefone}</span>
                    )}
                  </div>
                  <button
                    onClick={() => removerMembro(idx)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {selectedDept && equipe !== (selectedDept.equipe_json || []) && (
              <p className="text-xs text-amber-600 mt-4 flex justify-end font-medium">Você tem alterações não salvas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
