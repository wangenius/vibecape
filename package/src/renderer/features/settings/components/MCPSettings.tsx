import { useCallback, useRef, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { dialog } from "@/components/custom/DialogModal";
import { toast } from "sonner";
import { type MCPConfig, type MCPServerConfig, DEFAULT_MCP_CONFIG } from "@common/schema/config";
import { type MCPServerStatus, type MCPTool } from "@common/api/app";
import { useTranslation } from "react-i18next";
import { SettingSection, SettingItem } from "./SettingComponents";
import { CheckCircle, Loader2, Pencil, Play, Plus, RefreshCw, Terminal, Trash2, XCircle, Wrench } from "lucide-react";
import i18n from "@/lib/locales/i18n";

// 解析 MCP JSON 配置，支持两种格式：
// 1. { "mcpServers": { "name": { command, args, env } } }
// 2. { "name": { command, args, env } }
const parseMCPJson = (jsonStr: string): MCPServerConfig[] => {
  const parsed = JSON.parse(jsonStr);
  const serversObj = parsed.mcpServers || parsed;

  const result: MCPServerConfig[] = [];
  for (const [name, config] of Object.entries(serversObj)) {
    const cfg = config as { command?: string; args?: string[]; env?: Record<string, string> };
    if (cfg.command) {
      result.push({
        name,
        command: cfg.command,
        args: cfg.args || [],
        env: cfg.env,
        enabled: true,
      });
    }
  }
  return result;
};

// 将服务器配置转为 JSON 字符串（用于编辑）
const serverToJson = (server: MCPServerConfig): string => {
  const config: Record<string, unknown> = {
    command: server.command,
    args: server.args,
  };
  if (server.env && Object.keys(server.env).length > 0) {
    config.env = server.env;
  }
  return JSON.stringify({ [server.name]: config }, null, 2);
};

// 服务器弹窗内容组件（添加/编辑共用）
const ServerDialogContent = ({
  initialValue,
  onSave,
  close,
}: {
  initialValue?: string;
  onSave: (servers: MCPServerConfig[]) => void;
  close: () => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = i18n.t.bind(i18n);

  const handleConfirm = () => {
    const jsonInput = textareaRef.current?.value || "";
    if (!jsonInput.trim()) return;

    try {
      const newServers = parseMCPJson(jsonInput);
      if (newServers.length === 0) {
        toast.error(t("common.settings.mcpInvalidJson"));
        return;
      }
      onSave(newServers);
      close();
    } catch {
      toast.error(t("common.settings.mcpInvalidJson"));
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        ref={textareaRef}
        defaultValue={initialValue}
        className="w-full min-h-48 px-3 py-2 text-sm font-mono rounded-md border border-input bg-background resize-y"
        placeholder={t("common.settings.mcpJsonPlaceholder")}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={close}>
          {t("common.actions.cancel")}
        </Button>
        <Button onClick={handleConfirm}>
          {t("common.actions.confirm")}
        </Button>
      </div>
    </div>
  );
};

export const MCPSettings = () => {
  const { t } = useTranslation();
  const [mcpConfig, setMcpConfig] = useState<MCPConfig>(DEFAULT_MCP_CONFIG);
  const [serverStatus, setServerStatus] = useState<Record<string, MCPServerStatus>>({});
  const [allTools, setAllTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(true); // 初始为 true，表示正在加载

  // 加载 MCP 配置和状态
  const loadData = useCallback(async () => {
    try {
      // 分开请求，避免一个失败导致全部失败
      const config = await window.api.app.mcp.get();
      setMcpConfig(config);
      
      const status = await window.api.app.mcp.status();
      setServerStatus(status);
      
      const tools = await window.api.app.mcp.tools();
      setAllTools(tools);
    } catch (error) {
      console.error("[MCPSettings] Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // 监听后端 MCP 状态变化事件（如初始化完成）
    const unsubscribe = window.api.app.mcp.onStatusChanged(() => {
      loadData();
    });
    
    return () => unsubscribe();
  }, [loadData]);

  const servers = mcpConfig.servers || [];

  // 更新配置并保存
  const updateMCPConfig = useCallback(async (newConfig: MCPConfig) => {
    setMcpConfig(newConfig);
    setLoading(true);
    try {
      await window.api.app.mcp.set(newConfig);
      // 重新加载状态
      await loadData();
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  // 手动连接服务器
  const handleConnect = useCallback(async (serverName: string) => {
    setLoading(true);
    try {
      const result = await window.api.app.mcp.connect(serverName);
      if (result.success) {
        toast.success(t("common.settings.mcpConnectSuccess", { name: serverName }));
      } else {
        toast.error(result.error || t("common.settings.mcpConnectFailed"));
      }
      await loadData();
    } catch (error) {
      toast.error(String(error));
    } finally {
      setLoading(false);
    }
  }, [loadData, t]);

  // 重新加载所有连接
  const handleReload = useCallback(async () => {
    setLoading(true);
    try {
      await window.api.app.mcp.reload();
      await loadData();
      toast.success(t("common.settings.mcpReloadSuccess"));
    } catch (error) {
      toast.error(String(error));
    } finally {
      setLoading(false);
    }
  }, [loadData, t]);

  const handleMCPEnabledChange = useCallback((checked: boolean) => {
    void updateMCPConfig({ ...mcpConfig, enabled: checked });
  }, [mcpConfig, updateMCPConfig]);

  const handleServersUpdate = useCallback((newServers: MCPServerConfig[]) => {
    void updateMCPConfig({ ...mcpConfig, servers: newServers });
  }, [mcpConfig, updateMCPConfig]);

  // 打开添加弹窗
  const openAddDialog = () => {
    dialog({
      title: t("common.settings.mcpAddServer"),
      description: t("common.settings.mcpPasteJsonDesc"),
      className: "max-w-lg",
      content: (close) => (
        <ServerDialogContent
          close={close}
          onSave={(newServers) => {
            // 合并到现有服务器，按 name 去重
            const existingNames = new Set(servers.map((s) => s.name));
            const toAdd = newServers.filter((s) => !existingNames.has(s.name));
            const toUpdate = newServers.filter((s) => existingNames.has(s.name));

            const merged = servers.map((s) => {
              const updated = toUpdate.find((u) => u.name === s.name);
              return updated ? { ...s, ...updated, enabled: s.enabled } : s;
            });

            handleServersUpdate([...merged, ...toAdd]);
            toast.success(
              t("common.settings.mcpAddServerSuccess") +
                (toAdd.length > 0 ? ` (+${toAdd.length})` : "") +
                (toUpdate.length > 0 ? ` (↻${toUpdate.length})` : "")
            );
          }}
        />
      ),
    });
  };

  // 打开编辑弹窗
  const openEditDialog = (index: number) => {
    const server = servers[index];
    dialog({
      title: t("common.settings.mcpEditServer"),
      description: t("common.settings.mcpPasteJsonDesc"),
      className: "max-w-lg",
      content: (close) => (
        <ServerDialogContent
          initialValue={serverToJson(server)}
          close={close}
          onSave={(newServers) => {
            if (newServers.length === 0) return;
            // 编辑模式：替换当前服务器，保留 enabled 状态
            const updated = { ...newServers[0], enabled: server.enabled };
            const newList = [...servers];
            newList[index] = updated;
            handleServersUpdate(newList);
            toast.success(t("common.settings.mcpUpdateServerSuccess"));
          }}
        />
      ),
    });
  };

  // 删除服务器
  const handleDelete = (index: number) => {
    const newServers = [...servers];
    newServers.splice(index, 1);
    handleServersUpdate(newServers);
  };

  // 切换服务器启用状态
  const handleToggleEnabled = (index: number, enabled: boolean) => {
    const newServers = [...servers];
    newServers[index] = { ...newServers[index], enabled };
    handleServersUpdate(newServers);
  };

  return (
    <div className="space-y-6">
      <SettingSection
        title={t("common.settings.mcpConfig")}
        description={t("common.settings.mcpConfigDesc")}
      >
        <div className="space-y-2">
          <SettingItem
            label={t("common.settings.enableMCP")}
            description={t("common.settings.enableMCPDesc")}
          >
            <Switch
              checked={mcpConfig.enabled}
              onCheckedChange={handleMCPEnabledChange}
            />
          </SettingItem>
        </div>
      </SettingSection>

      {mcpConfig.enabled && (
        <SettingSection
          title={t("common.settings.mcpServers")}
          description={t("common.settings.mcpServersDesc")}
          action={
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleReload}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {t("common.settings.mcpReload")}
              </Button>
              <Button size="sm" onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-1" />
                {t("common.settings.mcpAddServer")}
              </Button>
            </div>
          }
        >
          {servers.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
              {t("common.settings.mcpNoServers")}
            </div>
          ) : (
            <div className="space-y-2">
              {servers.map((server, index) => {
                const status = serverStatus[server.name];
                const isConnected = status?.status === "connected";
                const isConnecting = status?.status === "connecting";
                const hasError = status?.status === "error";
                const toolCount = status?.toolCount || 0;

                return (
                  <div
                    key={server.name}
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* 状态图标 */}
                        {isConnecting ? (
                          <Loader2 className="h-4 w-4 text-yellow-500 animate-spin shrink-0" />
                        ) : isConnected ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : hasError ? (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        ) : (
                          <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">
                            {server.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {server.command} {server.args.join(" ")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* 工具数量 */}
                        {isConnected && toolCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            {toolCount}
                          </span>
                        )}
                        {/* 连接按钮 */}
                        {server.enabled && !isConnected && !isConnecting && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleConnect(server.name)}
                            disabled={loading}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Switch
                          checked={server.enabled}
                          onCheckedChange={(checked) =>
                            handleToggleEnabled(index, checked)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openEditDialog(index)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => handleDelete(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* 错误信息 */}
                    {hasError && status?.error && (
                      <div className="mt-2 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">
                        {status.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SettingSection>
      )}

      {/* 工具列表 */}
      {mcpConfig.enabled && allTools.length > 0 && (
        <SettingSection
          title={t("common.settings.mcpTools")}
          description={t("common.settings.mcpToolsDesc")}
        >
          <div className="space-y-1">
            {allTools.map((tool) => (
              <div
                key={`${tool.serverName}-${tool.name}`}
                className="flex items-start gap-3 p-2 rounded-lg bg-muted/20"
              >
                <Wrench className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {tool.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({tool.serverName})
                    </span>
                  </div>
                  {tool.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {tool.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SettingSection>
      )}
    </div>
  );
};
