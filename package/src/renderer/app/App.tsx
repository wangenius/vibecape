import { useEffect } from "react";
import { VibecapeSidebar } from "./components/VibecapeSidebar";
import { VibecapeWorkspace } from "./components/VibecapeWorkspace";
import { Header } from "./components/Header";
import { Baybar } from "./components/Baybar";
import { useVibecapeStore } from "./useVibecapeStore";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/hook/app/useTheme";
import { useChatInputFocus } from "@/hook/shortcuts/useChatInputFocus";
import { useSidebarToggle } from "@/hook/shortcuts/useSidebarToggle";

const App = () => {
  const bootstrap = useVibecapeStore((state) => state.bootstrap);

  useTheme();
  useSidebarToggle();
  useChatInputFocus(true, true);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <TooltipProvider>
      <div className="w-screen h-screen relative flex bg-background overflow-hidden">
        {/* Header Layer - Fixed Top */}
        <div className="absolute top-0 left-0 w-full h-10 z-50 pointer-events-none">
          <div className="w-full h-full pointer-events-auto">
            <Header />
          </div>
        </div>

        {/* Content Layer - Full Height */}
        <div className="w-full h-full flex overflow-hidden">
          <VibecapeSidebar />
          <div className="flex-1 h-full overflow-hidden">
            <VibecapeWorkspace />
          </div>
          <Baybar />
        </div>
      </div>
    </TooltipProvider>
  );
};

export { App };
