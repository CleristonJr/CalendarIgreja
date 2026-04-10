"use client";

import React, { useRef, useState } from 'react';
import { X, Clock, AlignLeft, Tag, Pencil, Trash2, CalendarCheck, Users, Phone, User as UserIcon, Plus, Repeat } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { editarEvento, deletarEvento } from "@/app/[igrejaSlug]/actions";
import DoxologiaEditor from "@/components/DoxologiaEditor";

export interface EventoFullCalendar {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: any;
}

interface CalendarioProps {
  eventos: EventoFullCalendar[];
  onDateSelect?: (selectInfo: any) => void;
  onEventClick?: (clickInfo: any) => void;
  isReadOnly?: boolean;
  userRole?: string;
  userDeptId?: string | null;
  slug?: string;
  departamentos?: any[];
  igreja_id?: string;
  membros?: any[];
  templatesDox?: any[];
  startEditEventoId?: string;
}

export default function Calendario({ 
  eventos, 
  onDateSelect, 
  onEventClick, 
  isReadOnly = true,
  userRole = 'visitante',
  userDeptId = null,
  slug = '',
  departamentos = [],
  igreja_id = '',
  membros = [],
  templatesDox = [],
  startEditEventoId
}: CalendarioProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modoEdicao, setModoEdicao] = useState<'single' | 'future'>('single');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estados para Gerenciar a Lista Temporária de Convidados
  const [convidadosList, setConvidadosList] = useState<any[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Auto-abre um evento contido via query params para edição imediata
  React.useEffect(() => {
    if (startEditEventoId && eventos.length > 0) {
      const eventoUrl = eventos.find(e => e.id === startEditEventoId);
      if (eventoUrl) {
        setEventoSelecionado({
          id: eventoUrl.id,
          title: eventoUrl.title,
          start: eventoUrl.start ? new Date(eventoUrl.start) : new Date(),
          end: eventoUrl.end ? new Date(eventoUrl.end) : null,
          extendedProps: eventoUrl.extendedProps
        });
        setConvidadosList(eventoUrl.extendedProps?.convidados || []);
        setIsEditing(true); // Abre direto na aba de gerenciar
      }
    }
  }, [startEditEventoId, eventos]);

  const isAnsiao = userRole === 'ansiao' || userRole === 'superadmin';

  const handleEventClick = (clickInfo: any) => {
    setEventoSelecionado(clickInfo.event);
    setConvidadosList(clickInfo.event.extendedProps?.convidados || []);
    setIsEditing(false);
    setModoEdicao('single');
    setShowDeleteConfirm(false);
    setGuestName('');
    setGuestPhone('');
    if (onEventClick) onEventClick(clickInfo);
  };

  const closeMenu = () => {
    setEventoSelecionado(null);
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setModoEdicao('single');
  };

  const handleAddGuest = () => {
    if (!guestName.trim()) return;
    
    // Identificar o nome do departamento que está adicionando o convidado
    let myDeptName = departamentos?.find(d => d.id === userDeptId)?.nome;
    if (!myDeptName) {
      if (isAnsiao && eventoSelecionado?.extendedProps?.departamento_nome) {
         myDeptName = eventoSelecionado.extendedProps.departamento_nome;
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

  // Avaliação de Contexto (Colaborador x Organizador)
  const isOrganizador = isAnsiao || (userRole === 'lider' && userDeptId === eventoSelecionado?.extendedProps?.departamento_id);
  const isColaborador = !isReadOnly && userRole === 'lider' && userDeptId && (eventoSelecionado?.extendedProps?.colaboradores_ids || []).includes(userDeptId);

  const canEdit = !isReadOnly && (isOrganizador || isColaborador);

  async function handleEditForm(formData: FormData) {
    setLoading(true);
    formData.append('convidados_json', JSON.stringify(convidadosList));
    formData.append('modo_edicao', modoEdicao);
    
    try {
      await editarEvento(formData);
      closeMenu();
    } catch(err: any) {
      alert("Erro ao editar: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(modo: 'single' | 'future') {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('evento_id', eventoSelecionado.id);
      fd.append('slug', slug);
      fd.append('modo_exclusao', modo);
      await deletarEvento(fd);
      closeMenu();
    } catch(err: any) {
      alert("Erro ao deletar: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const toDateTimeLocal = (date: Date) => {
    if (!date) return '';
    const ten = (i: number) => (i < 10 ? '0' : '') + i;
    return `${date.getFullYear()}-${ten(date.getMonth() + 1)}-${ten(date.getDate())}T${ten(date.getHours())}:${ten(date.getMinutes())}`;
  };

  // -------------------------------------------------------------
  // Helpers para agrupar convidados pelo Departamento
  // -------------------------------------------------------------
  const groupGuestsByDept = (list: any[], fallbackOrg: string) => {
    const grouped: Record<string, any[]> = {};
    list.forEach(conv => {
      const dept = conv.departamento_nome || fallbackOrg || 'Geral';
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(conv);
    });
    return grouped;
  };

  const renderVisualizacaoCardConvidados = () => {
    if (!eventoSelecionado?.extendedProps?.convidados?.length) return null;
    const fallbackOrg = eventoSelecionado.extendedProps.departamento_nome;
    const grouped = groupGuestsByDept(eventoSelecionado.extendedProps.convidados, fallbackOrg);

    return (
      <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 space-y-2 mt-4">
        <h4 className="text-sm font-bold text-amber-900 border-b border-amber-100 pb-1 mb-2 flex items-center">
          <Users className="w-4 h-4 mr-2" /> Lista de Convidados ({eventoSelecionado.extendedProps.convidados.length})
        </h4>
        <div className="space-y-3">
          {Object.entries(grouped).map(([dept, deptGuests]) => (
            <div key={dept}>
              <p className="text-[13px] font-bold text-amber-800 mb-1">Dep. {dept}:</p>
              <ul className="space-y-1.5 pl-2 border-l-2 border-amber-200">
                {deptGuests.map((conv: any, i: number) => (
                  <li key={i} className="flex flex-col">
                    <span className="text-sm font-semibold text-amber-950 flex items-center">
                      <UserIcon className="w-3.5 h-3.5 mr-1.5 opacity-60" /> {conv.nome}
                    </span>
                    {conv.telefone && <span className="text-xs text-amber-700 ml-5 font-medium">{conv.telefone}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGerenciadorConvidados = () => {
    const fallbackOrg = eventoSelecionado.extendedProps.departamento_nome;
    const grouped = groupGuestsByDept(convidadosList, fallbackOrg);

    // Para saber o index real e podermos deletar do array original de convidadosList
    // Damos um bypass map no convidadosList para achar o index original, mas já agrupado visualmente
    return (
      <div className="mt-3 space-y-3">
        <p className="text-xs font-semibold text-indigo-900 mb-1 uppercase tracking-wider">Na Lista ({convidadosList.length})</p>
        
        {Object.entries(grouped).map(([dept]) => (
           <div key={dept} className="space-y-2">
             <h5 className="text-[12px] font-bold text-indigo-800 bg-indigo-100/50 px-2 py-1 rounded inline-block">Dep. {dept}</h5>
             {convidadosList.map((conv, idx) => {
               const convDept = conv.departamento_nome || fallbackOrg || 'Geral';
               if (convDept !== dept) return null;
               
               return (
                 <div key={idx} className="flex flex-row items-center justify-between bg-white border border-indigo-100 p-2 rounded shadow-sm ml-2">
                   <div className="flex flex-col flex-1 overflow-hidden mr-2">
                     <span className="text-sm font-semibold text-slate-800 truncate">{conv.nome}</span>
                     {conv.telefone && <span className="text-xs text-slate-500 truncate">{conv.telefone}</span>}
                   </div>
                   <button type="button" onClick={() => handleRemoveGuest(idx)} title="Remover"
                      className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition shrink-0">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               );
             })}
           </div>
        ))}

        {convidadosList.length === 0 && (
          <p className="text-xs text-slate-500 font-medium text-center py-2 italic border-t border-indigo-50 mt-2">
            Nenhum convidado na lista ainda.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col custom-calendar">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        locale={ptBrLocale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
        initialView="dayGridMonth"
        editable={!isReadOnly}
        selectable={!isReadOnly}
        selectMirror={true}
        dayMaxEvents={true}
        views={{
          dayGridDay: {
            dayMaxEvents: false
          },
          dayGridWeek: {
            dayMaxEvents: false
          }
        }}
        weekends={true}
        events={eventos}
        select={onDateSelect}
        eventClick={handleEventClick}
        height="100%"
        eventDisplay="block"
        eventContent={(arg) => {
          if (arg.view.type === 'dayGridMonth') {
            return (
              <div className="p-1 px-1.5 w-full flex items-center shadow-sm rounded-sm bg-white border border-slate-100" 
                   style={{ borderLeftWidth: '3px', borderLeftColor: arg.event.backgroundColor || '#4f46e5' }}
                   title={arg.event.title}>
                <span className="font-semibold text-xs truncate text-slate-800">
                  {arg.timeText && <span className="text-slate-500 font-medium mr-1">{arg.timeText}</span>}
                  {arg.event.title}
                </span>
              </div>
            );
          }

          // Visões Semanais/Diárias: Card Sólido com as informações inclusas
          const startDate = arg.event.start;
          const endDate = arg.event.end;
          let timeString = arg.timeText;
          if (startDate && endDate) {
             const startFormat = new Date(startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' });
             const endFormat = new Date(endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' });
             timeString = `${startFormat} - ${endFormat}`;
          }

          const guests = arg.event.extendedProps?.convidados || [];
          const hasGuests = guests.length > 0;
          
          // Pegando informações cruciais
          const deptOrg = arg.event.extendedProps?.departamento_nome;
          const colab_ids = arg.event.extendedProps?.colaboradores_ids || [];
          const isDayView = arg.view.type === 'dayGridDay' || arg.view.type === 'listDay';

          const eventColor = arg.event.backgroundColor || '#4f46e5';

          return (
            <div className="w-full h-full flex flex-col p-2.5 box-border bg-white rounded-lg shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative group" style={{ minHeight: '100%' }}>
              {/* Tarja de cor indicativa na esquerda */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: eventColor }}></div>
              
              <div className="pl-2 flex flex-col h-full z-10">
                <div className="flex flex-col mb-2">
                  <h3 className="font-bold text-[14px] leading-tight text-slate-800 mb-0.5">
                    {arg.event.title}
                  </h3>
                  {timeString && (
                    <div className="flex items-center text-[12px] font-medium text-slate-500">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {timeString}
                    </div>
                  )}
                </div>

                <div className="mt-auto space-y-2">
                  {/* ORGANIZADOR & COLABORADORES */}
                  {(deptOrg || colab_ids.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {deptOrg && (
                        <span className="flex items-center bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                          <Tag className="w-2.5 h-2.5 mr-1" /> {deptOrg}
                        </span>
                      )}
                      
                      {colab_ids.map((cid: string) => {
                         const d = departamentos?.find(dept => dept.id === cid);
                         return d ? (
                           <span key={cid} className="flex items-center bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-100">
                             <Users className="w-2.5 h-2.5 mr-1" /> {d.nome}
                           </span>
                         ) : null;
                      })}
                    </div>
                  )}

                  {/* LISTA DE CONVIDADOS */}
                  {hasGuests && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div className="flex flex-col gap-2">
                        {Object.entries(groupGuestsByDept(guests, deptOrg)).map(([deptName, deptGuests]: [string, any]) => (
                          <div key={deptName} className="flex flex-col bg-slate-50 rounded-md border border-slate-100 overflow-hidden">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-1 uppercase tracking-wider">
                              Dep. {deptName}
                            </span>
                            <div className="px-2 py-1 flex flex-col gap-0.5">
                              {deptGuests.map((conv: any, idx: number) => (
                                <span key={idx} className="font-semibold text-[11px] text-slate-700 leading-tight">
                                  {conv.nome}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exibindo a Descrição se houver */}
                  {arg.event.extendedProps?.descricao && isDayView && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição</p>
                      <p className="text-[11px] font-medium text-slate-600 whitespace-pre-wrap leading-snug">
                        {arg.event.extendedProps.descricao}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }}
        buttonText={{
          today: 'Hoje',
          month: 'Mês',
          dayGridWeek: 'Semana',
          dayGridDay: 'Dia'
        }}
      />
      <style dangerouslySetInnerHTML={{__html: `
        .custom-calendar .fc { 
          --fc-border-color: #f1f5f9;
          --fc-button-text-color: #4f46e5;
          --fc-button-bg-color: #e0e7ff;
          --fc-button-border-color: transparent;
          --fc-button-hover-bg-color: #c7d2fe;
          --fc-button-hover-border-color: transparent;
          --fc-button-active-bg-color: #4f46e5;
          --fc-button-active-border-color: #4f46e5;
          --fc-button-active-text-color: #ffffff;
          --fc-today-bg-color: #f8fafc;
          height: 100%;
        }
        .custom-calendar .fc-toolbar-title { font-weight: 700; font-size: 1.25rem; color: #1e293b; text-transform: capitalize; }
        .custom-calendar .fc-header-toolbar { padding: 1.5rem 1.5rem 0.5rem; margin-bottom: 0 !important; }
        .custom-calendar .fc-view-harness { padding-bottom: 1rem; }
        .custom-calendar .fc-col-header-cell { padding: 10px 0; font-size: 0.875rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .custom-calendar .fc-daygrid-day-number { color: #475569; font-weight: 500; padding: 8px !important; text-decoration: none; }
        .custom-calendar .fc-event { border-radius: 4px; padding: 3px 6px; font-size: 0.75rem; font-weight: 600; border: none !important; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); transition: transform 0.1s ease; cursor: pointer; }
        
        .custom-calendar .fc-list-day-cushion { background-color: #f8fafc !important; }
        .custom-calendar .fc-list-event-title, .custom-calendar .fc-list-event-time { font-weight: 500; color: #334155; }
        .custom-calendar .fc-list-event:hover td { background-color: #f1f5f9; }
        .custom-calendar .fc-event:hover { transform: translateY(-1px); }
        .custom-calendar .fc-button-active { color: #ffffff !important; }

        /* Day View: eventos lado a lado em grid */
        .custom-calendar .fc-dayGridDay-view .fc-daygrid-day-events {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 8px !important;
          padding: 8px !important;
        }
        .custom-calendar .fc-dayGridDay-view .fc-daygrid-event-harness {
          margin: 0 !important;
          flex: 0 0 calc(50% - 4px);
          max-width: calc(50% - 4px);
        }
        @media (max-width: 640px) {
          .custom-calendar .fc-dayGridDay-view .fc-daygrid-event-harness {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }
      `}} />

      {eventoSelecionado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="h-3 w-full shrink-0" style={{ backgroundColor: eventoSelecionado.backgroundColor || '#4f46e5' }}></div>
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-white">
              <h2 className="text-xl font-bold flex items-center text-slate-800 tracking-tight">
                {isEditing ? (
                  <><Pencil className="w-5 h-5 mr-2 text-indigo-600" /> Edição de Evento</>
                ) : (
                  <><CalendarCheck className="w-5 h-5 mr-2 text-indigo-600" /> Detalhes do Evento</>
                )}
              </h2>
              <button disabled={loading} onClick={closeMenu} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {!isEditing ? (
                // ---------------------------
                // VISUALIZAÇÃO PURA
                // ---------------------------
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight mb-4">
                    {eventoSelecionado.title}
                  </h3>

                  <div className="flex items-center text-slate-600">
                    <Clock className="w-5 h-5 mr-3 text-slate-400 shrink-0" />
                    <span className="font-medium text-sm">
                      {new Date(eventoSelecionado.start).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
                      {eventoSelecionado.end && ` até ${new Date(eventoSelecionado.end).toLocaleTimeString('pt-BR', { timeStyle: 'short' })}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-slate-600">
                    <Tag className="w-5 h-5 mr-3 text-slate-400 shrink-0" />
                    <span className="font-medium text-sm">
                      Departamento Organizador: <span className="font-bold">{eventoSelecionado.extendedProps?.departamento_nome || 'Geral'}</span>
                    </span>
                  </div>

                  {eventoSelecionado.extendedProps?.colaboradores_ids?.length > 0 && (
                     <div className="flex items-start text-slate-600">
                       <Users className="w-5 h-5 mr-3 text-slate-400 shrink-0 mt-0.5" />
                       <div className="font-medium text-sm flex flex-wrap gap-1.5">
                         {eventoSelecionado.extendedProps.colaboradores_ids.map((colabId: string) => {
                            const d = departamentos?.find(dept => dept.id === colabId);
                            return d ? <span key={colabId} className="bg-slate-100 px-2 py-0.5 border border-slate-200 rounded text-xs">Apoio: {d.nome}</span> : null;
                         })}
                       </div>
                     </div>
                  )}

                  {renderVisualizacaoCardConvidados()}

                  {eventoSelecionado.extendedProps?.descricao && (
                    <div className="flex items-start text-slate-600 pt-3 border-t border-slate-100">
                      <AlignLeft className="w-5 h-5 mr-3 text-slate-400 shrink-0 mt-0.5" />
                      <div className="text-sm leading-relaxed whitespace-pre-wrap flex-1">
                        {eventoSelecionado.extendedProps.descricao}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // ---------------------------
                // MODO DE EDIÇÃO (FORMULÁRIO)
                // ---------------------------
                <form action={handleEditForm} id="formEdit" className="space-y-4">
                  <input type="hidden" name="evento_id" value={eventoSelecionado.id} />
                  <input type="hidden" name="slug" value={slug} />

                  {!isOrganizador && isColaborador && (
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4 border border-blue-100">
                      <strong>Você é um Colaborador deste evento.</strong><br/>
                      Seus poderes de edição se limitam ao preenchimento da Lista de Convidados para controle de acesso/recepção. O restante dos detalhes pertencem ao Organizador.
                    </div>
                  )}

                  {/* Campos do EVENTO GERAL (Só editável por organizadores) */}
                  <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Título do Evento *</label>
                      <input type="text" name="titulo" defaultValue={eventoSelecionado.title} required 
                        disabled={!isOrganizador}
                        className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-indigo-600 bg-white disabled:bg-slate-100 disabled:text-slate-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Início *</label>
                        <input type="datetime-local" name="data_inicio" defaultValue={toDateTimeLocal(eventoSelecionado.start)} required 
                          disabled={!isOrganizador}
                          className="w-full text-sm border border-slate-300 rounded-lg p-1.5 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Término *</label>
                        <input type="datetime-local" name="data_fim" defaultValue={eventoSelecionado.end ? toDateTimeLocal(eventoSelecionado.end) : ''} required 
                          disabled={!isOrganizador}
                          className="w-full text-sm border border-slate-300 rounded-lg p-1.5 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Dept. Organizador</label>
                      <select name="departamento_id" defaultValue={eventoSelecionado.extendedProps?.departamento_id || ""}
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
                             style={{ pointerEvents: !isOrganizador ? 'none' : 'auto' }}>
                          {departamentos.map(d => (
                            <label key={d.id} className="flex items-center space-x-1.5 text-xs text-slate-700">
                              <input type="checkbox" name="colaboradores_ids" value={d.id} 
                                defaultChecked={(eventoSelecionado.extendedProps?.colaboradores_ids || []).includes(d.id)}
                                disabled={!isOrganizador}
                                className="rounded" />
                              <span className="truncate">{d.nome}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição</label>
                      <textarea name="descricao" rows={2} defaultValue={eventoSelecionado.extendedProps?.descricao || ""} 
                        disabled={!isOrganizador}
                        className="w-full text-sm border border-slate-300 rounded-lg p-2 resize-none bg-white disabled:bg-slate-100 disabled:text-slate-400" />
                    </div>
                  </div>

                  {/* DOXOLOGIA EDITOR */}
                  {isOrganizador && (
                    <DoxologiaEditor 
                      templates={templatesDox || []} 
                      doxologiaInicial={eventoSelecionado.extendedProps?.doxologia_json || []}
                    />
                  )}

                  {/* GERENCIADOR DE LISTA DE CONVIDADOS */}
                  <div className="p-3 border border-indigo-200 rounded-lg bg-indigo-50/50 space-y-3 mt-4">
                    <h4 className="text-sm font-bold text-indigo-900 border-b border-indigo-100 pb-1 mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-2" /> Gerenciar Lista de Convidados
                    </h4>
                    
                    {/* Área de Criação */}
                    <div className="bg-white p-3 rounded border border-indigo-100 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                        <div>
                          <label className="block text-xs font-semibold text-indigo-800 mb-1">Novo Nome</label>
                          <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Ex: Ir. João Silva"
                            className="w-full text-sm border border-indigo-200 rounded-md p-2 outline-none focus:ring-2 focus:ring-indigo-600 bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-indigo-800 mb-1">Novo Telefone (Opcional)</label>
                          <input type="text" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddGuest();
                              }
                            }}
                            className="w-full text-sm border border-indigo-200 rounded-md p-2 outline-none focus:ring-2 focus:ring-indigo-600 bg-white" />
                        </div>
                      </div>
                      <button type="button" onClick={handleAddGuest} disabled={!guestName.trim()}
                        className="w-full flex items-center justify-center p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-bold rounded transition disabled:opacity-50">
                        <Plus className="w-4 h-4 mr-1" /> Adicionar à Lista
                      </button>
                    </div>

                    {renderGerenciadorConvidados()}

                  </div>

                  {/* Seletor de Escopo para Eventos Recorrentes */}
                  {eventoSelecionado.extendedProps?.recorrencia_id && isOrganizador && (
                    <div className="p-3 border border-amber-200 rounded-lg bg-amber-50 space-y-2">
                      <h4 className="text-sm font-bold text-amber-900 flex items-center">
                        <Repeat className="w-4 h-4 mr-2" /> Evento Recorrente — Escopo
                      </h4>
                      <div className="space-y-1.5">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="scope_ui"
                            checked={modoEdicao === 'single'}
                            onChange={() => setModoEdicao('single')}
                            className="text-amber-600 focus:ring-amber-600"
                          />
                          <span className="text-sm text-amber-900">Somente este evento</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="scope_ui"
                            checked={modoEdicao === 'future'}
                            onChange={() => setModoEdicao('future')}
                            className="text-amber-600 focus:ring-amber-600"
                          />
                          <span className="text-sm text-amber-900">Este e todos os futuros da série</span>
                        </label>
                      </div>
                    </div>
                  )}

                </form>
              )}
            </div>

            {/* Confirmação de Exclusão para Recorrentes */}
            {showDeleteConfirm && eventoSelecionado.extendedProps?.recorrencia_id ? (
              <div className="p-4 bg-red-50 border-t border-red-200 shrink-0 space-y-3">
                <p className="text-sm font-bold text-red-900 flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" /> Este evento faz parte de uma série semanal.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    disabled={loading}
                    onClick={() => handleDelete('single')}
                    className="flex-1 px-4 py-2.5 bg-white border border-red-200 text-red-700 font-bold rounded-lg hover:bg-red-100 transition text-sm disabled:opacity-50"
                  >
                    Excluir só este
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => handleDelete('future')}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
                  >
                    Este + todos os futuros
                  </button>
                </div>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-xs text-red-600 hover:underline">
                  Cancelar
                </button>
              </div>
            ) : showDeleteConfirm ? (
              <div className="p-4 bg-red-50 border-t border-red-200 shrink-0 space-y-3">
                <p className="text-sm font-bold text-red-900">Tem certeza que deseja excluir este evento permanentemente?</p>
                <div className="flex gap-2">
                  <button
                    disabled={loading}
                    onClick={() => handleDelete('single')}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
                  >
                    {loading ? 'Excluindo...' : 'Sim, excluir'}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition text-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  {canEdit && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition text-sm">
                      <Pencil className="w-4 h-4 mr-2" /> Editar / Gerenciar
                    </button>
                  )}
                  {canEdit && isEditing && (
                    <button onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition text-sm">
                      Cancelar Edição
                    </button>
                  )}

                  {canEdit && isOrganizador && (
                    <button 
                      disabled={loading} 
                      onClick={() => setShowDeleteConfirm(true)} 
                      title="Excluir" 
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition border border-red-100 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {!isEditing ? (
                   <button onClick={closeMenu} className="px-5 py-2 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition">
                     Fechar
                   </button>
                ) : (
                  <button 
                    disabled={loading}
                    form="formEdit" 
                    type="submit" 
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-sm disabled:opacity-50 flex items-center"
                  >
                    {loading ? 'Salvando...' : 'Salvar Tudo'}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
