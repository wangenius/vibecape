import { dialog } from '@/components/custom/DialogModal';
import { FormInput, FormContainer } from '@/components/custom/FormWrapper';
import { Button } from '@/components/ui/button';
import { useNovel, updateNovelMeta } from '@/hook/novel/useNovel';

export default function NovelNameEdit({ close }: { close: () => void }) {
  const novel = useNovel();

  return (
    <FormContainer
      className="space-y-4"
      onSubmit={data => {
        updateNovelMeta({ name: data.name });
        close();
      }}
    >
      <FormInput
        placeholder={novel?.name || '请输入小说标题'}
        name="name"
      />
      <Button type="submit" variant="default" className="w-full h-10">
        更新
      </Button>
    </FormContainer>
  );
}

NovelNameEdit.open = () => {
  dialog({
    title: '编辑小说标题',
    className: 'max-w-[500px]',
    content: close => {
      return <NovelNameEdit close={close} />;
    },
  });
};
