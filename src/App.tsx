import React, { useState } from "react";
import "./App.css";

interface Column {
  id: number;
  files: File[];
}

const App: React.FC = () => {
  const [draggedFile, setDraggedFile] = useState<{
    file: File;
    fromColumn: number;
  } | null>(null);
  const [columns, setColumns] = useState<Column[]>([{ id: 1, files: [] }]);
  const [pico, setPico] = useState<number>(75);
  const [valle, setValle] = useState<number>(10);
  const [tolerancia, setTolerancia] = useState<number>(5);

  const handleDragStart = (file: File, fromColumn: number) => {
    setDraggedFile({ file, fromColumn });
  };

  const handleDrop = (toColumn: number) => {
    if (!draggedFile) return;
    const { file, fromColumn } = draggedFile;
    if (fromColumn === toColumn) return;

    setColumns((cols) =>
      cols.map((c) => {
        if (c.id === fromColumn) {
          return { ...c, files: c.files.filter((f) => f !== file) };
        } else if (c.id === toColumn) {
          return { ...c, files: [...c.files, file] };
        }
        return c;
      })
    );

    setDraggedFile(null);
  };

  const handleFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    colId: number
  ) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setColumns((cols) =>
      cols.map((c) =>
        c.id === colId ? { ...c, files: [...c.files, ...filesArray] } : c
      )
    );
  };

  const handleRemoveFile = (colId: number, file: File) => {
    setColumns((cols) =>
      cols.map((c) =>
        c.id === colId ? { ...c, files: c.files.filter((f) => f !== file) } : c
      )
    );
  };

  const handleAddColumn = () => {
    const newId =
      columns.length > 0 ? Math.max(...columns.map((c) => c.id)) + 1 : 1;
    setColumns((cols) => [...cols, { id: newId, files: [] }]);
  };

  const handleRemoveColumn = (colId: number) => {
    if (columns.length === 1) return; // mínimo 1 columna

    // Eliminar la columna
    const newCols = columns.filter((c) => c.id !== colId);

    // Reenumerar las columnas de 1 hasta newCols.length
    const reenumeradas = newCols.map((c, index) => ({
      ...c,
      id: index + 1,
    }));

    setColumns(reenumeradas);
  };

  const handleSendColumn = async (col: Column) => {
    if (col.files.length === 0) return;

    const formData = new FormData();
    formData.append("pico", pico.toString());
    formData.append("valle", valle.toString());
    formData.append("toler", tolerancia.toString());
    formData.append("columna", col.id.toString());

    col.files.forEach((file) => formData.append("csv_files", file, file.name));

    try {
      const res = await fetch("http://192.168.1.47:5000/procesar_csv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al enviar los archivos");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `INFORME_COL${col.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      console.log(`PDF columna ${col.id} descargado`);
    } catch (error: unknown) {
      if (error instanceof Error)
        alert(`Error columna ${col.id}: ${error.message}`);
      else alert(`Error desconocido columna ${col.id}`);
    }
  };

  const handleSendAll = async () => {
    for (const col of columns) {
      await handleSendColumn(col);
    }

    // Limpiar carpetas después de terminar todo
    await fetch("http://192.168.1.47:5000/limpiar_carpetas", {
      method: "POST",
    });
  };

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
              {col.files.map((file) => (
                <li
                  key={file.name}
                  className="file-item"
                  draggable
                  onDragStart={() => handleDragStart(file, col.id)}
                >
                  <span>{file.name}</span>
                  <button
                    className="remove-file-btn"
                    onClick={() => handleRemoveFile(col.id, file)}
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
            onChange={(e) => setPico(Number(e.target.value))}
          />
        </label>
        <label>
          Valle:
          <input
            type="number"
            value={valle}
            onChange={(e) => setValle(Number(e.target.value))}
          />
        </label>
        <label>
          Tolerancia:
          <input
            type="number"
            value={tolerancia}
            onChange={(e) => setTolerancia(Number(e.target.value))}
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
