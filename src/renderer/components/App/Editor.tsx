import MonacoEditor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback } from "react";

type Monaco = typeof import("monaco-editor");

const options: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 12,
  lineHeight: 18,
  fontFamily:
    '"Iosevka", "JetBrains Mono", "Fira Code", "SFMono-Regular", monospace',
  wordWrap: "on" as const,
  renderLineHighlight: "all" as const,
  roundedSelection: false,
  overviewRulerBorder: false,
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
  rulers: [80]
}

interface EditorProps {
  onSourceChange: (source: string) => void;
  className?: string;
}

export function Editor(props: EditorProps) {
  const { onSourceChange, className } = props;

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    const existing = monaco.languages
      .getLanguages()
      .some((language) => language.id === "typst");
    if (!existing) {
      monaco.languages.register({ id: "typst" });
      monaco.languages.setMonarchTokensProvider("typst", {
        tokenizer: {
          root: [
            [/\/\/.*/, "comment"],
            [/^(=\s+)(.+)$/, ["keyword", "type"]],
            [/\b(let|set|show|import|include|for|if|else|return)\b/, "keyword"],
            [/\b(true|false|none)\b/, "constant"],
            [/\b\d+(\.\d+)?(pt|mm|cm|in|%)?\b/, "number"],
            [/"[^"]*"/, "string"],
            [/#[a-zA-Z_][\w-]*/, "type"],
          ],
        },
      });
      monaco.languages.setLanguageConfiguration("typst", {
        comments: {
          lineComment: "//",
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
        ],
      });
    }

    const themeName = "plainsheet-light";
    monaco.editor.defineTheme(themeName, {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "7E7B74" },
        { token: "keyword", foreground: "C2410C", fontStyle: "bold" },
        { token: "type", foreground: "0F766E" },
        { token: "string", foreground: "7C3AED" },
        { token: "number", foreground: "A16207" },
        { token: "constant", foreground: "0E7490" },
      ],
      colors: {
        "editor.background": "#FFF9F4",
        "editor.lineHighlightBackground": "#F3EEE7",
        "editorLineNumber.foreground": "#9C948A",
        "editorLineNumber.activeForeground": "#5C554A",
        "editorCursor.foreground": "#1F1B16",
        "editorIndentGuide.background": "#E2D7C8",
        "editorIndentGuide.activeBackground": "#C9BBA8",
      },
    });
  }, []);

  const handleChange = useCallback((value: string | undefined) => {
    onSourceChange(value)
  }, [onSourceChange]);

  return (
    <div className={className}>
      <MonacoEditor
        height="100%"
        defaultLanguage="typst"
        defaultValue={''}
        theme="plainsheet-light"
        beforeMount={handleBeforeMount}
        onChange={handleChange}
        options={options}
      />
    </div>
  )
}
