import { eq, sql } from 'drizzle-orm';
import type { Database } from './index';
import { rawDocs } from './schema/documents';
import type { NewRawDoc, UpdateRawDoc } from './schema/documents';

export async function getRawDocByFileId(db: Database, fileId: string) {
  return db.query.rawDocs.findFirst({
    where: eq(rawDocs.fileId, fileId),
  });
}

export async function createRawDoc(db: Database, data: NewRawDoc) {
  return db.insert(rawDocs).values(data).returning();
}

export async function updateRawDocOCR(db: Database, fileId: string, data: Partial<UpdateRawDoc>) {
  return db.update(rawDocs).set(data).where(eq(rawDocs.fileId, fileId)).returning();
}

export async function updateRawDoc(db: Database, fileId: string, data: Partial<UpdateRawDoc>) {
  return db.update(rawDocs).set(data).where(eq(rawDocs.fileId, fileId)).returning();
}

export function generateSearchableText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
}

export function parseTags(tags: string): string[] {
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) {
      return parsed.map(String);
    }
    return [];
  } catch {
    return [];
  }
}

export async function getUploadStats(db: Database, userId: string) {
  const result = await db
    .select({
      count: sql<number>`count(${rawDocs.id})`.mapWith(Number),
      totalSize: sql<number>`sum(${rawDocs.fileSize})`.mapWith(Number),
    })
    .from(rawDocs)
    .where(eq(rawDocs.uploadedBy, userId));

  const stats = result[0];

  return {
    count: stats?.count || 0,
    totalSize: stats?.totalSize || 0,
  };
}