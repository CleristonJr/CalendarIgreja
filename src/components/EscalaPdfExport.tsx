"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

type EventoPdf = {
  start: string;
  title: string;
  extendedProps?: {
    departamento_id?: string;
    colaboradores_ids?: string[];
    convidados?: Array<{ nome: string, departamento_nome?: string }>;
  };
};

type DepartamentoPdf = {
  id: string;
  nome: string;
};

type DepartamentoComEventos = {
  departamento: DepartamentoPdf;
  eventos: EventoPdf[];
};

interface EscalaPdfExportProps {
  departamentos: DepartamentoPdf[];
  eventosMes: EventoPdf[];
  mesAtual: number;
  anoAtual: number;
}

const mesesPtBr = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const diaSemanaPtBr = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function EscalaPdfExport({ departamentos, eventosMes, mesAtual, anoAtual }: EscalaPdfExportProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>(
    departamentos.map((d) => d.id)
  );

  const departamentosSelecionados = useMemo(
    () => departamentos.filter((dep) => selectedDeptIds.includes(dep.id)),
    [departamentos, selectedDeptIds]
  );

  const toggleDepartamento = (departamentoId: string) => {
    setSelectedDeptIds((prev) =>
      prev.includes(departamentoId)
        ? prev.filter((id) => id !== departamentoId)
        : [...prev, departamentoId]
    );
  };

  const formatarDia = (dateStr: string) => {
    const date = new Date(dateStr);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const diaSemana = diaSemanaPtBr[date.getDay()];
    return `${diaSemana}, ${dia}/${mes}`;
  };

  const gerarPdf = async () => {
    if (selectedDeptIds.length === 0) {
      alert("Selecione pelo menos um departamento para gerar o PDF.");
      return;
    }

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const leftMargin = 16;
    const rightMargin = 16;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - leftMargin - rightMargin;

    const eventosPorDepartamento: DepartamentoComEventos[] = departamentosSelecionados.map(
      (departamento) => {
        const eventos = eventosMes
          .filter((evento) => {
            const orgId = evento.extendedProps?.departamento_id;
            const cols = evento.extendedProps?.colaboradores_ids || [];
            return orgId === departamento.id || cols.includes(departamento.id);
          })
          .sort(
            (a, b) =>
              new Date(a.start).getTime() - new Date(b.start).getTime()
          );

        return {
          departamento,
          eventos
        };
      }
    );

    const formatarConvidados = (evento: any, depNome: string) => {
      const convidados = evento.extendedProps?.convidados || [];
      const nomes = convidados
        .filter((c: any) => c.departamento_nome === depNome)
        .map((convidado: any) => convidado.nome)
        .filter(Boolean);
      return nomes.length > 0 ? nomes.join("\n") : "Nenhum convidado";
    };

    const gerarCabecalho = (departamentoNome: string) => {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Escala de Convidados — ${departamentoNome}`,
        leftMargin,
        20,
        { maxWidth }
      );
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${mesesPtBr[mesAtual]} ${anoAtual}`,
        leftMargin,
        28,
        { maxWidth }
      );
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(leftMargin, 32, pageWidth - rightMargin, 32);
    };

    eventosPorDepartamento.forEach((item, index) => {
      if (index > 0) {
        doc.addPage();
      }

      gerarCabecalho(item.departamento.nome || "Departamento");
      let cursorY = 38;

      if (item.eventos.length === 0) {
        doc.setFontSize(11);
        doc.text(
          "Não há eventos agendados para este departamento no mês selecionado.",
          leftMargin,
          cursorY,
          { maxWidth }
        );
        return;
      }

      // Create one single table for all events
      const body = item.eventos.map((evento: EventoPdf) => [
        new Date(evento.start).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }),
        evento.title,
        formatarConvidados(evento, item.departamento.nome || "Departamento"),
      ]);

      autoTable(doc, {
        startY: cursorY,
        head: [["Data", "Evento", "Convidados"]],
        body,
        margin: { left: leftMargin, right: rightMargin },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
        },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 56 },
          2: { cellWidth: maxWidth - 22 - 60 },
        },
        theme: "striped",
      });
    });

    doc.save(
      `escala-${mesesPtBr[mesAtual].toLowerCase()}-${anoAtual}.pdf`
    );
    setModalAberto(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAberto(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 w-full sm:w-auto"
      >
        <Download className="w-4 h-4" />
        Exportar PDF
      </button>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">Download da Escala</h2>
              <p className="mt-1 text-sm text-slate-500">
                Selecione os departamentos que devem ser incluídos no PDF do mês.
              </p>
            </div>
            <div className="space-y-4 px-6 py-6 max-h-[60vh] overflow-y-auto">
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                O PDF será gerado com cada departamento em página separada. As seções trazem os eventos do mês organizados pela data e a lista de convidados.
              </div>

              <div className="grid gap-3">
                {departamentos.map((departamento) => (
                  <label
                    key={departamento.id}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDeptIds.includes(departamento.id)}
                      onChange={() => toggleDepartamento(departamento.id)}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <span className="text-sm font-medium text-slate-800">
                      {departamento.nome}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={gerarPdf}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
