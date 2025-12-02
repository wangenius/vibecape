import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, RefreshCw, Search, Server } from "lucide-react";
import { toast } from "sonner";
import { fetchRemoteModels, type RemoteModel } from "@/hook/model/useProvider";
import { createModel } from "@/hook/model/useModel";
import type { Provider } from "@common/schema/app";

const STORAGE_KEY_MODELS = "vibecape:remote-models";
const STORAGE_KEY_PROVIDER = "vibecape:remote-models-provider";

interface RemoteModelsSheetProps {
  provider: Provider;
}

export function RemoteModelsSheet({ provider }: RemoteModelsSheetProps) {
  const [open, setOpen] = useState(false);
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
  const saveToStorage = useCallback((data: RemoteModel[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_MODELS, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEY_PROVIDER, provider.id);
    } catch (e) {
      console.warn("Failed to save to localStorage:", e);
    }
  }, [provider.id]);

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
  const handleAddModel = useCallback(async (remoteModel: RemoteModel) => {
    try {
      await createModel({
        name: remoteModel.id,
        model: remoteModel.id,
        provider_id: provider.id,
        base_url: provider.base_url,
        api_key: provider.api_key,
        type: "text",
        json: false,
        reasoner: false,
      });
      toast.success(`模型 ${remoteModel.id} 添加成功`);
    } catch (error: any) {
      toast.error(error?.message ?? "添加模型失败");
    }
  }, [provider]);

  // 过滤模型
  const filteredModels = useMemo(() => {
    if (!search.trim()) return models;
    const keyword = search.toLowerCase();
    return models.filter(m => m.id.toLowerCase().includes(keyword));
  }, [models, search]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
        >
          <Server className="h-3 w-3 mr-1" />
          {models.length > 0 ? `${models.length} 个模型` : "获取模型"}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            {provider.name} 可用模型
          </SheetTitle>
          <SheetDescription>
            从 {provider.base_url} 获取的模型列表
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-3 py-4 overflow-hidden">
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
              variant="outline"
              size="sm"
              className="h-8 px-3"
              onClick={handleFetch}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "获取中" : "刷新"}
            </Button>
          </div>

          {/* 模型列表 */}
          <div className="flex-1 overflow-y-auto space-y-1">
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
                <div
                  key={model.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium truncate">{model.id}</p>
                    {model.object && (
                      <p className="text-xs text-muted-foreground">{model.object}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleAddModel(model)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
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
      </SheetContent>
    </Sheet>
  );
}
