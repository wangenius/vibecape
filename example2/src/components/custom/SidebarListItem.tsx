import { forwardRef, ReactNode } from "react";
import { PiSmileyBlankDuotone } from "react-icons/pi";
import { Button } from "@/components/ui/button";

export const SidebarListItem = forwardRef<
  HTMLDivElement,
  {
    icon?: ReactNode;
    name?: string;
    description?: string;
    focus?: boolean;
    isDragging?: boolean;
    main?: boolean;
    onContextMenu?: (
      event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => void;
    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  }
>(
  (
    {
      name,
      description,
      main,
      onClick,
      focus,
      icon,
      isDragging,
      onContextMenu,
    },
    ref
  ) => {
    return (
      <div
        onClick={onClick}
        onContextMenu={onContextMenu}
        ref={ref}
        className={`hover:bg-muted hover:border-base-300 ${
          focus && "bg-muted"
        } rounded cursor-pointer p-2 flex gap-2 items-center
      transition
      ${isDragging && "opacity-50"}
      `}
      >
        <Button size={"icon"}>{icon}</Button>
        <div className={"flex flex-1 flex-col justify-center"}>
          <span
            className={"font-medium text-sm flex justify-between items-center"}
          >
            {name}
            {main && <PiSmileyBlankDuotone className={"fill-amber-600"} />}
          </span>
          <span
            hidden={!description}
            className={"text-[12px] text-muted-foreground/80 line-clamp-1"}
          >
            {description}
          </span>
        </div>
      </div>
    );
  }
);

SidebarListItem.displayName = "SidebarListItem";
