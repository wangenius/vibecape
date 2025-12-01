import {
  type DocStory,
  type DocStorySummary,
  type DocFile,
  type DocNavNode,
} from "@common/types/docs";

export interface DocsAPI {
  /** 当前文档根目录 */
  getRoot: () => Promise<string | null>;
  /** 设置文档根目录 */
  setRoot: (path: string) => Promise<string>;
  /** 打开系统选择器选择根目录 */
  chooseRoot: () => Promise<string | null>;
  /** 列出 story 目录 */
  listStories: () => Promise<DocStorySummary[]>;
  /** 获取单个 story 及其导航树 */
  getStory: (storyId: string) => Promise<DocStory | null>;
  /** 读取文档 */
  readDoc: (storyId: string, filePath: string) => Promise<DocFile>;
  /** 保存文档 */
  writeDoc: (
    storyId: string,
    filePath: string,
    content: string,
    metadata?: Record<string, any>
  ) => Promise<DocFile>;
  /** 更新 meta.json（保持 tree 与原始 meta） */
  saveMeta: (
    storyId: string,
    payload: { tree: DocNavNode[]; rawMeta: Record<string, any> }
  ) => Promise<DocStory>;
}
