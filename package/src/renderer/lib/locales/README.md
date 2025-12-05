# Internationalization (i18n)

This project uses `react-i18next` for internationalization.

## Structure

- `i18n.ts`: Main configuration file.
- `en/`: English translations.
  - `common.json`: Common translation keys.
- `zh-CN/`: Chinese translations.
  - `common.json`: Common translation keys.

## Usage

### In Components

```typescript
import { useTranslation } from "react-i18next";

export const MyComponent = () => {
  const { t } = useTranslation();
  return <div>{t("common.key")}</div>;
};
```

### In Non-React Code

```typescript
import { lang } from "@/locales/i18n";

const message = lang("common.key");
```

## Adding a New Language

See `.agent/workflows/add-new-language.md` for instructions.
