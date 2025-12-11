import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { dialog } from "@/components/ui/dialog";
import { CachedAvatar } from "@/hooks/util/useAvatarCache";
import type { HeroInfo } from "@common/api/chat";
import { getPrompt, type LocaleLike } from "@common/types/hero";
import { useTranslation } from "react-i18next";

interface HeroSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heroes: HeroInfo[];
  currentHero: HeroInfo | undefined;
  onSelect: (agentId: string) => void;
}

export const HeroSelector: React.FC<HeroSelectorProps> = ({
  open,
  onOpenChange,
  heroes,
  currentHero,
  onSelect,
}) => {
  const { t, i18n } = useTranslation();
  const locale: LocaleLike = i18n.language?.startsWith("zh") ? "zh" : "en";

  const handleSelectAgent = useCallback(
    (agentId: string) => {
      console.log("[AgentSelector] handleSelectAgent:", agentId);
      onSelect(agentId);
      onOpenChange(false);
    },
    [onSelect, onOpenChange]
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          
          
          className="h-6 gap-1.5 pl-0 pr-2 text-xs rounded-full"
          title={t("chat.agent.switchAgent")}
        >
          <CachedAvatar
            src={
              currentHero?.avatar ||
              "https://avatar.iran.liara.run/public/girl?username=Maria"
            }
            alt=""
            className="size-5 rounded-full"
          />
          <span className="max-w-20 truncate">
            {currentHero?.name || t("chat.agent.defaultName")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-64 p-2"
        sideOffset={5}
      >
        <div className="space-y-2">
          <div className="px-2 py-1">
            <h4 className="text-xs font-medium text-foreground">
              {t("chat.agent.selectAgent")}
            </h4>
            <p className="text-[10px] text-muted-foreground">
              {t("chat.agent.selectAgentDesc")}
            </p>
          </div>
          <div className="max-h-[50vh] space-y-0.5 overflow-y-auto">
            {heroes.map((agent) => (
              <div
                key={agent.id}
                className={cn(
                  "w-full rounded-md px-2 py-2 text-left transition flex items-start gap-2 cursor-pointer",
                  agent.id === currentHero?.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
                onClick={() => handleSelectAgent(agent.id)}
              >
                <CachedAvatar
                  src={agent.avatar}
                  alt=""
                  className="size-7 rounded-full shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    dialog({
                      title: (
                        <div className="flex items-center gap-3">
                          <CachedAvatar
                            src={agent.avatar}
                            alt=""
                            className="size-10 rounded-full"
                          />
                          <span>{agent.name}</span>
                        </div>
                      ),
                      className: "max-w-sm",
                      content: (close) => (
                        <div className="space-y-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {t("chat.agent.intro")}
                            </div>
                            <p className="text-sm">
                              {getPrompt(agent.description, locale)}
                            </p>
                          </div>
                          <Button
                            className="w-full"
                            
                            onClick={() => {
                              handleSelectAgent(agent.id);
                              close();
                            }}
                          >
                            {t("chat.agent.useThisAgent")}
                          </Button>
                        </div>
                      ),
                    });
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium truncate">
                    {agent.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-2">
                    {getPrompt(agent.description, locale)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
