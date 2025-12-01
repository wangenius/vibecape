import { dialog } from '@/components/custom/DialogModal';
import { FormContainer, FormInput } from '@/components/custom/FormWrapper';
import { Button } from '@/components/ui/button';
import { lang } from '@/locales/i18n';
import { createNovel } from '@/hook/novel/useNovel';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

export const CreateNovelPanel = ({ close }: { close: () => void }) => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4 overflow-y-auto max-h-[80vh]">
      <FormContainer
        onSubmit={async v => {
          try {
            if (v.name) {
              setLoading(true);
              await createNovel({ name: v.name });
              close();
            }
          } catch (e) {
            toast.error(String(e));
          } finally {
            setLoading(false);
          }
        }}
        schema={z.object({ name: z.string().min(1) })}
        className="space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <FormInput
            autoFocus
            name={'name'}
            placeholder="请输入小说名称"
            disabled={loading}
            className="flex-1"
          />
        </div>
        <Button
          disabled={loading}
          className="w-full h-10"
          type="submit"
          variant="primary"
        >
          {loading ? '创建中...' : '确认创建'}
        </Button>
      </FormContainer>
    </div>
  );
};

CreateNovelPanel.open = () => {
  dialog({
    title: lang('common.new'),
    description: lang('common.newDesc'),
    className: 'max-w-4xl w-[500px]',
    content: close => <CreateNovelPanel close={close} />,
  });
};
