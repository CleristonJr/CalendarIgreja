"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Users, Plus, Trash2, Save, AlertTriangle, Calendar, Clock, Tag } from 'lucide-react';
import { editarEvento } from '@/app/[igrejaSlug]/actions';
import EscalaPdfExport from '@/components/EscalaPdfExport';

interface EscalaContainerProps {
  eventos: any[];
  departamentos: any[];
  slug: string;
  userRole: string;
  userDeptId: string | null;
}

export default function EscalaContainer({ eventos, departamentos, slug, userRole, userDeptId }: EscalaContainerProps) {
  const router = useRouter();
  const now = new Date();
  const [mesAtual, setMesAtual] = useState(now.getMonth());
  const [anoAtual, setAnoAtual] = useState(now.getFullYear());
  
  // Estado dos convidados por evento (chave: evento.id)
  const [convidadosMap, setConvidadosMap] = useState<Record<string, any[]>>(() => {
    const map: Record<string, any[]> = {};
    eventos.forEach(e => {
      map[e.id] = e.extendedProps?.convidados || [];
    });
    return map;
  });

  // Estado de inputs temporários por evento
  const [inputsMap, setInputsMap] = useState<Record<string, { nome: string; telefone: string }>>({});
  
  // Controle de loading por evento
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  // Controle de "salvo" visual por evento
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  
  // Controle do salvamento em lote
  const [isSavingAll, setIsSavingAll] = useState(false);

  const mesesPtBr = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Eventos filtrados pelo mês/ano selecionado
  const eventosMes = useMemo(() => {
    return eventos.filter(e => {
      if (!e.start) return false;
      const d = new Date(e.start);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });
  }, [eventos, mesAtual, anoAtual]);

  // Navegação entre meses
  const irParaMesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  };

  const irParaProximoMes = () => {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  };

  // Funções de convidados
  const getInput = (eventoId: string) => inputsMap[eventoId] || { nome: '', telefone: '' };

  const setInput = (eventoId: string, field: 'nome' | 'telefone', value: string) => {
    setInputsMap(prev => {
      const current = prev[eventoId] || { nome: '', telefone: '' };
      return {
        ...prev,
        [eventoId]: { ...current, [field]: value }
      };
    });
  };

  const addGuest = (eventoId: string, evento: any) => {
    const input = getInput(eventoId);
    if (!input.nome.trim()) return;

    const isAnsiao = userRole === 'ansiao' || userRole === 'superadmin';
    let myDeptName = departamentos?.find(d => d.id === userDeptId)?.nome;
    if (!myDeptName) {
      if (isAnsiao && evento.extendedProps?.departamento_nome) {
        myDeptName = evento.extendedProps.departamento_nome;
      } else {
        myDeptName = 'Geral';
      }
    }

    setConvidadosMap(prev => ({
      ...prev,
      [eventoId]: [...(prev[eventoId] || []), { nome: input.nome.trim(), telefone: input.telefone.trim(), departamento_nome: myDeptName }]
    }));
    setInputsMap(prev => ({ ...prev, [eventoId]: { nome: '', telefone: '' } }));
    // Remove "salvo" status when editing
    setSavedMap(prev => ({ ...prev, [eventoId]: false }));
  };

  const removeGuest = (eventoId: string, index: number) => {
    setConvidadosMap(prev => ({
      ...prev,
      [eventoId]: (prev[eventoId] || []).filter((_, i) => i !== index)
    }));
    setSavedMap(prev => ({ ...prev, [eventoId]: false }));
  };

  // Salvar convidados de um evento
  const salvarConvidados = async (evento: any, autoRefresh = true) => {
    setSavingMap(prev => ({ ...prev, [evento.id]: true }));
    try {
      const fd = new FormData();
      fd.append('evento_id', evento.id);
      fd.append('slug', slug);
      fd.append('titulo', evento.title);
      fd.append('data_inicio', evento.start ? evento.start.substring(0, 16) : '');
      fd.append('data_fim', evento.end ? evento.end.substring(0, 16) : '');
      fd.append('departamento_id', evento.extendedProps?.departamento_id || '');
      fd.append('descricao', evento.extendedProps?.descricao || '');
      fd.append('convidados_json', JSON.stringify(convidadosMap[evento.id] || []));
      fd.append('modo_edicao', 'single');

      // Colaboradores
      (evento.extendedProps?.colaboradores_ids || []).forEach((cid: string) => {
        fd.append('colaboradores_ids', cid);
      });

      await editarEvento(fd);
      setSavedMap(prev => ({ ...prev, [evento.id]: true }));
      if (autoRefresh) router.refresh();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSavingMap(prev => ({ ...prev, [evento.id]: false }));
    }
  };

  const salvarTodos = async () => {
    setIsSavingAll(true);
    try {
      const modificados = eventosMes.filter(e => savedMap[e.id] === false);
      if (modificados.length === 0) {
        alert("Sem alterações pendentes para salvar.");
        setIsSavingAll(false);
        return;
      }
      
      const promises = modificados.map(e => salvarConvidados(e, false));
      await Promise.all(promises);
      
      router.refresh();
    } catch (e: any) {
      alert("Erro ao salvar a escala em lote.");
    } finally {
      setIsSavingAll(false);
    }
  };

  // Formatar data
  const formatarData = (dateStr: string) => {
    const d = new Date(dateStr);
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return {
      diaSemana: diasSemana[d.getDay()],
      dia: String(d.getDate()).padStart(2, '0'),
      hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Contadores
  const totalEventos = eventosMes.length;
  const eventosComConvidados = eventosMes.filter(e => (convidadosMap[e.id] || []).length > 0).length;
  const eventosSemConvidados = totalEventos - eventosComConvidados;

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Header com navegação de meses */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Escala Mensal</h2>
          <p className="text-slate-500 text-sm font-medium">
            Gerencie os convidados/escalados de cada evento do seu departamento.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            onClick={salvarTodos}
            disabled={isSavingAll}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            {isSavingAll ? "Salvando..." : "Salvar Tudo"}
          </button>
          
          <EscalaPdfExport
            departamentos={departamentos}
            eventosMes={eventosMes}
            mesAtual={mesAtual}
            anoAtual={anoAtual}
          />

          {/* Navegação de Mês */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl shadow-sm px-1 py-1">
            <button 
              onClick={irParaMesAnterior}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 py-1.5 min-w-[160px] text-center">
              <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                {mesesPtBr[mesAtual]} {anoAtual}
              </span>
            </div>
            <button 
              onClick={irParaProximoMes}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <span className="text-2xl font-black text-slate-800">{totalEventos}</span>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Eventos</p>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-4 text-center shadow-sm">
          <span className="text-2xl font-black text-green-600">{eventosComConvidados}</span>
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mt-1">Com Escala</p>
        </div>
        <div className={`bg-white border rounded-xl p-4 text-center shadow-sm ${eventosSemConvidados > 0 ? 'border-amber-200' : 'border-slate-200'}`}>
          <span className={`text-2xl font-black ${eventosSemConvidados > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{eventosSemConvidados}</span>
          <p className={`text-xs font-semibold uppercase tracking-wider mt-1 ${eventosSemConvidados > 0 ? 'text-amber-500' : 'text-slate-400'}`}>Sem Escala</p>
        </div>
      </div>

      {/* Lista de Eventos */}
      {eventosMes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-bold text-lg mb-1">Sem eventos neste mês</p>
          <p className="text-slate-500 text-sm">Navegue para outro mês usando os botões acima.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {eventosMes.map((evento) => {
            const convidados = convidadosMap[evento.id] || [];
            const input = getInput(evento.id);
            const isSaving = savingMap[evento.id] || false;
            const isSaved = savedMap[evento.id] || false;
            
            const myDeptName = departamentos?.find(d => d.id === userDeptId)?.nome;
            const convidadosVisiveis = convidados
               .map((c: any, originalIndex: number) => ({ ...c, originalIndex }))
               .filter((c: any) => userRole !== 'lider' || c.departamento_nome === myDeptName);

            const semConvidados = convidadosVisiveis.length === 0;
            const dateInfo = formatarData(evento.start);
            // Se for líder, usa a equipe do próprio líder. Se for ancião, usa a do organizador.
            const deptIdDaEquipe = (userRole === 'lider' && userDeptId) ? userDeptId : (evento.extendedProps?.departamento_id || userDeptId);
            const equipeDoDept = departamentos.find(d => d.id === deptIdDaEquipe)?.equipe_json || [];

            return (
              <div key={evento.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${semConvidados ? 'border-amber-200' : 'border-slate-200'}`}>
                
                {/* Header do Evento */}
                <div className="flex items-center gap-4 p-4 border-b border-slate-100">
                  {/* Indicador de Data */}
                  <div className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white font-bold"
                       style={{ backgroundColor: evento.backgroundColor || '#4f46e5' }}>
                    <span className="text-[10px] uppercase leading-none font-semibold opacity-80">{dateInfo.diaSemana}</span>
                    <span className="text-xl leading-none font-black">{dateInfo.dia}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-base truncate">{evento.title}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500 font-medium flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> {dateInfo.hora}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center">
                        <Tag className="w-3 h-3 mr-1" /> {evento.extendedProps?.departamento_nome}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Alerta se sem convidados */}
                    {semConvidados && (
                      <div className="flex items-center text-amber-500" title="Nenhum convidado escalado">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    )}
                    
                    {/* Badge de quantidade */}
                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${convidadosVisiveis.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                      <Users className="w-3 h-3 inline mr-1" />
                      {convidadosVisiveis.length}
                    </div>

                    {/* Botão Salvar */}
                    <button
                      onClick={() => salvarConvidados(evento)}
                      disabled={isSaving}
                      className={`p-2 rounded-lg transition text-sm font-bold flex items-center gap-1 ${
                        isSaved 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      } disabled:opacity-50`}
                      title="Salvar convidados"
                    >
                      <Save className="w-4 h-4" />
                      <span className="hidden sm:inline">{isSaving ? '...' : isSaved ? 'Salvo' : 'Salvar'}</span>
                    </button>
                  </div>
                </div>

                {/* Corpo - Convidados + Formulário */}
                <div className="p-4">
                  {/* Input de novo convidado */}
                  <div className="flex gap-2 mb-3">
                    {equipeDoDept.length > 0 && (
                      <select 
                        className="text-sm border border-slate-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-600 max-w-[140px]"
                        onChange={(e) => {
                          const idx = e.target.value;
                          if (idx) {
                             const pessoa = equipeDoDept[idx];
                             setInput(evento.id, 'nome', pessoa.nome);
                             setInput(evento.id, 'telefone', pessoa.telefone || '');
                             e.target.value = ""; // reseta o select
                          }
                        }}
                        defaultValue=""
                      >
                         <option value="" disabled>Equipe...</option>
                         {equipeDoDept.map((m: any, i: number) => (
                           <option key={i} value={i}>{m.nome}</option>
                         ))}
                      </select>
                    )}
                    <input
                      type="text"
                      placeholder="Nome do convidado"
                      value={input.nome}
                      onChange={e => setInput(evento.id, 'nome', e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addGuest(evento.id, evento); } }}
                      className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Telefone"
                      value={input.telefone}
                      onChange={e => setInput(evento.id, 'telefone', e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addGuest(evento.id, evento); } }}
                      className="w-36 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white hidden sm:block"
                    />
                    <button
                      type="button"
                      onClick={() => addGuest(evento.id, evento)}
                      disabled={!input.nome.trim()}
                      className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition disabled:opacity-40 shrink-0"
                      title="Adicionar"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Lista de Convidados */}
                  {convidadosVisiveis.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {convidadosVisiveis.map((conv: any) => (
                        <div key={conv.originalIndex} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 group hover:border-red-200 transition">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700">{conv.nome}</span>
                            {conv.telefone && <span className="text-[10px] text-slate-400">{conv.telefone}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeGuest(evento.id, conv.originalIndex)}
                            className="p-0.5 text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-2">Nenhum convidado do seu departamento.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
