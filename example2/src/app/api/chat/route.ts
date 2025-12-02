import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
} from "ai";
import { MAIN_MODEL } from "@/lib/Model";
import { getServerSession } from "@/lib/server-session";
import {
  get_blog_content,
  get_blog_list,
  get_doc_content,
  get_docs_tree,
  get_product_content,
  get_products_list,
  search,
} from "./tool";
import systemPrompt from "./system";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new Response("请先登录", { status: 401 });
  }

  const { messages = [] }: { messages?: UIMessage[] } = await request.json();

  const msgs = convertToModelMessages(messages);
  console.log(JSON.stringify(msgs));
  const result = streamText({
    model: MAIN_MODEL,
    system: systemPrompt,
    messages: msgs,
    tools: {
      get_doc_content,
      get_docs_tree,
      get_blog_list,
      get_blog_content,
      get_products_list,
      get_product_content,
      search,
    },
    temperature: 0.7,
    stopWhen: stepCountIs(20),
    onChunk: (chunk) => {
      console.log(chunk);
    },
  });

  return result.toUIMessageStreamResponse();
}
