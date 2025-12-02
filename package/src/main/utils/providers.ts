import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createXai } from "@ai-sdk/xai";
import type { Model as ModelRecord } from "@common/schema/app";
import { createProxyFetchConfig } from "./proxy";

/**
 * 根据模型配置创建对应的 provider
 */
export async function createProviderForModel(model: ModelRecord) {
  const baseURL = model.base_url || undefined;
  const apiKey = model.api_key;

  // 获取代理配置（通过环境变量自动应用）
  await createProxyFetchConfig();

  // 根据 model name、id 或 base_url 判断使用哪个 provider
  const modelName = model.model?.toLowerCase() || "";
  const modelId = model.id?.toLowerCase() || "";
  const url = baseURL?.toLowerCase() || "";

  // Google/Gemini models
  if (
    modelName.includes("gemini") ||
    modelId.includes("gemini") ||
    url.includes("googleapis.com")
  ) {
    return createGoogleGenerativeAI({
      apiKey,
      baseURL,
    });
  }

  // DeepSeek models
  if (
    modelName.includes("deepseek") ||
    modelId.includes("deepseek") ||
    url.includes("deepseek.com")
  ) {
    return createDeepSeek({
      apiKey,
      baseURL,
    });
  }

  // Xai/Grok models
  if (
    modelName.includes("grok") ||
    modelId.includes("grok") ||
    url.includes("x.ai")
  ) {
    console.log("createXai", apiKey, baseURL);
    return createXai({
      apiKey,
      baseURL,
    });
  }

  // // OpenAI models
  // if (
  //   modelName.includes("gpt") ||
  //   modelId.includes("openai") ||
  //   url.includes("openai.com")
  // ) {
  //   return createOpenAI({
  //     apiKey,
  //     baseURL,
  //   });
  // }

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
