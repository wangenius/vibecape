/**
 * 工作区服务
 * 管理 {docs_root}/{workspace_id}/ 下的工作区
 */

import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { dialog } from "electron";
import {
  type Workspace,
  type WorkspaceConfig,
  type WorkspaceEntry,
  WORKSPACE_FILES,
  createDefaultWorkspaceConfig,
} from "@common/schema/workspace";
import {
  getDocsRoot,
  setDocsRoot,
  getCurrentWorkspaceId,
  setCurrentWorkspaceId,
  getRecentWorkspaces,
  addRecentWorkspace,
  removeRecentWorkspace,
  updateRecentWorkspace,
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
    console.error(`[Workspace] Failed to read ${filePath}:`, error);
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

function buildWorkspacePaths(docsRoot: string, id: string) {
  const workspacePath = path.join(docsRoot, id);
  return {
    id,
    path: workspacePath,
    config_path: path.join(workspacePath, WORKSPACE_FILES.CONFIG),
    docs_db_path: path.join(workspacePath, WORKSPACE_FILES.DOCS_DB),
    chat_db_path: path.join(workspacePath, WORKSPACE_FILES.CHAT_DB),
    llm_txt_path: path.join(workspacePath, WORKSPACE_FILES.LLM_TXT),
  };
}

// ==================== 工作区服务 ====================

export class WorkspaceService {
  private static currentWorkspace: Workspace | null = null;

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
    console.log("[Workspace] docs_root set to:", docsRoot);
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
  static listWorkspaces(): WorkspaceEntry[] {
    return getRecentWorkspaces();
  }

  /**
   * 获取当前工作区
   */
  static getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspace;
  }

  /**
   * 创建新工作区
   */
  static async create(name: string): Promise<Workspace> {
    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      throw new Error("docs_root 未配置，请先选择文档存储目录");
    }

    // 生成唯一 ID
    const id = nanoid(12);
    const paths = buildWorkspacePaths(docsRoot, id);

    // 创建目录
    ensureDir(paths.path);

    // 创建配置文件
    const config = createDefaultWorkspaceConfig(name);
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
    const entry: WorkspaceEntry = {
      id,
      name,
      last_opened_at: Date.now(),
    };
    addRecentWorkspace(entry);

    // 设置为当前工作区
    setCurrentWorkspaceId(id);

    const workspace: Workspace = {
      ...paths,
      config,
    };
    this.currentWorkspace = workspace;

    console.log("[Workspace] Created workspace:", id, name);
    return workspace;
  }

  /**
   * 打开工作区
   */
  static async open(id: string): Promise<Workspace> {
    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      throw new Error("docs_root 未配置");
    }

    const paths = buildWorkspacePaths(docsRoot, id);

    // 检查工作区是否存在
    if (!fs.existsSync(paths.path)) {
      throw new Error(`工作区不存在: ${id}`);
    }

    // 读取配置
    const config = readJsonFile<WorkspaceConfig>(
      paths.config_path,
      createDefaultWorkspaceConfig("未命名")
    );

    // 更新最近打开时间
    updateRecentWorkspace(id, { last_opened_at: Date.now() });

    // 设置为当前工作区
    setCurrentWorkspaceId(id);

    const workspace: Workspace = {
      ...paths,
      config,
    };
    this.currentWorkspace = workspace;

    console.log("[Workspace] Opened workspace:", id, config.name);
    return workspace;
  }

  /**
   * 关闭当前工作区
   */
  static close(): void {
    this.currentWorkspace = null;
    setCurrentWorkspaceId(null);
    console.log("[Workspace] Closed current workspace");
  }

  /**
   * 删除工作区
   */
  static async delete(id: string): Promise<void> {
    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      throw new Error("docs_root 未配置");
    }

    const paths = buildWorkspacePaths(docsRoot, id);

    // 删除目录
    if (fs.existsSync(paths.path)) {
      fs.rmSync(paths.path, { recursive: true, force: true });
    }

    // 从最近列表移除
    removeRecentWorkspace(id);

    // 如果是当前工作区，清除
    if (this.currentWorkspace?.id === id) {
      this.currentWorkspace = null;
    }

    console.log("[Workspace] Deleted workspace:", id);
  }

  /**
   * 更新工作区配置
   */
  static async updateConfig(
    id: string,
    updates: Partial<WorkspaceConfig>
  ): Promise<WorkspaceConfig> {
    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      throw new Error("docs_root 未配置");
    }

    const paths = buildWorkspacePaths(docsRoot, id);
    const config = readJsonFile<WorkspaceConfig>(
      paths.config_path,
      createDefaultWorkspaceConfig("未命名")
    );

    // 合并更新
    const newConfig: WorkspaceConfig = {
      ...config,
      ...updates,
    };
    writeJsonFile(paths.config_path, newConfig);

    // 如果更新了名称，同步到 recent 列表
    if (updates.name) {
      updateRecentWorkspace(id, { name: updates.name });
    }

    // 更新当前工作区缓存
    if (this.currentWorkspace?.id === id) {
      this.currentWorkspace.config = newConfig;
    }

    return newConfig;
  }

  /**
   * 获取工作区的 llm.txt 内容
   */
  static getLlmTxt(id?: string): string {
    const targetId = id ?? this.currentWorkspace?.id;
    if (!targetId) {
      return "";
    }

    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      return "";
    }

    const llmPath = path.join(docsRoot, targetId, WORKSPACE_FILES.LLM_TXT);
    if (!fs.existsSync(llmPath)) {
      return "";
    }

    return fs.readFileSync(llmPath, "utf-8");
  }

  /**
   * 更新工作区的 llm.txt 内容
   */
  static setLlmTxt(content: string, id?: string): void {
    const targetId = id ?? this.currentWorkspace?.id;
    if (!targetId) {
      throw new Error("未指定工作区");
    }

    const docsRoot = getDocsRoot();
    if (!docsRoot) {
      throw new Error("docs_root 未配置");
    }

    const llmPath = path.join(docsRoot, targetId, WORKSPACE_FILES.LLM_TXT);
    fs.writeFileSync(llmPath, content, "utf-8");
  }

  /**
   * 恢复上次打开的工作区
   */
  static async restoreLastWorkspace(): Promise<Workspace | null> {
    const currentId = getCurrentWorkspaceId();
    if (!currentId) {
      return null;
    }

    try {
      return await this.open(currentId);
    } catch (error) {
      console.warn("[Workspace] Failed to restore last workspace:", error);
      setCurrentWorkspaceId(null);
      return null;
    }
  }
}
