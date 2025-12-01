import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BellIcon,
  CircleIcon,
  ClockIcon,
  Loader2Icon,
  RefreshCwIcon,
  StopCircleIcon,
  Trash2Icon,
  XCircleIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { TbTrash } from "react-icons/tb";
import { Tao } from "taozen";

export function TaskManager() {
  const { taos } = Tao.use();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const tasks = useMemo(() => {
    return Object.entries(taos)
      .map(([id, tao]) => ({
        id,
        ...tao,
      }))
      .sort((a, b) => {
        return (b.startTime || 0) - (a.startTime || 0);
      });
  }, [taos]);

  if (tasks.length === 0) return null;

  const runningTasks = tasks.filter((t) => t.status === "running");

  const toggleExpand = (id: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-7">
          {runningTasks.length > 0 ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <BellIcon className="size-4" />
          )}
          {runningTasks.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-1.5 space-y-0.5" align="end">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            {...task}
            expanded={expandedTasks.has(task.id)}
            onToggle={() => toggleExpand(task.id)}
          />
        ))}
        {tasks.some((t) => t.status !== "running") && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-6 text-xs hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              const completedTasks = tasks.filter(
                (t) =>
                  t.status === "completed" ||
                  t.status === "failed" ||
                  t.status === "cancelled"
              );
              completedTasks.forEach((t) => Tao.remove(t.id));
            }}
          >
            <TbTrash className="h-3 w-3" />
            清除已完成
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
const statusConfig = {
  running: {
    icon: Loader2Icon,
    color: "text-foreground",
    dotColor: "bg-foreground",
    label: "运行中",
  },
  completed: {
    icon: CheckCircle2Icon,
    color: "text-emerald-500",
    dotColor: "bg-emerald-500",
    label: "完成",
  },
  failed: {
    icon: XCircleIcon,
    color: "text-red-500",
    dotColor: "bg-red-500",
    label: "失败",
  },
  cancelled: {
    icon: StopCircleIcon,
    color: "text-gray-400",
    dotColor: "bg-gray-400",
    label: "取消",
  },
  pending: {
    icon: CircleIcon,
    color: "text-gray-400",
    dotColor: "bg-gray-400",
    label: "等待",
  },
};

function StepItem({ zen }: { zen: any }) {
  const zenStatus = statusConfig[zen.status as keyof typeof statusConfig];

  return (
    <div className="flex items-center gap-2 text-[11px]">
      {/* 状态指示器 */}
      <div
        className={cn(
          "w-0.5 h-0.5 rounded-full shrink-0",
          zenStatus?.dotColor,
          zen.status === "running" && "animate-pulse"
        )}
      />

      {/* 步骤内容 */}
      <span className="flex-1 min-w-0 truncate text-muted-foreground">
        {zen.name}
      </span>

      {zen.status === "running" && (
        <Loader2Icon className="h-3 w-3 animate-spin shrink-0" />
      )}
      {zen.status === "failed" && zen.error && (
        <span className="text-red-500 truncate text-[10px]">{zen.error}</span>
      )}
    </div>
  );
}

function CircularProgress({ status }: { status: string }) {
  const isRunning = status === "running";

  const getDotColor = () => {
    switch (status) {
      case "completed":
        return "bg-emerald-500";
      case "failed":
        return "bg-red-500";
      case "cancelled":
        return "bg-gray-400";
      case "running":
        return "bg-foreground";
      default:
        return "bg-gray-400";
    }
  };

  // 运行中显示圆环，其他状态显示点
  if (!isRunning) {
    return (
      <div className="relative flex items-center justify-center w-2.5 h-2.5">
        <div className={cn("w-1.5 h-1.5 rounded-full", getDotColor())} />
      </div>
    );
  }

  // 运行中显示旋转圆环
  const radius = 3.5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (75 / 100) * circumference; // 显示75%

  return (
    <div className="relative flex items-center justify-center w-2.5 h-2.5">
      <svg className="w-2.5 h-2.5 -rotate-90 animate-spin-slow">
        {/* 背景圆环 */}
        <circle
          cx="5"
          cy="5"
          r={radius}
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-muted/30"
        />
        {/* 进度圆环 */}
        <circle
          cx="5"
          cy="5"
          r={radius}
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="stroke-primary"
        />
      </svg>
    </div>
  );
}

function TaskItem({
  id,
  name,
  status,
  zens,
  executionTime,
  expanded,
  onToggle,
}: {
  id: string;
  name: string;
  status: string;
  zens: any[];
  executionTime?: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn("rounded-md transition-colors", expanded && "bg-muted/40")}
    >
      <Button
        variant="ghost"
        className={cn(
          "group w-full h-7 px-2 justify-start gap-2 relative hover:bg-transparent",
          expanded && "hover:bg-transparent"
        )}
        onClick={onToggle}
      >
        <CircularProgress status={status} />
        <div className="flex-1 min-w-0 text-left">
          <span className="text-xs font-medium truncate block">{name}</span>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-none items-center gap-0.5 opacity-0 group-hover:opacity-100">
          {status === "running" && (
            <button
              className="h-5 w-5 flex items-center justify-center hover:text-red-500 rounded"
              onClick={(e) => {
                e.stopPropagation();
                Tao.cancel(id);
              }}
            >
              <StopCircleIcon className="h-3 w-3" />
            </button>
          )}
          {status === "failed" && (
            <button
              className="h-5 w-5 flex items-center justify-center hover:text-blue-500 rounded"
              onClick={(e) => {
                e.stopPropagation();
                Tao.retry(id);
              }}
            >
              <RefreshCwIcon className="h-3 w-3" />
            </button>
          )}
          {status !== "running" && (
            <button
              className="h-5 w-5 flex items-center justify-center hover:text-red-500 rounded"
              onClick={(e) => {
                e.stopPropagation();
                Tao.remove(id);
              }}
            >
              <Trash2Icon className="h-3 w-3" />
            </button>
          )}
        </div>
      </Button>

      {/* 展开内容 */}
      {expanded && zens.length > 0 && (
        <div className="px-2 pb-1.5 space-y-1">
          {zens.map((zen, index) => (
            <StepItem key={index} zen={zen} />
          ))}
          {executionTime && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-0.5">
              <ClockIcon className="h-2.5 w-2.5" />
              <span>{Math.round(executionTime / 1000)}s</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
