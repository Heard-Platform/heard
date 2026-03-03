import ReactMarkdown from "react-markdown";

interface LegalDocumentRendererProps {
  content: string;
}

export function LegalDocumentRenderer({ content }: LegalDocumentRendererProps) {
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
          p: ({ children }) => <p className="mb-3">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc ml-6 my-3 space-y-1">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="text-base">{children}</li>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
