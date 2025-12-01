import { createContext } from "react";

export interface SelectionContextType {
  isSelectionMode: boolean;
  setSelectionMode: (mode: boolean) => void;
  selectedChapters: string[];
  toggleChapterSelection: (id: string) => void;
  isChapterSelected: (id: string) => boolean;
  clearSelection: () => void;
}

export const SelectionContext = createContext<SelectionContextType>({
  isSelectionMode: false,
  setSelectionMode: () => {},
  selectedChapters: [],
  toggleChapterSelection: () => {},
  isChapterSelected: () => false,
  clearSelection: () => {},
});
