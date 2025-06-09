// src/services/newsAPI.ts
import axios from "axios";
import type { Article } from "../types";

const BASE_URL = "https://newsapi.org/v2";
const API_KEY = import.meta.env.VITE_NEWS_API_KEY;

// Приймаємо page і pageSize як числа
export async function fetchSourcesNews(
  sources: string,
  from?: string,
  to?: string,
  page: number = 1,
  pageSize: number = 50
): Promise<Article[]> {
  const params: Record<string, any> = {
    sources,
    language: "en",
    page,
    pageSize,
    apiKey: API_KEY,
  };
  if (from) params.from = from;
  if (to) params.to = to;

  const { data } = await axios.get<{ articles: Article[] }>(
    `${BASE_URL}/everything`,
    { params }
  );
  return data.articles;
}
