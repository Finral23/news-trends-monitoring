// src/components/TrendChart.tsx

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { TrendPoint } from "../types";

interface TrendChartProps {
  data: TrendPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  // Если нет данных, показываем сообщение
  if (!data || data.length === 0) {
    return <div className="text-gray-500">Немає даних для графіку</div>;
  }

  // Собираем уникальные даты и слова
  const datesSet = new Set<string>();
  const wordsSet = new Set<string>();
  data.forEach((tp) => {
    datesSet.add(tp.date);
    wordsSet.add(tp.word);
  });
  const dates = Array.from(datesSet).sort();
  const words = Array.from(wordsSet);

  // Формируем «широкий» формат: { date: "YYYY-MM-DD", word1: count, word2: count, ... }
  const chartData = dates.map((date) => {
    const entry: any = { date };
    data.forEach((tp) => {
      if (tp.date === date) {
        entry[tp.word] = tp.count;
      }
    });
    return entry;
  });

  // Цвета для линий (циклично)
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#d88484", "#84a4d8"];

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />

          {words.map((w, idx) => (
            <Line
              key={w}
              type="monotone"
              dataKey={w}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2}
              dot={false}
              name={w}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
