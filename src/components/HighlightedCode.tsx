import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import http from "react-syntax-highlighter/dist/esm/languages/prism/http";
import graphql from "react-syntax-highlighter/dist/esm/languages/prism/graphql";
import protobuf from "react-syntax-highlighter/dist/esm/languages/prism/protobuf";
import docker from "react-syntax-highlighter/dist/esm/languages/prism/docker";
import nginx from "react-syntax-highlighter/dist/esm/languages/prism/nginx";
import lua from "react-syntax-highlighter/dist/esm/languages/prism/lua";
import { usePreferences } from "../providers/PreferencesProvider";

// Register only the languages this course actually uses — keeps the bundle small.
const REGISTERED: Record<string, unknown> = {
  javascript,
  typescript,
  python,
  go,
  java,
  sql,
  bash,
  json,
  yaml,
  markup,
  http,
  graphql,
  protobuf,
  docker,
  nginx,
  lua,
};

for (const [name, lang] of Object.entries(REGISTERED)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SyntaxHighlighter.registerLanguage(name, lang as any);
}

/** Map our tab/language ids to the registered Prism language ids. */
const PRISM_LANG: Record<string, string> = {
  js: "javascript",
  javascript: "javascript",
  node: "javascript",
  nodejs: "javascript",
  ts: "typescript",
  typescript: "typescript",
  python: "python",
  py: "python",
  go: "go",
  golang: "go",
  java: "java",
  sql: "sql",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  json: "json",
  jsonc: "json",
  yaml: "yaml",
  yml: "yaml",
  html: "markup",
  xml: "markup",
  http: "http",
  graphql: "graphql",
  protobuf: "protobuf",
  proto: "protobuf",
  dockerfile: "docker",
  docker: "docker",
  nginx: "nginx",
  lua: "lua",
};

export function HighlightedCode({
  code,
  lang,
}: {
  code: string;
  lang: string;
}) {
  const { theme } = usePreferences();
  const language = PRISM_LANG[lang.toLowerCase()] ?? "text";

  return (
    <SyntaxHighlighter
      language={language}
      style={theme === "dark" ? oneDark : oneLight}
      customStyle={{
        margin: 0,
        padding: "1rem 1.1rem",
        background: "transparent",
        fontSize: "13.5px",
        lineHeight: 1.65,
      }}
      codeTagProps={{
        style: { fontFamily: "JetBrains Mono, ui-monospace, monospace" },
      }}
    >
      {code.replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
}
