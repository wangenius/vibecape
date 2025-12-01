import { createContext } from "react";

export interface PopoverContextType {
  enabled: boolean;
  activePopover: string | null;
  setActivePopover: (id: string | null) => void;
}

export const PopoverContext = createContext<PopoverContextType>({
  enabled: true,
  activePopover: null,
  setActivePopover: () => {},
});
