import React, { ReactNode, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TbCheck, TbX } from "react-icons/tb";
import { AnimatePresence, motion } from "framer-motion";

interface DialogOptions {
  title?: string | ReactNode;
  description?: string;
  content: ReactNode | ((close: () => void) => ReactNode);
  footer?: ReactNode | ((close: () => void) => ReactNode);
  onClose?: () => void;
  closeIconHide?: boolean;
  className?: string;
  autoFocus?: boolean;
}

type CloseDialog = () => void;

/** 创建一个对话框，可以用于弹窗、提示框等*/
export function dialog({
  title,
  description,
  content,
  footer,
  onClose,
  className,
  closeIconHide,
  autoFocus = true,
  ...props
}: DialogOptions): CloseDialog {
  const existingModals = document.querySelectorAll("[data-dialog-root]").length;
  const zIndex = 50 + existingModals * 10;
  const dialogRoot = document.createElement("div");
  dialogRoot.setAttribute("data-dialog-root", "true");
  document.body.appendChild(dialogRoot);
  const root = ReactDOM.createRoot(dialogRoot);

  const DialogPortal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (autoFocus && dialogRef.current) {
        dialogRef.current.focus();
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.removeChild(dialogRoot);
      };
    }, []);

    const handleClose = () => {
      setIsOpen(false);
    };

    const handleAnimationComplete = () => {
      if (!isOpen) {
        root.unmount();
        if (onClose) onClose();
      }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    };

    return createPortal(
      <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
        {isOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80"
              onClick={handleBackdropClick}
            />
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 400,
                mass: 0.5,
              }}
              onAnimationComplete={() => {
                // 动画完成后，自动聚焦第一个输入框
                const input = dialogRef.current?.querySelector("input");
                if (input instanceof HTMLInputElement) {
                  input.focus();
                }
              }}
              className={cn(
                "relative flex flex-col gap border bg-background shadow-lg rounded-xl max-h-[90vh] max-w-[90vw] overflow-hidden",
                className
              )}
              {...props}
            >
              {(title || !closeIconHide) && (
                <div>
                  {title && (
                    <div>
                      {typeof title === "string" ? (
                        <div>
                          <h2>{title}</h2>
                          {description && <p>{description}</p>}
                        </div>
                      ) : (
                        title
                      )}
                    </div>
                  )}
                  {!closeIconHide && (
                    <Button size="icon" onClick={handleClose}>
                      <TbX />
                    </Button>
                  )}
                </div>
              )}
              {typeof content === "function" ? content(handleClose) : content}

              {footer &&
                (typeof footer === "function" ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {footer(handleClose)}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {footer}
                  </motion.div>
                ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      dialogRoot
    );
  };

  root.render(<DialogPortal />);

  return () => {
    const dialogElement = dialogRoot.firstElementChild;
    if (dialogElement) {
      const closeEvent = new Event("close");
      dialogElement.dispatchEvent(closeEvent);
    }
  };
}

dialog.confirm = ({
  title = "确认",
  content,
  onOk,
  okText = "确认",
  cancelText = "取消",
  onCancel,
}: {
  title?: string;
  content?: ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  variants?:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null;
}) => {
  return dialog({
    title,
    content,
    footer: (close) => {
      return (
        <div className="flex justify-end gap">
          <Button
            onClick={() => {
              close();
              onCancel?.();
            }}
          >
            <TbX />
            {cancelText}
          </Button>
          <Button
            variant={"primary"}
            onClick={() => {
              close();
              onOk?.();
            }}
            autoFocus
          >
            <TbCheck />
            {okText}
          </Button>
        </div>
      );
    },
  });
};
