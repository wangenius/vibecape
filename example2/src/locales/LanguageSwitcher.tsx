"use client";

import { useLanguage } from "@/locales/LanguageProvider";
import type { Locale } from "@/locales/dictionaries";
import { cn } from "@/lib/utils";
import { Button } from "../components/ui/button";

interface LanguageSwitcherProps {
  variant?: "compact" | "full";
  className?: string;
}

const toggleLanguage = (current: Locale): Locale =>
  current === "en" ? "cn" : "en";

export function LanguageSwitcher({
  variant = "compact",
  className,
}: LanguageSwitcherProps) {
  const { language, setLanguage, dictionary } = useLanguage();
  const { languageSwitcher } = dictionary.navigation;
  const nextLanguage = toggleLanguage(language);
  const handleSwitchLanguage = () => {
    setLanguage(nextLanguage);
  };

  return (
    <div
      className={cn(
        variant === "full" ? "flex flex-col gap-2" : "flex items-center gap-2",
        className
      )}
    >
      {variant === "full" && (
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {languageSwitcher.title}
        </span>
      )}
      <Button
        type="button"
        aria-label={languageSwitcher.ariaLabel}
        onClick={handleSwitchLanguage}
        variant="ghost"
        size="icon"
        className="h-8 w-8"
      >
        {languageSwitcher.options[language].short}
      </Button>
    </div>
  );
}
