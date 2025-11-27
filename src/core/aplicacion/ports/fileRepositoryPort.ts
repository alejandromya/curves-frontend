import type { Archivo, Column } from "../../dominio/models/archivo";

export type FileRepoPort = {
  listColumns: () => Promise<Column[]>;
  setColumns: (cols: Column[]) => Promise<void>;
  addFilesToColumn: (colId: number, files: Archivo[]) => Promise<void>;
  removeFile: (colId: number, archivoId: string) => Promise<void>;
  moveFile: (from: number, to: number, archivoId: string) => Promise<void>;
};
