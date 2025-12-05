import { useEffect } from "react";
import { Sidebar } from "@/layouts/sidebar/Sidebar";
import { MainView } from "@/layouts/mainview";
import { Header } from "@/layouts/Header";
import { Baybar } from "@/layouts/Baybar";
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
  const { isCommandPaletteOpen, isDocSearchOpen, closePalette } = usePalette();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <TooltipProvider>
      <div className="w-screen h-screen relative flex bg-background overflow-hidden flex-col">
        {/* Header Layer - Fixed Top */}
        <div className="w-full h-8 z-50 pointer-events-auto">
          <Header />
        </div>

        {/* Content Layer - Full Height */}
        <div className="w-full h-full flex overflow-hidden">
          <Sidebar />
          <MainView />
          <Baybar />
        </div>

        {/* Command Palette */}
        <CommandPalette
          open={isCommandPaletteOpen}
          onOpenChange={closePalette}
        />

        {/* Doc Search Palette */}
        <DocSearchPalette
          open={isDocSearchOpen}
          onOpenChange={closePalette}
        />
      </div>
    </TooltipProvider>
  );
};

export { App };
