import React, { useState } from "react";
import "./App.css";  // estilos de App específicos

const App: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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

    try {
      const res = await fetch("http://localhost:5000/procesar_csv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Error al enviar los archivos");
      }

      const data: any = await res.json();
      alert("CSV enviados correctamente!");
      console.log(data);
    } catch (error) {
      console.error(error);
      alert("Fallo al enviar los archivos");
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