"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { openAnnotationDialog } from "@/components/docs/annotation-sheet";

type HighlightNote = {
  id: string;
  selection: string;
  selectorRegex: string | null;
  path: string;
};

type AnnotationHighlightsProps = {
  path?: string;
  children: React.ReactNode;
};

export function AnnotationHighlights({
  path,
  children,
}: AnnotationHighlightsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [notes, setNotes] = useState<HighlightNote[]>([]);

  const clearHighlights = useCallback((root: HTMLElement | null) => {
    if (!root) return;
    const spans = Array.from(
      root.querySelectorAll<HTMLElement>(
        "span[data-annotation-highlight='true']"
      )
    );
    spans.forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });
  }, []);

  const highlightNotes = useCallback(
    (root: HTMLElement | null, items: HighlightNote[]) => {
      if (!root || !items.length) return;
      clearHighlights(root);

      const wrapRange = (range: Range, note: HighlightNote) => {
        const span = document.createElement("span");
        span.dataset.annotationHighlight = "true";
        span.className =
          "underline decoration-dotted decoration-2 decoration-primary/70 cursor-pointer hover:bg-primary/10";
        span.onclick = () =>
          openAnnotationDialog({ text: note.selection, path: note.path });
        range.surroundContents(span);
      };

      items.forEach((note) => {
        const selectionStr =
          typeof note.selection === "string" ? note.selection : "";
        const patternStr =
          typeof note.selectorRegex === "string" &&
          note.selectorRegex.length > 0
            ? note.selectorRegex
            : selectionStr;
        if (!patternStr) return;

        let regex: RegExp | null = null;
        try {
          regex = new RegExp(patternStr);
        } catch {
          regex = null;
        }

        const matcher = (text: string) => {
          if (regex) return text.match(regex);
          const idx = text.indexOf(selectionStr);
          return idx >= 0
            ? { index: idx, 0: selectionStr, length: selectionStr.length }
            : null;
        };

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

        let currentNode = walker.currentNode as Text | null;
        while (currentNode) {
          const text =
            typeof currentNode.data === "string" ? currentNode.data : "";
          if (!text) {
            currentNode = walker.nextNode() as Text | null;
            continue;
          }
          const match = matcher(text);
          if (match && typeof match.index === "number") {
            const start = match.index;
            const end = start + (match[0]?.length ?? selectionStr.length);
            const range = document.createRange();
            range.setStart(currentNode, start);
            range.setEnd(currentNode, end);
            wrapRange(range, note);
            break; // 只包裹第一个匹配
          }
          currentNode = walker.nextNode() as Text | null;
        }
      });
    },
    [clearHighlights]
  );

  useEffect(() => {
    let canceled = false;
    const resolvedPath =
      path ??
      (typeof window !== "undefined" ? window.location.pathname : undefined);
    if (!resolvedPath) return;

    fetch(`/api/annotations/notes?path=${encodeURIComponent(resolvedPath)}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (canceled) return;
        const rows = Array.isArray(data?.notes) ? data.notes : [];
        const unique = new Map<string, HighlightNote>();
        rows.forEach((item: any) => {
          const selection =
            typeof item?.selection === "string" ? item.selection : "";
          const selectorRegex =
            typeof item?.selectorRegex === "string" &&
            item.selectorRegex.length > 0
              ? item.selectorRegex
              : null;
          const key = `${item?.path ?? ""}::${selectorRegex ?? selection}`;
          if (!selection) return;
          if (!unique.has(key)) {
            unique.set(key, {
              id: item?.id ?? key,
              selection,
              selectorRegex,
              path: item?.path ?? resolvedPath,
            });
          }
        });
        setNotes(Array.from(unique.values()));
      })
      .catch(() => {
        if (canceled) return;
        setNotes([]);
      });

    return () => {
      canceled = true;
    };
  }, [path]);

  useEffect(() => {
    highlightNotes(containerRef.current, notes);
    return () => clearHighlights(containerRef.current);
  }, [highlightNotes, notes, clearHighlights]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {children}
    </div>
  );
}
