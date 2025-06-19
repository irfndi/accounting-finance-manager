import { eq } from 'drizzle-orm';

const accounts = {
  id: { name: 'id' },
  code: { name: 'code' },
  type: { name: 'type' },
  isActive: { name: 'isActive' }
};

const condition1 = eq(accounts.code, '1000');
const condition2 = eq(accounts.type, 'ASSET');
const condition3 = eq(accounts.isActive, 1);

console.log('=== Condition 1: eq(accounts.code, "1000") ===');
console.log('Full condition:', JSON.stringify(condition1, null, 2));
console.log('QueryChunks length:', condition1.queryChunks.length);
condition1.queryChunks.forEach((chunk, i) => {
  console.log(`Chunk ${i}:`, typeof chunk, chunk);
});

console.log('\n=== Condition 2: eq(accounts.type, "ASSET") ===');
console.log('QueryChunks length:', condition2.queryChunks.length);
condition2.queryChunks.forEach((chunk, i) => {
  console.log(`Chunk ${i}:`, typeof chunk, chunk);
});

console.log('\n=== Condition 3: eq(accounts.isActive, 1) ===');
console.log('QueryChunks length:', condition3.queryChunks.length);
condition3.queryChunks.forEach((chunk, i) => {
  console.log(`Chunk ${i}:`, typeof chunk, chunk);
});