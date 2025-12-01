import { Unfind } from "@/components/custom/Unfind";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hook/util/useDebounce";
import { cn } from "@/lib/utils";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { TbSearch, TbX } from "react-icons/tb";
import { ActantCard } from "@/components/cosmos/actant/ActantCard";
import { LoreCard } from "@/components/cosmos/lore/LoreCard";
import { StoryCard } from "@/components/cosmos/story/StoryCard";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Actant, Lore, Story } from "@common/schema";

interface SearchTextState {
  text: string;
  setText: (text: string) => void;
}

const useSearchTextStore = create<SearchTextState>()(
  persist(
    (set) => ({
      text: "",
      setText: (text) => set({ text }),
    }),
    {
      name: "search_text",
    }
  )
);

export const search_text = {
  use: () => useSearchTextStore(),
  set: (value: { text: string }) =>
    useSearchTextStore.getState().setText(value.text),
};

export const SearchSection = () => {
  const actants = useCosmos((state) => state?.actants);
  const stories = useCosmos((state) => state?.stories);
  const lores = useCosmos((state) => state?.lores);
  const [results, setResults] = useState<{
    actants: Actant[];
    stories: Story[];
    lores: Lore[];
  }>({
    actants: [],
    stories: [],
    lores: [],
  });
  const { text } = search_text.use();
  const debouncedText = useDebounce(typeof text === "string" ? text : "", 300);
  useEffect(() => {
    if (
      !debouncedText ||
      typeof debouncedText !== "string" ||
      !actants ||
      !stories ||
      !lores
    ) {
      setResults({ actants: [], stories: [], lores: [] });
      return;
    }

    console.log("搜索文本:", debouncedText);
    setResults({
      actants: Object.values(actants || {}).filter((actant) =>
        actant.name.toLowerCase().includes(debouncedText.toLowerCase())
      ),
      stories: Object.values(stories || {}).filter((story) =>
        story.name.toLowerCase().includes(debouncedText.toLowerCase())
      ),
      lores: Object.values(lores || {}).filter((lore) =>
        lore.name.toLowerCase().includes(debouncedText.toLowerCase())
      ),
    });
  }, [debouncedText, actants, stories, lores]);

  const totalResults =
    results.actants.length + results.stories.length + results.lores.length;

  // 添加清除搜索文本的处理
  const handleCloseSearch = () => {
    search_text.set({ text: "" });
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col px-2" id="search-nav">
      <div className="relative px-1 py-2">
        <div className="relative flex items-center">
          <TbSearch className="absolute left-3 text-muted-foreground/50 w-4 h-4" />
          <Input
            placeholder="搜索"
            value={text}
            className={cn(
              "pl-9 pr-8 h-9 bg-muted/50 border-muted",
              "placeholder:text-muted-foreground/40",
              "focus-visible:ring-1 focus-visible:ring-primary/20",
              "focus-visible:border-primary/20",
              "transition-colors duration-200"
            )}
            onChange={(e) => search_text.set({ text: e.target.value })}
            onKeyDown={(e) => e.key === "Escape" && handleCloseSearch()}
            autoFocus
          />
          {text && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1.5 h-6 w-6 text-muted-foreground/40 hover:text-muted-foreground"
              onClick={handleCloseSearch}
            >
              <TbX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {text !== "" && totalResults === 0 && <Unfind />}
      {totalResults > 0 && (
        <div className="flex flex-col h-full relative overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-xs font-medium text-muted-foreground/50 px-4 py-2 border-b border-border/5"
          >
            找到 {totalResults} 个结果
          </motion.div>
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <div className="space-y-2">
              {results.actants.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground/40 px-1">
                    角色
                  </div>
                  {results.actants.map((actant) => (
                    <SearchListItem
                      key={actant.id}
                      item={actant}
                      type="actant"
                    />
                  ))}
                </div>
              )}
              {results.stories.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="text-xs font-medium text-muted-foreground/40 px-1">
                    情节
                  </div>
                  {results.stories.map((story) => (
                    <SearchListItem key={story.id} item={story} type="story" />
                  ))}
                </div>
              )}
              {results.lores.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="text-xs font-medium text-muted-foreground/40 px-1">
                    设定
                  </div>
                  {results.lores.map((schema) => (
                    <SearchListItem key={schema.id} item={schema} type="lore" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SearchListItem = React.memo(
  ({
    item,
    type,
  }: {
    item: Story | Actant | Lore;
    type: "story" | "actant" | "lore";
  }) => {
    const tag = () => {
      switch (type) {
        case "story":
          return "情节";
        case "actant":
          return "角色";
        case "lore":
          return "设定";
      }
    };

    const getBadgeColor = () => {
      switch (type) {
        case "story":
          return "bg-blue-500/10 text-blue-500";
        case "actant":
          return "bg-emerald-500/10 text-emerald-500";
        case "lore":
          return "bg-purple-500/10 text-purple-500";
      }
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <motion.div className="relative p-3 rounded-md hover:bg-muted/50 transition-all duration-200 cursor-pointer group border border-border/5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-200 truncate">
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground/50 mt-1 line-clamp-2 leading-relaxed group-hover:text-muted-foreground/70 transition-colors duration-200">
                  {item.description || "暂无描述"}
                </div>
              </div>
              <Badge
                variant="secondary"
                className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${getBadgeColor()}`}
              >
                {tag()}
              </Badge>
            </div>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent side="right" className="w-[600px]">
          {type === "story" && (
            <StoryCard id={item.id} className="max-h-[80vh] overflow-y-auto" />
          )}
          {type === "actant" && <ActantCard id={item.id} />}
          {type === "lore" && <LoreCard id={item.id} />}
        </PopoverContent>
      </Popover>
    );
  }
);
