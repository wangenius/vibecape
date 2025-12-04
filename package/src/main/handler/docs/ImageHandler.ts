/**
 * 图片处理 Handler
 * 处理图片上传、路径解析等
 */

import { ipcMain } from "electron";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { WorkspaceService } from "@main/services/Workspace";
import { SettingsService } from "@main/services/Settings";

// ==================== 图片路径解析 ====================

/**
 * 解析 /img/xxx 路径到本地文件系统路径
 */
ipcMain.handle(
  "vibecape:resolveAssetPath",
  async (_event, assetPath: string) => {
    try {
      const workspace = WorkspaceService.getCurrentWorkspace();
      if (!workspace?.path) {
        return null;
      }

      // /img/xxx -> {workspace}/asset/img/xxx
      if (assetPath.startsWith("/img/")) {
        const relativePath = assetPath.slice(1); // 移除开头的 /
        const fullPath = path.join(workspace.path, "asset", relativePath);

        // 检查文件是否存在
        try {
          await fs.access(fullPath);
          return fullPath;
        } catch {
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to resolve asset path:", error);
      return null;
    }
  }
);

// ==================== 图片上传 ====================

interface UploadImagePayload {
  filename: string;
  data: string; // base64 data URL
  useOss?: boolean;
}

interface UploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * 上传图片
 * 根据配置决定上传到本地还是 OSS
 */
ipcMain.handle(
  "vibecape:uploadImage",
  async (_event, payload: UploadImagePayload): Promise<UploadResult> => {
    try {
      const { filename, data, useOss } = payload;

      // 解析 base64 数据
      const matches = data.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return { success: false, error: "无效的图片数据" };
      }

      const [, mimeType, base64Data] = matches;
      const buffer = Buffer.from(base64Data, "base64");

      // 生成唯一文件名
      const ext = getExtFromMime(mimeType) || path.extname(filename) || ".png";
      const hash = crypto
        .createHash("md5")
        .update(buffer)
        .digest("hex")
        .slice(0, 8);
      const timestamp = Date.now();
      const newFilename = `${timestamp}-${hash}${ext}`;

      if (useOss) {
        // 上传到 OSS
        return await uploadToOss(buffer, newFilename);
      } else {
        // 保存到本地
        return await saveToLocal(buffer, newFilename);
      }
    } catch (error: any) {
      console.error("Upload image error:", error);
      return { success: false, error: error?.message || "上传失败" };
    }
  }
);

/**
 * 保存图片到本地 vibecape/asset/img/ 目录
 */
async function saveToLocal(
  buffer: Buffer,
  filename: string
): Promise<UploadResult> {
  const workspace = WorkspaceService.getCurrentWorkspace();
  if (!workspace?.path) {
    return { success: false, error: "未初始化工作区" };
  }

  // 确保目录存在
  const imgDir = path.join(workspace.path, "asset", "img");
  await fs.mkdir(imgDir, { recursive: true });

  // 保存文件
  const filePath = path.join(imgDir, filename);
  await fs.writeFile(filePath, buffer);

  // 返回相对路径
  return {
    success: true,
    path: `/img/${filename}`,
  };
}

/**
 * 上传图片到 OSS
 */
async function uploadToOss(
  buffer: Buffer,
  filename: string
): Promise<UploadResult> {
  const settings = SettingsService.get();
  const ossConfig = settings.oss;

  if (!ossConfig?.enabled) {
    return { success: false, error: "OSS 未启用" };
  }

  const {
    provider,
    region,
    bucket,
    access_key_id: accessKeyId,
    access_key_secret: accessKeySecret,
    endpoint,
    custom_domain: customDomain,
  } = ossConfig;

  if (!bucket || !accessKeyId || !accessKeySecret) {
    return { success: false, error: "OSS 配置不完整" };
  }

  try {
    const objectKey = `vibecape/img/${filename}`;
    let resultUrl: string;

    switch (provider) {
      case "aliyun":
        resultUrl = await uploadToAliyunOss(buffer, objectKey, {
          region,
          bucket,
          accessKeyId,
          accessKeySecret,
          endpoint,
        });
        break;
      case "s3":
        resultUrl = await uploadToS3(buffer, objectKey, {
          region,
          bucket,
          accessKeyId,
          accessKeySecret,
          endpoint,
        });
        break;
      case "qiniu":
      case "tencent":
        // 暂时使用通用 S3 兼容接口
        resultUrl = await uploadToS3(buffer, objectKey, {
          region,
          bucket,
          accessKeyId,
          accessKeySecret,
          endpoint,
        });
        break;
      default:
        return { success: false, error: `不支持的 OSS 服务商: ${provider}` };
    }

    // 如果配置了自定义域名，替换 URL
    if (customDomain) {
      resultUrl = `${customDomain.replace(/\/$/, "")}/${objectKey}`;
    }

    return { success: true, path: resultUrl };
  } catch (error: any) {
    console.error("OSS upload error:", error);
    return { success: false, error: error?.message || "OSS 上传失败" };
  }
}

/**
 * 上传到阿里云 OSS
 */
async function uploadToAliyunOss(
  buffer: Buffer,
  objectKey: string,
  config: {
    region: string;
    bucket: string;
    accessKeyId: string;
    accessKeySecret: string;
    endpoint?: string;
  }
): Promise<string> {
  const { region, bucket, accessKeyId, accessKeySecret, endpoint } = config;

  // 动态导入 ali-oss
  const OSS = (await import("ali-oss")).default;

  const client = new OSS({
    region: region || "oss-cn-hangzhou",
    accessKeyId,
    accessKeySecret,
    bucket,
    endpoint: endpoint || undefined,
  });

  const result = await client.put(objectKey, buffer);
  return result.url;
}

/**
 * 上传到 Amazon S3 (或兼容 S3 的服务)
 */
async function uploadToS3(
  buffer: Buffer,
  objectKey: string,
  config: {
    region: string;
    bucket: string;
    accessKeyId: string;
    accessKeySecret: string;
    endpoint?: string;
  }
): Promise<string> {
  const { region, bucket, accessKeyId, accessKeySecret, endpoint } = config;

  // 动态导入 @aws-sdk/client-s3
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: region || "us-east-1",
    credentials: {
      accessKeyId,
      secretAccessKey: accessKeySecret,
    },
    endpoint: endpoint || undefined,
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: getContentType(objectKey),
    })
  );

  // 构建 URL
  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${bucket}/${objectKey}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;
}

/**
 * 从 MIME 类型获取文件扩展名
 */
function getExtFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff",
  };
  return map[mimeType] || ".png";
}

/**
 * 从文件名获取 Content-Type
 */
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
  };
  return map[ext] || "application/octet-stream";
}
