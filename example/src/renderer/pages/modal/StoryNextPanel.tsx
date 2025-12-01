import { AICreatePanel } from "./AICreatePanel";
import { dialog } from "@/components/custom/DialogModal";
import { TiptapProse } from "@/components/editor/TiptapProse";
import { TiptapContent } from "@/components/editor/tiptap-types";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { Story } from "@common/schema";
import { toast } from "sonner";

export const StoryNextPanel = ({
  close,
  story,
}: {
  close: () => void;
  story: Story;
}) => {
  const bodyText = TiptapProse.flatten(story.body);
  const body = bodyText.split("\n").filter((item) => item.trim() !== "");

  const handleGenerate = async (_content: TiptapContent) => {
    if (body.length === 0) {
      throw new Error("请先填写情节细纲");
    }
  };

  return (
    <div className="p-3">
      <AICreatePanel
        close={close}
        placeholder="描述你希望情节如何接续、转折和推进……"
        taoName="story-next"
        taoDescription="情节接续生成"
        onGenerate={handleGenerate}
      />
    </div>
  );
};

StoryNextPanel.open = async (story_id: string) => {
  const story = await useCosmos.getState().stories[story_id];
  if (!story) return toast.error("情节不存在");

  return dialog({
    title: `情节接续`,
    description: "智能接续当前情节的后续发展",
    content: (close) => <StoryNextPanel close={close} story={story} />,
    className: "w-[640px] h-full max-h-[500px]",
  });
};
