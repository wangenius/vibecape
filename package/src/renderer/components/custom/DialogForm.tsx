import React, { ReactNode, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { createPortal } from "react-dom";
import { useForm, UseFormReturn, FieldValues, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, type ZodObject, type ZodRawShape, type ZodTypeAny } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TbCheck, TbX } from "react-icons/tb";
import { AnimatePresence, motion } from "framer-motion";

// ============ 类型定义 ============

/** 字段 UI 配置 */
export interface FieldConfig {
  label?: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "password" | "textarea" | "number" | "select" | "switch";
  options?: Array<{ value: string; label: string }>;
  hidden?: boolean;
}

/** 字段配置映射 */
export type FieldsConfig = Record<string, FieldConfig>;

/** 从 Zod schema 推断字段类型 */
function inferFieldType(zodType: ZodTypeAny, fieldConfig?: FieldConfig): "text" | "number" | "switch" | "select" | "textarea" | "password" {
  // 优先使用显式配置
  if (fieldConfig?.type) return fieldConfig.type;
  
  const typeName = zodType._def.typeName;
  if (typeName === "ZodBoolean") return "switch";
  if (typeName === "ZodNumber") return "number";
  if (typeName === "ZodEnum") return "select";
  if (fieldConfig?.options) return "select";
  
  return "text";
}

/** 获取 ZodEnum 的选项 */
function getEnumOptions(zodType: ZodTypeAny, fieldConfig?: FieldConfig): Array<{ value: string; label: string }> {
  // 优先使用显式配置的 options
  if (fieldConfig?.options) return fieldConfig.options;
  
  if (zodType._def.typeName === "ZodEnum") {
    return zodType._def.values.map((v: string) => ({ value: v, label: v }));
  }
  return [];
}

/** 解包 Zod 类型（处理 optional, default 等包装） */
function unwrapZodType(zodType: ZodTypeAny): ZodTypeAny {
  const typeName = zodType._def.typeName;
  if (typeName === "ZodOptional" || typeName === "ZodNullable" || typeName === "ZodDefault") {
    return unwrapZodType(zodType._def.innerType);
  }
  return zodType;
}

interface DialogFormOptions<T extends FieldValues> {
  /** 标题，同时作为持久化 ID */
  title?: string | ReactNode;
  description?: string;
  schema: ZodObject<ZodRawShape>;
  /** 字段 UI 配置 */
  fields?: FieldsConfig;
  defaultValues?: DefaultValues<T>;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  className?: string;
  /** 自定义字段渲染 */
  renderField?: (name: string, form: UseFormReturn<T>) => ReactNode;
}

// ============ 自动表单字段渲染 ============

interface AutoFieldProps<T extends FieldValues> {
  name: string;
  zodType: ZodTypeAny;
  form: UseFormReturn<T>;
  config?: FieldConfig;
  renderCustom?: (name: string, form: UseFormReturn<T>) => ReactNode;
}

function AutoField<T extends FieldValues>({ name, zodType, form, config = {}, renderCustom }: AutoFieldProps<T>) {
  const { register, formState: { errors }, setValue, watch } = form;
  const error = errors[name];
  const value = watch(name as any);
  
  // 隐藏字段
  if (config.hidden) return null;
  
  const unwrapped = unwrapZodType(zodType);
  const fieldType = inferFieldType(unwrapped, config);
  // 使用字段名作为默认 label
  const label = config.label ?? name;
  
  // 自定义渲染
  if (renderCustom) {
    const custom = renderCustom(name, form);
    if (custom) return <>{custom}</>;
  }

  const renderInput = () => {
    switch (fieldType) {
      case "switch":
        return (
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{label}</Label>
              {config.description && <p className="text-xs text-muted-foreground">{config.description}</p>}
            </div>
            <Switch
              checked={value as boolean}
              onCheckedChange={(v) => setValue(name as any, v as any)}
            />
          </div>
        );

      case "select": {
        const options = getEnumOptions(unwrapped, config);
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <Select value={value as string} onValueChange={(v) => setValue(name as any, v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={config.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {config.description && <p className="text-xs text-muted-foreground">{config.description}</p>}
            {error && <p className="text-xs text-destructive">{error.message as string}</p>}
          </div>
        );
      }

      case "textarea":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <textarea
              {...register(name as any)}
              placeholder={config.placeholder}
              className={cn(
                "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-destructive"
              )}
            />
            {config.description && <p className="text-xs text-muted-foreground">{config.description}</p>}
            {error && <p className="text-xs text-destructive">{error.message as string}</p>}
          </div>
        );

      case "number":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <Input
              {...register(name as any, { valueAsNumber: true })}
              type="number"
              placeholder={config.placeholder}
              className={cn(error && "border-destructive")}
            />
            {config.description && <p className="text-xs text-muted-foreground">{config.description}</p>}
            {error && <p className="text-xs text-destructive">{error.message as string}</p>}
          </div>
        );

      case "password":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <Input
              {...register(name as any)}
              type="password"
              placeholder={config.placeholder}
              className={cn(error && "border-destructive")}
            />
            {config.description && <p className="text-xs text-muted-foreground">{config.description}</p>}
            {error && <p className="text-xs text-destructive">{error.message as string}</p>}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <Input
              {...register(name as any)}
              type="text"
              placeholder={config.placeholder}
              className={cn(error && "border-destructive")}
            />
            {config.description && <p className="text-xs text-muted-foreground">{config.description}</p>}
            {error && <p className="text-xs text-destructive">{error.message as string}</p>}
          </div>
        );
    }
  };

  return renderInput();
}

