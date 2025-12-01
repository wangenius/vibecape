import { text, integer } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { customType } from "drizzle-orm/sqlite-core";

type IdOptions = {
  length?: number;
};

export const id = (name: string, options?: IdOptions) => {
  const len = options?.length ?? 21;
  return text(name, { length: len })
    .primaryKey()
    .$defaultFn(() => nanoid(len));
};

export const jsonb = <T>() =>
  customType<{ data: T; driverData: string }>({
    dataType: () => "text",
    toDriver: (value) => JSON.stringify(value),
    fromDriver: (value) => {
      try {
        return JSON.parse(value as string);
      } catch {
        return value as any;
      }
    },
  });

export const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" }).$defaultFn(() => Date.now());
