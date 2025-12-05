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
  csvFile: File;
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
  onClose,
}) => {
  const [data, setData] = useState<CSVRow[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<CSVRow | null>(null);

  useEffect(() => {
    if (csvFile) {
      parseCSV(csvFile).then(setData);
    }
  }, [csvFile]);

  const handlePointClick = (e: any) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      setSelectedPoint(e.activePayload[0].payload);
    }
  };

  return (
    <div className="csv-graph-viewer">
      <div className="graph-header">
        <h2>Gráfico CSV</h2>
        <Button title="Cerrar" onClick={onClose} />
      </div>
      <LineChart
        width={700}
        height={400}
        data={data}
        onClick={handlePointClick}
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
          domain={["auto", "auto"]}
          tickCount={10}
        />

        <YAxis type="number" domain={["auto", "auto"]} />

        <Tooltip />
        <Line type="monotone" dataKey="y" stroke="#8884d8" dot={true} />
      </LineChart>
      q
      {selectedPoint && (
        <div className="selected-point">
          <h3>Punto seleccionado:</h3>
          <p>X: {selectedPoint.x}</p>
          <p>Y: {selectedPoint.y}</p>
        </div>
      )}
    </div>
  );
};
