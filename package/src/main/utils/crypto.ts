/**
 * API Key 加密工具
 * 使用 Electron safeStorage API 加密敏感数据
 */

import { safeStorage } from "electron";

const PLAIN_PREFIX = "plain:";
const ENCRYPTED_PREFIX = "enc:";

/**
 * 检查加密是否可用
 */
export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}

/**
 * 加密 API Key
 * @param apiKey 明文 API Key
 * @returns 加密后的字符串（带前缀标识）
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return apiKey;

  if (safeStorage.isEncryptionAvailable()) {
    try {
      const encrypted = safeStorage.encryptString(apiKey);
      return ENCRYPTED_PREFIX + encrypted.toString("base64");
    } catch (error) {
      console.error("[Crypto] Encryption failed:", error);
      // Fallback to plain storage
      return PLAIN_PREFIX + apiKey;
    }
  }

  // 开发环境或加密不可用时，标记为明文
  console.warn("[Crypto] Encryption not available, storing as plain text");
  return PLAIN_PREFIX + apiKey;
}

/**
 * 解密 API Key
 * @param stored 存储的加密字符串
 * @returns 明文 API Key
 */
export function decryptApiKey(stored: string): string {
  if (!stored) return stored;

  // 明文存储（开发环境或旧数据）
  if (stored.startsWith(PLAIN_PREFIX)) {
    return stored.slice(PLAIN_PREFIX.length);
  }

  // 加密存储
  if (stored.startsWith(ENCRYPTED_PREFIX)) {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Cannot decrypt: encryption not available on this system");
    }

    try {
      const encryptedData = stored.slice(ENCRYPTED_PREFIX.length);
      const buffer = Buffer.from(encryptedData, "base64");
      return safeStorage.decryptString(buffer);
    } catch (error) {
      console.error("[Crypto] Decryption failed:", error);
      throw new Error("Failed to decrypt API key");
    }
  }

  // 无前缀 = 旧格式明文（向后兼容）
  return stored;
}

/**
 * 检查是否需要迁移（旧格式明文）
 */
export function needsMigration(stored: string): boolean {
  if (!stored) return false;
  return !stored.startsWith(PLAIN_PREFIX) && !stored.startsWith(ENCRYPTED_PREFIX);
}

/**
 * 迁移旧格式到新格式
 */
export function migrateApiKey(oldValue: string): string {
  if (!needsMigration(oldValue)) return oldValue;
  return encryptApiKey(oldValue);
}
