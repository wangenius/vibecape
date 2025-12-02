import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";
import { createTokenizer } from "@orama/tokenizers/mandarin";

// Apply Mandarin tokenizer globally, without locale-based filtering.
// Do NOT set `language` when using a custom tokenizer (Orama restriction).
export const { GET } = createFromSource(source, {
  components: {
    tokenizer: createTokenizer(),
  },
});
