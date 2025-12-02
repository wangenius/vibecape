"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { openAnnotationDialog } from "@/components/docs/annotation-sheet";
import { getBayBarOpen, toggleBayBar } from "@/hook/useView";

interface SelectionQuoteState {
  text: string;
  x: number;
  y: number;
  visible: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
}

interface SelectionProviderState {
  state: SelectionQuoteState | null;
  showQuote: (payload: {
    text: string;
    rect: DOMRect;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meta?: any;
  }) => void;
  hideQuote: () => void;
}

const SelectionContext = createContext<SelectionProviderState | null>(null);

export function useSelectionContext() {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error(
      "useSelectionContext must be used within a SelectionProvider"
    );
  }
  return ctx;
}

interface SelectionProviderProps {
  children: ReactNode;
}

export function SelectionProvider({ children }: SelectionProviderProps) {
  const [state, setState] = useState<SelectionQuoteState | null>(null);
  const pathname = usePathname();

  const showQuote = useCallback(
    (payload: {
      text: string;
      rect: DOMRect;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      meta?: any;
    }) => {
      const { text, rect, meta } = payload;
      if (!text.trim()) {
        setState(null);
        return;
      }

      if (!rect || (rect.x === 0 && rect.y === 0 && rect.width === 0)) {
        return;
      }

      const x = rect.left + rect.width / 2;
      const y = rect.top - 8;

      setState({
        text,
        x,
        y,
        visible: true,
        meta,
      });
    },
    []
  );

  const hideQuote = useCallback(() => {
    setState((prev) => (prev ? { ...prev, visible: false } : null));
  }, []);

  const handleQuote = useCallback(() => {
    if (!state?.text) return;

    const detail = {
      text: state.text,
      ...(state.meta ?? {}),
    };

    const isOpen = getBayBarOpen();

    const dispatchQuote = () => {
      window.dispatchEvent(
        new CustomEvent("set-quote", {
          detail,
        })
      );
    };

    if (!isOpen) {
      toggleBayBar(true);
      // 等待侧边栏动画完成后再发送事件，确保 ChatInput 已挂载并监听
      setTimeout(dispatchQuote, 400);
    } else {
      dispatchQuote();
    }

    setState(null);
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
  }, [state]);

  const handleAddAnnotation = useCallback(() => {
    if (!state?.text) return;
    const docPath =
      pathname ??
      (typeof window !== "undefined" ? window.location.pathname : "");
    if (!docPath) return;

    openAnnotationDialog({
      text: state.text,
      path: docPath,
    });

    setState(null);
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
  }, [pathname, state]);

  return (
    <SelectionContext.Provider value={{ state, showQuote, hideQuote }}>
      <div className="relative">
        {children}
        {state?.visible && (
          <div
            className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-full border bg-background px-3 py-1 text-xs shadow-md flex items-center gap-2 cursor-pointer hover:bg-muted transition-colors"
            style={{
              left: state.x,
              top: state.y,
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              type="button"
              className="rounded-full px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={handleQuote}
            >
              引用到对话
            </button>
            <button
              type="button"
              className="rounded-full px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={handleAddAnnotation}
            >
              添加批注
            </button>
          </div>
        )}
      </div>
    </SelectionContext.Provider>
  );
}

interface SelectFieldProps {
  children: ReactNode;
  onSelect?: (text: string) => {
    text: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export function SelectField({ children, onSelect }: SelectFieldProps) {
  const { showQuote, hideQuote } = useSelectionContext();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleSelectionChange = useCallback(() => {
    if (typeof window === "undefined") return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      hideQuote();
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      hideQuote();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    const container = containerRef.current;

    if (
      !container ||
      (!container.contains(anchorNode instanceof Node ? anchorNode : null) &&
        !container.contains(focusNode instanceof Node ? focusNode : null))
    ) {
      return;
    }

    const base = onSelect ? onSelect(text) : { text };
    const { text: finalText, ...meta } = base;

    showQuote({
      text: finalText,
      rect,
      meta,
    });
  }, [hideQuote, onSelect, showQuote]);

  return (
    <div
      className="w-full flex-1"
      ref={containerRef}
      onMouseUp={handleSelectionChange}
      onKeyUp={handleSelectionChange}
    >
      {children}
    </div>
  );
}

interface SelectionQuoteProps {
  children: ReactNode;
}

export function SelectionQuote({ children }: SelectionQuoteProps) {
  return (
    <SelectField
      onSelect={(text) => {
        const path =
          typeof window !== "undefined" ? window.location.pathname : undefined;
        return { text, path };
      }}
    >
      {children}
    </SelectField>
  );
}
