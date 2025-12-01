import { AICreatePanel } from "./AICreatePanel";
import { TiptapProse } from "@/components/editor/TiptapProse";
import { TiptapContent } from "@/components/editor/tiptap-types";
import { Story } from "@common/schema";

export const StoryChapterizePanel = ({
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
        placeholder="描述章节划分的节奏、长度、视角和其他要求……"
        taoName="story-chapterize"
        taoDescription="情节章节化"
        onGenerate={handleGenerate}
      />
    </div>
  );
};
