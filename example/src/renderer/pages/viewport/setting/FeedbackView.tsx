import React from "react";
import { toast } from "sonner";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { Button } from "@/components/ui/button";
import { TbSend, TbLoader2, TbMessageCheck } from "react-icons/tb";
import { Tools } from "@/lib/tools";
import { dialog } from "@/components/custom/DialogModal";
import { Badge } from "@/components/ui/badge";

export const FeedbackView = () => {
  const [feedback, setFeedback] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedbackList] = React.useState<
    {
      id: string;
      content: string;
      reply?: string;
      create_at: Date;
      update_at: Date;
    }[]
  >([]);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error("请输入反馈内容");
      return;
    }

    setIsSubmitting(true);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* 反馈输入 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">提交反馈</h3>
              <p className="text-sm text-muted-foreground mt-1">
                告诉我们您遇到的问题或建议
              </p>
            </div>

            <div className="relative">
              <AutoResizeTextarea
                value={feedback}
                onValueChange={setFeedback}
                variant="ghost"
                placeholder="请描述您遇到的问题或建议..."
                className="w-full text-sm px-4 pt-4 resize-none hover:bg-muted active:bg-muted focus:bg-muted outline-none bg-muted/50 transition-all duration-200 rounded-xl"
                footer={
                  <div className="flex justify-end items-center px-2 py-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !feedback.trim()}
                      size="sm"
                      className="rounded-full"
                    >
                      {isSubmitting ? (
                        <>
                          <TbLoader2 className="w-4 h-4 mr-2 animate-spin" />
                          提交中...
                        </>
                      ) : (
                        <>
                          <TbSend className="w-4 h-4 mr-2" />
                          提交反馈
                        </>
                      )}
                    </Button>
                  </div>
                }
              />
            </div>
          </div>

          {/* 社群 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">加入社群</h3>
              <p className="text-sm text-muted-foreground mt-1">
                加入我们的社群，获取最新动态与技术交流
              </p>
            </div>

            <div className="rounded-lg bg-muted/30 p-6">
              <div className="flex items-center gap-6">
                <div className="flex-1 space-y-3">
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      在社群中，你可以与其他创作者交流经验、分享心得，也可以第一时间获取产品更新和活动信息。
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      window.open("https://qm.qq.com/q/HcVchbcF4Q");
                    }}
                    variant="default"
                    size="sm"
                  >
                    加入群聊
                  </Button>
                </div>
                <div className="shrink-0">
                  <img
                    className="h-28 w-28 rounded-lg border"
                    src="/qq_group.png"
                    alt="群二维码"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 历史反馈 */}
          {feedbackList.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">历史反馈</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  查看您提交的反馈和回复
                </p>
              </div>

              <div className="rounded-lg">
                <div className="space-y-1">
                  {feedbackList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        dialog({
                          title: "反馈详情",
                          className: "md:max-w-[600px]",
                          content: (
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">反馈内容</h4>
                                  <time className="text-sm text-muted-foreground">
                                    {Tools.whenWasThat(item.create_at)}
                                  </time>
                                </div>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {item.content}
                                </p>
                              </div>
                              {item.reply && (
                                <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <TbMessageCheck className="w-4 h-4 text-primary" />
                                    <h4 className="font-medium">官方回复</h4>
                                  </div>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                    {item.reply}
                                  </p>
                                </div>
                              )}
                            </div>
                          ),
                        });
                      }}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium line-clamp-1">
                              {item.content}
                            </span>
                            {item.reply && (
                              <Badge
                                variant="outline"
                                className="text-xs shrink-0"
                              >
                                <TbMessageCheck className="w-3 h-3 mr-1" />
                                已回复
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {Tools.whenWasThat(item.create_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
