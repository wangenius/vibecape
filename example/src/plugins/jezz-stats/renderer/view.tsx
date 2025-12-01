// import { useCosmos } from "@/hook/cosmos/useCosmos";
import { useEffect, useMemo, useState } from "react";
import { DailyStats } from "../schema";
import { cn } from "../../../renderer/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../renderer/components/ui/tooltip";

/**
 * 世界观统计数据页面
 * 极简高级设计
 */
export const CosmosStatsView = () => {
  // Assets hooks removed as they are no longer needed for global view

  const [stats, setStats] = useState<DailyStats[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // @ts-ignore
      const data = await window.api.cosmos.stats.get(365);
      setStats(data || []);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const summary = useMemo(() => {
    const empty = {
      cosmos: { edits: 0, activeDays: 0 },
      novel: { edits: 0, words: 0, activeDays: 0, streak: 0 },
    };
    if (!stats.length) return empty;

    const cosmosEdits = stats.reduce(
      (acc, curr) => acc + (curr.cosmos_edits || 0),
      0
    );
    const cosmosActiveDays = stats.filter((s) => s.cosmos_edits > 0).length;
    const novelEdits = stats.reduce(
      (acc, curr) => acc + (curr.novel_edits || 0),
      0
    );
    const novelWords = stats.reduce(
      (acc, curr) => acc + (curr.novel_word_count || 0),
      0
    );
    const novelActiveDays = stats.filter(
      (s) => s.novel_edits > 0 || s.novel_word_count > 0
    ).length;

    let currentStreak = 0;
    const today = new Date();
    const dateMap = new Set(
      stats
        .filter((s) => s.novel_edits > 0 || s.novel_word_count > 0)
        .map((s) => s.date)
    );
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (dateMap.has(dateStr)) currentStreak++;
      else if (i > 0 && !dateMap.has(dateStr)) break;
    }

    return {
      cosmos: { edits: cosmosEdits, activeDays: cosmosActiveDays },
      novel: {
        edits: novelEdits,
        words: novelWords,
        activeDays: novelActiveDays,
        streak: currentStreak,
      },
    };
  }, [stats]);

  // Heatmap Generator
  const generateHeatmap = (type: "cosmos" | "novel") => {
    const today = new Date();
    const data: {
      date: string;
      count: number;
      words: number;
      intensity: number;
    }[] = [];
    const map = new Map(stats.map((s) => [s.date, s]));

    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(today.getDate() - (364 - i));
      const dateStr = d.toISOString().split("T")[0];
      const dayStat = map.get(dateStr);

      let intensity = 0;
      let count = 0;
      let words = 0;

      if (type === "cosmos") {
        count = dayStat?.cosmos_edits || 0;
        intensity = Math.min(5, Math.ceil(count / 2)); // Scale 0-5
      } else {
        count = dayStat?.novel_edits || 0;
        words = dayStat?.novel_word_count || 0;
        intensity = Math.min(5, Math.ceil((count + words / 200) / 2)); // Scale 0-5
      }

      data.push({ date: dateStr, count, words, intensity });
    }
    return data;
  };

  const cosmosHeatmap = useMemo(() => generateHeatmap("cosmos"), [stats]);
  const novelHeatmap = useMemo(() => generateHeatmap("novel"), [stats]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background/30">
      <div className="p-10 max-w-6xl mx-auto w-full space-y-12">
        {/* Header - Extremely Minimal */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-mono uppercase text-muted-foreground/50 tracking-widest">
            Overview
          </div>
          <h1 className="text-3xl font-light tracking-tight text-foreground/90">
            全局数据统计
          </h1>
        </div>

        {/* World Building Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
              世界观构建
            </h2>
            <div className="flex gap-8 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground/50 text-xs font-mono">
                  构建次数
                </span>
                <span className="font-medium tabular-nums">
                  {summary.cosmos.edits.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground/50 text-xs font-mono">
                  活跃天数
                </span>
                <span className="font-medium tabular-nums">
                  {summary.cosmos.activeDays} 天
                </span>
              </div>
            </div>
          </div>

          <HeatmapBar data={cosmosHeatmap} color="blue" />
        </section>

        {/* Divider */}
        <div className="h-px w-full bg-border/30" />

        {/* Writing Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
              小说创作
            </h2>
            <div className="flex gap-8 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground/50 text-xs font-mono">
                  总字数
                </span>
                <span className="font-medium tabular-nums">
                  {summary.novel.words.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground/50 text-xs font-mono">
                  连更
                </span>
                <span className="font-medium tabular-nums text-primary">
                  {summary.novel.streak} 天
                </span>
              </div>
            </div>
          </div>

          <HeatmapBar data={novelHeatmap} />
        </section>
      </div>
    </div>
  );
};

// --- Minimal Heatmap Component ---

const HeatmapBar = ({
  data,
  color = "primary",
}: {
  data: any[];
  color?: "primary" | "blue";
}) => {
  // Group data by columns (weeks) - simplistic 53 weeks x 7 days approach
  // We just render a flex grid, auto-wrapping is tricky for exact github style without css grid
  // Let's use a pure flex row of columns

  // Prepare chunks of 7 days
  const weeks: any[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="flex gap-[3px] items-end h-32 mask-linear-fade">
        {/* Using bar chart style instead of grid for "High-end" feel? 
                    Or just a very clean grid. Let's stick to clean grid but cleaner.
                */}
        <div className="flex gap-0.5 overflow-x-auto pb-2 no-scrollbar">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-0.5">
              {week.map((day, dIdx) => (
                <TooltipProvider key={dIdx} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-[1px] transition-all duration-300",
                          getColor(day.intensity, color)
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="text-xs bg-popover/90 backdrop-blur-sm border-none shadow-xl"
                    >
                      <div className="font-mono text-[10px] opacity-50">
                        {day.date}
                      </div>
                      <div className="font-medium">
                        {day.count} edits, {day.words} words
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function getColor(intensity: number, color: "primary" | "blue") {
  // 0: bg-muted/10
  // 1-5: opacity steps
  if (intensity === 0) return "bg-foreground/5";

  if (color === "primary") {
    // Using monochrome scale for high-end feel
    if (intensity === 1) return "bg-foreground/20";
    if (intensity === 2) return "bg-foreground/40";
    if (intensity === 3) return "bg-foreground/60";
    if (intensity === 4) return "bg-foreground/80";
    return "bg-foreground";
  } else {
    // Blue scale
    if (intensity === 1) return "bg-blue-500/20";
    if (intensity === 2) return "bg-blue-500/40";
    if (intensity === 3) return "bg-blue-500/60";
    if (intensity === 4) return "bg-blue-500/80";
    return "bg-blue-500";
  }
}
