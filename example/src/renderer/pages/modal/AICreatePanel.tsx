import { AsyncButton } from "@/components/custom/AsyncButton";
import { BaseEditor } from "@/components/editor/BaseEditor";
import { MentionCommand } from "@/components/editor/extensions/MentionCommand";
import { MentionNode } from "@/components/editor/extensions/MentionNode";
import { createMentionPlugin } from "@/components/editor/menus/MentionMenu";
import {
  DEFAULT_TIPTAP_CONTENT,
  TiptapContent,
} from "@/components/editor/tiptap-types";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Tao } from "taozen";

interface AICreatePanelProps {
  close: () => void;
  placeholder: string;
  taoName: string;
  taoDescription: string;
  onGenerate: (content: TiptapContent) => Promise<void>;
}

export const AICreatePanel = ({
  close,
  placeholder,
  taoName,
  taoDescription,
  onGenerate,
}: AICreatePanelProps) => {
  // 提及插件配置
  const mentionPlugin = useMemo(() => createMentionPlugin(), []);
  const [content, setContent] = useState(DEFAULT_TIPTAP_CONTENT);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      MentionNode,
      MentionCommand.configure({
        suggestion: mentionPlugin,
      }),
    ],
    [mentionPlugin, placeholder]
  );

  const handleGenerate = async () => {
    try {
      const tao = new Tao({
        name: taoName,
        description: taoDescription,
      });
      tao.register();
      tao.zen(taoName).exe(async () => {
        await onGenerate(content);
      });
      tao.run();
      close();
    } catch (e) {
      toast.error(String(e));
    }
  };

  return (
    <div className="w-[480px] max-w-full">
      <div className="flex flex-col gap-4">
        <BaseEditor
          defaultValue={DEFAULT_TIPTAP_CONTENT}
          onChange={setContent}
          extensions={extensions as any}
          className="prose prose-lg text-sm dark:prose-invert max-w-none w-full focus:outline-none text-foreground placeholder:text-muted-foreground/30 font-light tracking-wide leading-relaxed min-h-[80px]"
        />

        <div className="flex justify-end pt-1">
          <AsyncButton type="button" onClick={handleGenerate}>
            <span>Generate</span>
          </AsyncButton>
        </div>
      </div>
    </div>
  );
};
