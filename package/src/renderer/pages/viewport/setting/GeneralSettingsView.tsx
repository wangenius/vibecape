import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { setLang } from "@/locales/i18n";
import { updateSettings, useSettings } from "@/hook/app/useSettings";
import { settingsShape } from "@common/config/settings";
import { useCallback } from "react";

const THEME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "default", label: "默认" },
  { value: "dim", label: "微光" },
  { value: "forest", label: "森林" },
  { value: "graph", label: "图谱" },
  { value: "haze", label: "雾霾" },
  { value: "mono", label: "单色" },
  { value: "ocean", label: "海洋" },
  { value: "sunset", label: "日落" },
  { value: "vercel", label: "Vercel" },
];

export const GeneralSettingsView = () => {
  const settings = useSettings();

  const handleThemeChange = useCallback((value: string) => {
    void updateSettings(settingsShape.ui.theme, value as typeof settings.ui.theme);
  }, []);

  const handleModeChange = useCallback(
    (checked: boolean) => {
      void updateSettings(settingsShape.ui.mode, checked ? "dark" : "light");
    },
    []
  );

  const handleLanguageChange = useCallback((value: string) => {
    setLang(value as "zh-CN" | "en-US");
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <section className="space-y-4">
        <header>
          <h3 className="text-base font-semibold">外观</h3>
          <p className="text-sm text-muted-foreground mt-1">
            自定义界面外观、主题与语言
          </p>
        </header>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {settings.ui.mode === "dark" ? "黑暗模式" : "明亮模式"}
              </span>
              <p className="text-xs text-muted-foreground">
                切换明亮和黑暗显示模式
              </p>
            </div>
            <Switch
              checked={settings.ui.mode === "dark"}
              onCheckedChange={handleModeChange}
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">主题</span>
              <p className="text-xs text-muted-foreground">
                选择界面主题风格
              </p>
            </div>
            <Select
              value={settings.ui.theme}
              onValueChange={handleThemeChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">语言</span>
              <p className="text-xs text-muted-foreground">
                选择界面显示语言
              </p>
            </div>
            <Select
              value={settings.ui.language}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <h3 className="text-base font-semibold">写作助手</h3>
          <p className="text-sm text-muted-foreground mt-1">
            配置写作时的自动推理与上下文设置
          </p>
        </header>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">自动推理</span>
              <p className="text-xs text-muted-foreground">
                生成内容时自动推理重要信息
              </p>
            </div>
            <Switch
              checked={settings.novel.autoInfer}
              onCheckedChange={(checked) =>
                updateSettings(settingsShape.novel.autoInfer, checked)
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">上下文关联</span>
              <p className="text-xs text-muted-foreground">
                在生成内容时保留上下文联系
              </p>
            </div>
            <Switch
              checked={settings.novel.enableContext}
              onCheckedChange={(checked) =>
                updateSettings(settingsShape.novel.enableContext, checked)
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <h3 className="text-base font-semibold">网络代理</h3>
          <p className="text-sm text-muted-foreground mt-1">
            配置应用访问外部服务时的代理设置
          </p>
        </header>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">启用代理</span>
              <p className="text-xs text-muted-foreground">
                通过代理访问外部网络服务
              </p>
            </div>
            <Switch
              checked={settings.general.proxy.enabled}
              onCheckedChange={(checked) =>
                updateSettings(settingsShape.general.proxy.enabled, checked)
              }
            />
          </div>

          {settings.general.proxy.enabled ? (
            <div className="rounded-lg bg-background p-3 space-y-2">
              <label className="text-sm font-medium">代理地址</label>
              <Input
                placeholder="例如：http://127.0.0.1:7890"
                value={settings.general.proxy.url}
                onChange={(event) =>
                  updateSettings(
                    settingsShape.general.proxy.url,
                    event.target.value
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                支持 HTTP、HTTPS 代理地址
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};
