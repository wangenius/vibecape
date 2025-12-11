import { ReactNode, useState } from "react";
import {
  useForm,
  UseFormReturn,
  FieldValues,
  DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ZodObject, type ZodRawShape, type ZodTypeAny } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2 } from "lucide-react";

// ============ 类型定义 ============

export interface FieldConfig {
  label?: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "password" | "textarea" | "number" | "select" | "switch";
  options?: Array<{ value: string; label: string }>;
  hidden?: boolean;
}

export type FieldsConfig = Record<string, FieldConfig>;

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

// ============ 工具函数 ============

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

// ============ 表单字段组件 ============

interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  horizontal?: boolean;
}

const FormField = ({
  label,
  description,
  error,
  required,
  children,
  horizontal,
}: FormFieldProps) => {
  if (horizontal) {
    return (
      <div className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm text-foreground">{label}</span>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5 px-1">
        <span className="text-sm text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      {children}
      {error && <span className="text-xs text-destructive px-1">{error}</span>}
    </div>
  );
};

// ============ 自动字段渲染 ============

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
  const isRequired =
    zodType._def.typeName !== "ZodOptional" &&
    zodType._def.typeName !== "ZodNullable";

  if (renderCustom) {
    const custom = renderCustom(name, form);
    if (custom) return <>{custom}</>;
  }

  switch (fieldType) {
    case "switch":
      return (
        <FormField label={label} description={config.description} horizontal>
          <Switch
            checked={value as boolean}
            onCheckedChange={(v) => setValue(name as any, v as any)}
          />
        </FormField>
      );

    case "select": {
      const options = getEnumOptions(unwrapped, config);
      return (
        <FormField
          label={label}
          description={config.description}
          error={error?.message as string}
          required={isRequired}
        >
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
        </FormField>
      );
    }

    case "textarea":
      return (
        <FormField
          label={label}
          description={config.description}
          error={error?.message as string}
          required={isRequired}
        >
          <textarea
            className={cn(
              "min-h-24 p-3 resize-none",
              error && "border-destructive"
            )}
            value={(value as string) || ""}
            onChange={(e) => setValue(name as any, e.target.value as any)}
            placeholder={config.placeholder}
          />
        </FormField>
      );

    case "number":
      return (
        <FormField
          label={label}
          description={config.description}
          error={error?.message as string}
          required={isRequired}
        >
          <Input
            {...register(name as any, { valueAsNumber: true })}
            type="number"
            placeholder={config.placeholder}
            className={cn(error && "border-destructive")}
          />
        </FormField>
      );

    case "password":
      return (
        <FormField
          label={label}
          description={config.description}
          error={error?.message as string}
          required={isRequired}
        >
          <Input
            {...register(name as any)}
            type="password"
            placeholder={config.placeholder}
            className={cn(error && "border-destructive")}
          />
        </FormField>
      );

    default:
      return (
        <FormField
          label={label}
          description={config.description}
          error={error?.message as string}
          required={isRequired}
        >
          <Input
            {...register(name as any)}
            type="text"
            placeholder={config.placeholder}
            className={cn(error && "border-destructive")}
          />
        </FormField>
      );
  }
}

// ============ Dialog Form 内容 ============

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
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

      <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
        <Button
          type="button"
          onClick={() => {
            options.onCancel?.();
            onClose();
          }}
          disabled={isSubmitting}
        >
          {options.cancelText ?? "取消"}
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {options.submitText ?? "保存"}
        </Button>
      </div>
    </form>
  );
}

// ============ 主函数 ============

type CloseDialog = () => void;

export function dialogForm<T extends FieldValues>(
  options: DialogFormOptions<T>
): CloseDialog {
  return dialog({
    title: options.title,
    description: options.description,
    className: cn("w-96 p-5", options.className),
    onClose: options.onCancel,
    content: (close) => <DialogFormContent options={options} onClose={close} />,
  });
}
