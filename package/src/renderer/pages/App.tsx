import { DndWrapper } from "../hook/ui/useDragAndDrop";
import { TooltipProvider } from "../components/ui/tooltip";
import { Header } from "./header/Header";
import { Viewport } from "./viewport/Viewport";
import { Sidebar } from "./sidebar/Sidebar";
import { Baybar } from "./baybar/Baybar";
import { useTheme } from "@/hook/app/useTheme";
import { useChatInputFocus } from "@/hook/shortcuts/useChatInputFocus";
import { useSidebarToggle } from "@/hook/shortcuts/useSidebarToggle";
import { useAppInit } from "@/hook/app/useAppInit";

const App = () => {
  useAppInit();
  useTheme();
  useChatInputFocus(true, true);
  useSidebarToggle(true);

  return (
    <DndWrapper>
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
            <Sidebar />
            <div className="flex-1 h-full pt-8 overflow-hidden">
              <Viewport />
            </div>
            <Baybar />
          </div>
        </div>
      </TooltipProvider>
    </DndWrapper>
  );
};

export { App };
