import { dialog } from "@/components/custom/DialogModal";
import { AICreatePanel } from "./AICreatePanel";

/**
 * AI 创建角色
 */
export const AICreateActantPanel = ({ close }: { close: () => void }) => {
  return (
    <AICreatePanel
      close={close}
      placeholder="Describe the character you want to create... Type @ to reference..."
      taoName="创建角色"
      taoDescription="AI 创建角色"
      onGenerate={async (content) => {
        // TODO: 基于 content 构造上下文描述，并调用相关 API
        console.log("Generating actant with content:", content);
      }}
    />
  );
};

AICreateActantPanel.open = () =>
  dialog({
    title: "",
    description: "",
    content: (close) => <AICreateActantPanel close={close} />,
    footer: false,
    className:
      "p-6 bg-background/95 backdrop-blur-xl border border-border/10 shadow-2xl max-w-none w-fit rounded-3xl",
  });
