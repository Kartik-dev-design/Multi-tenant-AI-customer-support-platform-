import { Schema, model } from "mongoose";

// Mock order store so the agent has something real to look up.
// In production this becomes an integration (Shopify, internal OMS...), ideally behind an MCP server.
const s = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true },
    orderNumber: { type: String, required: true },
    customerEmail: { type: String, required: true },
    status: { type: String, enum: ["processing", "shipped", "delivered", "cancelled"], required: true },
    items: [{ name: String, qty: Number, price: Number }],
    total: { type: Number, required: true },
    trackingNumber: String,
    estimatedDelivery: Date,
  },
  { timestamps: true }
);
s.index({ tenantId: 1, orderNumber: 1 }, { unique: true });

export const Order = model("Order", s);
