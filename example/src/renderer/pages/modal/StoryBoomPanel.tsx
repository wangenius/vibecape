import { AICreatePanel } from "./AICreatePanel";
import { TiptapProse } from "@/components/editor/TiptapProse";
import { TiptapContent } from "@/components/editor/tiptap-types";
import { Story } from "@common/schema";

export const StoryBoomPanel = ({
  story,
  close,
}: {
  story: Story;
  close: () => void;
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
        placeholder="描述要如何拆解当前情节、子情节数量、风格或其他要求……"
        taoName="story-boom"
        taoDescription="情节拆解"
        onGenerate={handleGenerate}
      />
    </div>
  );
};
