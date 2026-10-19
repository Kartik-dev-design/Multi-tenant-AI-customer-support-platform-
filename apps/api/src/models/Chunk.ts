import { Schema, model } from "mongoose";

const chunkSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true },
    documentId: { type: Schema.Types.ObjectId, ref: "KnowledgeDoc", required: true, index: true },
    index: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true, select: false },
  },
  { timestamps: true }
);
chunkSchema.index({ tenantId: 1, documentId: 1 });

export const Chunk = model("Chunk", chunkSchema);
