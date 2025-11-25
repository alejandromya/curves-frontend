import React, { useState } from "react";
import "./App.css";

interface Archivo {
  id: string;
  file: File;
  status?: "pendiente" | "procesando" | "procesado" | "error";
}

interface Column {
  id: number;
  files: Archivo[];
}

const App: React.FC = () => {
  const [draggedFile, setDraggedFile] = useState<{
    archivoId: string;
    fromColumn: number;
  } | null>(null);

  const [columns, setColumns] = useState<Column[]>([{ id: 1, files: [] }]);

  const [pico, setPico] = useState<number>(75);
  const [valle, setValle] = useState<number>(10);
  const [tolerancia, setTolerancia] = useState<number>(5);

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
      id: crypto.randomUUID(),
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
  // Agregar columna
  // =====================================================
  const handleAddColumn = () => {
    const newId =
      columns.length > 0 ? Math.max(...columns.map((c) => c.id)) + 1 : 1;
    setColumns((cols) => [...cols, { id: newId, files: [] }]);
  };

  // =====================================================
  // Eliminar columna
  // =====================================================
  const handleRemoveColumn = (colId: number) => {
    if (columns.length === 1) return;

    const newCols = columns.filter((c) => c.id !== colId);

    // Reenumerar
    const reenumeradas = newCols.map((c, index) => ({
      ...c,
      id: index + 1,
    }));

    setColumns(reenumeradas);
  };

  // =====================================================
  // Enviar UNA columna
  // =====================================================
  const handleSendColumn = async (col: Column) => {
    if (col.files.length === 0) return;

    const formData = new FormData();
    formData.append("pico", pico.toString());
    formData.append("valle", valle.toString());
    formData.append("toler", tolerancia.toString());
    formData.append("columna", col.id.toString());

    col.files.forEach((a) => formData.append("csv_files", a.file, a.file.name));

    try {
      const res = await fetch("http://192.168.1.47:5000/procesar_csv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al enviar archivos");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `INFORME_COL${col.id}.pdf`;

      a.click();
      window.URL.revokeObjectURL(url);

      console.log(`PDF columna ${col.id} descargado`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";

      alert(`Error columna ${col.id}: ${message}`);
    }
  };

  // =====================================================
  // Enviar TODAS las columnas
  // =====================================================
  const handleSendAll = async () => {
    for (const col of columns) {
      await handleSendColumn(col);
    }

    // await fetch("http://192.168.1.47:5000/limpiar_carpetas", {
    //   method: "POST",
    // });
  };

  // =====================================================
  // Render
  // =====================================================
  return (
    <div className="container">
      <h1>Generador de Informes</h1>

      <button className="add-column-btn" onClick={handleAddColumn}>
        +
      </button>

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
                <button
                  className="remove-column-btn"
                  onClick={() => handleRemoveColumn(col.id)}
                >
                  -
                </button>
              )}
            </div>

            <label className="file-upload-label">
              Seleccionar CSVs
              <input
                type="file"
                multiple
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
                  <span>{archivo.file.name}</span>

                  <button
                    className="remove-file-btn"
                    onClick={() => handleRemoveFile(col.id, archivo.id)}
                  >
                    -
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="params-container">
        <label>
          Pico:
          <input
            type="number"
            value={pico}
            onChange={(e) => setPico(+e.target.value)}
          />
        </label>
        <label>
          Valle:
          <input
            type="number"
            value={valle}
            onChange={(e) => setValle(+e.target.value)}
          />
        </label>
        <label>
          Tolerancia:
          <input
            type="number"
            value={tolerancia}
            onChange={(e) => setTolerancia(+e.target.value)}
          />
        </label>
      </div>

      <button className="send-btn" onClick={handleSendAll}>
        Generar Informes
      </button>
    </div>
  );
};

export default App;
