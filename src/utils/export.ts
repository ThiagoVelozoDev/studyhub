import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface HistoryExportRow {
  data: string;
  plano: string;
  disciplina: string;
  topico: string;
  horaInicio: string;
  horaFim: string;
  tempo: string;
}

const COLUMNS = ["Data", "Plano", "Disciplina", "Tópico", "Início", "Fim", "Tempo"];

export function exportHistoryToPdf(rows: HistoryExportRow[]) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Histórico de estudos", 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [COLUMNS],
    body: rows.map((r) => [r.data, r.plano, r.disciplina, r.topico, r.horaInicio, r.horaFim, r.tempo]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [74, 58, 167] },
  });
  doc.save("historico-estudos.pdf");
}

export function exportHistoryToExcel(rows: HistoryExportRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      Data: r.data,
      Plano: r.plano,
      Disciplina: r.disciplina,
      Tópico: r.topico,
      Início: r.horaInicio,
      Fim: r.horaFim,
      Tempo: r.tempo,
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico");
  XLSX.writeFile(workbook, "historico-estudos.xlsx");
}
