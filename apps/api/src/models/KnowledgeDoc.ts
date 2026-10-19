import { Schema, model, InferSchemaType } from "mongoose";

const schemaDef = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storagePath: { type: String, required: true },
    status: { type: String, enum: ["queued", "processing", "ready", "failed"], default: "queued" },
    error: { type: String },
    chunkCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type KnowledgeDocType = InferSchemaType<typeof schemaDef>;
export const KnowledgeDoc = model("KnowledgeDoc", schemaDef);
