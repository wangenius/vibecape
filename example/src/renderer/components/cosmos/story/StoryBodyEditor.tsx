import { BaseEditor } from "@/components/editor/BaseEditor";
import { TiptapContent } from "@/components/editor/tiptap-types";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { memo, useCallback } from "react";
import { EditorContent } from "@common/types/content";
import { MentionExtension } from "@/components/editor/extensions/MentionExtension";
import StarterKit from "@tiptap/starter-kit";

/**故事内容编辑器*/
export const StoryBodyEditor = memo(({ story_id }: { story_id: string }) => {
  /*当前创作环境*/
  const stories = useCosmos((state) => state.stories);
  if (!story_id || !stories) throw new Promise(() => {});
  const story = stories[story_id];

  const onChange = useCallback(
    (value: TiptapContent) => {
      useCosmos
        .getState()
        .updateStory(story.id, { body: value as EditorContent });
    },
    [story.id]
  );

  return (
    <div className="p-2">
      <BaseEditor
        key={story_id}
        readonly={false}
        defaultValue={story.body}
        extensions={[StarterKit, ...MentionExtension]}
        onChange={onChange}
      />
    </div>
  );
});
