import { PiCommand } from 'react-icons/pi';
import { TbEdit } from 'react-icons/tb';

interface Shortcut {
  name: string;
  description: string;
  key: string;
}

interface ShortcutGroup {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcuts: Shortcut[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: '通用快捷键',
    description: '系统常用的基础操作快捷键',
    icon: PiCommand,
    shortcuts: [
      {
        name: '快速开关侧边栏',
        description: '快速开关侧边栏',
        key: 'Ctrl + B',
      },
      {
        name: '快速打开设置',
        description: '快速打开设置页面',
        key: 'Ctrl + ,',
      },
      {
        name: '快速切换主页和创作空间',
        description: '仅在有作品打开的情况下',
        key: 'Ctrl + Y',
      },
    ],
  },
  {
    title: '编辑快捷键',
    description: '文本编辑时的相关的快捷操作',
    icon: TbEdit,
    shortcuts: [
      {
        name: '快捷面板',
        description: '打开快捷面板，快速使用各种内容',
        key: '#',
      },
      {
        name: '角色快捷插入',
        description: '将选中的内容复制到剪贴板',
        key: '@',
      },
      {
        name: 'AI行内工具',
        description: '在行内使用AI对话工具',
        key: '> + Enter',
      },
      {
        name: 'AI自动推断',
        description: '自动推断接下来的输入',
        key: 'Alt + P',
      },
      {
        name: '扩写',
        description: '扩写当前段落',
        key: 'Alt + 1',
      },
      {
        name: '润色',
        description: '润色当前段落',
        key: 'Alt + 2',
      },
      {
        name: '快速打开优化面板',
        description:
          '当您在编辑扩写、润色时，可以当光标位于目标语句时，用此快捷键快速打开关闭优化面板',
        key: 'Alt + Q',
      },
      {
        name: '快速聚焦',
        description: '快速聚焦到正文编辑部分',
        key: 'Ctrl + I',
      },
    ],
  },
];

export const ShortcutsView = () => {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {shortcutGroups.map((group, index) => (
            <div key={index} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <group.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold">{group.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {group.description}
                  </p>
                </div>
              </div>

              <div className="rounded-lg">
                <div className="space-y-1">
                  {group.shortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {shortcut.name}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {shortcut.description}
                          </p>
                        </div>
                      </div>
                      <kbd className="shrink-0 px-2.5 py-1.5 text-xs font-medium bg-muted rounded-md border shadow-sm">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
