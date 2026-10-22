import { z } from "zod";
import { KnowledgeDoc } from "../../models/KnowledgeDoc";
import { Order } from "../../models/Order";
import { Ticket } from "../../models/Ticket";
import { retrieve } from "../knowledge/knowledge.service";

/**
 * SECURITY: tenantId / userId / conversationId come from the server-side ToolContext,
 * NEVER from the model's arguments. The model can't ask for another tenant's data
 * because there is no parameter that lets it.
 */
export interface ToolContext {
  tenantId: string;
  userId: string;
  conversationId: string;
}

interface ToolDef {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required: string[] };
  schema: z.ZodType<any>;
  run: (input: any, ctx: ToolContext) => Promise<unknown>;
}

export const tools: ToolDef[] = [
  {
    name: "searchKnowledgeBase",
    description:
      "Search the company's knowledge base (policies, FAQs, how-to guides, product info). Use for any question about how the company works. Returns relevant passages with their source file.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "A focused search query in natural language" } },
      required: ["query"],
    },
    schema: z.object({ query: z.string().trim().min(2).max(500) }),
    async run({ query }, ctx) {
      const hits = await retrieve(ctx.tenantId, query);
      if (!hits.length) return { results: [], note: "No relevant documents found." };
      const docs = await KnowledgeDoc.find({ _id: { $in: hits.map((h) => h.documentId) }, tenantId: ctx.tenantId });
      const name = new Map(docs.map((d) => [String(d._id), d.filename]));
      return {
        results: hits.map((h) => ({
          source: name.get(String(h.documentId)) ?? "unknown",
          score: Number(h.score.toFixed(3)),
          text: h.text,
        })),
      };
    },
  },
  {
    name: "getOrderStatus",
    description:
      "Look up an order by its order number (e.g. ORD-1001). Returns status, items, tracking number and estimated delivery. If the customer hasn't given an order number, ask for it instead of guessing.",
    input_schema: {
      type: "object",
      properties: { orderNumber: { type: "string", description: "The order number, e.g. ORD-1001" } },
      required: ["orderNumber"],
    },
    schema: z.object({ orderNumber: z.string().trim().min(3).max(40) }),
    async run({ orderNumber }, ctx) {
      // TODO (hardening): require the customer's email to match before revealing details.
      const order = await Order.findOne({ tenantId: ctx.tenantId, orderNumber: orderNumber.toUpperCase() });
      if (!order) return { found: false, message: `No order found with number ${orderNumber}` };
      return {
        found: true,
        orderNumber: order.orderNumber,
        status: order.status,
        items: order.items,
        total: order.total,
        trackingNumber: order.trackingNumber ?? null,
        estimatedDelivery: order.estimatedDelivery?.toISOString().slice(0, 10) ?? null,
      };
    },
  },
  {
    name: "createTicket",
    description:
      "Create a support ticket for a human agent. Use when you cannot resolve the issue from the knowledge base or order data, when the customer asks for a human, or when they want something you cannot do yourself (refunds, account changes, complaints).",
    input_schema: {
      type: "object",
      properties: {
        subject: { type: "string", description: "Short summary, max ~80 chars" },
        description: { type: "string", description: "Full context: what the customer wants and what has been tried" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: ["subject", "description", "priority"],
    },
    schema: z.object({
      subject: z.string().trim().min(3).max(200),
      description: z.string().trim().min(3).max(4000),
      priority: z.enum(["low", "medium", "high"]),
    }),
    async run(input, ctx) {
      const t = await Ticket.create({ ...input, tenantId: ctx.tenantId, conversationId: ctx.conversationId, createdVia: "agent" });
      return { ticketId: t.id, status: t.status, message: "Ticket created; a human agent will follow up." };
    },
  },
];

export const anthropicTools = tools.map(({ name, description, input_schema }) => ({ name, description, input_schema }));

/** Never throws: errors go back to the model as an error tool_result so it can recover or apologise. */
export async function executeTool(name: string, rawInput: unknown, ctx: ToolContext) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) return { output: { error: `Unknown tool: ${name}` }, isError: true };
  const parsed = tool.schema.safeParse(rawInput);
  if (!parsed.success) return { output: { error: "Invalid arguments", details: parsed.error.issues }, isError: true };
  try {
    return { output: await tool.run(parsed.data, ctx), isError: false };
  } catch (e) {
    console.error(`tool ${name} failed:`, e);
    return { output: { error: "Tool execution failed" }, isError: true };
  }
}
