"use client";

import React, { useState } from 'react';
import EventosSidebar from './EventosSidebar';
import EventCard from './EventCard';
import { X } from 'lucide-react';

interface PortalContainerProps {
  igreja: any;
  departamentos: any[];
  eventos: any[];
  user: any;
  slug: string;
}

export default function PortalContainer({ igreja, departamentos, eventos, user, slug }: PortalContainerProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [departamentosSelecionados, setDepartamentosSelecionados] = useState<string[]>([]);
  
  // Estados para Popups
  const [popupDoxologiaOpen, setPopupDoxologiaOpen] = useState(false);
  const [eventoParaDoxologia, setEventoParaDoxologia] = useState<any>(null);
  
  const [popupEscaladosOpen, setPopupEscaladosOpen] = useState(false);
  const [eventoParaEscalados, setEventoParaEscalados] = useState<any>(null);

  // Toggle Checkboxes da Sidebar
  const toggleDepartamento = (id: string) => {
    setDepartamentosSelecionados(prev => 
      prev.includes(id) ? prev.filter(deptId => deptId !== id) : [...prev, id]
    );
  };

  // Filtragem
  const eventosFiltrados = eventos.filter((evento) => {
    // Se nenhum checkbox selecionado, exibe todos
    if (departamentosSelecionados.length === 0) return true;
    
    // Verifica se o evento tem esse departamento (no nosso modelo o extendedProps.departamento_id segura isso)
    return departamentosSelecionados.includes(evento.extendedProps.departamento_id);
  });

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      <EventosSidebar 
        igreja={{ nome: igreja.nome, slug: slug }}
        departamentos={departamentos}
        user={user}
        departamentosSelecionados={departamentosSelecionados}
        toggleDepartamento={toggleDepartamento}
        isOpen={isOpenMobile}
        setIsOpen={setIsOpenMobile}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 w-full h-full overflow-y-auto overflow-x-hidden relative">
        <div className="w-full max-w-4xl mx-auto py-10 px-4 md:px-8 flex flex-col items-center gap-8 md:gap-10">
          
          <div className="w-full mb-2">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Próximos Eventos</h1>
            <p className="text-slate-500 font-medium">Acompanhe as programações da {igreja.nome}</p>
          </div>

          {eventosFiltrados.length === 0 ? (
            <div className="w-full text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
                <span className="text-slate-400 font-bold block mb-2 text-lg">Nenhum evento agendado</span>
                <span className="text-slate-500 text-sm">Não há programações futuras correspondentes aos filtros selecionados.</span>
            </div>
          ) : (
            eventosFiltrados.map((evento) => (
              <EventCard 
                key={evento.id} 
                evento={evento} 
                onOpenDoxologia={() => {
                  setEventoParaDoxologia(evento);
                  setPopupDoxologiaOpen(true);
                }}
                onOpenEscalados={() => {
                  setEventoParaEscalados(evento);
                  setPopupEscaladosOpen(true);
                }}
              />
            ))
          )}
          
          <div className="h-10 w-full shrink-0"></div>
        </div>
      </main>

      {/* MODAL DOXOLOGIA */}
      {popupDoxologiaOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <button onClick={() => setPopupDoxologiaOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Doxologia do Culto</h2>
              <p className="text-slate-500 font-medium mb-6">Visualização para {eventoParaDoxologia?.title}</p>
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                {eventoParaDoxologia?.extendedProps?.doxologia_json && eventoParaDoxologia.extendedProps.doxologia_json.length > 0 ? (
                  <div className="relative border-l-2 border-indigo-100 ml-3 space-y-6">
                    {eventoParaDoxologia.extendedProps.doxologia_json.map((item: any, idx: number) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white shadow-sm"></div>
                        <div className="text-sm font-black text-indigo-600 tracking-wider mb-1">{item.hora}</div>
                        <div className="text-base font-semibold text-slate-800 leading-snug">{item.descricao}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-slate-400 font-bold block mb-1">Roteiro Indisponível</span>
                    <span className="text-slate-500 text-sm">Este evento não possui um cronograma litúrgico ou passo-a-passo cadastrado.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESCALADOS */}
      {popupEscaladosOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="shrink-0 p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Escalados</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">{eventoParaEscalados?.title}</p>
              </div>
              <button onClick={() => setPopupEscaladosOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {eventoParaEscalados?.extendedProps?.convidados && eventoParaEscalados.extendedProps.convidados.length > 0 ? (
                <ul className="space-y-3">
                  {eventoParaEscalados.extendedProps.convidados.map((c: any, index: number) => (
                    <li key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <div>
                         <span className="block font-bold text-slate-800">{c.nome}</span>
                         {c.telefone && <span className="block text-xs font-medium text-slate-500 mt-1">{c.telefone}</span>}
                       </div>
                       {c.departamento_nome && (
                         <span className="shrink-0 bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2 py-1 flex items-center justify-center rounded-lg uppercase tracking-wide">
                           {c.departamento_nome}
                         </span>
                       )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-10">
                  <span className="text-slate-400 font-bold block mb-1">Nenhum escalado.</span>
                  <span className="text-slate-500 text-sm">Não há convidados/escalados para este evento.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
