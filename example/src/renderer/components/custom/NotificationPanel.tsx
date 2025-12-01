import { dialog } from "@/components/custom/DialogModal";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  TbBook,
  TbCheck,
  TbClock,
  TbInfoCircle,
  TbUpload,
  TbWorldUpload,
} from "react-icons/tb";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { ImportNovelPanel } from "./ImportNovelPanel";
import { ImportWorldViewPanel } from "./ImportWorldViewPanel";

/**
 * 加载更新日志的函数
 * @param isHistory 是否加载历史版本
 * @returns 返回markdown格式的更新日志内容
 */
const loadReleaseNotes = async (
  isHistory: boolean = false
): Promise<string> => {
  try {
    const file = isHistory ? "history.md" : "current.md";
    const response = await fetch(`/release-notes/${file}`);
    if (!response.ok) throw new Error("无法加载更新日志");
    return await response.text();
  } catch (error) {
    console.error("加载更新日志失败:", error);
    toast.error("无法加载更新日志内容");
    return "无法加载更新日志内容";
  }
};

export const VersionPanel = ({ close }: { close: () => void }) => {
  const [currentNotes, setCurrentNotes] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyNotes, setHistoryNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载当前版本更新日志
  useEffect(() => {
    const fetchCurrentNotes = async () => {
      setLoading(true);
      try {
        const notes = await loadReleaseNotes(false);
        setCurrentNotes(notes);
      } catch (error) {
        console.error("加载当前版本更新日志失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentNotes();
  }, []);

  // 加载历史版本数据
  const handleToggleHistory = async () => {
    if (!showHistory) {
      if (!historyNotes) {
        setHistoryLoading(true);
        try {
          const notes = await loadReleaseNotes(true);
          setHistoryNotes(notes);
        } catch (error) {
          console.error("加载历史版本更新日志失败:", error);
        } finally {
          setHistoryLoading(false);
        }
      }
    }
    setShowHistory(!showHistory);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg mb-4"
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{currentNotes}</ReactMarkdown>
          </div>
        )}
      </motion.div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          className="text-xs flex items-center gap-1"
          onClick={handleToggleHistory}
        >
          <TbClock className="w-3.5 h-3.5" />
          {showHistory ? "隐藏历史版本" : "查看历史版本"}
        </Button>

        <Button variant="default" size="sm" onClick={close}>
          知道了
        </Button>
      </div>

      {showHistory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 border rounded-lg p-4 bg-muted/30"
        >
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground">
              <ReactMarkdown>{historyNotes || ""}</ReactMarkdown>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

VersionPanel.open = () => {
  dialog({
    closeIconHide: true,
    className: "max-w-xl",
    title: "版本更新",
    content: (close) => <VersionPanel close={close} />,
  });
};

export const DataMigrationPanel = ({ close }: { close: () => void }) => {
  const [activeTab, setActiveTab] = useState<"info" | "import">("info");
  // setImportType 目前未使用，但保留状态以备将来需要
  const [, _setImportType] = useState<"novel" | "worldview" | null>(
    null
  );

  // 处理导入世界观
  const handleImportWorldView = () => {
    close();
    ImportWorldViewPanel.open();
  };

  // 处理导入小说
  const handleImportNovel = () => {
    close();
    ImportNovelPanel.open();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg"
      >
        {activeTab === "info" ? (
          <div className="space-y-5">
            <h3 className="text-xl font-medium flex items-center gap-2">
              <TbInfoCircle className="w-5 h-5 text-blue-500" />
              存储方式升级说明
            </h3>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                1.5版本对数据存储方式进行了全面升级。我们取消了适配率较低的File
                System API，
                转而采用更可靠的IndexedDB方案，同时仍保持本地存储方式确保您的数据隐私和安全。
              </p>

              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 space-y-2">
                <h4 className="font-medium text-primary">
                  升级带来的主要优势：
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-0.5">
                      <TbCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <span>无需手动保存，自动实时保存您的所有创作内容</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-0.5">
                      <TbCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <span>更好的浏览器兼容性，支持几乎所有现代浏览器</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-0.5">
                      <TbCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <span>显著提升数据加载速度和整体应用性能</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-amber-600 dark:text-amber-400">
                  注意：
                </strong>
                由于存储方式变更，您需要重新导入之前的创作内容。请点击下方按钮开始导入流程。
              </p>
            </div>

            <Button
              className="w-full mt-4 h-10"
              variant="default"
              onClick={() => setActiveTab("import")}
            >
              <TbUpload className="w-4 h-4 mr-2" />
              开始导入数据
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <h3 className="text-xl font-medium flex items-center gap-2">
              <TbUpload className="w-5 h-5 text-blue-500" />
              导入您的创作
            </h3>

            <p className="text-sm text-muted-foreground">
              请选择您要导入的内容类型，然后按照提示完成导入流程。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Button
                className="h-auto py-6 px-4 flex flex-col items-center gap-2"
                variant="outline"
                onClick={handleImportWorldView}
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <TbWorldUpload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <h4 className="font-medium">导入世界观</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    导入您之前创建的世界观设定
                  </p>
                </div>
              </Button>
              <Button
                className="h-auto py-6 px-4 flex flex-col items-center gap-2"
                variant="outline"
                onClick={handleImportNovel}
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <TbBook className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <h4 className="font-medium">导入小说</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    导入您之前创作的小说内容
                  </p>
                </div>
              </Button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-xs text-muted-foreground mt-4">
              <p className="font-medium text-primary mb-1">
                1.5版本之前的项目结构说明：
              </p>
              <ul className="space-y-1">
                <li className="flex items-start gap-1.5">
                  <TbWorldUpload className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  <span>
                    世界观文件路径：
                    <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">
                      {"{世界观id}"}/cosmos.json
                    </code>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <TbBook className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  <span>
                    小说文件路径：
                    <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">
                      {"{世界观id}"}/novels/{"{小说id}"}/main.json
                    </code>
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex justify-between items-center mt-4">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("info")}
                className="text-xs"
              >
                返回说明
              </Button>

              <Button variant="default" className="h-9 px-5" onClick={close}>
                稍后再说
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

DataMigrationPanel.open = () => {
  dialog({
    closeIconHide: true,
    className: "max-w-xl",
    title: "数据存储方式升级指南",
    content: (close) => <DataMigrationPanel close={close} />,
  });
};
