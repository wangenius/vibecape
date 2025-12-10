import { ReactNode, useEffect } from "react";
import { useWorkspaceStore, useDocumentStore, bootstrap } from "@/hooks/stores";
import { EmptyDocState } from "../../components/ui/EmptyState";
import { DocWorkspace } from "./DocWorkspace";

const MainContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex-1 h-full overflow-hidden overflow-y-auto p-4">
      {children}
    </div>
  );
};

export const MainView = () => {
  const workspace = useWorkspaceStore((state) => state.workspace);
  const activeDoc = useDocumentStore((state) => state.activeDoc);
  const saveDoc = useDocumentStore((state) => state.saveDoc);
  const openDoc = useDocumentStore((state) => state.openDoc);

  useEffect(() => {
    bootstrap();
  }, []);

  // 监听文档跳转事件
  useEffect(() => {
    const handleNavigate = (e: CustomEvent<{ id: string }>) => {
      openDoc(e.detail.id);
    };
    window.addEventListener("doc:navigate", handleNavigate as EventListener);
    return () => {
      window.removeEventListener(
        "doc:navigate",
        handleNavigate as EventListener
      );
    };
  }, [openDoc]);

  // 未打开工作区 - 显示欢迎页面
  if (!workspace || !activeDoc) {
    return (
      <MainContainer>
        <EmptyDocState />
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <DocWorkspace key={activeDoc.id} doc={activeDoc} onSave={saveDoc} />
    </MainContainer>
  );
};
