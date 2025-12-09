import { useEffect } from "react";
import { Sidebar } from "@/layouts/sidebar";
import { MainView } from "@/layouts/mainview";
import { Header } from "@/layouts/Header";
import { Baybar } from "@/layouts/baybar";
import { bootstrap } from "@/hooks/stores";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/app/useTheme";
import { useChatInputFocus } from "@/hooks/shortcuts/useChatInputFocus";
import { useSidebarToggle } from "@/hooks/shortcuts/useSidebarToggle";
import { usePalette } from "@/hooks/shortcuts/usePalette";
import { useDocEditorFocus } from "@/hooks/shortcuts/useDocEditorFocus";
import { useSettingsToggle } from "@/hooks/shortcuts/useSettingsToggle";
import { CommandPalette } from "@/components/custom/CommandPalette";
import { DocSearchPalette } from "@/components/custom/DocSearchPalette";

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
    <TooltipProvider>
      <div className="w-screen h-screen relative flex bg-background overflow-hidden flex-col">
        <div className="w-full h-8 z-50 pointer-events-auto">
          <Header />
        </div>

        <div className="w-full h-full flex overflow-hidden">
          <Sidebar />
          <MainView />
          <Baybar />
        </div>

        <CommandPalette />

        <DocSearchPalette />
      </div>
    </TooltipProvider>
  );
};

export { App };
