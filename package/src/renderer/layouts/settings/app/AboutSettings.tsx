import { useTranslation } from "react-i18next";
import iconImage from "@/assets/new-macOS-Default-1024x1024@2x.png";

export const AboutSettings = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-lg">
      <section className="section">
        <div className="flex items-center gap-md">
          <img
            src={iconImage}
            alt="Vibecape"
            className="size-16 rounded-xl"
          />
          <div>
            <h3 className="text-xl font-semibold">Vibecape</h3>
            <p className="text-sm text-muted-foreground mt-1">
              NextGen AI Native Docs Editor
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("common.settings.version")}
            </span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("common.settings.creator")}
            </span>
            <a
              href="https://wangenius.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              wangenius
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("common.settings.homepage")}
            </span>
            <a
              href="https://vibecape.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              vibecape.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
