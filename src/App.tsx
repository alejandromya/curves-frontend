import React, { useState } from "react";
import "./App.css";

const App: React.FC = () => {
  const [column1Files, setColumn1Files] = useState<File[]>([]);
  const [column2Files, setColumn2Files] = useState<File[]>([]);
  const [column3Files, setColumn3Files] = useState<File[]>([]);
  const [pico, setPico] = useState<number>(75);
  const [valle, setValle] = useState<number>(10);
  const [tolerancia, setTolerancia] = useState<number>(5);

  const [draggedFile, setDraggedFile] = useState<{
    file: File;
    fromColumn: number;
  } | null>(null);

  const handleFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    column: number
  ) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    switch (column) {
      case 1:
        setColumn1Files((prev) => [...prev, ...filesArray]);
        break;
      case 2:
        setColumn2Files((prev) => [...prev, ...filesArray]);
        break;
      case 3:
        setColumn3Files((prev) => [...prev, ...filesArray]);
        break;
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLLIElement>,
    file: File,
    fromColumn: number
  ) => {
    setDraggedFile({ file, fromColumn });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toColumn: number) => {
    e.preventDefault();
    if (!draggedFile) return;
    const { file, fromColumn } = draggedFile;

    if (fromColumn === toColumn) return;

    // Quitar de columna original
    switch (fromColumn) {
      case 1:
        setColumn1Files((files) => files.filter((f) => f !== file));
        break;
      case 2:
        setColumn2Files((files) => files.filter((f) => f !== file));
        break;
      case 3:
        setColumn3Files((files) => files.filter((f) => f !== file));
        break;
    }

    // Añadir a columna destino
    switch (toColumn) {
      case 1:
        setColumn1Files((files) => [...files, file]);
        break;
      case 2:
        setColumn2Files((files) => [...files, file]);
        break;
      case 3:
        setColumn3Files((files) => [...files, file]);
        break;
    }

    setDraggedFile(null);
  };

  const handleSend = async () => {
    if (
      column1Files.length === 0 &&
      column2Files.length === 0 &&
      column3Files.length === 0
    ) {
      alert("No has seleccionado ningún archivo");
      return;
    }

    const formData = new FormData();
    column1Files.forEach((file) =>
      formData.append("csv_files", file, file.name)
    );
    //column2Files.forEach((file) => formData.append("csv_files_col2", file, file.name));
    //column3Files.forEach((file) => formData.append("csv_files_col3", file, file.name));

    formData.append("pico", pico.toString());
    formData.append("valle", valle.toString());
    formData.append("toler", tolerancia.toString());

    try {
      const res = await fetch("http://192.168.1.49:5000/procesar_csv", {
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
      a.download = "INFORME_FINAL.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      alert("CSV procesados y PDF descargado correctamente!");
    } catch (error: any) {
      console.error(error);
      alert(`Fallo al enviar los archivos: ${error.message}`);
    }
  };

  const renderColumn = (files: File[], columnNumber: number) => (
    <div
      className="column"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, columnNumber)}
    >
      <label className="custom-file-upload">
        Informe {columnNumber}
        <input
          type="file"
          multiple
          onChange={(e) => handleFilesChange(e, columnNumber)}
          {...({ webkitdirectory: true, directory: true } as any)}
        />
      </label>
      <ul>
        {files.map((file) => (
          <li
            key={file.name}
            draggable
            onDragStart={(e) => handleDragStart(e, file, columnNumber)}
          >
            {(file as File & { webkitRelativePath?: string })
              .webkitRelativePath || file.name}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="container">
      <h1>Generador de Informes</h1>

      <div className="columns">
        {renderColumn(column1Files, 1)}
        {renderColumn(column2Files, 2)}
        {renderColumn(column3Files, 3)}
      </div>

      <div className="params">
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

      <button className="send-btn" onClick={handleSend}>
        Generar Informe
      </button>
    </div>
  );
};

export default App;
