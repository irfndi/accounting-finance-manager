import { eq, sql } from 'drizzle-orm';
import { rawDocs } from './schema/documents';
export async function getRawDocByFileId(db, fileId) {
    return db.query.rawDocs.findFirst({
        where: eq(rawDocs.fileId, fileId),
    });
}
export async function createRawDoc(db, data) {
    return db.insert(rawDocs).values(data).returning();
}
export async function updateRawDocOCR(db, fileId, data) {
    return db.update(rawDocs).set(data).where(eq(rawDocs.fileId, fileId)).returning();
}
export async function updateRawDoc(db, fileId, data) {
    return db.update(rawDocs).set(data).where(eq(rawDocs.fileId, fileId)).returning();
}
export function generateSearchableText(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
}
export function parseTags(tags) {
    try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) {
            return parsed.map(String);
        }
        return [];
    }
    catch {
        return [];
    }
}
export async function getUploadStats(db, userId) {
    const result = await db
        .select({
        count: sql `count(${rawDocs.id})`.mapWith(Number),
        totalSize: sql `sum(${rawDocs.fileSize})`.mapWith(Number),
    })
        .from(rawDocs)
        .where(eq(rawDocs.uploadedBy, userId));
    const stats = result[0];
    return {
        count: stats?.count || 0,
        totalSize: stats?.totalSize || 0,
    };
}
