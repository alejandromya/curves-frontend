import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";

describe("Selección de archivos", () => {
  test("añade archivos en columna 1", () => {
    render(<App />);

    const input = screen.getByLabelText("Informe 1");

    const file1 = new File(["contenido"], "archivo1.csv", { type: "text/csv" });

    fireEvent.change(input, {
      target: { files: [file1] },
    });

    expect(screen.getByText("archivo1.csv")).toBeInTheDocument();
  });
});

describe("App - envío de archivos 3 columnas", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("envía correctamente 3 columnas en llamadas separadas", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () =>
        Promise.resolve(new Blob(["PDF_MOCK"], { type: "application/pdf" })),
    } as Response);

    globalThis.fetch = mockFetch;

    render(<App />);

    // Crear archivos simulados
    const file1 = new File(["datos1"], "archivo1.csv", { type: "text/csv" });
    const file2 = new File(["datos2"], "archivo2.csv", { type: "text/csv" });
    const file3 = new File(["datos3"], "archivo3.csv", { type: "text/csv" });

    // Añadir archivos a cada columna
    fireEvent.change(screen.getByLabelText(/Informe 1/i), {
      target: { files: [file1] },
    });
    fireEvent.change(screen.getByLabelText(/Informe 2/i), {
      target: { files: [file2] },
    });
    fireEvent.change(screen.getByLabelText(/Informe 3/i), {
      target: { files: [file3] },
    });

    // Cambiar parámetros
    fireEvent.change(screen.getByLabelText(/Pico/i), {
      target: { value: "80" },
    });
    fireEvent.change(screen.getByLabelText(/Valle/i), {
      target: { value: "15" },
    });
    fireEvent.change(screen.getByLabelText(/Tolerancia/i), {
      target: { value: "7" },
    });

    // Click en Generar Informe (envía las 3 columnas)
    fireEvent.click(screen.getByText(/Generar Informe/i));

    // Esperar a que se hayan llamado 3 veces
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));

    // Comprobar cada llamada
    const llamadas = mockFetch.mock.calls;

    // Columna 1
    let options = llamadas[0][1] as RequestInit;
    let formData = options.body as FormData;
    const col1Files = Array.from(formData.getAll("csv_files")) as File[];
    expect(col1Files.map((f) => f.name)).toContain("archivo1.csv");
    expect(formData.get("pico")).toBe("80");
    expect(formData.get("valle")).toBe("15");
    expect(formData.get("toler")).toBe("7");

    // Columna 2
    options = llamadas[1][1] as RequestInit;
    formData = options.body as FormData;
    const col2Files = Array.from(formData.getAll("csv_files")) as File[];
    expect(col2Files.map((f) => f.name)).toContain("archivo2.csv");

    // Columna 3
    options = llamadas[2][1] as RequestInit;
    formData = options.body as FormData;
    const col3Files = Array.from(formData.getAll("csv_files")) as File[];
    expect(col3Files.map((f) => f.name)).toContain("archivo3.csv");
  });
});
