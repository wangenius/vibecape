import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useWritingStyleList,
  useSelectedStyle,
  selectWritingStyle,
} from '@/hook/app/useWritingStyle';
import { openSettingsTab } from '@/hook/app/useViewManager';
import { TbSettings } from 'react-icons/tb';

export const WritingStyleSelector = () => {
  const styles = useWritingStyleList();
  const selectedStyle = useSelectedStyle();

  const handleValueChange = (value: string) => {
    // 特殊值：打开设置
    if (value === '__settings__') {
      openSettingsTab('novel');
      return;
    }
    
    // 正常选择风格
    selectWritingStyle(value);
  };

  return (
    <Select value={selectedStyle?.id} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <span className="text-sm font-medium truncate">
            {selectedStyle?.name}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {styles.map((style) => (
          <SelectItem key={style.id} value={style.id}>
            {style.name}
          </SelectItem>
        ))}
        
        <SelectSeparator />
        
        <SelectItem value="__settings__" className="text-primary">
          <div className="flex items-center gap-2">
            <TbSettings className="w-3.5 h-3.5" />
            <span>去设置</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

