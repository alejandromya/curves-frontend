import { useState, useEffect } from "react";
import { inMemoryFileRepo } from "../core/infraestructura/inMemoryFileRepo";
import { fetchApiClient } from "../core/infraestructura/fetchApiClient";
import { generateReports } from "../core/aplicacion/usecases/generateReports";
import { v4 as uuid } from "uuid";
import type { Column } from "../core/dominio/models/archivo";

export const useAppController = () => {
  const [columns, setColumnsState] = useState<Column[]>([]);
  const [pico, setPico] = useState(75);
  const [valle, setValle] = useState(10);
  const [tolerancia, setTolerancia] = useState(5);

  const sync = async () => {
    const cols = await inMemoryFileRepo.listColumns();
    setColumnsState(cols);
  };

  useEffect(() => {
    sync();
  }, []);

  const addFiles = async (colId: number, files: FileList | null) => {
    if (!files) return;
    const mapped = Array.from(files).map((f) => ({
      id: uuid(),
      name: f.name,
      size: f.size,
      file: f,
      status: "pendiente",
    }));
    await inMemoryFileRepo.addFilesToColumn(colId, mapped as any);
    await sync();
  };

  const removeFile = async (colId: number, id: string) => {
    await inMemoryFileRepo.removeFile(colId, id);
    await sync();
  };

  const moveFile = async (from: number, to: number, id: string) => {
    await inMemoryFileRepo.moveFile(from, to, id);
    await sync();
  };

  const generate = async () => {
    const res = await generateReports(inMemoryFileRepo, fetchApiClient, {
      pico,
      valle,
      tolerancia,
      baseUrl: "http://192.168.1.50:5000",
    });

    res.pdfs.forEach(({ colId, blob }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `INFORME_COL${colId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });

    const urlExcel = URL.createObjectURL(res.excelBlob);
    const aEx = document.createElement("a");
    aEx.href = urlExcel;
    aEx.download = "INFORME_TOTAL.xlsx";
    aEx.click();
    URL.revokeObjectURL(urlExcel);
  };

  return {
    columns,
    pico,
    valle,
    tolerancia,
    setPico,
    setValle,
    setTolerancia,
    addFiles,
    removeFile,
    moveFile,
    generate,
  };
};
