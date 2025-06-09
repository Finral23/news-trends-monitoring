// src/hooks/useNews.ts

import { useState, useEffect } from "react";
import { fetchSourcesNews } from "../services/newsApi";
import {
  computeTopTermsByTfIdf,
  analyzeSentiment,
  forecastTrends,
} from "../utils/textUtils";
import type { Article, Keyword, SentimentResult, TrendPoint } from "../types";

function getDatesInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  let d = new Date(from);
  const end = new Date(to);
  while (d <= end) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function useNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [sentiment, setSentiment] = useState<SentimentResult[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [forecast, setForecast] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState<string>(() => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 7);
    return dt.toISOString().slice(0, 10);
  });

  const to = new Date().toISOString().slice(0, 10);
  const sources = "reuters,bloomberg,nbc-news"; // менше джерел = менше новин = більше днів охоплено

  useEffect(() => {
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const allArticles: Article[] = [];

        const dates = getDatesInRange(from, to);
        for (const date of dates) {
          const dayArticles = await fetchSourcesNews(
            sources,
            date,
            date,
            1,
            100
          );
          allArticles.push(...dayArticles);
        }

        setArticles(allArticles);

        const top = computeTopTermsByTfIdf(allArticles, 5);
        setKeywords(
          top.map(({ term, score }) => ({
            word: term,
            count: Math.round(score * 100) / 100,
          }))
        );

        setSentiment(
          allArticles.map((a) =>
            analyzeSentiment(`${a.title} ${a.description || ""}`)
          )
        );

        const byDate: Record<string, string[]> = {};
        allArticles.forEach(({ publishedAt, title, description }) => {
          const d = publishedAt.slice(0, 10);
          (byDate[d] ||= []).push(
            `${title} ${description || ""}`.toLowerCase()
          );
        });

        const actualTrends: TrendPoint[] = [];
        top.forEach(({ term }) => {
          Object.entries(byDate).forEach(([d, texts]) => {
            const cnt = texts.reduce(
              (sum, txt) => sum + (txt.includes(term) ? 1 : 0),
              0
            );
            actualTrends.push({ word: term, date: d, count: cnt });
          });
        });

        setTrends(actualTrends);
        setForecast(forecastTrends(actualTrends, 7));
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [from]);

  return {
    articles,
    keywords,
    sentiment,
    trends,
    forecast,
    loading,
    error,
    from,
    setFrom,
    to,
  };
}
