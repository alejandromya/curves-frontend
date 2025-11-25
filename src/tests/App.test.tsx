import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";
import { describe, test, expect } from "vitest";
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
