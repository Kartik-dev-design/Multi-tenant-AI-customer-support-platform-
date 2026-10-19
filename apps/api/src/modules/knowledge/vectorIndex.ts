import { env } from "../../config/env";
import { Chunk } from "../../models/Chunk";

export const VECTOR_INDEX = "chunk_vector_index";

/** Idempotent: creates the Atlas Vector Search index if it doesn't exist. */
export async function ensureVectorIndex() {
  try {
    await Chunk.createCollection().catch(() => {}); // search indexes need the collection to exist
    const existing = await Chunk.collection.listSearchIndexes(VECTOR_INDEX).toArray();
    if (existing.length) return;
    await Chunk.collection.createSearchIndex({
      name: VECTOR_INDEX,
      type: "vectorSearch",
      definition: {
        fields: [
          { type: "vector", path: "embedding", numDimensions: env.EMBEDDING_DIMENSIONS, similarity: "cosine" },
          { type: "filter", path: "tenantId" }, // lets us pre-filter by tenant INSIDE the vector search
        ],
      },
    });
    console.log(`Created vector index "${VECTOR_INDEX}"`);
  } catch (e) {
    console.warn("Could not ensure vector index (needs Atlas or atlas-local):", (e as Error).message);
  }
}
