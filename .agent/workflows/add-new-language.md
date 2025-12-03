---
description: How to add a new language to the application
---

1. Create a new locale directory in `src/renderer/locales/[lang_code]`.
2. Copy `common.json` from `src/renderer/locales/en` to the new directory.
3. Translate all values in the new `common.json`.
4. Update `src/renderer/locales/i18n.ts`:
   - Import the new locale file.
   - Add it to the `resources` object.
5. Update `src/renderer/components/settings/GeneralSettings.tsx`:
   - Add the new language to `LANGUAGE_OPTIONS`.
