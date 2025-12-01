import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import React, { useCallback, useMemo, useState } from 'react';
import { PiFunnelLight } from 'react-icons/pi';
import { TbTrash } from 'react-icons/tb';
import { Unfind } from './Unfind';

// 过滤选项的类型定义
interface Option {
  id: string; // 选项的唯一标识
  name: string; // 选项的显示名称
}

// 组件的属性类型定义
interface FilterSelectorProps<T extends Option, F = Option> {
  /* 触发弹出层的元素 */
  trigger: React.ReactNode;
  className?: string;
  /* 要显示的数据项数组 */
  items: T[];
  /* 选择项目时的回调函数 */
  onSelect: (item: T) => void;
  /* 删除按钮的回调函数（可选） */
  onDelete?: () => void;
  /* 搜索输入框的占位文本 */
  placeholder?: string;
  /* 无结果时显示的文本 */
  emptyText?: string;
  /* 项目没有名称时显示的默认文本 */
  defaultItemName?: string;
  /* 过滤选项数组 */
  types?: Record<string, F>;
  /* 弹出层的对齐方式 */
  align?: 'start' | 'center' | 'end';
  /* 选择后是否自动关闭 */
  closeOnSelect?: boolean;
  /* 列表项的图标 */
  itemIcon?: React.ElementType;
  /** 自定义过滤函数
   * @param item 当前项
   * @param type 选中的过滤项ID
   * @returns 是否显示
   */
  filter?: (item: T, type: string) => boolean;
}

// 主组件定义
export function FilterSelector<T extends { id: string; name: string }>({
  trigger,
  className,
  items,
  onSelect,
  onDelete,
  placeholder = '搜索...',
  emptyText = '无结果',
  defaultItemName: defaultText = '未命名',
  types: filterOptions = undefined,
  align = 'end',
  closeOnSelect = true,
  itemIcon,
  filter,
}: FilterSelectorProps<T>) {
  // 状态管理
  const [open, setOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  // 根据搜索文本和过滤条件筛选项目
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const name = item.name || defaultText;
      const matchesSearch =
        !searchText || name.toLowerCase().includes(searchText.toLowerCase());

      if (!matchesSearch) return false;

      if (filter && selectedFilter !== 'all') {
        return filter(item, selectedFilter);
      }
      return true;
    });
  }, [items, searchText, selectedFilter, defaultText, filter]);

  // 处理项目选择的回调函数
  const handleSelect = useCallback(
    (item: T) => {
      onSelect(item);
      // 如果设置了选择后自动关闭，则关闭弹出层
      if (closeOnSelect) {
        setOpen(false);
      }
    },
    [onSelect, closeOnSelect]
  );

  const filterOptionsList = useMemo(() => {
    return Object.values(filterOptions || {});
  }, [filterOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={cn('w-[300px] p-0', className)}
        align={align}
        onClick={e => e.stopPropagation()}
      >
        <Command className="border-none">
          {/* 顶部搜索和过滤区域 */}
          <div className="px-2 pt-2 pb-1">
            <div className="flex items-center bg-muted rounded-lg pl-2 pr-1 gap-2 w-full">
              <CommandInput
                placeholder={placeholder}
                value={searchText}
                onValueChange={setSearchText}
                className="h-9 border-0 text-sm"
              />
              {/* 删除按钮（仅在提供 onDelete 时显示） */}
              {onDelete && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-6 w-6 shrink-0"
                  onClick={e => {
                    e.preventDefault();
                    onDelete();
                  }}
                >
                  <TbTrash className="h-4 w-4" />
                </Button>
              )}
              {filterOptionsList.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        'h-7 w-7 p-0 rounded-md hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10',
                        selectedFilter !== 'all' && 'bg-muted-foreground/10'
                      )}
                    >
                      <PiFunnelLight className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuRadioGroup
                      value={selectedFilter}
                      onValueChange={setSelectedFilter}
                    >
                      {/* 默认的"全部类型"选项 */}
                      <DropdownMenuRadioItem value="all">
                        全部类型
                      </DropdownMenuRadioItem>

                      {filterOptionsList.map(option => (
                        <DropdownMenuRadioItem
                          key={option.id}
                          value={option.id}
                        >
                          {option.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* 列表区域 */}
          <CommandList className="px-1 pb-1">
            {/* 无结果时显示的内容 */}
            <CommandEmpty>
              <Unfind description={emptyText} />
            </CommandEmpty>
            {/* 项目列表 */}
            <CommandGroup>
              {filteredItems.map(item => (
                <CommandItem
                  key={item.id}
                  value={`${item.id}:${item.name}`}
                  onSelect={() => handleSelect(item)}
                >
                  {itemIcon && React.createElement(itemIcon)}
                  <span className="truncate">{item.name || defaultText}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
