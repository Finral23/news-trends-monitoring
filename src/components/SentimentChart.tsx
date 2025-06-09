// src/components/SentimentChart.tsx
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import type { SentimentResult } from "../types";

const COLORS = ["#4CAF50", "#FF9800", "#F44336"]; // позитив, нейтрально, негатив

export function SentimentChart({ data }: { data: SentimentResult[] }) {
  // Порахуємо скільки статей із кожною тональністю
  const counts = data.reduce((acc, { label }) => {
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Готуємо для recharts
  const chartData = (["positive", "neutral", "negative"] as const).map(
    (label, i) => ({
      name: label,
      value: counts[label] || 0,
      fill: COLORS[i],
    })
  );

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            dataKey="value"
            data={chartData}
            nameKey="name"
            label
            outerRadius={100}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
