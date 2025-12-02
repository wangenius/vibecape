import { useEffect } from "react";
import { useVibecapeStore } from "@/hook/useVibecapeStore";
import { useViewManager } from "@/hook/app/useViewManager";
import { GeneralSettings, ModelSettings, AboutSettings } from "../SettingsModal";
import { InitProgressDialog } from "./InitProgressDialog";
import { WelcomePage } from "./WelcomePage";
import { EmptyDocState } from "./EmptyDocState";
import { DocWorkspace } from "./DocWorkspace";

export const Workspace = () => {
  const workspace = useVibecapeStore((state) => state.workspace);
  const activeDoc = useVibecapeStore((state) => state.activeDoc);
  const bootstrap = useVibecapeStore((state) => state.bootstrap);
  const saveDoc = useVibecapeStore((state) => state.saveDoc);
  const activeSidebarPanel = useViewManager(
    (state) => state.activeSidebarPanel
  );
  const settingsSection = useViewManager((state) => state.previewCosmosId);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // 设置模式 - 显示设置页面
  if (activeSidebarPanel === "settings") {
    const renderSettings = () => {
      switch (settingsSection) {
        case "models":
          return <ModelSettings />;
        case "about":
          return <AboutSettings />;
        case "general":
        default:
          return <GeneralSettings />;
      }
    };

    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-3xl mx-auto">{renderSettings()}</div>
      </div>
    );
  }

  // 未初始化工作区 - 显示欢迎页面
  if (!workspace?.initialized) {
    return (
      <>
        <InitProgressDialog />
        <WelcomePage />
      </>
    );
  }

  // 未选择文档
  if (!activeDoc) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <EmptyDocState />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <DocWorkspace doc={activeDoc} onSave={saveDoc} />
    </div>
  );
};
