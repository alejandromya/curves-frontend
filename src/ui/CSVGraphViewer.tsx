import React, { useEffect, useState } from "react";
import { Button } from "../ui/ButtonComponent";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface CSVRow {
  x: number;
  y: number;
}

interface CSVGraphViewerProps {
  csvFile: File | null;
  serverData?: CSVRow[] | null;
  onClose: () => void;
}

const parseCSV = async (file: File): Promise<CSVRow[]> => {
  const text = await file.text();
  const rows = text.trim().split(/\r?\n/);

  return rows.map((row) => {
    const [x, y] = row.split(",");
    return { x: parseFloat(x), y: parseFloat(y) };
  });
};

export const CSVGraphViewer: React.FC<CSVGraphViewerProps> = ({
  csvFile,
  serverData,
  onClose,
}) => {
  const [data, setData] = useState<CSVRow[]>([]);
  const [xMin, setXMin] = useState<number | undefined>();
  const [xMax, setXMax] = useState<number | undefined>();

  useEffect(() => {
    if (serverData && serverData.length > 0) {
      setData(serverData);
    } else if (csvFile) {
      parseCSV(csvFile).then(setData);
    }
  }, [csvFile, serverData]);

  // Datos filtrados según rango X
  const filteredData = data.filter(
    (d) =>
      (xMin === undefined || d.x >= xMin) && (xMax === undefined || d.x <= xMax)
  );

  // Dominio de Y
  const minY = Math.min(...filteredData.map((d) => d.y));
  const maxY = Math.max(...filteredData.map((d) => d.y));
  const yDomain: [number, number] = [minY, maxY];

  const formatNumber = (num: number) => num.toFixed(2);

  // --- Generación de ticks ---
  const generateTicks = (start: number, end: number, step: number) => {
    const ticks = [];
    for (let v = start; v <= end; v += step) ticks.push(Number(v.toFixed(5)));
    return ticks;
  };

  // Ticks cada 2 mm en X
  const xTicks =
    filteredData.length > 0
      ? generateTicks(
          xMin ?? filteredData[0].x,
          xMax ?? filteredData[filteredData.length - 1].x,
          2
        )
      : [];

  // Ticks cada 20 N en Y
  const yTicks = generateTicks(minY, maxY, 20);

  return (
    <div className="csv-graph-viewer">
      <div className="graph-header">
        <h2>Gráfico CSV</h2>
        <Button title="Cerrar" onClick={onClose} />
      </div>

      {/* Inputs de rango X */}
      <div style={{ marginBottom: 10 }}>
        <label>
          X1:{" "}
          <input
            type="number"
            step="0.01"
            value={xMin ?? ""}
            onChange={(e) =>
              setXMin(e.target.value ? parseFloat(e.target.value) : undefined)
            }
          />
        </label>

        <label style={{ marginLeft: 10 }}>
          X2:{" "}
          <input
            type="number"
            step="0.01"
            value={xMax ?? ""}
            onChange={(e) =>
              setXMax(e.target.value ? parseFloat(e.target.value) : undefined)
            }
          />
        </label>
      </div>

      <LineChart
        width={800}
        height={400}
        data={filteredData}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        style={{
          userSelect: "none",
          background: "#fafafa",
          borderRadius: "12px",
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis
          dataKey="x"
          type="number"
          domain={[xMin ?? "dataMin", xMax ?? "dataMax"]}
          ticks={xTicks}
          tickFormatter={formatNumber}
        />

        <YAxis
          dataKey="y"
          type="number"
          domain={yDomain}
          ticks={yTicks}
          tickFormatter={formatNumber}
        />

        <Tooltip formatter={(value: number) => value.toFixed(2)} />

        <Line
          type="monotone"
          dataKey="y"
          stroke="#8884d8"
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
};
