export type DocMetaNode = {
  id?: string;
  title?: string;
  name?: string;
  label?: string;
  type?: "group" | "doc";
  file?: string;
  path?: string;
  href?: string;
  children?: DocMetaNode[];
  items?: DocMetaNode[];
  meta?: Record<string, any>;
};

export type DocNavNode = {
  id: string;
  title: string;
  type: "group" | "doc";
  /** relative path inside the story directory */
  path?: string;
  children?: DocNavNode[];
  meta?: Record<string, any>;
};

export type DocStoryMeta = {
  title: string;
  description?: string;
  items?: DocMetaNode[];
  [key: string]: any;
};

export type DocStorySummary = {
  id: string;
  title: string;
  description?: string;
  hasMeta: boolean;
  metaPath: string;
};

export type DocStory = DocStorySummary & {
  root: string;
  tree: DocNavNode[];
  rawMeta: Record<string, any>;
};

export type DocFile = {
  storyId: string;
  path: string;
  content: string;
  metadata: Record<string, any>;
};
