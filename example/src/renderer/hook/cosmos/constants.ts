import type { CosmosTag } from "@common/types/content";

export const TAG_GROUPS = [
  { name: "category", multiple: false },
  { name: "time", multiple: false },
  { name: "genre", multiple: true },
  { name: "custom", multiple: true },
];

export const TAG_OPTIONS: Record<string, CosmosTag[]> = {
  category: [
    { label: "男性", value: "male", group: "category" },
    { label: "女性", value: "female", group: "category" },
    { label: "其他", value: "other", group: "category" },
  ],
  time: [
    { label: "古代", value: "ancient", group: "time" },
    { label: "近代", value: "modern", group: "time" },
    { label: "未来", value: "future", group: "time" },
  ],
  genre: [
    { label: "奇幻", value: "fantasy", group: "genre" },
    { label: "科幻", value: "sci-fi", group: "genre" },
    { label: "都市", value: "urban", group: "genre" },
    { label: "悬疑", value: "mystery", group: "genre" },
    { label: "历史", value: "history", group: "genre" },
    { label: "言情", value: "romance", group: "genre" },
  ],
};
