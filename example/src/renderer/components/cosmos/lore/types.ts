export interface LoreTypeOption {
  id: string;
  name: string;
}

export interface LoreItem {
  id: string;
  name: string;
  type_id: string;
  multiple: boolean;
  description: string;
  parent_id?: string;
}
