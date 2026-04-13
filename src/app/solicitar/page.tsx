"use client";

import React, { useState } from "react";
import { ArrowLeft, Building, Link as LinkIcon, User, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { criarSolicitacaoIgreja } from "./actions";

export default function SolicitarIgreja() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [slugPreview, setSlugPreview] = useState("");

  async function handleAction(formData: FormData) {
    setLoading(true);
    setErrorMsg("");
    try {
      await criarSolicitacaoIgreja(formData);
      setSuccess(true);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nome = e.target.value;
    const baseSlug = nome
      .toLowerCase()
      .normalize('NFD') // remove acentos
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlugPreview(baseSlug);
  }

  if (success) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border top-0 border-indigo-100 z-10 animate-in fade-in slide-in-from-bottom-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Solicitação Enviada!</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Sua conta de Ancião foi reservada! Recebemos a ficha da sua igreja e nossa equipe de administração já está analisando para aprovação.
            Você será notificado e tentará logar em breve.
          </p>
          <Link href="/" className="inline-block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-white">
      {/* Lado Institucional (Branding) */}
      <div className="w-full md:w-5/12 bg-indigo-600 p-10 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-white to-transparent"></div>
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center text-indigo-200 hover:text-white transition group mb-16">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition" /> Voltar ao Login
          </Link>
          <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
            O Calendário Definitivo para a sua Igreja.
          </h1>
          <p className="text-indigo-100 text-lg md:text-xl font-medium max-w-md leading-relaxed">
            Controle departamentos, cadastre equipes e unifique as agendas congregacionais sob a aprovação de uma infraestrutura robusta.
          </p>
        </div>
      </div>

      {/* Lado Formulário */}
      <div className="w-full md:w-7/12 flex items-center justify-center px-4 py-8 md:p-12 overflow-y-auto">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-800">Crie o seu acesso</h2>
            <p className="text-slate-500 font-medium mt-1">Sua nova infraestrutura SaaS começará ao preencher este formulário de afiliação.</p>
          </div>

          {errorMsg && (
            <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 font-medium rounded animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <form action={handleAction} className="space-y-6">
            {/* Bloco Conta */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Sua Conta Permanente (Ancião)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Seu Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input name="nome_ansiao" required placeholder="Pr. João Campos" className="w-full bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 border border-slate-200 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail de Login</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input type="email" name="email" required placeholder="pastor@igreja.com" className="w-full bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 border border-slate-200 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Senha Mestra</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input type="password" name="password" required placeholder="Crie uma senha forte" className="w-full bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 border border-slate-200 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco Igreja */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">2. Detalhes da Igreja Física</h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Oficial da Organização</label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input name="nome_igreja" onChange={handleNameChange} required placeholder="Igreja Presbiteriana do Brasil" className="w-full bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 border border-slate-200 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition" />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                <div className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                  <LinkIcon className="w-4 h-4 text-indigo-400 mr-2" />
                  O Link Público do seu Calendário (Gerado Automaticamente)
                </div>
                <p className="mt-1 text-sm font-medium text-slate-600 border border-dashed border-indigo-200 bg-indigo-50/50 p-2 rounded">
                  seusite.com/<span className="text-indigo-700 font-bold">{slugPreview || 'sua-igreja'}</span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  *Nosso sistema verificará a disponibilidade deste nome e poderá ajustá-lo automaticamente com numéricos caso já exista outra congregação usando.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition hover:-translate-y-0.5"
              >
                {loading ? 'Preparando infraestrutura...' : 'Confirmar e Enviar Solicitação'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

