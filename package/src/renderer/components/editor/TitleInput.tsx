import { Input } from '@/components/ui/input';
import { memo, useEffect, useRef } from 'react';

export const TitleInput = memo(
  ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (value === '') {
        inputRef.current?.focus();
      }
    }, [value]);

    return (
      <Input
        ref={inputRef}
        defaultValue={value}
        onChange={onChange}
        className="w-full text-5xl font-medium tracking-tight bg-transparent border-none 
          focus:bg-transparent
          placeholder:text-muted-foreground/30 px-0 h-20"
        placeholder="输入标题..."
      />
    );
  }
);
