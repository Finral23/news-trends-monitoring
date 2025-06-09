import type { Article } from "../types";

export function NewsList({ articles }: { articles: Article[] }) {
  return (
    <ul>
      {articles.map((a, i) => (
        <li key={i} className="mb-4 border-b pb-2">
          <a
            href={a.url}
            target="_blank"
            className="text-blue-600 hover:underline"
          >
            {a.title}
          </a>
          <p className="text-sm text-gray-600">{a.description}</p>
          <p className="text-xs text-gray-400">
            {new Date(a.publishedAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
