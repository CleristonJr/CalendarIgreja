"use client";

import React, { useState } from 'react';
import { Upload, Building, X } from 'lucide-react';
import { atualizarLogoIgreja } from '@/app/[igrejaSlug]/configuracoes/actions';
import { createClient } from '@/utils/supabase/client';

export default function GerenciadorLogo({ igreja, slug }: { igreja: any; slug: string }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(igreja.logo_url || null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const arquivo = formData.get('logo') as File | null;

      if (!arquivo || arquivo.size === 0) {
        alert("Selecione uma imagem.");
        setLoading(false);
        return;
      }

      // Upload para Supabase Storage
      const supabase = createClient();
      const extensao = arquivo.name.split('.').pop();
      const nomeArquivo = `${igreja.id}_logo_${Date.now()}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from('arquivos_igreja')
        .upload(nomeArquivo, arquivo);

      if (uploadError) throw new Error("Falha no upload: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('arquivos_igreja').getPublicUrl(nomeArquivo);

      // Salvar no banco
      const fd = new FormData();
      fd.append('igreja_id', igreja.id);
      fd.append('slug', slug);
      fd.append('logo_url', publicUrl);
      await atualizarLogoIgreja(fd);

      setPreview(publicUrl);
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function removerLogo() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('igreja_id', igreja.id);
      fd.append('slug', slug);
      fd.append('logo_url', '');
      await atualizarLogoIgreja(fd);
      setPreview(null);
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-indigo-600" />
          Logo da Igreja
        </h2>
      </div>

      <div className="p-6 flex items-center gap-6">
        {/* Preview */}
        <div className="shrink-0">
          {preview ? (
            <div className="relative group">
              <img 
                src={preview} 
                alt="Logo da Igreja" 
                className="w-24 h-24 object-contain rounded-xl border border-slate-200 shadow-sm bg-white p-1"
              />
              <button 
                type="button" 
                onClick={removerLogo}
                disabled={loading}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                title="Remover logo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
              <Building className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Enviar Logo</p>
            <p className="text-xs text-slate-500 mb-2">Esta imagem aparecerá no Portal de Eventos e na sidebar. Formato ideal: quadrada (1:1).</p>
            <input
              type="file"
              name="logo"
              accept="image/png, image/jpeg, image/webp"
              className="w-full text-sm border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Salvar Logo'}
          </button>
        </form>
      </div>
    </div>
  );
}
