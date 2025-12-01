import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import { BaseEditor } from "@/components/editor/BaseEditor";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { MentionExtension } from "@/components/editor/extensions/MentionExtension";
import type { Actant } from "@common/schema";
import type { TiptapContent } from "@/components/editor/tiptap-types";

// Simple debounce hook
const useDebounce = <T,>(callback: (value: T) => void, delay = 500) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (value: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callback(value), delay);
    },
    [callback, delay]
  );
};

export const ActantDetailPanel = ({
  actant,
  onClose,
}: {
  actant: Actant;
  onClose: () => void;
}) => {
  const updateActant = useCosmos((s) => s.updateActant);
  const [localName, setLocalName] = useState(actant.name || "");

  // Reset local state when actant changes
  useEffect(() => {
    setLocalName(actant.name || "");
  }, [actant.id, actant.name]);

  const debouncedNameSave = useDebounce(
    useCallback(
      (value: string) => updateActant(actant.id, { name: value }),
      [updateActant, actant.id]
    )
  );
  const debouncedDescSave = useDebounce(
    useCallback(
      (value: TiptapContent) => updateActant(actant.id, { description: value }),
      [updateActant, actant.id]
    )
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalName(value);
      debouncedNameSave(value);
    },
    [debouncedNameSave]
  );

  const handleDescChange = useCallback(
    (value: TiptapContent) => {
      debouncedDescSave(value);
    },
    [debouncedDescSave]
  );

  const editorKey = useMemo(() => actant.id, [actant.id]);

  return (
    <div className="absolute bottom-4 right-4 w-72 rounded-xl bg-card border border-border overflow-hidden shadow-lg">
      {/* Header with name input */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Input
          type="title"
          value={localName}
          onChange={handleNameChange}
          placeholder="未命名"
          className="bg-transparent"
        />
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Description editor */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <BaseEditor
          key={editorKey}
          defaultValue={actant.description}
          onChange={handleDescChange}
          extensions={[
            StarterKit,
            Placeholder.configure({ placeholder: "输入角色描述..." }),
            ...MentionExtension,
          ]}
          className="text-sm min-h-16"
        />
      </div>

      {/* Main char indicator */}
      {actant.main_char && (
        <div className="px-3 pb-3 flex items-center gap-1.5">
          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
          <span className="text-[10px] text-muted-foreground">主角</span>
        </div>
      )}
    </div>
  );
};
