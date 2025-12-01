import { DynamicTag } from '@/components/custom/Tag';
import { SectionPanel } from '@/components/custom/SectionPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TAG_GROUPS, TAG_OPTIONS } from '@/hook/cosmos/constants';
import type { CosmosTag } from '@common/types/content';
import { useState } from 'react';
import { TbHash, TbTrash, TbX } from 'react-icons/tb';
import { toast } from 'sonner';

interface TagsSelectionPanelProps {
  tags: CosmosTag[];
  onTagsChange: (values: CosmosTag[]) => void;
  onClearAll: () => void;
  className?: string;
}

export const TagsSelectionPanel = ({
  tags,
  onTagsChange,
  onClearAll,
  className,
}: TagsSelectionPanelProps) => {
  const [customTag, setCustomTag] = useState('');
  const hasSelections = tags.length > 0;
  const tagCategories = Object.entries(TAG_OPTIONS);

  const handleAddCustomTag = () => {
    if (!customTag.trim()) return;
    const newTag = {
      label: customTag.trim(),
      value: customTag.trim(),
      group: 'custom',
    };

    if (tags.some(tag => tag.label === customTag.trim())) {
      toast.error('标签已存在');
      return;
    }
    onTagsChange([...tags, newTag]);
    setCustomTag('');
  };

  const handleRemoveTag = (id: string) => {
    onTagsChange(tags.filter(t => t.value !== id));
  };

  return (
    <div>
      <SectionPanel
        title="标签"
        icon={TbHash}
        className={className}
        collapsible
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {tags.map(tag => (
              <DynamicTag
                key={tag.value}
                label={tag.label}
                id={tag.value}
                onClickIcon={handleRemoveTag}
                icon={TbX}
                className="bg-primary/10 text-primary hover:bg-primary/20"
              />
            ))}
            {hasSelections && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                onClick={onClearAll}
              >
                <TbTrash className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 自定义标签输入 */}
          <div className="space-y-1">
            <Input
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              placeholder="输入标签名称，按回车添加..."
              className="bg-muted-foreground/10 rounded-lg"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleAddCustomTag();
                }
              }}
            />
          </div>

          {/* 预设标签区域 */}
          <div className="space-y-2">
            <div className="max-h-[300px] rounded-md overflow-y-auto">
              <div className="space-y-4 p-3">
                {tagCategories.map(([category, options]) => {
                  const group = TAG_GROUPS.find(
                    g => g.name === options[0]?.group
                  );
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">
                          {category === 'category' && '性别'}
                          {category === 'time' && '时代背景'}
                          {category === 'genre' && '类型'}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {group?.multiple ? '多选' : '单选'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {options.map(option => {
                          const isSelected = tags.some(
                            tag => tag.value === option.value
                          );
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                const group = TAG_GROUPS.find(
                                  g => g.name === option.group
                                );
                                if (!group) return;

                                if (isSelected) {
                                  onTagsChange(tags.filter(v => v !== option));
                                } else {
                                  let newTags = [...tags];
                                  if (!group.multiple) {
                                    newTags = newTags.filter(
                                      t => t.group !== option.group
                                    );
                                  }
                                  newTags.push(option);
                                  onTagsChange(newTags);
                                }
                              }}
                              className={cn(
                                'px-2 py-1 text-xs rounded-lg transition-all duration-200',
                                isSelected
                                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                                  : 'bg-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                              )}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
};
