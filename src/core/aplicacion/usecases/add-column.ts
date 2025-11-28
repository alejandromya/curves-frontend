import type { FileRepoPort } from "../ports/fileRepositoryPort";
import type { Column } from "../../dominio/models/archivo";

export const addColumnUseCase = (repo: FileRepoPort) => {
  return async (): Promise<Column> => {
    const cols = await repo.listColumns();

    const newId = cols.length > 0 ? Math.max(...cols.map((c) => c.id)) + 1 : 1;

    const newColumn: Column = {
      id: newId,
      files: [],
    };

    const updated = [...cols, newColumn];

    await repo.setColumns(updated); // infraestructura lo guarda

    return newColumn;
  };
};

export const removeColumnUseCase = (repo: FileRepoPort) => {
  return async (colId: number): Promise<Column[]> => {
    const cols = await repo.listColumns();
    if (cols.length === 1) return cols;

    const newCols = cols.filter((c) => c.id !== colId);

    // Reenumerar
    const reenumeradas = newCols.map((c, index) => ({
      ...c,
      id: index + 1,
    }));

    await repo.setColumns(reenumeradas); // infraestructura lo guarda
    return reenumeradas;
  };
};
