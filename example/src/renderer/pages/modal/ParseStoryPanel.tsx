import { dialog } from '@/components/custom/DialogModal';
import {
  FormContainer,
  FormTextArea,
} from '@/components/custom/FormWrapper';
import { Button } from '@/components/ui/button';
import { BsStars } from 'react-icons/bs';

export const ParseStoryPanel = ({ close: _close }: { close: () => void }) => {
  return (
    <FormContainer
      className={'flex flex-col gap-2'}
      onSubmit={async (_data) => {
        close();
        // const text = data.text as string;
        // const fileId = data.file as string | undefined;
        // const payload = fileId ? { fileId } : { text };
        // const { channel } = await window.api.ai.parseStoryStart(payload as any);
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
      <FormTextArea autoFocus placeholder={'输入要解析的内容或选择文件'} name={'text'} />
      <Button className="w-full h-10" type="submit" variant={'default'}>
        <BsStars className="mr-2 h-4 w-4" />
        开始解析
      </Button>
    </FormContainer>
  );
};

ParseStoryPanel.open = () => {
  dialog({
    title: '解析情节',
    description: '从文本或文件解析情节节点',
    className: 'max-w-[500px]',
    content: close => <ParseStoryPanel close={close} />,
  });
};
