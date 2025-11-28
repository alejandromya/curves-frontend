import type { Column } from "../../dominio/models/archivo";

export type FileRepoPort = {
  listColumns: () => Promise<Column[]>;
  setColumns: (cols: Column[]) => Promise<void>;
};
