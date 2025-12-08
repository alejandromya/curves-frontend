import React, { useState } from "react";
import "./App.css";
import { v4 as uuidv4 } from "uuid";
import type { Archivo, Column } from "./core/dominio/models/archivo";
import { Button } from "./ui/ButtonComponent";
import { Input } from "./ui/InputComponent";
import {
  addColumnUseCase,
  removeColumnUseCase,
} from "./core/aplicacion/usecases/columns";
import { inMemoryFileRepo } from "./core/infraestructura/inMemoryFileRepo";
import { CSVGraphViewer } from "./ui/CSVGraphViewer";

const URL_BACKEND = "https://curves-myjb.onrender.com/";

const App: React.FC = () => {
  const [draggedFile, setDraggedFile] = useState<{
    archivoId: string;
    fromColumn: number;
  } | null>(null);

  const [columns, setColumns] = useState<Column[]>([{ id: 1, files: [] }]);

  const [pico, setPico] = useState<number>(75);
  const [valle, setValle] = useState<number>(10);
  const [tolerancia, setTolerancia] = useState<number>(5);

  const [showGraph, setShowGraph] = useState(false);
  const [graphCSV, setGraphCSV] = useState<File | null>(null);
  const [serverData, setServerData] = useState<
    { x: number; y: number }[] | null
  >(null);

  const [loadingGraph, setLoadingGraph] = useState(false);

  // Función para abrir el visor de un CSV específico
  const handleGraphViewFile = async (file: File) => {
    setGraphCSV(file);
    setLoadingGraph(true); // Iniciamos carga

    // Enviar al backend
    const formData = new FormData();
    formData.append("csv_file", file);
    formData.append("columna", String(columns[0].id)); // opcional

    try {
      const res = await fetch(`${URL_BACKEND}/procesar_csv_bruto`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error procesando CSV en el servidor");

      const data = await res.json();
      const mapped = data.puntos.map((p: any) => ({
        x: p.Deformacion,
        y: p.Fuerza,
      }));
      setServerData(mapped);
    } catch (err) {
      console.error(err);
      setServerData(null);
    } finally {
      setLoadingGraph(false); // Terminamos carga
    }

    setShowGraph(true);
  };

  // =====================================================
  // Drag Start
  // =====================================================
  const handleDragStart = (archivoId: string, fromColumn: number) => {
    setDraggedFile({ archivoId, fromColumn });
  };

  // =====================================================
  // Drop
  // =====================================================
  const handleDrop = (toColumn: number) => {
    if (!draggedFile) return;

    const { archivoId, fromColumn } = draggedFile;
    if (fromColumn === toColumn) return;

    setColumns((cols) =>
      cols.map((col) => {
        if (col.id === fromColumn) {
          return { ...col, files: col.files.filter((a) => a.id !== archivoId) };
        } else if (col.id === toColumn) {
          const archivoMovido = cols
            .find((c) => c.id === fromColumn)!
            .files.find((a) => a.id === archivoId)!;

          return { ...col, files: [...col.files, archivoMovido] };
        }
        return col;
      })
    );

    setDraggedFile(null);
  };

  // =====================================================
  // Agregar archivos
  // =====================================================
  const handleFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    colId: number
  ) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const archivosNuevos: Archivo[] = filesArray.map((f) => ({
      id: uuidv4(),
      file: f,
      status: "pendiente",
    }));

    setColumns((cols) =>
      cols.map((c) =>
        c.id === colId ? { ...c, files: [...c.files, ...archivosNuevos] } : c
      )
    );
  };

  // =====================================================
  // Eliminar archivo
  // =====================================================

  const handleRemoveFile = (colId: number, archivoId: string) => {
    setColumns((cols) =>
      cols.map((c) =>
        c.id === colId
          ? { ...c, files: c.files.filter((a) => a.id !== archivoId) }
          : c
      )
    );
  };

  // =====================================================
  // Agregar columna REFACTORIADO
  // =====================================================
  const addColumn = addColumnUseCase(inMemoryFileRepo);
  const handleAddColumn = async () => {
    const newCol = await addColumn();
    setColumns((cols) => [...cols, newCol]);
  };

  // =====================================================
  // Eliminar columna REFACTORIZADO
  // =====================================================
  const removeColumn = removeColumnUseCase(inMemoryFileRepo);
  const handleRemoveColumn = async (colId: number) => {
    const cols = await removeColumn(colId);
    setColumns(cols);
  };

  // =====================================================
  // Enviar TODAS las columnas y generar Excel final
  // =====================================================
  const handleSendAll = async () => {
    const pdfBlobs: { colId: number; blob: Blob }[] = [];
    // 1️⃣ Generar PDFs de cada columna
    for (const col of columns) {
      if (col.files.length === 0) continue;

      const formData = new FormData();
      formData.append("pico", pico.toString());
      formData.append("valle", valle.toString());
      formData.append("toler", tolerancia.toString());
      formData.append("columna", col.id.toString());

      col.files.forEach((a) => {
        if (a.file) {
          formData.append("csv_files", a.file, a.file.name);
        }
      });

      try {
        const res = await fetch(`${URL_BACKEND}/procesar_csv`, {
          method: "POST",
          body: formData,
        });
        console.log(formData);

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Error al generar PDF");
        }

        const blob = await res.blob();
        pdfBlobs.push({ colId: col.id, blob });
        console.log(`PDF columna ${col.id} listo`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error desconocido";
        alert(`Error columna ${col.id}: ${message}`);
        return;
      }
    }

    // 2️⃣ Descargar PDFs
    pdfBlobs.forEach(({ colId, blob }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `INFORME_COL${colId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });

    // 3️⃣ Descargar Excel final
    try {
      const resExcel = await fetch(`${URL_BACKEND}/descargar_excel`, {
        method: "GET",
      });
      if (!resExcel.ok) throw new Error("Error al generar Excel");

      const excelBlob = await resExcel.blob();
      const urlExcel = window.URL.createObjectURL(excelBlob);
      const aExcel = document.createElement("a");
      aExcel.href = urlExcel;
      aExcel.download = "INFORME_TOTAL.xlsx";
      aExcel.click();
      window.URL.revokeObjectURL(urlExcel);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      alert(`Error al descargar Excel: ${message}`);
    }

    // 4️⃣ Limpiar carpetas en backend
    try {
      await fetch(`${URL_BACKEND}/limpiar_carpetas`, {
        method: "POST",
      });
      console.log("Carpetas limpiadas");
    } catch (e) {
      console.warn("No se pudo limpiar carpetas:", e);
    }
  };

  // =====================================================
  // Render
  // =====================================================
  return (
    <div className="container">
      <h1>Generador de Informes</h1>
      <Button className="add-column-btn" title="+" onClick={handleAddColumn} />
      <div className="columns-container">
        {columns.map((col) => (
          <div
            key={col.id}
            className="column-card"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
          >
            <div className="column-header">
              <span>Informe {col.id}</span>
              {columns.length > 1 && (
                <Button
                  className="remove-column-btn"
                  title="-"
                  onClick={() => handleRemoveColumn(col.id)}
                />
              )}
            </div>
            <label className="file-upload-label">
              Seleccionar CSVs
              <input
                type="file"
                multiple
                data-testid={`input-col-${col.id}`}
                accept=".csv"
                onChange={(e) => handleFilesChange(e, col.id)}
              />
            </label>
            <ul className="file-list">
              {col.files.map((archivo) => (
                <li
                  key={archivo.id}
                  className="file-item"
                  draggable
                  onDragStart={() => handleDragStart(archivo.id, col.id)}
                >
                  {/* 🔍 Lupa a la izquierda del nombre */}
                  <Button
                    className="view-file-btn"
                    title="🔍"
                    onClick={() =>
                      archivo.file && handleGraphViewFile(archivo.file)
                    }
                  />

                  <span>{archivo.file?.name}</span>
                  <Button
                    className="remove-file-btn"
                    title="-"
                    onClick={() => handleRemoveFile(col.id, archivo.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="params-container">
        <Input
          title="Pico"
          value={pico}
          onChange={(e) => setPico(+e.target.value)}
        />
        <Input
          title="Valle"
          value={valle}
          onChange={(e) => setValle(+e.target.value)}
        />
        <Input
          title="Tolerancia"
          value={tolerancia}
          onChange={(e) => setTolerancia(+e.target.value)}
        />
      </div>
      <Button
        className="send-btn"
        title="Generar Informes"
        onClick={handleSendAll}
      />
      {loadingGraph ? (
        <div className="spinner-overlay">
          <div className="spinner" />
        </div>
      ) : (
        showGraph &&
        serverData && (
          <CSVGraphViewer
            csvFile={graphCSV}
            serverData={serverData}
            onClose={() => setShowGraph(false)}
          />
        )
      )}
    </div>
  );
};

export default App;
