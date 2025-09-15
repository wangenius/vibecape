import inquirer from "inquirer";
import * as fs from "fs-extra";
import { createTemplate } from "./TemplateManager";

createTemplate({
  name: "blank",
  description: "A blank template with minimal setup",
  execute: async (path: string) => {
    const res = await inquirer.prompt([
      {
        type: "input",
        name: "readme",
        message:
          "do you want to set up a README.md file?(yes/no, default: yes)",
        default: "yes",
        validate(input) {
          const val = input.toLowerCase();
          if (val === "yes" || val === "no") {
            return true;
          }
          return 'please enter "yes" or "no"';
        },
      },
    ]);

    if (res.readme === "yes") {
      fs.writeFile(
        path + "/README.md",
        `# ${path.split("/").pop()}\n\nThis is a blank project created with vibecape.\n`,
        (err) => {
          if (err) {
            console.error("Error creating README.md:", err);
          } else {
            console.log("README.md created successfully.");
          }
        }
      );
    }
    return;
  },
});

createTemplate({
  name: "PackageOnNPMJS",
  description: "NPMJS Node Template",
  url: "https://github.com/wangenius/npmjs-template.git",
});

createTemplate({
  name: "vibetake",
  description: "Next.js Template",
  url: "https://github.com/wangenius/vibetake.git",
});
