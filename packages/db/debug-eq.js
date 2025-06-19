import { eq } from 'drizzle-orm';

const mockColumn = { name: 'test' };
const condition = eq(mockColumn, 'value');
console.log('eq condition structure:', JSON.stringify(condition, null, 2));
console.log('condition keys:', Object.keys(condition));
console.log('condition type:', typeof condition);