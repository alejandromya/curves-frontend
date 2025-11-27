import type { FileRepoPort } from "../ports/fileRepositoryPort";
import type { Column } from "../../dominio/models/archivo";

export const createAddColumnUseCase = (repo: FileRepoPort) => {
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
