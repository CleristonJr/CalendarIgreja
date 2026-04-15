"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EventosSidebar from './EventosSidebar';
import EventCard from './EventCard';
import { X, Pencil, Users, Plus, Trash2, Repeat, ChevronLeft, ChevronRight } from 'lucide-react';
import { editarEvento } from '@/app/[igrejaSlug]/actions';
import DoxologiaEditor from '@/components/DoxologiaEditor';

interface PortalContainerProps {
  igreja: any;
  departamentos: any[];
  eventos: any[];
  user: any;
  slug: string;
  templatesDox?: any[];
}

export default function PortalContainer({ igreja, departamentos, eventos, user, slug, templatesDox = [] }: PortalContainerProps) {
  const router = useRouter();
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [departamentosSelecionados, setDepartamentosSelecionados] = useState<string[]>([]);
  
  // Estados para Popups
  const [popupDoxologiaOpen, setPopupDoxologiaOpen] = useState(false);
  const [eventoParaDoxologia, setEventoParaDoxologia] = useState<any>(null);
  
  const [popupEscaladosOpen, setPopupEscaladosOpen] = useState(false);
  const [eventoParaEscalados, setEventoParaEscalados] = useState<any>(null);

  // Estado do MODAL DE EDIÇÃO INLINE
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [modoEdicao, setModoEdicao] = useState<'single' | 'future'>('single');

  // Estado para convidados na edição
  const [convidadosList, setConvidadosList] = useState<any[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Estados para Slideshow
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const slideTimer = useRef<NodeJS.Timeout | null>(null);
  const slideshowRef = useRef<HTMLDivElement>(null);

  // Toggle Checkboxes da Sidebar
  const toggleDepartamento = (id: string) => {
    setDepartamentosSelecionados(prev => 
      prev.includes(id) ? prev.filter(deptId => deptId !== id) : [...prev, id]
    );
  };

  // Filtragem
  const eventosFiltrados = eventos.filter((evento) => {
    if (departamentosSelecionados.length === 0) return true;
    return departamentosSelecionados.includes(evento.extendedProps.departamento_id);
  });

  // Abrir modal de edição inline
  const openEditModal = (evento: any) => {
    setEditingEvento(evento);
    setConvidadosList(evento.extendedProps?.convidados || []);
    setModoEdicao('single');
    setGuestName('');
    setGuestPhone('');
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingEvento(null);
    setModoEdicao('single');
  };

  // Função para resetar timer de inatividade
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      if (!user && eventosFiltrados.length > 0) setSlideshowActive(true);
    }, 60000); // 1 minuto
  }, [user, eventosFiltrados.length]);

  // Função para iniciar timer de avanço de slide
  const startSlideTimer = useCallback(() => {
    if (slideTimer.current) clearInterval(slideTimer.current);
    slideTimer.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % eventosFiltrados.length);
    }, 5000); // 5 segundos
  }, [eventosFiltrados.length]);

  // Função para parar slideshow
  const stopSlideshow = () => {
    setSlideshowActive(false);
    if (slideTimer.current) clearInterval(slideTimer.current);
    if (document.fullscreenElement) document.exitFullscreen();
    resetInactivityTimer();
  };

  // Navegação manual
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % eventosFiltrados.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + eventosFiltrados.length) % eventosFiltrados.length);
  };

  // Funções de Convidados
  const handleAddGuest = () => {
    if (!guestName.trim()) return;
    const isAnsiao = user?.role === 'ansiao' || user?.role === 'superadmin';
    let myDeptName = departamentos?.find(d => d.id === user?.departamento_id)?.nome;
    if (!myDeptName) {
      if (isAnsiao && editingEvento?.extendedProps?.departamento_nome) {
        myDeptName = editingEvento.extendedProps.departamento_nome;
      } else {
        myDeptName = 'Geral';
      }
    }
    setConvidadosList(prev => [...prev, { nome: guestName.trim(), telefone: guestPhone.trim(), departamento_nome: myDeptName }]);
    setGuestName('');
    setGuestPhone('');
  };

  const handleRemoveGuest = (index: number) => {
    setConvidadosList(prev => prev.filter((_, i) => i !== index));
  };

  const toDateTimeLocal = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const ten = (i: number) => (i < 10 ? '0' : '') + i;
    return `${date.getFullYear()}-${ten(date.getMonth() + 1)}-${ten(date.getDate())}T${ten(date.getHours())}:${ten(date.getMinutes())}`;
  };

  // useEffect para timers e event listeners
  useEffect(() => {
    if (!user) {
      resetInactivityTimer();
      const handleActivity = () => resetInactivityTimer();
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('keydown', handleActivity);
      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        if (slideTimer.current) clearInterval(slideTimer.current);
      };
    }
  }, [user, resetInactivityTimer]);

  // useEffect para slideshow ativo
  useEffect(() => {
    if (slideshowActive) {
      startSlideTimer();
      if (slideshowRef.current) slideshowRef.current.requestFullscreen();
    } else {
      if (slideTimer.current) clearInterval(slideTimer.current);
    }
  }, [slideshowActive, startSlideTimer]);

  // Submit de edição
  async function handleEditSubmit(formData: FormData) {
    setEditLoading(true);
    formData.append('convidados_json', JSON.stringify(convidadosList));
    formData.append('modo_edicao', modoEdicao);

    try {
      await editarEvento(formData);
      closeEditModal();
      router.refresh();
    } catch (err: any) {
      alert("Erro ao editar: " + err.message);
    } finally {
      setEditLoading(false);
    }
  }

  // Agrupamento de convidados
  const groupGuestsByDept = (list: any[], fallbackOrg: string) => {
    const grouped: Record<string, any[]> = {};
    list.forEach(conv => {
      const dept = conv.departamento_nome || fallbackOrg || 'Geral';
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(conv);
    });
    return grouped;
  };

  // Permissão de edição sobre o evento sendo editado
  const isAnsiao = user?.role === 'ansiao' || user?.role === 'superadmin';
  const isOrganizadorEdit = editingEvento && (isAnsiao || (user?.role === 'lider' && user?.departamento_id === editingEvento?.extendedProps?.departamento_id));
  const isColaboradorEdit = editingEvento && user?.role === 'lider' && user?.departamento_id && (editingEvento?.extendedProps?.colaboradores_ids || []).includes(user?.departamento_id);

  // Renderização condicional para slideshow
  if (slideshowActive && eventosFiltrados.length > 0) {
    const eventoAtual = eventosFiltrados[currentSlide];
    return (
      <div ref={slideshowRef} className="fixed inset-0 bg-black z-[200] flex items-center justify-center" onClick={stopSlideshow}>
        <div className="relative w-full h-full flex items-center justify-center p-8">
          <button onClick={prevSlide} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-4 text-white">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <div className="max-w-4xl w-full">
            <EventCard 
              evento={eventoAtual} 
              onOpenDoxologia={() => {}} // Desabilitado no slideshow
              onOpenEscalados={() => {}} // Desabilitado no slideshow
              onEdit={() => {}} // Desabilitado no slideshow
              isVisitor={true}
              canEdit={false}
              slug={slug}
            />
          </div>
          <button onClick={nextSlide} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-4 text-white">
            <ChevronRight className="w-8 h-8" />
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {currentSlide + 1} / {eventosFiltrados.length}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      <EventosSidebar 
        igreja={{ nome: igreja.nome, slug: slug, logo_url: igreja.logo_url || null }}
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
            eventosFiltrados.map((evento) => {
              const isAnsiaoCheck = user?.role === 'ansiao' || user?.role === 'superadmin';
              const isOrganizador = isAnsiaoCheck || (user?.role === 'lider' && user?.departamento_id === evento.extendedProps?.departamento_id);
              const isColaborador = user?.role === 'lider' && user?.departamento_id && (evento.extendedProps?.colaboradores_ids || []).includes(user?.departamento_id);
              const canEdit = isOrganizador || Boolean(isColaborador);

              return (
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
                  onEdit={() => openEditModal(evento)}
                  isVisitor={!user}
                  canEdit={canEdit}
                  slug={slug}
                />
              )
            })
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

      {/* MODAL DE EDIÇÃO INLINE */}
      {editModalOpen && editingEvento && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="h-3 w-full shrink-0" style={{ backgroundColor: editingEvento.backgroundColor || '#4f46e5' }}></div>
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-white">
              <h2 className="text-xl font-bold flex items-center text-slate-800 tracking-tight">
                <Pencil className="w-5 h-5 mr-2 text-indigo-600" /> Edição de Evento
              </h2>
              <button disabled={editLoading} onClick={closeEditModal} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              <form action={handleEditSubmit} id="formEditPortal" className="space-y-4">
                <input type="hidden" name="evento_id" value={editingEvento.id} />
                <input type="hidden" name="slug" value={slug} />

                {!isOrganizadorEdit && isColaboradorEdit && (
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4 border border-blue-100">
                    <strong>Você é um Colaborador deste evento.</strong><br/>
                    Seus poderes de edição se limitam ao preenchimento da Lista de Convidados.
                  </div>
                )}

                {/* Campos do EVENTO GERAL */}
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Título do Evento *</label>
                    <input type="text" name="titulo" defaultValue={editingEvento.title} required 
                      disabled={!isOrganizadorEdit}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-indigo-600 bg-white disabled:bg-slate-100 disabled:text-slate-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Início *</label>
                      <input type="datetime-local" name="data_inicio" defaultValue={toDateTimeLocal(editingEvento.start)} required 
                        disabled={!isOrganizadorEdit}
                        className="w-full text-sm border border-slate-300 rounded-lg p-1.5 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Término *</label>
                      <input type="datetime-local" name="data_fim" defaultValue={editingEvento.end ? toDateTimeLocal(editingEvento.end) : ''} required 
                        disabled={!isOrganizadorEdit}
                        className="w-full text-sm border border-slate-300 rounded-lg p-1.5 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Dept. Organizador</label>
                    <select name="departamento_id" defaultValue={editingEvento.extendedProps?.departamento_id || ""}
                      disabled={!isAnsiao} 
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 outline-none disabled:bg-slate-100 disabled:text-slate-400">
                      <option value="">Geral</option>
                      {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                    </select>
                  </div>

                  {departamentos.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Colaboradores</label>
                      <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto p-2 border border-slate-300 rounded-lg bg-white opacity-80"
                           style={{ pointerEvents: !isOrganizadorEdit ? 'none' : 'auto' }}>
                        {departamentos.map(d => (
                          <label key={d.id} className="flex items-center space-x-1.5 text-xs text-slate-700">
                            <input type="checkbox" name="colaboradores_ids" value={d.id} 
                              defaultChecked={(editingEvento.extendedProps?.colaboradores_ids || []).includes(d.id)}
                              disabled={!isOrganizadorEdit}
                              className="rounded" />
                            <span className="truncate">{d.nome}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição</label>
                    <textarea name="descricao" rows={2} defaultValue={editingEvento.extendedProps?.descricao || ""} 
                      disabled={!isOrganizadorEdit}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 resize-none bg-white disabled:bg-slate-100 disabled:text-slate-400" />
                  </div>
                </div>

                {/* DOXOLOGIA EDITOR */}
                {isOrganizadorEdit && (
                  <DoxologiaEditor 
                    templates={templatesDox || []} 
                    doxologiaInicial={editingEvento.extendedProps?.doxologia_json || []}
                  />
                )}

                {/* GERENCIADOR DE CONVIDADOS */}
                <div className="p-3 border border-indigo-200 rounded-lg bg-indigo-50/50 space-y-3 mt-4">
                  <h4 className="text-sm font-bold text-indigo-900 border-b border-indigo-100 pb-1 mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-2" /> Gerenciar Lista de Convidados
                  </h4>
                  
                  <div className="bg-white p-3 rounded border border-indigo-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="block text-xs font-semibold text-indigo-800 mb-1">Novo Nome</label>
                        <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Ex: Ir. João Silva"
                          className="w-full text-sm border border-indigo-200 rounded-md p-2 outline-none focus:ring-2 focus:ring-indigo-600 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-800 mb-1">Telefone (Opcional)</label>
                        <input type="text" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGuest(); } }}
                          className="w-full text-sm border border-indigo-200 rounded-md p-2 outline-none focus:ring-2 focus:ring-indigo-600 bg-white" />
                      </div>
                    </div>
                    <button type="button" onClick={handleAddGuest} disabled={!guestName.trim()}
                      className="w-full flex items-center justify-center p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-bold rounded transition disabled:opacity-50">
                      <Plus className="w-4 h-4 mr-1" /> Adicionar à Lista
                    </button>
                  </div>

                  {/* Lista de convidados */}
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-indigo-900 mb-1 uppercase tracking-wider">Na Lista ({convidadosList.length})</p>
                    {convidadosList.length === 0 && (
                      <p className="text-xs text-slate-500 font-medium text-center py-2 italic">Nenhum convidado na lista ainda.</p>
                    )}
                    {convidadosList.map((conv, idx) => (
                      <div key={idx} className="flex flex-row items-center justify-between bg-white border border-indigo-100 p-2 rounded shadow-sm">
                        <div className="flex flex-col flex-1 overflow-hidden mr-2">
                          <span className="text-sm font-semibold text-slate-800 truncate">{conv.nome}</span>
                          {conv.telefone && <span className="text-xs text-slate-500 truncate">{conv.telefone}</span>}
                          {conv.departamento_nome && <span className="text-[10px] text-indigo-600 font-bold">{conv.departamento_nome}</span>}
                        </div>
                        <button type="button" onClick={() => handleRemoveGuest(idx)} title="Remover"
                           className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Escopo para Recorrentes */}
                {editingEvento.extendedProps?.recorrencia_id && isOrganizadorEdit && (
                  <div className="p-3 border border-amber-200 rounded-lg bg-amber-50 space-y-2">
                    <h4 className="text-sm font-bold text-amber-900 flex items-center">
                      <Repeat className="w-4 h-4 mr-2" /> Evento Recorrente — Escopo
                    </h4>
                    <div className="space-y-1.5">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="scope_ui" checked={modoEdicao === 'single'} onChange={() => setModoEdicao('single')} className="text-amber-600" />
                        <span className="text-sm text-amber-900">Somente este evento</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="scope_ui" checked={modoEdicao === 'future'} onChange={() => setModoEdicao('future')} className="text-amber-600" />
                        <span className="text-sm text-amber-900">Este e todos os futuros da série</span>
                      </label>
                    </div>
                  </div>
                )}

              </form>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button onClick={closeEditModal} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition text-sm">
                Cancelar
              </button>
              <button 
                disabled={editLoading}
                form="formEditPortal" 
                type="submit" 
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-sm disabled:opacity-50 flex items-center"
              >
                {editLoading ? 'Salvando...' : 'Salvar Tudo'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
