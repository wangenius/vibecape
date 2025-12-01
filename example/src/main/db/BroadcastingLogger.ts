import { Logger } from "drizzle-orm/logger";
import { eventBus } from "@main/services/EventBus";

export class BroadcastingLogger implements Logger {
  private cosmosId: string;

  constructor(cosmosId: string) {
    this.cosmosId = cosmosId;
  }

  logQuery(query: string, _: unknown[]): void {
    const q = query.trim().toLowerCase();
    // Filter out SELECT and PRAGMA
    if (q.startsWith("select") || q.startsWith("pragma")) return;

    let tableName = "";
    // Check for core tables. Order matters if table names are substrings of others, but here they are distinct enough.
    if (q.includes('"chapters"') || q.includes('chapters')) tableName = "chapters";
    else if (q.includes('"novels"') || q.includes('novels')) tableName = "novels";
    else if (q.includes('"actants"') || q.includes('actants')) tableName = "actants";
    else if (q.includes('"actant_relations"') || q.includes('actant_relations')) tableName = "actant_relations";
    else if (q.includes('"actant_states"') || q.includes('actant_states')) tableName = "actant_states";
    else if (q.includes('"actant_types"') || q.includes('actant_types')) tableName = "actant_types";
    else if (q.includes('"lores"') || q.includes('lores')) tableName = "lores";
    else if (q.includes('"lore_types"') || q.includes('lore_types')) tableName = "lore_types";
    else if (q.includes('"stories"') || q.includes('stories')) tableName = "stories";
    else if (q.includes('"timelines"') || q.includes('timelines')) tableName = "timelines";

    if (!tableName) return;

    const operation = q.split(' ')[0].toUpperCase(); // INSERT, UPDATE, DELETE

    eventBus.emit('db:change', {
      cosmosId: this.cosmosId,
      tableName,
      operation
    });
  }
}
