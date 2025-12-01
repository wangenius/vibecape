import { dialog } from "@/components/custom/DialogModal";
import { AICreatePanel } from "./AICreatePanel";

/**
 * AI 创建设定
 */
export const AICreateLorePanel = ({ close }: { close: () => void }) => {
  return (
    <AICreatePanel
      close={close}
      placeholder="Describe the lore you want to create... Type @ to reference..."
      taoName="生成设定"
      taoDescription="AI 生成设定"
      onGenerate={async (content) => {
        // TODO: 基于 content 构造上下文描述，并调用相关 API
        console.log("Generating lore with content:", content);
      }}
    />
  );
};

AICreateLorePanel.open = () =>
  dialog({
    title: "",
    description: "",
    content: (close) => <AICreateLorePanel close={close} />,
    footer: false,
    className:
      "p-6 bg-background/95 backdrop-blur-xl border border-border/10 shadow-2xl max-w-none w-fit rounded-3xl",
  });
