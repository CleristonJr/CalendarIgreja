import React from 'react';
import { Pencil } from 'lucide-react';

interface EventCardProps {
  evento: any;
  onOpenDoxologia?: () => void;
  onOpenEscalados?: () => void;
  onEdit?: () => void;
  isVisitor?: boolean;
  canEdit?: boolean;
  slug?: string;
  slideshow?: boolean;
}

export default function EventCard({ evento, onOpenDoxologia, onOpenEscalados, onEdit, isVisitor = false, canEdit = false, slug = '', slideshow = false }: EventCardProps) {
  // Extrai Informações de Data Formatada
  const dateObj = new Date(evento.start || new Date());

  const diasDaSemana = ['DOMINGO', 'SEGUNDA FEIRA', 'TERÇA FEIRA', 'QUARTA FEIRA', 'QUINTA FEIRA', 'SEXTA FEIRA', 'SÁBADO'];
  const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

  const diaDaSemanaStr = diasDaSemana[dateObj.getDay()];
  const diaNum = String(dateObj.getDate()).padStart(2, '0');
  const mesStr = meses[dateObj.getMonth()];
  const displayDataText = `${diaNum} DE ${mesStr}`;
  const horaMinuto = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Cores dinâmicas para o gradiente de fallback caso não tenha imagem_url
  const hexCor = evento.backgroundColor || '#3b82f6';

  const imagemUrl = evento.extendedProps?.imagem_url;

  return (
    <div className={`w-full max-w-4xl bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow duration-300 flex flex-col md:flex-row overflow-hidden group ${slideshow ? 'min-w-[70vw]' : ''}`}>

      {/* BLOCO DA ESQUERDA (IMAGEM / BANNER) */}
      <div className="md:w-[45%] h-64 md:h-auto min-h-[300px] relative overflow-hidden flex items-center justify-center m-1.5 rounded-[20px]">
        {imagemUrl ? (
          <img src={imagemUrl} alt="Capa do Evento" className="w-full h-full object-cover rounded-[20px] filter brightness-95 group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center"
            style={{
              background: `linear-gradient(135deg, ${hexCor} 0%, #1e293b 100%)`
            }}
          >
            <span className="text-xl font-bold tracking-widest opacity-80 uppercase mb-2">Evento</span>
            <span className="text-5xl font-black mb-2">{diaNum}</span>
            <span className="text-2xl font-bold uppercase">{mesStr}</span>
            <span className="text-sm font-medium mt-6 bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
              {evento.extendedProps?.departamento_nome}
            </span>
          </div>
        )}
      </div>

      {/* BLOCO DA DIREITA (CONTEÚDO) */}
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between relative">
        {canEdit && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            title="Editar Evento"
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors z-10"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
        <div className="space-y-4">

          {/* HEADER DIREITO (Dia / Data / Hora) */}
          <div className="flex items-center mb-6">
            {evento.extendedProps?.departamento_imagem_url ? (
              <div className="mr-5 flex shrink-0 items-center justify-center">
                <img
                  src={evento.extendedProps.departamento_imagem_url}
                  alt="Ícone do Depto"
                  className="w-20 h-20 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full flex shrink-0 items-center justify-center mr-5" style={{ backgroundColor: hexCor + '15' }}>
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: hexCor }}></div>
              </div>
            )}
            <div className="flex flex-col justify-center">
              <h3 className="text-xl sm:text-[22px] font-bold text-slate-600 uppercase tracking-tight leading-none mb-1.5">
                {diaDaSemanaStr}
              </h3>
              <div className="text-xl sm:text-[22px] font-normal text-slate-500 uppercase tracking-tight leading-none">
                {displayDataText} <span className="text-slate-400 text-lg mx-1">•</span> {horaMinuto}
              </div>
            </div>
          </div>

          {/* TÍTULO & DESCRIÇÃO */}
          <div className="pt-2">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-3">
              {evento.title}
            </h2>
            <p className="text-[15px] font-medium text-slate-500 leading-relaxed max-w-lg line-clamp-4">
              {evento.extendedProps?.descricao || 'Nenhuma descrição detalhada disponível para este evento.'}
            </p>
          </div>

        </div>

        {/* BOTÕES DE AÇÃO */}
        {!isVisitor && (
          <div className="mt-8 flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={onOpenDoxologia}
              className="flex-1 min-w-[140px] px-6 py-3.5 bg-white text-slate-700 font-bold text-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] hover:text-slate-900 rounded-xl transition duration-300"
            >
              Doxologia
            </button>

            <button
              type="button"
              onClick={onOpenEscalados}
              className="flex-1 min-w-[140px] px-6 py-3.5 bg-white text-slate-700 font-bold text-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] hover:text-slate-900 rounded-xl transition duration-300"
            >
              Escala
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