// ============ Dialog Form 内容组件 ============

function DialogFormContent<T extends FieldValues>({
  options,
  onClose,
}: {
  options: DialogFormOptions<T>;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<T>({
    resolver: zodResolver(options.schema as any),
    defaultValues: options.defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true);
      await options.onSubmit(data);
      onClose();
    } catch {
      // 错误由 onSubmit 处理
    } finally {
      setIsSubmitting(false);
    }
  });

  // 从 schema 获取字段
  const schemaFields = Object.entries(options.schema.shape);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-4">
        {schemaFields.map(([name, zodType]) => (
          <AutoField
            key={name}
            name={name}
            zodType={zodType as ZodTypeAny}
            form={form}
            config={options.fields?.[name]}
            renderCustom={options.renderField}
          />
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-3 text-xs"
          onClick={() => {
            options.onCancel?.();
            onClose();
          }}
          disabled={isSubmitting}
        >
          <TbX className="w-4 h-4" />
          {options.cancelText ?? "取消"}
        </Button>
        <Button type="submit" className="h-8 px-3 text-xs" disabled={isSubmitting}>
          <TbCheck className="w-4 h-4" />
          {options.submitText ?? "保存"}
        </Button>
      </div>
    </form>
  );
}

// ============ Dialog Form Portal ============

function DialogFormPortal<T extends FieldValues>({
  options,
  onUnmount,
}: {
  options: DialogFormOptions<T>;
  onUnmount: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleClose = () => setIsOpen(false);
  const handleAnimationComplete = () => { if (!isOpen) onUnmount(); };
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return createPortal(
    <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 400, mass: 0.5 }}
            className={cn(
              "relative z-50 max-h-[85vh] max-w-[80vw] rounded-lg bg-background p-6 pt-3 shadow-lg w-[480px] flex flex-col gap-4 border border-border",
              options.className
            )}
          >
            {options.title && (
              <div className="flex items-center justify-between mt-1 mb-2 flex-none">
                <div>
                  {typeof options.title === "string" ? (
                    <>
                      <h2 className="font-semibold">{options.title}</h2>
                      {options.description && (
                        <p className="text-sm text-muted-foreground">{options.description}</p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 font-semibold">{options.title}</div>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full hover:bg-muted">
                  <TbX className="h-4 w-4" />
                </Button>
              </div>
            )}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-y-auto">
              <DialogFormContent options={options} onClose={handleClose} />
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ============ 主函数 ============

type CloseDialog = () => void;

/**
 * 打开一个表单对话框 - 自动从 schema 推断字段
 * 
 * @example
 * ```tsx
 * const schema = z.object({
 *   name: z.string().min(1, "名称不能为空").describe("名称"),
 *   email: z.string().email().describe('{"label":"邮箱","placeholder":"请输入邮箱"}'),
 *   type: z.enum(["admin", "user"]).describe("类型"),
 *   enabled: z.boolean().describe("启用"),
 * });
 * 
 * dialogForm({
 *   title: "添加用户",
 *   schema,
 *   defaultValues: { name: "", email: "", type: "user", enabled: true },
 *   onSubmit: async (data) => {
 *     await createUser(data);
 *   },
 * });
 * ```
 */
export function dialogForm<T extends FieldValues>(options: DialogFormOptions<T>): CloseDialog {
  if (typeof window !== "undefined" && window.event) {
    window.event.stopPropagation?.();
  }

  const dialogRoot = document.createElement("div");
  document.body.appendChild(dialogRoot);
  const root = ReactDOM.createRoot(dialogRoot);

  const unmount = () => {
    root.unmount();
    if (dialogRoot.parentNode) dialogRoot.parentNode.removeChild(dialogRoot);
  };

  root.render(<DialogFormPortal options={options} onUnmount={unmount} />);
  return unmount;
}

// ============ 快捷方法 ============

/** 快速创建输入对话框 */
dialogForm.input = ({
  title,
  label,
  placeholder,
  defaultValue = "",
  onSubmit,
  required = true,
}: {
  title: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  onSubmit: (value: string) => void | Promise<void>;
  required?: boolean;
}) => {
  const schema = z.object({
    value: (required ? z.string().min(1, "此项不能为空") : z.string())
      .describe(JSON.stringify({ label, placeholder })),
  });

  return dialogForm({
    title,
    schema,
    defaultValues: { value: defaultValue },
    onSubmit: async (data) => await onSubmit(data.value),
  });
};

/** 快速创建确认对话框 */
dialogForm.confirm = ({
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "确认",
  cancelText = "取消",
}: {
  title: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}) => {
  return dialogForm({
    title,
    description,
    schema: z.object({}),
    defaultValues: {},
    submitText: confirmText,
    cancelText,
    onSubmit: onConfirm,
    onCancel,
  });
};
