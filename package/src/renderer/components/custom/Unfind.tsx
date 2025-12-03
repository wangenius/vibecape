import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Unfind = ({
  className,
  title,
  description,
}: {
  className?: string;
  title?: string;
  description?: string;
}) => {
  const { t } = useTranslation();
  const displayTitle = title || t("common.unfindTitle");
  const displayDesc = description || t("common.unfindDesc");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center h-full text-center px-6 py-8",
        className
      )}
    >
      <Search className="w-10 h-10 text-muted-foreground/20 mb-4" />
      <div className="text-sm font-medium text-muted-foreground/60 mb-1">
        {displayTitle}
      </div>
      <div className="text-xs text-muted-foreground/40">{displayDesc}</div>
    </motion.div>
  );
};
