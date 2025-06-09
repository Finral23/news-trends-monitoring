// Стаття з NewsAPI
export interface Article {
  title: string;
  description: string;
  publishedAt: string;
  url: string;
}

// Ключове слово + кількість
export interface Keyword {
  word: string;
  count: number;
}

// Результат тонального аналізу однієї статті
export interface SentimentResult {
  score: number; // сума +1/-1
  label: "positive" | "neutral" | "negative";
  // за бажанням можна додати title або інші поля:
  title?: string;
}

export interface TrendPoint {
  word: string;
  date: string; // "2025-05-26"
  count: number;
}
