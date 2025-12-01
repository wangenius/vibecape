import { AsyncButton } from "@/components/custom/AsyncButton";
import {
  FormContainer,
  FormRadio,
  FormTextArea,
} from "@/components/custom/FormWrapper";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TbArrowAutofitLeft, TbPlus, TbX } from "react-icons/tb";

interface ChapterSelectionToolbarProps {
  isSelectionMode: boolean;
  selectedChapters: string[];
  openPopover: boolean;
  setOpenPopover: (open: boolean) => void;
  clearSelection: () => void;
  onAddChapter: () => void;
}

export const ChapterSelectionToolbar = ({
  isSelectionMode,
  selectedChapters,
  openPopover,
  setOpenPopover,
  clearSelection,
  onAddChapter,
}: ChapterSelectionToolbarProps) => {
  return (
    <div className="flex items-center gap-2 rounded-lg justify-between px-3">
      {isSelectionMode ? (
        <div className="flex items-center gap-1">
          <Popover open={openPopover} onOpenChange={setOpenPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                title="拆解情节"
                className="h-7 hover:bg-muted shrink-0 text-xs"
              >
                <TbArrowAutofitLeft className="h-4 w-4 mr-1" />
                拆解
              </Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" className="w-72 p-3">
              <FormContainer
                className="space-y-2"
                defaultValues={{
                  mode: "single",
                  extra: "",
                }}
                onSubmit={async () => {}}
              >
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    已选择 {selectedChapters.length} 个章节
                  </div>
                  <FormRadio
                    name="mode"
                    label="解析模式"
                    className="flex flex-row gap-2"
                    options={[
                      {
                        value: "single",
                        label: (
                          <div className="flex flex-col items-start">
                            <span className="flex text-xs items-center gap-1">
                              单独解析
                            </span>
                            <span className="text-[10px] text-muted-foreground text-wrap text-start">
                              每个章节独立解析为一个情节, 最多一次执行三个章节
                            </span>
                          </div>
                        ),
                      },
                      {
                        value: "combined",
                        label: (
                          <div className="flex flex-col items-start">
                            <span className="flex text-xs items-center gap-1">
                              整体解析
                            </span>
                            <span className="text-[10px] text-muted-foreground text-wrap text-start">
                              将选择的全部内容解析为一个情节，最多一次执行30000字
                            </span>
                          </div>
                        ),
                      },
                      {
                        value: "sequence",
                        label: (
                          <div className="flex flex-col items-start">
                            <span className="flex text-xs items-center gap-1">
                              AI解析
                            </span>
                            <span className="text-[10px] text-muted-foreground text-wrap text-start">
                              由AI决定解析方式，生成情节，最多一次执行30000字
                            </span>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
                <FormTextArea
                  name="extra"
                  label="具体要求"
                  autoFocus
                  placeholder="输入具体要求"
                />
                <AsyncButton
                  disabled={selectedChapters.length === 0}
                  variant="default"
                  className="w-full h-10"
                  type="submit"
                  size="lg"
                >
                  {selectedChapters.length === 0 ? "请选择章节" : "开始拆解"}
                </AsyncButton>
              </FormContainer>
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <span className="text-sm font-medium whitespace-nowrap">章节目录</span>
      )}
      <div className="flex items-center gap-2 overflow-hidden">
        {isSelectionMode ? (
          <div
            onClick={clearSelection}
            title="点击清除选择"
            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground cursor-pointer hover:border-b hover:border-foreground"
          >
            <span>已选择 {selectedChapters.length} 个章节</span>
            <TbX className="inline" />
          </div>
        ) : (
          <Button
            onClick={onAddChapter}
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-muted shrink-0"
          >
            <TbPlus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
