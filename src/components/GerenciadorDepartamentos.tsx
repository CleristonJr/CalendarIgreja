"use client";

import React, { useState } from 'react';
import { Plus, Tag, Trash2, Edit2, X, Upload } from 'lucide-react';
import { adicionarDepartamento, deletarDepartamento, editarDepartamento } from '@/app/[igrejaSlug]/configuracoes/actions';
import { createClient } from '@/utils/supabase/client';

export default function GerenciadorDepartamentos({ igreja, slug, departamentos, PALETA_CORES }: any) {
  const [loading, setLoading] = useState(false);
  
  // Estado de Edição
  const [editMode, setEditMode] = useState<string | null>(null); // null = Modo Criação; 'id' = Modo Edição
  
  // States do formulário
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState(PALETA_CORES[0].hex);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);

  // Iniciar Edição
  const handleEditClick = (dept: any) => {
    setEditMode(dept.id);
    setNome(dept.nome);
    setCor(dept.cor_identificacao);
    setImagemPreview(dept.imagem_url || null);
  };

  // Cancelar Edição
  const cancelEdit = () => {
    setEditMode(null);
    setNome('');
    setCor(PALETA_CORES[0].hex);
    setImagemPreview(null);
  };

  // Submit Handler Unificado (Criação ou Edição)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Manter a foto no estado se veio pela edição e não uploadou nova
      if (editMode && imagemPreview && !(formData.get('imagem') as File)?.size) {
         formData.set('imagem_url', imagemPreview);
      }

      // 1. Upload de Imagem se houver
      const arquivoImagem = formData.get('imagem') as File | null;
      if (arquivoImagem && arquivoImagem.size > 0) {
        const supabase = createClient();
        const extensao = arquivoImagem.name.split('.').pop();
        const nomeArquivo = `${igreja.id}_dept_${Date.now()}.${extensao}`;
        
        const { error: uploadError } = await supabase.storage
          .from('arquivos_igreja')
          .upload(nomeArquivo, arquivoImagem);

        if (uploadError) throw new Error("Falha no upload da imagem: " + uploadError.message);

        const { data: { publicUrl } } = supabase.storage.from('arquivos_igreja').getPublicUrl(nomeArquivo);
        formData.set('imagem_url', publicUrl);
      }

      // 2. Dispatch Server Action
      if (editMode) {
        formData.set('dept_id', editMode);
        await editarDepartamento(formData);
      } else {
        await adicionarDepartamento(formData);
      }
      
      cancelEdit(); // Reset após sucesso
      
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Tag className="w-5 h-5 mr-2 text-indigo-600" />
          Departamentos Oficiais da Igreja
        </h2>
      </div>

      <div className="p-6 md:flex md:space-x-8">
        
        {/* Lado Esquerdo: Formulário (Create/Edit) */}
        <div className="md:w-1/3 mb-8 md:mb-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="igreja_id" value={igreja.id} />
            <input type="hidden" name="slug" value={slug} />

            {editMode && (
              <div className="flex items-center justify-between bg-indigo-50 px-3 py-2 rounded text-indigo-800 font-bold mb-4">
                 <span>Modo de Edição</span>
                 <button type="button" onClick={cancelEdit} className="p-1 hover:bg-indigo-100 rounded text-indigo-600">
                   <X className="w-4 h-4" />
                 </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Departamento</label>
              <input
                name="nome"
                placeholder="Ex: Ministério Jovem"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Cor Oficial</label>
              <div className="grid grid-cols-5 gap-2">
                {PALETA_CORES.map((pc: any, idx: number) => (
                  <label key={idx} className="cursor-pointer relative group">
                    <input 
                      type="radio" 
                      name="cor_identificacao" 
                      value={pc.hex} 
                      className="peer sr-only" 
                      required 
                      checked={cor === pc.hex}
                      onChange={() => setCor(pc.hex)}
                    />
                    <div
                      className="w-full aspect-square rounded-md shadow-sm border-2 border-transparent peer-checked:border-indigo-600 peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:ring-indigo-600 hover:scale-105 transition"
                      style={{ backgroundColor: pc.hex }}
                    ></div>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                      {pc.nome}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Ícone / Imagem <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              
              {imagemPreview && (
                 <div className="mb-2 relative w-16 h-16 rounded-full border border-slate-200 overflow-hidden shadow-sm">
                    <img src={imagemPreview} alt="Ícone Atual" className="w-full h-full object-cover" />
                 </div>
              )}

              <input
                type="file"
                name="imagem"
                accept="image/png, image/jpeg, image/webp"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
              />
              <p className="text-xs text-slate-500 mt-1">Essa imagem aparecerá no Portal Eventos (Ideal: quadrada 1:1).</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center p-2.5 text-white font-medium rounded-lg shadow-sm transition disabled:opacity-50 ${editMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? 'Salvando...' : editMode ? (
                <><Edit2 className="w-5 h-5 mr-2" /> Salvar Edição</>
              ) : (
                <><Plus className="w-5 h-5 mr-1" /> Cadastrar Área</>
              )}
            </button>
          </form>
        </div>

        {/* Lado Direito: Lista de Departamentos */}
        <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 pt-8 md:pt-0">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Departamentos Criados ({departamentos.length})</h3>
          
          {departamentos.length === 0 ? (
            <div className="text-slate-500 text-sm italic bg-slate-50 p-4 rounded-lg">Nenhum departamento cadastrado. Defina logo o primeiro!</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
              {departamentos.map((dept: any) => (
                <div key={dept.id} className="flex justify-between items-center p-3 border border-slate-100 bg-white rounded-xl shadow-sm hover:shadow-md transition group">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    {dept.imagem_url ? (
                      <img src={dept.imagem_url} alt={dept.nome} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200" />
                    ) : (
                      <div className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: dept.cor_identificacao }}></div>
                    )}
                    <span className="font-bold text-slate-800 text-sm truncate">{dept.nome}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => handleEditClick(dept)} 
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" 
                      title="Editar Departamento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    
                    <form action={deletarDepartamento}>
                      <input type="hidden" name="dept_id" value={dept.id} />
                      <input type="hidden" name="igreja_id" value={igreja.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <button 
                        type="submit" 
                        onClick={(e) => { if (!confirm(`Tem certeza que deseja DELETAR o departamento ${dept.nome} e os acessos dos seus membros?`)) e.preventDefault(); }}
                        className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Deletar Departamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
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
