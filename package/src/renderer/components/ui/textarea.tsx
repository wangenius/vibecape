import {
  useEffect,
  useRef,
  useState,
  ReactNode,
  forwardRef,
  useImperativeHandle,
  KeyboardEventHandler,
} from "react";
import { cn } from "@/lib/utils";

export interface CustomTextAreaRef {
  focus: () => void;
  blur: () => void;
  dom: HTMLTextAreaElement | null;
}

export interface TextareaProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  variant?: "ghost" | "secondary";
  className?: string;
  autoFocus?: boolean;
  minRow?: number;
  footer?: ReactNode;
  header?: ReactNode;
  placeholder?: string;
}

export const Textarea = forwardRef<CustomTextAreaRef, TextareaProps>(
  (
    {
      defaultValue,
      value: controlledValue,
      onValueChange: onChange,
      variant,
      className,
      onKeyDown,
      autoFocus,
      minRow = 1,
      footer,
      header,
      placeholder,
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const [footerHeight, setFooterHeight] = useState(0);
    const [minHeight, setMinHeight] = useState(0);
    const [internalValue, setInternalValue] = useState(defaultValue || "");

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;

    useImperativeHandle(ref, () => ({
      focus: () => internalRef.current?.focus(),
      blur: () => internalRef.current?.blur(),
      dom: internalRef.current,
    }));

    // Footer height observer
    useEffect(() => {
      const updateFooterHeight = () => {
        if (footerRef.current) {
          const newHeight = footerRef.current.offsetHeight;
          if (newHeight !== footerHeight) {
            setFooterHeight(newHeight);
          }
        }
      };

      updateFooterHeight();

      if (footerRef.current) {
        const observer = new MutationObserver(updateFooterHeight);
        observer.observe(footerRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
        });
        return () => observer.disconnect();
      }
      return undefined;
    }, [footer, footerHeight]);

    // Calculate min height based on minRow
    useEffect(() => {
      if (internalRef.current) {
        const style = window.getComputedStyle(internalRef.current);
        const lineHeight = parseInt(style.lineHeight, 10);
        const paddingTop = parseInt(style.paddingTop, 10);
        const paddingBottom = parseInt(style.paddingBottom, 10);
        setMinHeight(lineHeight * minRow + paddingTop + paddingBottom);
      }
    }, [minRow]);

    // Auto resize height
    const adjustHeight = () => {
      const textarea = internalRef.current;
      if (textarea) {
        const scrollPos = window.scrollY;
        textarea.style.height = "auto";
        const newHeight = Math.max(textarea.scrollHeight, minHeight);
        textarea.style.height = `${newHeight}px`;
        window.scrollTo(0, scrollPos);
      }
    };

    useEffect(() => {
      adjustHeight();
      const handleResize = () => adjustHeight();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [value, minHeight]);

    useEffect(() => {
      if (defaultValue !== undefined) {
        setInternalValue(defaultValue);
      }
    }, [defaultValue]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      adjustHeight();
      onChange?.(newValue);
    };

    return (
      <div className="relative">
        {header && <div>{header}</div>}
        <textarea
          ref={internalRef}
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onKeyDown={(e) => {
            e.stopPropagation();
            onKeyDown?.(e);
          }}
          onChange={handleChange}
          onInput={!onChange ? adjustHeight : undefined}
          className={cn(
            variant === "secondary" && "textarea-secondary",
            variant === "ghost" && "textarea-ghost",
            className
          )}
          style={{
            resize: "none",
            overflow: "hidden",
            minHeight: `${minHeight}px`,
            paddingBottom: footer ? `${footerHeight + 16}px` : undefined,
          }}
        />
        {footer && (
          <div
            ref={footerRef}
            className="absolute bottom-1 left-0 right-0 transition-all duration-200"
          >
            {footer}
          </div>
        )}
      </div>
    );
  }
);

export default Textarea;
