import { useEffect, useState } from "react";
import axios from "axios";

interface Article {
  title: string;
  description: string;
  publishedAt: string;
  url: string;
}

const stopWords = new Set([
  "і",
  "та",
  "на",
  "в",
  "з",
  "до",
  "що",
  "у",
  "як",
  "до",
  "не",
  "за",
  "по",
  "із",
  "для",
  "від",
  "а",
  "але",
  "до",
  "же",
  "якщо",
  "чи",
  "їх",
  "й",
  "бути",
  "я",
  "ти",
  "він",
  "вона",
  "ми",
  "ви",
  "вони",
  "це",
  "той",
  "такий",
  "тоді",
  "тому",
  "там",
  "тут",
  "ось",
  "який",
  "яка",
  "коли",
  "де",
  "хто",
  "що",
  "буде",
  "була",
  "був",
  "було",
  "ось",
  "своє",
  "про",
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "aren't",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "did",
  "didn't",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "hadn't",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he'd",
  "he'll",
  "he's",
  "her",
  "here",
  "here's",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "how's",
  "i",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "in",
  "into",
  "is",
  "isn't",
  "it",
  "it's",
  "its",
  "itself",
  "let's",
  "me",
  "more",
  "most",
  "mustn't",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "shan't",
  "she",
  "she'd",
  "she'll",
  "she's",
  "should",
  "shouldn't",
  "so",
  "some",
  "such",
  "than",
  "that",
  "that's",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "there's",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "wasn't",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "were",
  "weren't",
  "what",
  "what's",
  "when",
  "when's",
  "where",
  "where's",
  "which",
  "while",
  "who",
  "who's",
  "whom",
  "why",
  "why's",
  "with",
  "won't",
  "would",
  "wouldn't",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself",
  "yourselves",
]);

export const NewsFeed = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [keywords, setKeywords] = useState<{ word: string; count: number }[]>(
    []
  );

  useEffect(() => {
    axios
      .get(
        `https://newsapi.org/v2/top-headlines?country=us&sortBy=publishedAt&pageSize=10&apiKey=0b2bf527bcd242f996dc131033a773d8`
      )
      .then((response) => {
        setArticles(response.data.articles);

        const freqMap = extractKeywords(response.data.articles);
        // Сортуємо за кількістю
        const sorted = Object.entries(freqMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([word, count]) => ({ word, count }));

        setKeywords(sorted);
      })
      .catch((error) => console.error("Помилка завантаження новин:", error));
  }, []);

  function cleanText(text: string): string {
    // Видалити HTML-теги
    return text
      .replace(/<[^>]*>/g, "")
      .replace(/&[a-z]+;/gi, "")
      .toLowerCase();
  }

  function extractKeywords(articles: Article[]): { [key: string]: number } {
    const freqMap: { [key: string]: number } = {};

    articles.forEach(({ title, description }) => {
      const rawText = `${title} ${description || ""}`;
      const text = cleanText(rawText);

      // Розбиваємо на слова вручну
      const words = text
        .split(/\s+/)
        .map((w) => w.replace(/[^а-яіїєґa-z']/gi, ""))
        .filter(Boolean);

      words.forEach((word) => {
        if (!stopWords.has(word)) {
          freqMap[word] = (freqMap[word] || 0) + 1;
        }
      });
    });

    return freqMap;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Останні новини</h2>
      <ul>
        {articles.map((article, index) => (
          <li key={index} className="mb-4 border-b pb-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {article.title}
            </a>
            <p className="text-sm text-gray-600">{article.description}</p>
            <p className="text-xs text-gray-400">
              {new Date(article.publishedAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>

      <h3 className="text-lg font-semibold mt-8 mb-2">
        Популярні ключові слова:
      </h3>
      <ul className="list-disc list-inside">
        {keywords.map(({ word, count }) => (
          <li key={word}>
            {word} — {count} разів
          </li>
        ))}
      </ul>
    </div>
  );
};
