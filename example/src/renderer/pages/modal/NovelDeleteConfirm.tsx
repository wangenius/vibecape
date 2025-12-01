import { dialog } from "@/components/custom/DialogModal";
import { deleteNovel } from "@/hook/novel/useNovel";
import { Novel } from "@common/schema/novel";

export default function NovelDeleteConfirm({ novel }: { novel: Novel }) {
  return (
    <div>
      确定删除小说
      <span className={"font-bold text-base-content underline"}>
        {novel.name}
      </span>
      ? 此操作将永久删除小说数据.
    </div>
  );
}

NovelDeleteConfirm.open = (novel: Novel) => {
  dialog.confirm({
    title: "确定删除小说",
    content: <NovelDeleteConfirm novel={novel} />,
    onOk: () => {
      deleteNovel(novel);
    },
  });
};
