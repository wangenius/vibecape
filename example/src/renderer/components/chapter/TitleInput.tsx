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
        className="w-full text-2xl font-medium tracking-tight bg-transparent border-none 
          focus:bg-transparent
          placeholder:text-muted-foreground/30"
        placeholder="未命名章节"
      />
    );
  }
);
