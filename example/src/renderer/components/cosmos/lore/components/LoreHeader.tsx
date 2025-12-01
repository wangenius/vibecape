import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TbTrash } from 'react-icons/tb';
import { LoreItem } from '../types';
import { useCosmos } from '@/hook/cosmos/useCosmos';

interface LoreHeaderProps {
  item: LoreItem;
  onDelete: () => void;
}

export const LoreHeader = ({ item, onDelete }: LoreHeaderProps) => (
  <div className="flex items-start justify-between gap-4 mb-2">
    <Input
      key={item.id} // 确保切换lore时重置输入框
      variant="ghost"
      defaultValue={item.name}
      autoFocus={!item.name}
      className="text-xl font-semibold h-8 px-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent w-full"
      placeholder="输入设定名称..."
      onValueChange={e => useCosmos.getState().updateLore(item.id, { name: e as string })}
    />
    <Button
      variant="destructive"
      size="icon"
      onClick={onDelete}
      className="h-8 w-8 flex-none"
    >
      <TbTrash className="h-4 w-4" />
    </Button>
  </div>
);
