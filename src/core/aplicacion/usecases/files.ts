import type { Column } from "../../dominio/models/archivo";
import type { FileRepoPort } from "../ports/fileRepositoryPort";

export const addFileUseCase = (repo: FileRepoPort) => {
  return async (colId: number, archivoId: string): Promise<Column[]> => {
    const cols = await repo.listColumns();
    const newCols = cols.map((c) =>
      c.id === colId
        ? { ...c, files: c.files.filter((f) => f.id !== archivoId) }
        : c
    );
    return newCols;
  };
};
