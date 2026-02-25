import ReactMarkdown from "react-markdown";
import { TOS } from "../utils/constants/terms-of-service";

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen p-2">
      <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc ml-6 my-3 space-y-1">{children}</ul>
        ),
        li: ({ children }) => (
          <li className="text-base">{children}</li>
        ),
      }}>
        {TOS}
      </ReactMarkdown>
    </div>
  );
}