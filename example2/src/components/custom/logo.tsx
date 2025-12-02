import { HTMLAttributes } from "react";
import clsx from "clsx";
import Image from "next/image";

export const Logo = (props: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      className={clsx(
        "flex items-center w-9 h-9 rounded-full flex-none overflow-hidden justify-center hover:ring-2 hover:ring-muted-foreground/50 hover:ring-offset-2 transition-all duration-300",
        props.className
      )}
    >
      <Image src="/icon.svg" alt="logo" className={"w-full h-full"} />
    </div>
  );
};
