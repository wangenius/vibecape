/**
 * Relation - 关系管理
 * 包含 Slice + 业务逻辑
 */

import { ActantRelation, ActantRelationInsert } from "@common/schema";

// ==================== 类型定义 ====================

export interface RelationSlice {
  relations: Record<string, ActantRelation>;
  setRelations: (relations: Record<string, ActantRelation>) => void;
  insertRelation: (relation: ActantRelationInsert) => void;
  updateRelation: (
    id: string,
    updates: Partial<ActantRelationInsert>
  ) => void;
  removeRelation: (id: string) => void;
}

// ==================== Slice Creator ====================

export const createRelationSlice = (
  set: any,
  get: () => RelationSlice
): RelationSlice => ({
  relations: {},

  setRelations: (relations) =>
    set(() => ({
      relations,
    })),

  insertRelation: async (relation) => {
    const newRelation = await window.api.cosmos.relation.create(relation);
    set((state: RelationSlice) => ({
      relations: {
        ...state.relations,
        [newRelation.id]: newRelation,
      },
    }));
  },

  updateRelation: async (id, updates) => {
    const current = get().relations?.[id];
    if (!current) return;

    const payload = { ...current, ...updates };
    const updatedRelation = await window.api.cosmos.relation.update(payload);
    set((state: RelationSlice) => ({
      relations: {
        ...state.relations,
        [id]: updatedRelation,
      },
    }));
  },

  removeRelation: async (id) => {
    const deletedRelation = await window.api.cosmos.relation.delete(id);
    if (deletedRelation.success) {
      set((state: RelationSlice) => {
        const newRelations = { ...state.relations };
        delete newRelations[id];
        return { relations: newRelations };
      });
    }
  },
});
