import { Button } from '@/components/ui/button';
import { TbBook, TbUsers, TbVideo } from 'react-icons/tb';
import TutorPanel from '../../../components/custom/TutorPanel';

const TutorialsView = () => {
  const tutorials = [
    {
      icon: TbBook,
      title: '官网文档',
      description: '官方详细文档，包含产品所有功能的使用说明和最佳实践指南',
      url: 'https://jezzlab.com/docs/start',
    },
    {
      icon: TbBook,
      title: '飞书文档',
      description: '在飞书文档中，你可以找到更多详细的操作指南和常见问题解答',
      url: 'https://v16cwjzf5wt.feishu.cn/wiki/space/7433715484972040195?ccm_open_type=lark_wiki_spaceLink&open_tab_from=wiki_home',
    },
    {
      icon: TbVideo,
      title: '视频教程',
      description: '通过生动的视频演示，直观地学习软件的使用方法和技巧',
      url: 'https://space.bilibili.com/3546665296333720?spm_id_from=333.337.0.0',
    },
    {
      icon: TbUsers,
      title: '加入社群',
      description: '加入我们的用户社群，与其他创作者交流经验，分享创作心得',
      url: 'https://qm.qq.com/q/HcVchbcF4Q',
    },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* 快速入门 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">快速入门</h3>
              <p className="text-sm text-muted-foreground mt-1">
                查看简单说明，快速了解基本操作
              </p>
            </div>

            <div className="rounded-lg">
              <div className="space-y-1">
                <div
                  onClick={() => TutorPanel.open()}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <TbBook className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">新手指南</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        了解基本功能和操作流程
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    查看
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 学习资源 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">学习资源</h3>
              <p className="text-sm text-muted-foreground mt-1">
                通过专业的教程指南，快速掌握创作技巧
              </p>
            </div>

            <div className="rounded-lg">
              <div className="space-y-1">
                {tutorials.map((tutorial, index) => (
                  <a
                    key={index}
                    href={tutorial.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-muted-foreground/10 transition-colors">
                        <tutorial.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">
                          {tutorial.title}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tutorial.description}
                        </p>
                      </div>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { TutorialsView };
