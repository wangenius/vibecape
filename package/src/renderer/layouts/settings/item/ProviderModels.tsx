import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw, Search, Server } from "lucide-react";
import { toast } from "sonner";
import { fetchRemoteModels, type RemoteModel } from "@/hooks/model/useProvider";
import { createModel } from "@/hooks/model/useModel";
import type { Provider } from "@common/schema/app";

export const STORAGE_KEY_MODELS = "vibecape:remote-models";
export const STORAGE_KEY_PROVIDER = "vibecape:remote-models-provider";
// 获取缓存的模型数量
export const getCachedModelCount = (providerId: string): number => {
  try {
    const cachedProviderId = localStorage.getItem(STORAGE_KEY_PROVIDER);
    if (cachedProviderId === providerId) {
      const cached = localStorage.getItem(STORAGE_KEY_MODELS);
      if (cached) {
        return JSON.parse(cached).length;
      }
    }
    return 0;
  } catch {
    return 0;
  }
};
// Dialog 内容组件
export const RemoteModelsDialogContent = ({
  provider,
}: {
  provider: Provider;
}) => {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // 从 localStorage 加载缓存
  const [models, setModels] = useState<RemoteModel[]>(() => {
    try {
      const cachedProviderId = localStorage.getItem(STORAGE_KEY_PROVIDER);
      if (cachedProviderId === provider.id) {
        const cached = localStorage.getItem(STORAGE_KEY_MODELS);
        return cached ? JSON.parse(cached) : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  // 当 provider 变化时，检查是否需要清空缓存
  useEffect(() => {
    const cachedProviderId = localStorage.getItem(STORAGE_KEY_PROVIDER);
    if (cachedProviderId !== provider.id) {
      setModels([]);
    }
  }, [provider.id]);

  // 保存到 localStorage
  const saveToStorage = useCallback(
    (data: RemoteModel[]) => {
      try {
        localStorage.setItem(STORAGE_KEY_MODELS, JSON.stringify(data));
        localStorage.setItem(STORAGE_KEY_PROVIDER, provider.id);
      } catch (e) {
        console.warn("Failed to save to localStorage:", e);
      }
    },
    [provider.id]
  );

  // 获取模型列表
  const handleFetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchRemoteModels(provider.id);
      setModels(result);
      saveToStorage(result);
      toast.success(`获取到 ${result.length} 个模型`);
    } catch (error: any) {
      toast.error(error?.message ?? "获取模型列表失败");
    } finally {
      setLoading(false);
    }
  }, [provider.id, saveToStorage]);

  // 添加模型
  const handleAddModel = useCallback(
    async (remoteModel: RemoteModel) => {
      try {
        await createModel({
          name: remoteModel.id,
          model: remoteModel.id,
          provider_id: provider.id,
          type: "text",
          json: false,
          reasoner: false,
        });
        toast.success(`模型 ${remoteModel.id} 添加成功`);
      } catch (error: any) {
        toast.error(error?.message ?? "添加模型失败");
      }
    },
    [provider.id]
  );

  // 过滤模型
  const filteredModels = useMemo(() => {
    if (!search.trim()) return models;
    const keyword = search.toLowerCase();
    return models.filter((m) => m.id.toLowerCase().includes(keyword));
  }, [models, search]);

  return (
    <div className="flex flex-col gap-3 max-h-[60vh]">
      {/* 搜索和刷新 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索模型..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Button
          
          
          className="h-8 px-3"
          onClick={handleFetch}
          disabled={loading}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "获取中" : "刷新"}
        </Button>
      </div>

      {/* 模型列表 */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-[200px]">
        {filteredModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            {models.length === 0 ? (
              <>
                <Server className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">点击刷新获取模型列表</p>
              </>
            ) : (
              <>
                <Search className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">没有找到匹配的模型</p>
              </>
            )}
          </div>
        ) : (
          filteredModels.map((model) => (
            <div key={model.id} className="item-card">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-label truncate">{model.id}</p>
                {model.object && (
                  <p className="text-xs text-muted-foreground">
                    {model.object}
                  </p>
                )}
              </div>
              <Button
                
                
                className="hover-visible"
                onClick={() => handleAddModel(model)}
              >
                <Plus />
                添加
              </Button>
            </div>
          ))
        )}
      </div>

      {/* 底部统计 */}
      {models.length > 0 && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          共 {models.length} 个模型
          {search && filteredModels.length !== models.length && (
            <span>，显示 {filteredModels.length} 个</span>
          )}
        </div>
      )}
    </div>
  );
};
