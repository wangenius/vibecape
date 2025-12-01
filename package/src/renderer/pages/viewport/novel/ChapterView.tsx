import { SectionPanel } from "@/components/custom/SectionPanel";
import { cn } from "@/lib/utils";
import { getChapterWordCount } from "@/hook/novel/useChapter";
import {
  useChapterIndex,
  useChapterList,
  useCurrentChapter,
  useNovel,
  updateChapterByIndex,
  createChapter,
} from "@/hook/novel/useNovel";
import { Fragment, useCallback, useMemo } from "react";
import { useSettings, updateSettings } from "@/hook/app/useSettings";
import { settingsShape } from "@common/config/settings";
import { TbBrain } from "react-icons/tb";
import { FileText, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { ChapterBodyEditor } from "@/components/chapter/ChapterBodyEditor";
import { ChapterContent } from "./ChapterContent";
import { TitleInput } from "@/components/chapter/TitleInput";
import { TopToolbar } from "@/components/chapter/TopToolbar";
import { Chapter } from "@common/schema/novel";

/** 章节为空时的占位组件 */
const ChapterEmptyState = () => {
  const handleCreateChapter = useCallback(async () => {
    await createChapter();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-background/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl" />
          <FileText
            className="relative w-12 h-12 text-muted-foreground/20"
            strokeWidth={1}
          />
        </div>

        <div className="space-y-2 text-center">
          <h3 className="text-sm font-medium text-foreground/70 tracking-widest">
            暂无章节
          </h3>
          <p className="text-xs text-muted-foreground/40 tracking-wider">
            创建第一个章节开始写作
          </p>
        </div>

        <button
          onClick={handleCreateChapter}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-foreground/60 text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          新建章节
        </button>
      </motion.div>
    </div>
  );
};

/** 章节编辑的页面 */
export const ChapterPage = () => {
  const index = useChapterIndex();
  const { chapter } = useCurrentChapter();
  const chapters = useChapterList();
  const novel = useNovel();
  const showChapterList = useSettings((s) => s.ui.showChapterList);

  const handleToggleChapterList = useCallback(() => {
    updateSettings(settingsShape.ui.showChapterList, !showChapterList);
  }, [showChapterList]);

  /* 修改章节标题 */
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (index !== null && index >= 0) {
        updateChapterByIndex(index, { name: e.target.value });
      }
    },
    [index]
  );

  /* 计算章节字数 */
  const wordCount = useMemo(
    () => (chapter ? getChapterWordCount(chapter) : 0),
    [chapter]
  );

  /* 如果小说不存在，则显示加载或空状态 */
  const hasActiveNovel = Boolean(novel?.id);
  const hasChapters = chapters.length > 0;

  if (!hasActiveNovel) {
    // 显示加载状态或提示信息
    return (
      <div className="flex h-full items-center justify-center px-6 py-6 text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="text-2xl">📖</div>
          <div>正在加载小说...</div>
        </div>
      </div>
    );
  }

  /* 如果没有章节，显示空状态 */
  if (!hasChapters) {
    return <ChapterEmptyState />;
  }

  /* 渲染章节编辑页面 */
  return (
    <Fragment>
      <TopToolbar
        wordCount={wordCount}
        chapterIndex={index}
        showChapterList={showChapterList}
        onToggleChapterList={handleToggleChapterList}
      />

      <div className="flex h-[calc(100%-3.5rem)]">
        {/* 左侧目录栏 - 可隐藏 */}
        <div
          className={cn(
            "h-full border-r border-border/10 p-2 transition-all duration-300",
            showChapterList ? "w-80" : "w-0 p-0 opacity-0 overflow-hidden"
          )}
        >
          <ChapterContent />
        </div>

        {/* 中间编辑区域 */}
        <div
          key={chapter?.id}
          className="flex-1 p-2 overflow-y-auto max-w-5xl m-auto flex flex-col gap-4 h-full"
        >
          <TitleInput
            value={chapter?.name || ""}
            onChange={handleTitleChange}
          />

          <Thinking chapter={chapter} />

          <ChapterBodyEditor
            className="text-muted-foreground/80 flex-1 px-2"
            chapter={chapter}
          />
        </div>
      </div>
    </Fragment>
  );
};

const Thinking = ({ chapter }: { chapter: Chapter | null }) => {
  const reasoner = useMemo(() => chapter?.reasoner ?? "", [chapter]);
  if (reasoner.length === 0) return null;
  return (
    <SectionPanel icon={TbBrain} title="思考结果" collapsible>
      <div className="text-sm p-2 text-muted-foreground/60">
        {reasoner.split("\n").map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </SectionPanel>
  );
};
