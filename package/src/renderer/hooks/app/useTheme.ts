import { useEffect } from "react";
import { useSettings } from "@/hooks/app/useSettings";

export const useTheme = () => {
  const mode = useSettings((state) => state.ui.mode);
  const theme = useSettings((state) => state.ui.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return { mode, theme };
};
