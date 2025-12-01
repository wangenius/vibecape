import { useEffect } from "react";
import { DefaultModels, Models } from "@/hook/model/useModel";
import { initSettings } from "@/hook/app/useSettings";

export function useAppInit() {
  useEffect(() => {
    const init = async () => {
      try {
        console.log("[App] Initializing...");
        await Promise.all([
          initSettings(),
          Models.init(),
          DefaultModels.init(),
        ]);
        console.log("[App] Initialization complete");
      } catch (error) {
        console.error("[App] Initialization failed:", error);
      }
    };

    void init();
  }, []);
}
