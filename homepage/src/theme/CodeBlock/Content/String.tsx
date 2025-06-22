import { usePrismTheme, useThemeConfig } from "@docusaurus/theme-common";
import {
  containsLineNumbers,
  parseCodeBlockTitle,
  parseLanguage,
  parseLines,
  useCodeWordWrap,
} from "@docusaurus/theme-common/internal";
import { Button } from "@site/src/components/ui/button";
import Container from "@theme/CodeBlock/Container";
import type { Props } from "@theme/CodeBlock/Content/String";
import clsx from "clsx";
import { Highlight, type Language } from "prism-react-renderer";
import Line from "@theme/CodeBlock/Line";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import copy from "copy-text-to-clipboard";
import { TbCheck, TbCopy } from "react-icons/tb";
// Prism languages are always lowercase
// We want to fail-safe and allow both "php" and "PHP"
// See https://github.com/facebook/docusaurus/issues/9012
function normalizeLanguage(language: string | undefined): string | undefined {
  return language?.toLowerCase();
}

export default function CodeBlockString({
  children,
  className: blockClassName = "",
  metastring,
  title: titleProp,
  showLineNumbers: showLineNumbersProp,
  language: languageProp,
}: Props): ReactNode {
  const {
    prism: { defaultLanguage, magicComments },
  } = useThemeConfig();
  const language = normalizeLanguage(
    languageProp ?? parseLanguage(blockClassName) ?? defaultLanguage
  );

  const prismTheme = usePrismTheme();
  const wordWrap = useCodeWordWrap();

  // 默认启用自动换行
  React.useEffect(() => {
    if (!wordWrap.isEnabled) {
      wordWrap.toggle();
    }
  }, []);

  // We still parse the metastring in case we want to support more syntax in the
  // future. Note that MDX doesn't strip quotes when parsing metastring:
  // "title=\"xyz\"" => title: "\"xyz\""
  const title = parseCodeBlockTitle(metastring) || titleProp;
  const [isCopied, setIsCopied] = useState(false);

  const { lineClassNames, code } = parseLines(children, {
    metastring,
    language,
    magicComments,
  });
  const copyTimeout = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copyTimeout.current), []);
  const showLineNumbers =
    showLineNumbersProp ?? containsLineNumbers(metastring);
  const handleCopyCode = useCallback(() => {
    copy(code);
    setIsCopied(true);
    copyTimeout.current = window.setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }, [code]);
  return (
    <Container
      as="div"
      className={clsx(
        blockClassName,
        language &&
          !blockClassName.includes(`language-${language}`) &&
          `language-${language}`,
        "!shadow-none !rounded-xl"
      )}
    >
      <div className="rounded-lg overflow-hidden shadow-none">
        <div className="px-2 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {language && (
              <span className="px-2 py-1 text-xs rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono">
                {language}
              </span>
            )}
            {title && (
              <div className="font-medium text-gray-500 dark:text-gray-300 text-sm">
                {title}
              </div>
            )}
          </div>
          <div className="flex items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyCode}
              className="flex items-center size-7 hover:bg-muted-foreground/20 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="复制代码"
            >
              {isCopied ? <TbCheck /> : <TbCopy />}
            </Button>
          </div>
        </div>
        <Highlight
          theme={prismTheme}
          code={code}
          language={(language ?? "text") as Language}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              tabIndex={0}
              ref={wordWrap.codeBlockRef}
              className={clsx(className, "!py-1 overflow-auto !mb-0")}
              style={style}
            >
              <code
                className={clsx(
                  "block font-mono text-sm",
                  showLineNumbers && "pl-12 relative"
                )}
              >
                {tokens.map((line, i) => (
                  <Line
                    key={i}
                    line={line}
                    getLineProps={getLineProps}
                    getTokenProps={getTokenProps}
                    classNames={lineClassNames[i]}
                    showLineNumbers={showLineNumbers}
                  />
                ))}
              </code>
            </pre>
          )}
        </Highlight>
      </div>
    </Container>
  );
}
