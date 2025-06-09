import React, { useState, useMemo } from "react";
import { NewsList } from "../components/NewsList";
import { KeywordList } from "../components/KeywordList";
import { SentimentChart } from "../components/SentimentChart";
import { TrendChart } from "../components/TrendChart";
import { useNews } from "../hooks/useNews";
import { computeTopTermsByTfIdf, forecastTrends } from "../utils/textUtils";
import type { Article, SentimentResult, TrendPoint, Keyword } from "../types";

export const NewsFeed = () => {
  const { articles, sentiment, loading, error, from, setFrom, to } = useNews();

  const [pendingFrom, setPendingFrom] = useState<string>(from);
  const [filterKeyword, setFilterKeyword] = useState<string>("");
  const [filterSentiment, setFilterSentiment] = useState<
    "all" | "positive" | "neutral" | "negative"
  >("all");

  const fallbackDay = useMemo(() => {
    const availableDates = [
      ...new Set(articles.map((a) => a.publishedAt.slice(0, 10))),
    ].sort();
    return availableDates.includes(from)
      ? from
      : availableDates.length > 0
      ? availableDates[availableDates.length - 1]
      : from;
  }, [articles, from]);

  const strictDayArticles = useMemo<Article[]>(() => {
    return articles.filter((a) => a.publishedAt.slice(0, 10) === fallbackDay);
  }, [articles, fallbackDay]);

  const displayArticles = useMemo<Article[]>(() => {
    if (strictDayArticles.length > 0) return strictDayArticles;
    if (articles.length === 0) return [];
    const latestDate = articles[0].publishedAt.slice(0, 10);
    return articles.filter((a) => a.publishedAt.slice(0, 10) === latestDate);
  }, [articles, strictDayArticles]);

  const periodArticles = useMemo(() => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return articles.filter((a) => {
      const date = new Date(a.publishedAt);
      return date >= fromDate && date <= toDate;
    });
  }, [articles, from, to]);

  const dayKeywords: Keyword[] = useMemo(() => {
    if (strictDayArticles.length === 0) return [];
    const top = computeTopTermsByTfIdf(strictDayArticles, 5);
    return top.map(({ term, score }) => ({
      word: term,
      count: Math.round(score * 100) / 100,
    }));
  }, [strictDayArticles]);

  const periodKeywords: Keyword[] = useMemo(() => {
    if (periodArticles.length === 0) return [];
    const top = computeTopTermsByTfIdf(periodArticles, 5);
    return top.map(({ term, score }) => ({
      word: term,
      count: Math.round(score * 100) / 100,
    }));
  }, [periodArticles]);

  const filteredSentiment: SentimentResult[] = useMemo(() => {
    return strictDayArticles.map((a) => {
      const idx = articles.findIndex((x) => x.url === a.url);
      return sentiment[idx] ?? { score: 0, label: "neutral" };
    });
  }, [strictDayArticles, articles, sentiment]);

  const byKeyword = useMemo(() => {
    if (!filterKeyword) return displayArticles;
    const kw = filterKeyword.toLowerCase();
    return displayArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(kw) ||
        (a.description || "").toLowerCase().includes(kw)
    );
  }, [displayArticles, filterKeyword]);

  const filteredArticles = useMemo(() => {
    if (filterSentiment === "all") return byKeyword;
    return byKeyword.filter((a) => {
      const idx = articles.findIndex((x) => x.url === a.url);
      return sentiment[idx]?.label === filterSentiment;
    });
  }, [byKeyword, articles, sentiment, filterSentiment]);

  const actualTrends: TrendPoint[] = useMemo(() => {
    if (!periodKeywords.length) return [];
    const byDate: Record<string, string[]> = {};
    periodArticles.forEach(({ publishedAt, title, description }) => {
      const d = publishedAt.slice(0, 10);
      (byDate[d] ||= []).push(
        (title + " " + (description || "")).toLowerCase()
      );
    });
    const arr: TrendPoint[] = [];
    periodKeywords.forEach(({ word }) => {
      Object.entries(byDate).forEach(([d, texts]) => {
        const cnt = texts.reduce(
          (s, txt) => s + (txt.includes(word) ? 1 : 0),
          0
        );
        arr.push({ word, date: d, count: cnt });
      });
    });
    return arr;
  }, [periodArticles, periodKeywords]);

  const forecastedTrends = useMemo(() => {
    if (!actualTrends.length) return [];
    return forecastTrends(actualTrends, 7);
  }, [actualTrends]);

  const combinedTrends = useMemo<TrendPoint[]>(() => {
    const merged = [...actualTrends, ...forecastedTrends];
    const byWord: Record<string, TrendPoint[]> = {};
    merged.forEach((tp) => (byWord[tp.word] ||= []).push(tp));
    const res: TrendPoint[] = [];
    Object.entries(byWord).forEach(([w, pts]) => {
      pts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      if (pts.length === 1) {
        const only = pts[0];
        const d0 = new Date(only.date);
        d0.setDate(d0.getDate() - 1);
        res.push({ word: w, date: d0.toISOString().slice(0, 10), count: 0 });
      }
      pts.forEach((tp) => res.push(tp));
    });
    return res;
  }, [actualTrends, forecastedTrends]);

  const applyDate = () => setFrom(pendingFrom);

  if (loading) return <div className="p-4">Завантаження…</div>;
  if (error) return <div className="p-4 text-red-600">Помилка: {error}</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-4 items-end">
        <label className="flex items-center gap-2">
          З:
          <input
            type="date"
            className="border rounded p-1"
            value={pendingFrom}
            onChange={(e) => setPendingFrom(e.target.value)}
          />
        </label>
        <button
          onClick={applyDate}
          className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Застосувати
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Пошук за словом..."
          className="flex-1 border rounded p-1"
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
        />
        <select
          className="border rounded p-1"
          value={filterSentiment}
          onChange={(e) => setFilterSentiment(e.target.value as any)}
        >
          <option value="all">Всі тональності</option>
          <option value="positive">Позитивні</option>
          <option value="neutral">Нейтральні</option>
          <option value="negative">Негативні</option>
        </select>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">
            Популярні ключові слова (за {fallbackDay})
          </h3>
          <KeywordList keywords={dayKeywords} />
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            Тональність новин (за {fallbackDay})
          </h3>
          <SentimentChart data={filteredSentiment} />
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            Динаміка тем (факт + прогноз) з {from} по {to}
          </h3>
          <TrendChart data={combinedTrends} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold">Новини за {fallbackDay}</h2>
        <NewsList articles={filteredArticles} />
      </div>
    </div>
  );
};
