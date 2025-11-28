import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import { columns } from "../core/infraestructura/inMemoryFileRepo";

describe("Selección de archivos", () => {
  test("añade archivos en columna 1", () => {
    render(<App />);

    const input = screen.getByTestId("input-col-1");

    const file1 = new File(["contenido"], "archivo1.csv", {
      type: "text/csv",
    });

    fireEvent.change(input, {
      target: { files: [file1] },
    });

    expect(screen.getByText("archivo1.csv")).toBeInTheDocument();
  });

  test("añade 2 columnas y las eliminamnos reordenandolas", async () => {
    render(<App />);

    //Buscamos el Informe 1
    const informe1 = await screen.findByText("Informe 1");
    expect(informe1).toBeInTheDocument();

    // Añadir columna 2 (la app inicia con 1)
    await userEvent.click(await screen.findByText("+"));

    //Buscamos el Informe 2
    const informe2 = await screen.findByText("Informe 2");
    expect(informe2).toBeInTheDocument();

    // Añadir columna 3 (la app inicia con 1)
    await userEvent.click(await screen.findByText("+"));

    //Buscamos el Informe
    const informe3 = await screen.findByText("Informe 3");
    expect(informe3).toBeInTheDocument();

    //Buscamos el primer elemento que se llame -
    const botones = await screen.findAllByText("-");
    await userEvent.click(botones[0]);

    //Buscamos el Informe 1
    expect(informe1).toBeInTheDocument();
    expect(informe2).toBeInTheDocument();
  });
});

describe("App - envío de archivos 3 columnas (lógica corregida)", () => {
  beforeEach(() => {
    columns.length = 0;
    columns.push({ id: 1, files: [] });
    vi.resetAllMocks();
  });

  test("envía correctamente 3 columnas y realiza llamadas posteriores (Excel + limpieza)", async () => {
    // Preparamos mock para 5 respuestas en orden:
    // 1-3: POST procesar_csv -> PDF blobs
    // 4: GET descargar_excel -> Excel blob
    // 5: POST limpiar_carpetas -> ok true (sin body necesario)
    const mockFetch = vi.fn();
    // PDFs (3 veces)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        blob: () =>
          Promise.resolve(
            new Blob(["PDF_MOCK_COL1"], { type: "application/pdf" })
          ),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        blob: () =>
          Promise.resolve(
            new Blob(["PDF_MOCK_COL2"], { type: "application/pdf" })
          ),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        blob: () =>
          Promise.resolve(
            new Blob(["PDF_MOCK_COL3"], { type: "application/pdf" })
          ),
      } as Response)
      // Excel (GET)
      .mockResolvedValueOnce({
        ok: true,
        blob: () =>
          Promise.resolve(
            new Blob(["EXCEL_MOCK"], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            })
          ),
      } as Response)
      // limpiar_carpetas (POST) - la app ignora el body, con ok:true basta
      .mockResolvedValueOnce({
        ok: true,
      } as Response);

    globalThis.fetch = mockFetch as unknown as typeof fetch;

    render(<App />);

    // Crear archivos simulados
    const file1 = new File(["datos1"], "archivo1.csv", { type: "text/csv" });
    const file2 = new File(["datos2"], "archivo2.csv", { type: "text/csv" });
    const file3 = new File(["datos3"], "archivo3.csv", { type: "text/csv" });

    fireEvent.change(await screen.findByTestId("input-col-1"), {
      target: { files: [file1] },
    });
    // Añadir columna 2 (la app inicia con 1)
    fireEvent.click(await screen.findByText("+"));

    // Añadir archivos a cada columna por data-testid
    fireEvent.change(await screen.findByTestId("input-col-2"), {
      target: { files: [file2] },
    });

    // Añadir columna 3 (la app inicia con 1)
    fireEvent.click(await screen.findByText("+"));

    // Añadir archivos a cada columna por data-testid
    fireEvent.change(await screen.findByTestId("input-col-3"), {
      target: { files: [file3] },
    });

    // Cambiar parámetros usando los labels (Pico, Valle, Tolerancia)
    fireEvent.change(screen.getByLabelText(/Pico/i), {
      target: { value: "80" },
    });
    fireEvent.change(screen.getByLabelText(/Valle/i), {
      target: { value: "15" },
    });
    fireEvent.change(screen.getByLabelText(/Tolerancia/i), {
      target: { value: "7" },
    });

    // Click en Generar Informes (envía todas las columnas)
    fireEvent.click(screen.getByText(/Generar Informes/i));

    // Ahora esperamos que se hayan llamado 5 veces: 3 procesar_csv + 1 descargar_excel + 1 limpiar_carpetas
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(5));

    const llamadas = mockFetch.mock.calls;

    // --- Comprobaciones de las 3 primeras llamadas (procesar_csv) ---
    for (let i = 0; i < 3; i++) {
      const callUrl = llamadas[i][0] as string;
      const options = llamadas[i][1] as RequestInit;
      expect(callUrl).toContain("/procesar_csv"); // comprobamos endpoint
      expect(options.method).toBe("POST");
      const formData = options.body as FormData;
      // csv_files incluye el archivo correspondiente
      const files = Array.from(formData.getAll("csv_files")) as File[];
      const expectedName = `archivo${i + 1}.csv`;
      expect(files.map((f) => f.name)).toContain(expectedName);
      // parámetros
      expect(formData.get("pico")).toBe("80");
      expect(formData.get("valle")).toBe("15");
      expect(formData.get("toler")).toBe("7");
      // columna correcta
      expect(formData.get("columna")).toBe((i + 1).toString());
    }

    // --- Cuarta llamada: descargar_excel (GET) ---
    const callExcelUrl = llamadas[3][0] as string;
    const callExcelOptions = llamadas[3][1] as RequestInit | undefined;
    expect(callExcelUrl).toContain("/descargar_excel");
    // En tu App haces fetch(..., { method: "GET" })
    expect(callExcelOptions).toBeDefined();
    expect(callExcelOptions!.method).toBe("GET");

    // --- Quinta llamada: limpiar_carpetas (POST) ---
    const callCleanUrl = llamadas[4][0] as string;
    const callCleanOptions = llamadas[4][1] as RequestInit | undefined;
    expect(callCleanUrl).toContain("/limpiar_carpetas");
    expect(callCleanOptions).toBeDefined();
    expect(callCleanOptions!.method).toBe("POST");
  });
});
