import * as fs from "fs-extra";
import * as path from "path";
import { createTemplate } from "./TemplateManager";

createTemplate({
  name: "blank",
  description: "A blank template with minimal setup",
  execute: async (params) => {
    // For the blank template, avoid extra prompts to prevent conflicts with spinners.
    const projectName = path.basename(params.path);
    const content = `# ${projectName}\n\nThis is a blank project created with vibecape.\n`;
    await fs.writeFile(params.path + "/README.md", content);
  },
});

createTemplate({
  name: "PackageOnNPMJS",
  description: "NPMJS Node Template",
  url: "https://github.com/wangenius/npmjs-template.git",
});

createTemplate({
  name: "vibetake",
  description: "vibetake 是 vibecape 默认的 Next.js Template",
  url: "https://github.com/wangenius/vibetake.git",
});
