import { useEffect } from "react";
import { Sidebar } from "@/layouts/sidebar";
import { MainView } from "@/layouts/mainview";
import { Header } from "@/layouts/Header";
import { Baybar } from "@/layouts/baybar";
import { bootstrap } from "@/hooks/stores";
import { useTheme } from "@/hooks/app/useTheme";
import { useChatInputFocus } from "@/hooks/shortcuts/useChatInputFocus";
import { useSidebarToggle } from "@/hooks/shortcuts/useSidebarToggle";
import { usePalette } from "@/hooks/shortcuts/usePalette";
import { useDocEditorFocus } from "@/hooks/shortcuts/useDocEditorFocus";
import { useSettingsToggle } from "@/hooks/shortcuts/useSettingsToggle";
import { CommandPalette, DocSearchPalette } from "@/lib/palette";

const App = () => {
  useTheme();
  useSidebarToggle();
  useChatInputFocus(true, true);
  useDocEditorFocus();
  useSettingsToggle();
  usePalette();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <div className="w-screen h-screen relative flex bg-background overflow-hidden flex-col">
      <Header />
      <div className="w-full h-full flex overflow-hidden">
        <Sidebar />
        <MainView />
        <Baybar />
      </div>
      <CommandPalette />
      <DocSearchPalette />
    </div>
  );
};

export { App };
