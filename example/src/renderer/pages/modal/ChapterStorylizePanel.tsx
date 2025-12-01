import { ROLLBACK_NAME } from "@common/lib/const";
import { FormContainer, FormTextArea } from "@/components/custom/FormWrapper";
import { Button } from "@/components/ui/button";
import { BsStars } from "react-icons/bs";
import { Chapter } from "@common/schema/novel";

export const ChapterStorylizePanel = ({
  close,
  chapter,
}: {
  close: () => void;
  chapter: Chapter;
}) => {
  const submit = (_data: { extra: string }) => {
    void (async () => {
      try {
        // const { channel } = await window.api.ai.storylizeStart({
        //   tags: [],
        //   theme: data.extra,
        // });
        // const ipc = window.electron?.ipcRenderer;
        // if (ipc && channel) {
        //   const handler = (_e: unknown, payload: any) => {
        //     if (payload?.type === "end" || payload?.type === "error") {
        //       ipc.removeAllListeners(channel);
        //     }
        //   };
        //   ipc.on(channel, handler);
        // }
      } catch (err) {
        // 忽略错误，保持与原先“触发即关闭”一致
      }
    })();
    close();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      className="w-[400px] p-3"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground">情节化</h3>
          <span className="text-muted-foreground text-xs ml-2">
            {chapter.name || ROLLBACK_NAME.CHAPTER}
          </span>
        </div>
        <small className="text-muted-foreground text-xs">
          将章节转化成一个情节
        </small>
      </div>
      <FormContainer className="flex flex-col gap-6" onSubmit={submit}>
        <div className="h-12">
          <FormTextArea
            autoFocus
            placeholder={"可输入自定义内容"}
            name={"extra"}
            className="h-full"
          />
        </div>
        <Button className="w-full h-10" type="submit" variant={"default"}>
          <BsStars className="mr-2 h-4 w-4" />
          开始生成
        </Button>
      </FormContainer>
    </div>
  );
};
