import { dialog } from '@/components/custom/DialogModal';
import {
  FormContainer,
  FormSelect,
  FormTextArea,
} from '@/components/custom/FormWrapper';
import { Button } from '@/components/ui/button';
// BookFile 功能已移除
import { BsStars } from 'react-icons/bs';
/**
 * 解析设定
 * 从已有的书籍中解析出来你想要的设定
 */
export const ParseLorePanel = ({ close: _close }: { close: () => void }) => {
  // BookFile 功能已移除
  const files: any[] = [];
  return (
    <FormContainer
      className={'flex flex-col gap-2'}
      onSubmit={async (_data) => {
        close();
        // const { channel } = await window.api.ai.parseLoreStart({ text: `fileid://${data.file}\n${data.extra || ''}` });
        // const ipc = window.electron?.ipcRenderer;
        // if (ipc) {
        //   const handler = (_e: unknown, payload: any) => {
        //     if (payload?.type === 'end' || payload?.type === 'error') {
        //       ipc.removeAllListeners(channel);
        //     }
        //   };
        //   ipc.on(channel, handler);
        // }
      }}
    >
      <div className="flex gap-2 items-center justify-between">
        <label className="text-sm text-muted-foreground">选择书籍</label>
        <FormSelect
          name={'file'}
          align="end"
          emptyText="暂无书籍，请您先上传"
          options={files.map(file => ({
            label: file.filename,
            value: file.id,
          }))}
        />
      </div>
      <FormTextArea
        autoFocus
        placeholder={'输入你想拆解的设定描述'}
        name={'extra'}
      />
      <Button className="w-full h-10" type="submit" variant={'default'}>
        <BsStars className="mr-2 h-4 w-4" />
        开始解析
      </Button>
    </FormContainer>
  );
};

ParseLorePanel.open = () => {
  dialog({
    title: '解析设定',
    description: '从已有的书籍中解析出来你想要的设定',
    className: 'max-w-[500px]',
    content: close => <ParseLorePanel close={close} />,
  });
};
