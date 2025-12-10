/**
 * 工作区服务
 * 管理 {docs_root}/{repository_id}/ 下的工作区
 */

import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { dialog } from "electron";
import {
  type Repository,
  type RepositoryConfig,
  type RepositoryEntry,
  REPOSITORY_FILES,
  createDefaultRepositoryConfig,
} from "@common/schema/repository";
import {
  getDocsRoot,
  setDocsRoot,
  getCurrentRepositoryId,
  setCurrentRepositoryId,
  getRecentRepositorys,
  addRecentRepository,
  removeRecentRepository,
  updateRecentRepository,
} from "./UserData";

// ==================== 工具函数 ====================

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`[Repository] Failed to read ${filePath}:`, error);
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ==================== 路径构建 ====================

function buildRepositoryPaths(docsRoot: string, id: string) {
  const repositoryPath = path.join(docsRoot, id);
  return {
    id,
    path: repositoryPath,
    config_path: path.join(repositoryPath, REPOSITORY_FILES.CONFIG),
    docs_db_path: path.join(repositoryPath, REPOSITORY_FILES.DOCS_DB),
    chat_db_path: path.join(repositoryPath, REPOSITORY_FILES.CHAT_DB),
    llm_txt_path: path.join(repositoryPath, REPOSITORY_FILES.LLM_TXT),
  };
}

// ==================== 工作区服务 ====================

export class RepositoryService {
  private static currentRepository: Repository | null = null;

  /**
   * 检查 docs_root 是否已配置
   */
  static hasDocsRoot(): boolean {
    const docsRoot = getDocsRoot();
    return !!docsRoot && fs.existsSync(docsRoot);
  }

  /**
   * 选择 docs_root 目录
   */
  static async selectDocsRoot(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      title: "选择文档存储目录",
      message: "所有工作区将存储在此目录下",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const docsRoot = result.filePaths[0];
    setDocsRoot(docsRoot);
    console.log("[Repository] docs_root set to:", docsRoot);
    return docsRoot;
  }

  /**
   * 获取 docs_root
   */
  static getDocsRoot(): string {
    return getDocsRoot();
  }

  /**
   * 设置 docs_root
   */
  static setDocsRoot(docsRoot: string): void {
    setDocsRoot(docsRoot);
  }

  /**
   * 列出所有工作区
   */
  static listRepositorys(): RepositoryEntry[] {
    return getRecentRepositorys();
  }

  /**
   * 获取当前工作区
   */
  static getCurrentRepository(): Repository | null {
    return this.currentRepository;
  }

  /**
   * 创建新工作区
   */
  static async create(name: string): Promise<Repository> {
    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      throw new Error("docs_root 未配置，请先选择文档存储目录");
    }

    // 生成唯一 ID
    const id = nanoid(12);
    const paths = buildRepositoryPaths(docsRoot, id);

    // 创建目录
    ensureDir(paths.path);

    // 创建配置文件
    const config = createDefaultRepositoryConfig(name);
    writeJsonFile(paths.config_path, config);

    // 创建 llm.txt
    const llmContent = `# ${name}

## 写作风格
- 简洁明了
- 技术准确

## 注意事项
- 请根据项目需求补充
`;
    fs.writeFileSync(paths.llm_txt_path, llmContent, "utf-8");

    // 添加到最近工作区
    const entry: RepositoryEntry = {
      id,
      name,
      last_opened_at: Date.now(),
    };
    addRecentRepository(entry);

    // 设置为当前工作区
    setCurrentRepositoryId(id);

    const repository: Repository = {
      ...paths,
      config,
    };
    this.currentRepository = repository;

    console.log("[Repository] Created repository:", id, name);
    return repository;
  }

  /**
   * 打开工作区
   */
  static async open(id: string): Promise<Repository> {
    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      throw new Error("docs_root 未配置");
    }

    const paths = buildRepositoryPaths(docsRoot, id);

    // 检查工作区是否存在
    if (!fs.existsSync(paths.path)) {
      throw new Error(`工作区不存在: ${id}`);
    }

    // 读取配置
    const config = readJsonFile<RepositoryConfig>(
      paths.config_path,
      createDefaultRepositoryConfig("未命名")
    );

    // 更新最近打开时间
    updateRecentRepository(id, { last_opened_at: Date.now() });

    // 设置为当前工作区
    setCurrentRepositoryId(id);

    const repository: Repository = {
      ...paths,
      config,
    };
    this.currentRepository = repository;

    console.log("[Repository] Opened repository:", id, config.name);
    return repository;
  }

  /**
   * 关闭当前工作区
   */
  static close(): void {
    this.currentRepository = null;
    setCurrentRepositoryId(null);
    console.log("[Repository] Closed current repository");
  }

  /**
   * 删除工作区
   */
  static async delete(id: string): Promise<void> {
    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      throw new Error("docs_root 未配置");
    }

    const paths = buildRepositoryPaths(docsRoot, id);

    // 删除目录
    if (fs.existsSync(paths.path)) {
      fs.rmSync(paths.path, { recursive: true, force: true });
    }

    // 从最近列表移除
    removeRecentRepository(id);

    // 如果是当前工作区，清除
    if (this.currentRepository?.id === id) {
      this.currentRepository = null;
    }

    console.log("[Repository] Deleted repository:", id);
  }

  /**
   * 更新工作区配置
   */
  static async updateConfig(
    id: string,
    updates: Partial<RepositoryConfig>
  ): Promise<RepositoryConfig> {
    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      throw new Error("docs_root 未配置");
    }

    const paths = buildRepositoryPaths(docsRoot, id);
    const config = readJsonFile<RepositoryConfig>(
      paths.config_path,
      createDefaultRepositoryConfig("未命名")
    );

    // 合并更新
    const newConfig: RepositoryConfig = {
      ...config,
      ...updates,
    };
    writeJsonFile(paths.config_path, newConfig);

    // 如果更新了名称，同步到 recent 列表
    if (updates.name) {
      updateRecentRepository(id, { name: updates.name });
    }

    // 更新当前工作区缓存
    if (this.currentRepository?.id === id) {
      this.currentRepository.config = newConfig;
    }

    return newConfig;
  }

  /**
   * 获取工作区的 llm.txt 内容
   */
  static getLlmTxt(id?: string): string {
    const targetId = id ?? this.currentRepository?.id;
    if (!targetId) {
      return "";
    }

    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      return "";
    }

    const llmPath = path.join(docsRoot, targetId, REPOSITORY_FILES.LLM_TXT);
    if (!fs.existsSync(llmPath)) {
      return "";
    }

    return fs.readFileSync(llmPath, "utf-8");
  }

  /**
   * 更新工作区的 llm.txt 内容
   */
  static setLlmTxt(content: string, id?: string): void {
    const targetId = id ?? this.currentRepository?.id;
    if (!targetId) {
      throw new Error("未指定工作区");
    }

    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      throw new Error("docs_root 未配置");
    }

    const llmPath = path.join(docsRoot, targetId, REPOSITORY_FILES.LLM_TXT);
    fs.writeFileSync(llmPath, content, "utf-8");
  }

  /**
   * 恢复上次打开的工作区
   */
  static async restoreLastRepository(): Promise<Repository | null> {
    const currentId = getCurrentRepositoryId();
    if (!currentId) {
      return null;
    }

    try {
      return await this.open(currentId);
    } catch (error) {
      console.warn("[Repository] Failed to restore last repository:", error);
      setCurrentRepositoryId(null);
      return null;
    }
  }
}
