// src/utils/textUtils.ts

import type { Article, SentimentResult, TrendPoint } from "../types";
import Sentiment from "sentiment";
import { removeStopwords, eng, ukr, rus } from "stopword";

/**
 * Очищает HTML-теги и спецсимволы, возвращает строку в нижнем регистре.
 */
export function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, "")
    .toLowerCase();
}

/**
 * Токенизирует документ: разбивает по пробелу, убирает все символы кроме букв.
 */
function tokenize(doc: string): string[] {
  return cleanText(doc)
    .split(/\s+/)
    .map((w) => w.replace(/[^а-яіїєґa-z']/gi, ""))
    .filter(Boolean);
}

/**
 * Простая частотная модель: возвращает объект { слово: count } для всего массива articles.
 */
export function extractKeywords(articles: Article[]): Record<string, number> {
  const freq: Record<string, number> = {};
  articles.forEach(({ title, description }) => {
    const raw = cleanText(`${title} ${description || ""}`);
    const tokens = raw
      .split(/\s+/)
      .map((w) => w.replace(/[^а-яіїєґa-z']/gi, ""));
    // Убираем стоп-слова из русского, украинского и английского
    const filtered = removeStopwords(tokens, [...rus, ...eng, ...ukr]);
    filtered.forEach((w) => {
      if (w.length > 1) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });
  });
  return freq;
}

/**
 * Вычисляет TF-IDF для всего массива articles и возвращает топ-K терминов:
 * [{ term: "слово", score: 0.123 }, ...]
 */
export function computeTopTermsByTfIdf(
  articles: Article[],
  topK: number = 5
): { term: string; score: number }[] {
  const N = articles.length;
  const docsTokens = articles.map((a) => {
    // 1) Токенизируем
    const rawTokens = tokenize(`${a.title} ${a.description || ""}`);
    // 2) Убираем стоп-слова
    return removeStopwords(rawTokens, [...eng, ...ukr, ...rus]);
  });

  // 1) Считаем df: в скольких документах встречается термин
  const df: Record<string, number> = {};
  docsTokens.forEach((tokens) => {
    Array.from(new Set(tokens)).forEach((t) => {
      df[t] = (df[t] || 0) + 1;
    });
  });

  // 2) Считаем сумму tf-idf для каждого термина по всем документам
  const tfIdfSum: Record<string, number> = {};
  docsTokens.forEach((tokens) => {
    const len = tokens.length;
    const tfDoc: Record<string, number> = {};
    tokens.forEach((t) => {
      tfDoc[t] = (tfDoc[t] || 0) + 1;
    });
    Object.entries(tfDoc).forEach(([t, cnt]) => {
      const tf = cnt / len;
      const idf = Math.log(N / (df[t] || 1));
      const w = tf * idf;
      tfIdfSum[t] = (tfIdfSum[t] || 0) + w;
    });
  });

  // 3) Преобразуем в массив и выбираем топ-K по среднему TF-IDF (sum / N)
  return Object.entries(tfIdfSum)
    .map(([term, sum]) => ({ term, score: sum / N }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Определяет тональность текста через библиотеку sentiment.
 * Возвращает { score: number, label: "positive"|"negative"|"neutral" }.
 */
const analyzer = new Sentiment();
export function analyzeSentiment(text: string): SentimentResult {
  const { score } = analyzer.analyze(text);
  const label: SentimentResult["label"] =
    score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
  return { score, label };
}

/**
 * Линейная регрессия: по массиву точек (x_i, y_i) вычисляем a и b для y = a*x + b.
 */
function linearRegression(points: Array<[number, number]>): {
  a: number;
  b: number;
} {
  const N = points.length;
  if (N === 0) return { a: 0, b: 0 };

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
  points.forEach(([x, y]) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });
  const denom = N * sumXX - sumX * sumX;
  if (denom === 0) {
    // все x одинаковы ⇒ тренд постоянный
    return { a: 0, b: sumY / N };
  }
  const a = (N * sumXY - sumX * sumY) / denom;
  const b = (sumY - a * sumX) / N;
  return { a, b };
}

/**
 * forecastTrends принимает:
 *  - trends: массив TrendPoint вида { word, date, count } (date = "YYYY-MM-DD")
 *  - daysAhead: сколько следующих дней спрогнозировать
 *
 * Возвращает массив новых TrendPoint для тех же words, но на даты от (последняя дата + 1) до (last + daysAhead).
 */
export function forecastTrends(
  trends: TrendPoint[],
  daysAhead: number
): TrendPoint[] {
  // Группируем фактические точки по слову
  const byWord: Record<string, TrendPoint[]> = {};
  trends.forEach((tp) => {
    (byWord[tp.word] ||= []).push(tp);
  });

  const result: TrendPoint[] = [];

  Object.keys(byWord).forEach((word) => {
    const arr = byWord[word].slice();
    // Сортируем по дате
    arr.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    // Переводим дату в число дней от 1970-01-01
    const xys: Array<[number, number]> = arr.map((tp) => {
      const x = Math.floor(new Date(tp.date).getTime() / (1000 * 60 * 60 * 24));
      return [x, tp.count];
    });

    // Строим линейную регрессию
    const { a, b } = linearRegression(xys);

    // Берём последнюю дату из arr
    const lastDate = new Date(arr[arr.length - 1].date);

    // Для каждого i = 1..daysAhead строим прогнозную точку
    for (let i = 1; i <= daysAhead; i++) {
      const fut = new Date(lastDate);
      fut.setDate(fut.getDate() + i);

      const xFuture = Math.floor(fut.getTime() / (1000 * 60 * 60 * 24));
      let yPred = a * xFuture + b;
      if (yPred < 0) yPred = 0; // не допускаем отрицательных значений
      const count = Math.round(yPred);
      result.push({
        word,
        date: fut.toISOString().slice(0, 10),
        count,
      });
    }
  });

  return result;
}
