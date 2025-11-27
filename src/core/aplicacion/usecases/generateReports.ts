import type { ApiClientPort } from "../ports/apiClientPort";
import type { FileRepoPort } from "../ports/fileRepositoryPort";

type Params = {
  pico: number;
  valle: number;
  tolerancia: number;
  baseUrl: string;
};

export const generateReports = async (
  repo: FileRepoPort,
  api: ApiClientPort,
  params: Params
) => {
  const columns = await repo.listColumns();
  const pdfs: { colId: number; blob: Blob }[] = [];

  for (const col of columns) {
    if (col.files.length === 0) continue;

    const form = new FormData();
    form.append("pico", String(params.pico));
    form.append("valle", String(params.valle));
    form.append("toler", String(params.tolerancia));
    form.append("columna", String(col.id));

    for (const a of col.files) {
      if (a.file) form.append("csv_files", a.file, a.file.name);
    }

    const res = await api.postFormData(`${params.baseUrl}/procesar_csv`, form);
    if (!res.ok) throw new Error(`Error columna ${col.id}`);

    pdfs.push({ colId: col.id, blob: await res.blob() });
  }

  const excel = await api.get(`${params.baseUrl}/descargar_excel`);
  if (!excel.ok) throw new Error("Error Excel");

  return { pdfs, excelBlob: await excel.blob() };
};
