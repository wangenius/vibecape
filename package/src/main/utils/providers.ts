import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createXai } from "@ai-sdk/xai";
import type { Model as ModelRecord } from "@common/schema/app";
import { createProxyFetchConfig } from "./proxy";
import { Provider } from "../services/Provider";

/**
 * 根据模型配置创建对应的 provider
 */
export async function createProviderForModel(model: ModelRecord) {
  // 从 Provider 获取 api_key 和 base_url
  const provider = Provider.get(model.provider_id);
  if (!provider) {
    throw new Error(`Provider ${model.provider_id} 不存在`);
  }
  const baseURL = provider.base_url || undefined;
  const apiKey = provider.api_key;

  // 获取代理配置（通过环境变量自动应用）
  await createProxyFetchConfig();

  const url = baseURL?.toLowerCase() || "";

  // Google/Gemini models
  if (url.includes("googleapis.com")) {
    return createGoogleGenerativeAI({
      apiKey,
      baseURL,
    });
  }

  // DeepSeek models
  if (url.includes("deepseek.com")) {
    return createDeepSeek({
      apiKey,
      baseURL,
    });
  }

  // Xai/Grok models
  if (url.includes("x.ai")) {
    console.log("createXai", apiKey, baseURL);
    return createXai({
      apiKey,
      baseURL,
    });
  }

  // OpenAI models
  if (url.includes("openai.com")) {
    return createOpenAI({
      apiKey,
      baseURL,
    });
  }

  return createOpenAICompatible({
    name: model.name || "custom",
    apiKey,
    baseURL: baseURL || "",
  });
}

/**
 * 获取模型实例
 */
export async function getModelInstance(model: ModelRecord) {
  const provider = await createProviderForModel(model);
  return provider(model.model);
}
