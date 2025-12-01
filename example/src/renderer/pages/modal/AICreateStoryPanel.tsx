import { dialog } from "@/components/custom/DialogModal";
import { AICreatePanel } from "./AICreatePanel";

/**
 * 创建情节
 */
export const AICreateStoryPanel = ({ close }: { close: () => void }) => {
  return (
    <AICreatePanel
      close={close}
      placeholder="What happens next? Type @ to reference..."
      taoName="创建情节"
      taoDescription="创建情节"
      onGenerate={async (content) => {
        // TODO: 基于 value 构造上下文描述，并调用 window.api.ai.storyScriptStart
        console.log("Generating story with content:", content);
      }}
    />
  );
};

AICreateStoryPanel.open = () =>
  dialog({
    title: "",
    description: "",
    content: (close) => <AICreateStoryPanel close={close} />,
    footer: false,
    className:
      "p-6 bg-background/95 backdrop-blur-xl border border-border/10 shadow-2xl max-w-none w-fit rounded-3xl",
  });
