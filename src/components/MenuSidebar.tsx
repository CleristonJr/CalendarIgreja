"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building, 
  LayoutDashboard, 
  Circle, 
  Settings, 
  LogOut, 
  Menu,
  X
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Dept {
  id: string;
  nome: string;
  cor_identificacao: string;
}

interface MenuSidebarProps {
  igreja: { nome: string };
  slug: string;
  departamentos: Dept[];
  user: any | null;
  departamentoAtivoId?: string | null;
  paginaAtiva?: string; // ex: 'calendario' | 'configuracoes'
}

export default function MenuSidebar({ 
  igreja, 
  slug, 
  departamentos, 
  user, 
  departamentoAtivoId = null,
  paginaAtiva = 'calendario'
}: MenuSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  const toggleSidebar = () => setIsOpen(!isOpen);

  // O conteúdo interno da sidebar, renderizado igual tanto pro Desktop quanto para o Drawer Mobile
  const SidebarContent = () => (
    <>
      <div className="h-16 shrink-0 flex items-center px-4 md:px-6 border-b border-slate-200">
        <Building className="w-6 h-6 text-indigo-600 mr-2 shrink-0" />
        <span className="font-bold text-lg truncate" title={igreja.nome}>{igreja.nome}</span>
        {/* Close Button on Mobile só */}
        <button onClick={toggleSidebar} className="ml-auto md:hidden p-1 text-slate-400 hover:text-slate-600 rounded">
           <X className="w-5 h-5"/>
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Visão Principal
        </div>
        <Link 
          href={`/${slug}`} 
          onClick={() => setIsOpen(false)}
          className={`flex items-center px-3 py-2.5 rounded-md font-medium mb-4 transition-colors ${
            paginaAtiva === 'calendario' && !departamentoAtivoId 
              ? 'bg-indigo-50 text-indigo-700' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mr-3 shrink-0" />
          <span className="truncate">Calendário Geral</span>
        </Link>

        {user && (
          <>
            <div className="px-3 pb-2 pt-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Departamentos
            </div>
                    
            {departamentos?.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">Nenhum setor cadastrado ainda.</p>
            )}

            {departamentos?.map((dept) => {
              const isAtivo = dept.id === departamentoAtivoId;
              return (
                <Link 
                  key={dept.id} 
                  href={`/${slug}/departamentos/${dept.id}`} 
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isAtivo ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Circle className="w-3 h-3 mr-3 shrink-0" style={{ color: dept.cor_identificacao, fill: dept.cor_identificacao }} />
                  <span className="truncate">{dept.nome}</span>
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200 shrink-0 space-y-2">
        {user && (
          <Link 
            href={`/${slug}/configuracoes`} 
            onClick={() => setIsOpen(false)}
            className={`flex items-center px-3 py-2 rounded-md font-medium transition-colors ${
                paginaAtiva === 'configuracoes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className="w-5 h-5 mr-3 shrink-0" />
            Configurações
          </Link>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {user ? (
            <>
              <div className="flex flex-col overflow-hidden mr-2">
                <span className="text-sm font-semibold text-slate-900 truncate" title={user.email}>{user.email}</span>
                <span className="text-xs text-green-600 font-medium">Logado</span>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 p-1.5 shrink-0 transition-colors" title="Sair">
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 truncate">Visitante</span>
                <span className="text-[10px] sm:text-xs text-slate-500">Acesso Restrito</span>
              </div>
              <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0 ml-1">
                Entrar
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Botão de Hamburger Exclusivo para Mobile */}
      <button 
        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md absolute top-3 left-4 z-40 transition-colors"
        onClick={toggleSidebar}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay Escuro Móvel */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Física (Visível e Lateral no Desktop / Deslizante no Mobile) */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 shadow-xl md:shadow-none
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
