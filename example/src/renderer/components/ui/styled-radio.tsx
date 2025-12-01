'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface Option {
  value: string;
  label: string;
}

interface StyledRadioGroupProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function StyledRadioGroup({ options, value, onChange }: StyledRadioGroupProps) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <div key={option.value}>
          <RadioGroupItem
            value={option.value}
            id={`radio-${option.value}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`radio-${option.value}`}
            className="flex items-center justify-center px-2 py-1 rounded-md text-sm font-medium text-secondary-foreground hover:bg-secondary/80 peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-colors"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

interface StyledCheckboxGroupProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
}

export function StyledCheckboxGroup({ options, value, onChange }: StyledCheckboxGroupProps) {
  const handleToggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <div key={option.value}>
          <Checkbox
            id={`checkbox-${option.value}`}
            checked={value.includes(option.value)}
            onCheckedChange={() => handleToggle(option.value)}
            className="peer sr-only"
          />
          <Label
            htmlFor={`checkbox-${option.value}`}
            className="flex items-center justify-center px-2 py-1 rounded-md text-sm font-medium text-secondary-foreground hover:bg-secondary/80 peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-colors"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
