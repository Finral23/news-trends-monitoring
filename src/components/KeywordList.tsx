import type { Keyword } from "../types";

export function KeywordList({ keywords }: { keywords: Keyword[] }) {
  return (
    <ul className="list-disc list-inside">
      {keywords.map((k) => (
        <li key={k.word}>{k.word}</li>
      ))}
    </ul>
  );
}
