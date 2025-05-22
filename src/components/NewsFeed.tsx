import { useEffect, useState } from "react";
import axios from "axios";

interface Article {
  title: string;
  description: string;
  publishedAt: string;
  url: string;
}

export const NewsFeed = () => {
  const [articles, setArticles] = useState<Article[]>([]);

  const apiKey = "0b2bf527bcd242f996dc131033a773d8";
  const url = `https://newsapi.org/v2/everything?q=ukraine&language=uk&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;

  useEffect(() => {
    axios
      .get(url)
      .then((response) => setArticles(response.data.articles))
      .catch((error) => console.error("Помилка завантаження новин:", error));
  }, []);

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
    </div>
  );
};
