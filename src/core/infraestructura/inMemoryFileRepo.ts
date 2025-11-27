import type { FileRepoPort } from "../aplicacion/ports/fileRepositoryPort";

import type { Archivo, Column } from "../dominio/models/archivo";

let columns: Column[] = [{ id: 1, files: [] as Archivo[] }];

export const inMemoryFileRepo: FileRepoPort = {
  listColumns: async () => JSON.parse(JSON.stringify(columns)),
  setColumns: async (newCols) => {
    columns = newCols;
  },

  addFilesToColumn: async (colId, files) => {
    columns = columns.map((c) =>
      c.id === colId ? { ...c, files: [...c.files, ...files] } : c
    );
  },

  removeFile: async (colId, archivoId) => {
    columns = columns.map((c) =>
      c.id === colId
        ? { ...c, files: c.files.filter((f) => f.id !== archivoId) }
        : c
    );
  },

  moveFile: async (from, to, archivoId) => {
    const colFrom = columns.find((c) => c.id === from)!;
    const archivo = colFrom.files.find((f) => f.id === archivoId);
    if (!archivo) return;

    await inMemoryFileRepo.removeFile(from, archivoId);
    await inMemoryFileRepo.addFilesToColumn(to, [archivo]);
  },
};
