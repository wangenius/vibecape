import { dialog } from '@/components/custom/DialogModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNovel, exportNovelAsTxt } from '@/hook/novel/useNovel';
import { exportCosmos } from '@/hook/cosmos/useCosmos';
import { TbDownload } from 'react-icons/tb';
import { toast } from 'sonner';

export const NovelExportTxtPanel = ({ close }: { close: () => void }) => {
  const novel = useNovel();

  const handleExportTxt = () => {
    if (!novel) return;
    exportNovelAsTxt();
    close();
  };

  if (!novel) return null;

  return (
    <Card className="border-none shadow-none">
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">文本格式 (TXT)</div>
            <div className="text-xs text-muted-foreground">
              导出为纯文本格式，适合在任何设备上阅读
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportTxt}
          >
            <TbDownload className="w-4 h-4" />
            导出
          </Button>
        </div>
      </div>
    </Card>
  );
};

NovelExportTxtPanel.open = () => {
  dialog({
    title: '导出作品',
    description: '将作品导出为不同格式',
    content: close => <NovelExportTxtPanel close={close} />,
    className: 'max-w-[500px]',
  });
};

export const CosmosExport = ({ id }: { id: string }) => {
  const handleExport = async () => {
    try {
      await exportCosmos(id);
    } catch (error) {
      toast.error('导出失败', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <div className="space-y-6">
      <Button onClick={handleExport} className="w-full h-10" variant="default">
        <TbDownload className="mr-2 h-4 w-4" />
        开始导出
      </Button>
    </div>
  );
};
CosmosExport.open = (id: string) => {
  dialog({
    title: '导出项目',
    content: <CosmosExport id={id} />,
    className: 'w-[400px]',
  });
};
