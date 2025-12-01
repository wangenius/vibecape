import {
  Actant,
  ActantInsert,
  ActantRelation,
  ActantRelationInsert,
  ActantState,
  ActantStateInsert,
  ActantType,
  ActantTypeInsert,
  CosmosMeta,
  CosmosMetaInsert,
  Lore,
  LoreInsert,
  LoreType,
  LoreTypeInsert,
  Story,
  StoryInsert,
} from "@common/schema";

export interface CosmosMetaAPI {
  // 获取项目列表
  list: () => Promise<Record<string, CosmosMeta>>;
  // 获取项目：不传 id 返回当前打开的，传 id 返回指定项目（并设置为当前）
  get: (id?: string) => Promise<CosmosMeta | null>;
  // 创建项目
  create: (payload: CosmosMetaInsert) => Promise<CosmosMeta>;
  // 更新项目Meta
  update: (payload: CosmosMetaInsert) => Promise<CosmosMeta>;
  // 关闭当前项目
  close: () => Promise<{ success: boolean }>;
  // 删除项目
  delete: (id: string) => Promise<{ success: boolean }>;
  // 获取项目路径
  getPath: (id: string) => Promise<string>;
  // 在文件管理器中显示项目
  showInFolder: (path: string) => Promise<{ success: boolean }>;
}

export interface StoryAPI {
  // 获取故事列表
  list: () => Promise<Record<string, Story>>;
  // 获取单个故事
  get: (id: string) => Promise<Story>;
  // 创建故事
  create: (payload: StoryInsert) => Promise<Story>;
  // 更新故事
  update: (payload: StoryInsert) => Promise<Story>;
  // 删除故事
  delete: (id: string) => Promise<{ success: boolean }>;
  // 之后可能和Story相关的所有API
}

export interface ActantAPI {
  // 获取角色列表
  list: () => Promise<Record<string, Actant>>;
  // 获取单个角色
  get: (id: string) => Promise<Actant>;
  // 创建角色
  create: (
    payload: ActantInsert
  ) => Promise<{ actant: Actant; state: ActantState }>;
  // 更新角色
  update: (payload: ActantInsert) => Promise<Actant>;
  // 删除角色
  delete: (id: string) => Promise<{ success: boolean }>;
  // 之后可能和Actant相关的所有API
}

export interface ActantStateAPI {
  // 获取角色状态列表
  list: () => Promise<Record<string, ActantState>>;
  // 获取单个角色状态
  get: (id: string) => Promise<ActantState>;
  // 创建角色状态
  create: (payload: ActantStateInsert) => Promise<ActantState>;
  // 更新角色状态（id 从 actantStateData.id 获取）
  update: (payload: ActantStateInsert) => Promise<ActantState>;
  // 删除角色状态
  delete: (id: string) => Promise<{ success: boolean }>;
}

export interface LoreAPI {
  // 获取设定列表
  list: () => Promise<Record<string, Lore>>;
  // 获取单个设定
  get: (id: string) => Promise<Lore>;
  // 创建设定
  create: (payload: LoreInsert) => Promise<Lore>;
  // 更新设定
  update: (payload: LoreInsert) => Promise<Lore>;
  // 删除设定
  delete: (id: string) => Promise<{ success: boolean }>;
  // 之后可能和Lore相关的所有API
}

export interface LoreTypeAPI {
  // 获取设定类型列表
  list: () => Promise<Record<string, LoreType>>;
  // 获取单个设定类型
  get: (id: string) => Promise<LoreType>;
  // 创建设定类型
  create: (payload: LoreTypeInsert) => Promise<LoreType>;
  // 更新设定类型
  update: (payload: LoreTypeInsert) => Promise<LoreType>;
  // 删除设定类型
  delete: (id: string) => Promise<{ success: boolean }>;
  // 之后可能和LoreType相关的所有API
}

export interface ActantTypeAPI {
  // 获取角色类型列表
  list: () => Promise<Record<string, ActantType>>;
  // 获取单个角色类型
  get: (id: string) => Promise<ActantType>;
  // 创建设角色类型
  create: (payload: ActantTypeInsert) => Promise<ActantType>;
  // 更新角色类型
  update: (payload: ActantTypeInsert) => Promise<ActantType>;
  // 删除角色类型
  delete: (id: string) => Promise<{ success: boolean }>;
  // 之后可能和ActantType相关的所有API
}

export interface RelationAPI {
  // 获取关系列表
  list: () => Promise<Record<string, ActantRelation>>;
  // 获取单个关系
  get: (id: string) => Promise<ActantRelation>;
  // 创建关系
  create: (payload: ActantRelationInsert) => Promise<ActantRelation>;
  // 更新关系
  update: (payload: ActantRelationInsert) => Promise<ActantRelation>;
  // 删除关系
  delete: (id: string) => Promise<{ success: boolean }>;
}
