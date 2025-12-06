// Stores - 状态管理模块
// 按领域拆分的 Zustand stores

export { useWorkspaceStore } from "./useWorkspaceStore";
export { useDocumentStore } from "./useDocumentStore";
export { useUIStore } from "./useUIStore";
export { useMentionHistoryStore } from "./useMentionHistoryStore";

// Bootstrap 函数 - 初始化应用
import { initModels, initDefaultModels } from "@/hooks/model/useModel";
import { initProviders } from "@/hooks/model/useProvider";
import { useWorkspaceStore } from "./useWorkspaceStore";
import { useDocumentStore } from "./useDocumentStore";

export const bootstrap = async () => {
  try {
    await Promise.all([initModels(), initDefaultModels(), initProviders()]);

    // 获取 docs_root 路径
    const docsRoot = await window.api.vibecape.getDocsRoot();
    useWorkspaceStore.setState({ docsRoot });

    // 加载工作区列表
    await useWorkspaceStore.getState().loadWorkspaceList();

    // 尝试恢复上次打开的工作区
    const workspace = await window.api.vibecape.restoreLastWorkspace();
    if (workspace) {
      useWorkspaceStore.setState({ workspace });
      await useDocumentStore.getState().refreshTree();

      // 恢复上次打开的文档
      const { activeDocId } = useDocumentStore.getState();
      if (activeDocId) {
        await useDocumentStore.getState().restoreDoc(activeDocId);
      }
    }

    // 监听文档变更事件 - 当 AI 工具修改文档后自动刷新
    window.api.vibecape.onDocsChanged(async (data) => {
      console.log("[Stores] 文档变更通知:", data.tool);
      // 刷新文档树
      await useDocumentStore.getState().refreshTree();
      // 如果当前有打开的文档，也刷新它
      const { activeDocId } = useDocumentStore.getState();
      if (activeDocId) {
        await useDocumentStore.getState().restoreDoc(activeDocId);
      }
    });
  } catch (error) {
    const { useUIStore } = await import("./useUIStore");
    useUIStore.getState().setError((error as Error).message);
  }
};
