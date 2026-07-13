import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

/** Renders a plain-markdown chunk (no top-level fenced code — those are
 *  extracted upstream into CodeBlock/CodeTabs). Handles inline code, tables,
 *  lists, links, and any stray fenced block. */
export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children }) => <>{children}</>,
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          if (match) {
            return (
              <CodeBlock
                lang={match[1]}
                code={String(children).replace(/\n$/, "")}
              />
            );
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
