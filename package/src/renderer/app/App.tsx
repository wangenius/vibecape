import { useEffect } from "react";
import { DocsSidebar } from "./components/DocsSidebar";
import { DocWorkspace } from "./components/DocWorkspace";
import { Header } from "./components/Header";
import { useDocsStore } from "./useDocsStore";

const App = () => {
  const bootstrap = useDocsStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      <Header />
      <div className="flex flex-1 overflow-hidden border-t border-border/60">
        <DocsSidebar />
        <DocWorkspace />
      </div>
    </div>
  );
};

export { App };
