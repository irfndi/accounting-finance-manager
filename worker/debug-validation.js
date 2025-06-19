import { validateOCRRequirements } from './dist/worker/src/utils/ocr.js';

console.log('Testing 50 bytes:', validateOCRRequirements('image/jpeg', 50));
console.log('Testing 150 bytes:', validateOCRRequirements('image/jpeg', 150));
console.log('Testing 99 bytes:', validateOCRRequirements('image/jpeg', 99));
console.log('Testing 100 bytes:', validateOCRRequirements('image/jpeg', 100));