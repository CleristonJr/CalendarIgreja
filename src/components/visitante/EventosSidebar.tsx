"use client";

import React from 'react';
import Link from 'next/link';
import {
  Building,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';

interface Dept {
  id: string;
  nome: string;
  cor_identificacao: string;
  imagem_url?: string;
}

interface EventosSidebarProps {
  igreja: { nome: string, slug: string };
  departamentos: Dept[];
  user: any | null;
  // Estado e Controle dos Checkboxes de Filtro
  departamentosSelecionados: string[];
  toggleDepartamento: (id: string) => void;
  // Controle Mobile
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function EventosSidebar({
  igreja,
  departamentos,
  user,
  departamentosSelecionados,
  toggleDepartamento,
  isOpen,
  setIsOpen
}: EventosSidebarProps) {

  const SidebarContent = () => (
    <>
      <div className="h-20 shrink-0 flex items-center px-4 md:px-6">
        <img
          src="https://e7.pngegg.com/pngimages/884/302/png-clipart-taunton-seventh-day-adventist-church-christian-church-sasebo-seventh-day-adventist-church-church-angle-christianity-thumbnail.png"
          alt="Logo IASD"
          className="w-10 h-10 mr-3 shrink-0 object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none' }} // fallback smooth
        />
        <div className="flex flex-col">
          <span className="font-bold text-sm text-[#003056] uppercase tracking-tight leading-tight">
            Igreja Adventista<br />do Sétimo Dia®
          </span>
          <span className="text-xs text-slate-500 font-medium truncate mt-0.5" title={igreja.nome}>
            {igreja.nome}
          </span>
        </div>
        <button onClick={() => setIsOpen(false)} className="ml-auto md:hidden p-1 text-slate-400 hover:text-slate-600 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">

        {/* Calendário Geral - Destacado como no Mockup */}
        <div className="mb-8">
          <Link
            href={user ? `/${igreja.slug}/calendario` : `/${igreja.slug}`}
            className={`flex items-center px-4 py-3 rounded-xl font-bold transition-colors bg-[#f5f3ff] text-[#6366f1] hover:bg-[#ede9fe] border shadow-sm border-[#ede9fe]`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3 shrink-0" />
            <span className="truncate">Calendário Geral</span>
          </Link>
        </div>

        <div className="px-2 pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          DEPARTAMENTOS
        </div>

        {departamentos?.length === 0 && (
          <p className="px-2 py-2 text-xs text-slate-400">Nenhum departamento cadastrado.</p>
        )}

        <div className="space-y-1">
          {departamentos?.map((dept) => {
            const isChecked = departamentosSelecionados.includes(dept.id);
            return (
              <label
                key={dept.id}
                className="flex items-center justify-between px-2 py-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-4 overflow-hidden">

                  {/* Ícone Dinâmico: Usa a foto se existir, senão a bolinha */}
                  {dept.imagem_url ? (
                    <img src={dept.imagem_url} alt={dept.nome} className="w-8 h-8 rounded-full shrink-0 object-cover border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center opacity-80 shadow-sm" style={{ backgroundColor: dept.cor_identificacao + '25' }}>
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: dept.cor_identificacao }} />
                    </div>
                  )}

                  <span className="text-[13px] font-bold text-[#1f2937] truncate group-hover:text-black uppercase tracking-wide">
                    {dept.nome}
                  </span>
                </div>
                <div className="flex items-center justify-center relative">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-600 cursor-pointer"
                    checked={isChecked}
                    onChange={() => toggleDepartamento(dept.id)}
                  />
                </div>
              </label>
            )
          })}
        </div>
      </nav>

      {!user && (
        <div className="p-4 shrink-0">
          <Link href="/login" className="w-full flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition">
            Fazer Login
          </Link>
        </div>
      )}
    </>
  );

  return (
    <>
      <button
        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md absolute top-3 left-4 z-40 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white flex flex-col transform transition-transform duration-300 shadow-2xl md:shadow-sm rounded-r-3xl
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
