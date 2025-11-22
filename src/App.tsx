import React, { useState } from "react";
import "./App.css";

const App: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pico, setPico] = useState<number>(75);
  const [valle, setValle] = useState<number>(10);
  const [tolerancia, setTolerancia] = useState<number>(5);

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setSelectedFiles(filesArray);
  };

  const handleSend = async () => {
    if (selectedFiles.length === 0) {
      alert("No has seleccionado ningún archivo");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("csv_files", file, file.name));

    // Agregar parámetros al FormData
    formData.append("pico", pico.toString());
    formData.append("valle", valle.toString());
    formData.append("toler", tolerancia.toString());

    try {
      const res = await fetch("http://localhost:5000/procesar_csv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al enviar los archivos");
      }

      // Descargar PDF directamente
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

  return (
    <div className="container">
      <h1>Seleccionar CSV</h1>

      <label className="custom-file-upload">
        Seleccionar carpeta
        <input
          type="file"
          multiple
          onChange={handleFolderChange}
          {...({ webkitdirectory: true, directory: true } as any)}
        />
      </label>

      <div className="params">
        <label>
          Pico:
          <input type="number" value={pico} onChange={(e) => setPico(Number(e.target.value))} />
        </label>
        <label>
          Valle:
          <input type="number" value={valle} onChange={(e) => setValle(Number(e.target.value))} />
        </label>
        <label>
          Tolerancia:
          <input type="number" value={tolerancia} onChange={(e) => setTolerancia(Number(e.target.value))} />
        </label>
      </div>

      <h2>Archivos detectados</h2>
      <ul id="fileList">
        {selectedFiles.map((file) => (
          <li key={file.name}>{(file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name}</li>
        ))}
      </ul>

      <button className="send-btn" onClick={handleSend}>
        Enviar al backend
      </button>
    </div>
  );
};

export default App;