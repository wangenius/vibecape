import { loader } from "fumadocs-core/source";
import { docs, create } from "../../source.generated";

export const source = loader({
  baseUrl: "/docs",
  source: await create.sourceAsync(docs.doc, docs.meta),
});
