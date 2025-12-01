import { FilterSelector } from '@/components/custom/FilterSelector';
import { Tag } from '@/components/custom/Tag';
import { LoreItem, LoreTypeOption } from '../types';
import { useCosmos } from '@/hook/cosmos/useCosmos';

interface LoreTypeSelectorProps {
  item: LoreItem;
  lore_types: Record<string, LoreTypeOption>;
}

export const LoreTypeSelector = ({
  item,
  lore_types,
}: LoreTypeSelectorProps) => (
  <div className="flex items-center gap-2">
    <FilterSelector
      align="start"
      trigger={
        <Tag
          active={!!item.type_id}
          activeClassName="bg-primary/10 text-primary hover:bg-primary/20"
        >
          {lore_types[item.type_id]?.name || '选择类型'}
        </Tag>
      }
      onDelete={() => useCosmos.getState().updateLore(item.id, { type_id: "" })}
      items={Object.values(lore_types)}
      placeholder="搜索类型..."
      onSelect={type => useCosmos.getState().updateLore(item.id, { type_id: type.id })}
    />

    <Tag
      active={item.multiple}
      activeClassName="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
      onClick={() => useCosmos.getState().updateLore(item.id, { multiple: !item.multiple })}
    >
      {item.multiple ? '多选' : '单选'}
    </Tag>
  </div>
);
