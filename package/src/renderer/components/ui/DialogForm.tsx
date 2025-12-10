import { ReactNode, useState } from "react";
import {
  useForm,
  UseFormReturn,
  FieldValues,
  DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ZodObject, type ZodRawShape, type ZodTypeAny } from "zod";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
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
import { dialog } from "./dialog";

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
function inferFieldType(
  zodType: ZodTypeAny,
  fieldConfig?: FieldConfig
): "text" | "number" | "switch" | "select" | "textarea" | "password" {
  if (fieldConfig?.type) return fieldConfig.type;
  const typeName = zodType._def.typeName;
  if (typeName === "ZodBoolean") return "switch";
  if (typeName === "ZodNumber") return "number";
  if (typeName === "ZodEnum") return "select";
  if (fieldConfig?.options) return "select";
  return "text";
}

/** 获取 ZodEnum 的选项 */
function getEnumOptions(
  zodType: ZodTypeAny,
  fieldConfig?: FieldConfig
): Array<{ value: string; label: string }> {
  if (fieldConfig?.options) return fieldConfig.options;
  if (zodType._def.typeName === "ZodEnum") {
    return zodType._def.values.map((v: string) => ({ value: v, label: v }));
  }
  return [];
}

/** 解包 Zod 类型 */
function unwrapZodType(zodType: ZodTypeAny): ZodTypeAny {
  const typeName = zodType._def.typeName;
  if (
    typeName === "ZodOptional" ||
    typeName === "ZodNullable" ||
    typeName === "ZodDefault"
  ) {
    return unwrapZodType(zodType._def.innerType);
  }
  return zodType;
}

interface DialogFormOptions<T extends FieldValues> {
  title?: string | ReactNode;
  description?: string;
  schema: ZodObject<ZodRawShape>;
  fields?: FieldsConfig;
  defaultValues?: DefaultValues<T>;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  className?: string;
  renderField?: (name: string, form: UseFormReturn<T>) => ReactNode;
}

// ============ 富文本编辑器组件 ============

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  hasError,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "输入内容...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rich-editor-content",
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getText());
    },
  });

  return (
    <div
      className={cn(
        "w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background transition-colors",
        "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-20",
        "[&_.ProseMirror_p]:m-0 [&_.ProseMirror_p]:leading-relaxed",
        "[&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:text-muted-foreground/50 [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:h-0 [&_.is-editor-empty]:before:pointer-events-none",
        hasError && "border-destructive"
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
};

// ============ 自动表单字段渲染 ============

interface AutoFieldProps<T extends FieldValues> {
  name: string;
  zodType: ZodTypeAny;
  form: UseFormReturn<T>;
  config?: FieldConfig;
  renderCustom?: (name: string, form: UseFormReturn<T>) => ReactNode;
}

function AutoField<T extends FieldValues>({
  name,
  zodType,
  form,
  config = {},
  renderCustom,
}: AutoFieldProps<T>) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;
  const error = errors[name];
  const value = watch(name as any);

  if (config.hidden) return null;

  const unwrapped = unwrapZodType(zodType);
  const fieldType = inferFieldType(unwrapped, config);
  const label = config.label ?? name;

  // 检查是否为必填字段
  const isRequired =
    zodType._def.typeName !== "ZodOptional" &&
    zodType._def.typeName !== "ZodNullable";

  // 渲染标签（带必填标记）
  const renderLabel = () => (
    <Label>
      {label}
      {isRequired && <span className="text-destructive ml-1">*</span>}
    </Label>
  );

  if (renderCustom) {
    const custom = renderCustom(name, form);
    if (custom) return <>{custom}</>;
  }

  const renderInput = () => {
    switch (fieldType) {
      case "switch":
        return (
          <div className="flex items-center justify-between">
            <div>
              <Label>{label}</Label>
              {config.description && (
                <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
              )}
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
          <div className="flex flex-col gap-1.5">
            {renderLabel()}
            <Select
              value={value as string}
              onValueChange={(v) => setValue(name as any, v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder={config.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {config.description && (
              <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
            )}
            {error && (
              <p className="text-xs text-destructive mt-1">{error.message as string}</p>
            )}
          </div>
        );
      }

      case "textarea":
        return (
          <div className="flex flex-col gap-1.5">
            {renderLabel()}
            <RichTextEditor
              value={value as string}
              onChange={(v) => setValue(name as any, v as any)}
              placeholder={config.placeholder}
              hasError={!!error}
            />
            {config.description && (
              <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
            )}
            {error && (
              <p className="text-xs text-destructive mt-1">{error.message as string}</p>
            )}
          </div>
        );

      case "number":
        return (
          <div className="flex flex-col gap-1.5">
            {renderLabel()}
            <Input
              {...register(name as any, { valueAsNumber: true })}
              type="number"
              placeholder={config.placeholder}
            />
            {config.description && (
              <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
            )}
            {error && (
              <p className="text-xs text-destructive mt-1">{error.message as string}</p>
            )}
          </div>
        );

      case "password":
        return (
          <div className="flex flex-col gap-1.5">
            {renderLabel()}
            <Input
              {...register(name as any)}
              type="password"
              placeholder={config.placeholder}
            />
            {config.description && (
              <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
            )}
            {error && (
              <p className="text-xs text-destructive mt-1">{error.message as string}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-col gap-1.5">
            {renderLabel()}
            <Input
              {...register(name as any)}
              type="text"
              placeholder={config.placeholder}
            />
            {config.description && (
              <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
            )}
            {error && (
              <p className="text-xs text-destructive mt-1">{error.message as string}</p>
            )}
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

  const schemaFields = Object.entries(options.schema.shape);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
      <div className="space-y-md">
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

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            options.onCancel?.();
            onClose();
          }}
          disabled={isSubmitting}
        >
          {options.cancelText ?? "取消"}
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "..." : (options.submitText ?? "保存")}
        </Button>
      </div>
    </form>
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
export function dialogForm<T extends FieldValues>(
  options: DialogFormOptions<T>
): CloseDialog {
  return dialog({
    title: options.title,
    description: options.description,
    className: options.className,
    onClose: options.onCancel,
    content: (close) => <DialogFormContent options={options} onClose={close} />,
  });
}
