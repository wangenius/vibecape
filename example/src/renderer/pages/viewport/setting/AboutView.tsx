import { Button } from "@/components/ui/button";
import { PiInfo } from "react-icons/pi";
import { TbInfoCircle } from "react-icons/tb";
import { VersionPanel } from "@/components/custom/NotificationPanel";

export const AboutView = () => {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* 应用信息 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src="/icon.png"
                  className="size-10 object-cover"
                  alt="logo"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold">介子工坊</h3>
              </div>
            </div>
          </div>

    
          <div className="space-y-4">
            <div className="rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-background">
                  <img
                    src="/company.png"
                    className="size-10 object-cover"
                    alt="logo"
                  />
                  <span className="text-sm">深圳创生语宙科技有限公司</span>
                </div>
              </div>
            </div>
          </div>

          {/* 版本信息 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">版本信息</h3>
              <p className="text-sm text-muted-foreground mt-1">
                当前版本和更新记录
              </p>
            </div>

            <div className="rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">当前版本</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Preview v-{PACKAGE_VERSION}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => VersionPanel.open()}
                  >
                    <TbInfoCircle className="w-4 h-4 mr-2" />
                    更新日志
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 其他信息 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">其他信息</h3>
              <p className="text-sm text-muted-foreground mt-1">
                备案和法律信息
              </p>
            </div>

            <div className="rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-background">
                  <PiInfo className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">备案信息</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      粤ICP备2024309407号
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
