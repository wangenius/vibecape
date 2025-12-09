import { useCallback, useMemo } from "react";
import { FileText, Folder } from "lucide-react";
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Palette } from "@/components/custom/Palette";
import { useDocumentStore } from "@/hooks/stores/useDocumentStore";
import { usePaletteStore } from "@/hooks/shortcuts/usePalette";
import type { DocTreeNode } from "@common/schema/docs";


interface FlatDoc {
  id: string;
  title: string;
  path: string;
  hasChildren: boolean;
}

// 将树形结构扁平化
function flattenTree(
  nodes: DocTreeNode[],
  parentPath: string = ""
): FlatDoc[] {
  const result: FlatDoc[] = [];

  for (const node of nodes) {
    const currentPath = parentPath ? `${parentPath} / ${node.title}` : node.title;
    result.push({
      id: node.id,
      title: node.title,
      path: currentPath,
      hasChildren: !!(node.children && node.children.length > 0),
    });

    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, currentPath));
    }
  }

  return result;
}

export const DocSearchPalette = () => {
  const tree = useDocumentStore((state) => state.tree);
  const openDoc = useDocumentStore((state) => state.openDoc);
  const open = usePaletteStore((state) => state.activePalette === "docSearch");
  const closePalette = usePaletteStore((state) => state.closePalette);

  // 扁平化文档列表
  const flatDocs = useMemo(() => flattenTree(tree), [tree]);

  // 打开文档
  const handleOpenDoc = useCallback(
    (docId: string) => {
      closePalette();
      void openDoc(docId);
    },
    [closePalette, openDoc]
  );

  return (
    <Palette
      open={open}
      onOpenChange={(open) => !open && closePalette()}
      placeholder="搜索文档..."
    >
      <CommandEmpty>没有找到相关文档</CommandEmpty>
      <CommandGroup heading="文档">
        {flatDocs.map((doc, index) => (
          <CommandItem
            key={doc.id}
            value={`${doc.id}-${index}`}
            onSelect={() => handleOpenDoc(doc.id)}
          >
            <span className="mr-2 text-muted-foreground">
              {doc.hasChildren ? (
                <Folder className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </span>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="truncate">{doc.title || "无标题"}</span>
              {doc.path !== doc.title && (
                <span className="text-xs text-muted-foreground truncate">
                  {doc.path}
                </span>
              )}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </Palette>
  );
};
