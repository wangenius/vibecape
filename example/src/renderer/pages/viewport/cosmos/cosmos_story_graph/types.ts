export type StoryNodeData = {
  title: string;
  characters: string[];
  hasChildren: boolean;
  dimmed?: boolean;
  highlight?: boolean;
};

export type BreadcrumbItem = {
  id: string;
  name: string;
};
