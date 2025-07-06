#!/usr/bin/env node

import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Function to recursively scan directory for files
async function scanDirectory(dir, extensions = ['.ts', '.tsx'], exclude = []) {
  const files = [];
  
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        if (!exclude.some(ex => fullPath.includes(ex))) {
          files.push(...await scanDirectory(fullPath, extensions, exclude));
        }
      } else if (stats.isFile()) {
        const ext = extname(entry);
        if (extensions.includes(ext) && !exclude.some(ex => fullPath.includes(ex))) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

// Function to analyze file content for functions and classes
async function analyzeFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const relativePath = relative(projectRoot, filePath);
    
    // Simple regex patterns to find functions and classes
    const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    const arrowFunctionPattern = /(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
    const classPattern = /(?:export\s+)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:extends\s+[a-zA-Z_$][a-zA-Z0-9_$]*)?\s*\{/g;
    const methodPattern = /(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g;
    
    const functions = [];
    const classes = [];
    
    let match;
    
    // Find regular functions
    while ((match = functionPattern.exec(content)) !== null) {
      functions.push({
        name: match[1],
        type: 'function',
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    // Find arrow functions
    while ((match = arrowFunctionPattern.exec(content)) !== null) {
      functions.push({
        name: match[1],
        type: 'arrow_function',
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    // Find classes
    while ((match = classPattern.exec(content)) !== null) {
      classes.push({
        name: match[1],
        type: 'class',
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    return {
      file: relativePath,
      functions,
      classes,
      totalLines: content.split('\n').length,
      size: content.length
    };
  } catch (error) {
    console.warn(`Warning: Could not analyze file ${filePath}:`, error.message);
    return null;
  }
}

// Main analysis function
async function analyzeCoverage() {
  console.log('🔍 Analyzing test coverage for Finance Manager...');
  console.log('=' .repeat(60));
  
  const srcDir = join(projectRoot, 'src');
  const testsDir = join(projectRoot, 'tests');
  
  // Scan source files
  const sourceFiles = await scanDirectory(srcDir, ['.ts', '.tsx'], [
    '.test.', '.spec.', '.d.ts', 'node_modules', 'dist', '.astro'
  ]);
  
  // Scan test files
  const testFiles = await scanDirectory(testsDir, ['.ts', '.tsx'], [
    'node_modules', 'dist'
  ]);
  
  console.log(`📁 Found ${sourceFiles.length} source files`);
  console.log(`🧪 Found ${testFiles.length} test files`);
  console.log('');
  
  // Analyze source files
  const sourceAnalysis = [];
  for (const file of sourceFiles) {
    const analysis = await analyzeFile(file);
    if (analysis) {
      sourceAnalysis.push(analysis);
    }
  }
  
  // Analyze test files
  const testAnalysis = [];
  for (const file of testFiles) {
    const analysis = await analyzeFile(file);
    if (analysis) {
      testAnalysis.push(analysis);
    }
  }
  
  // Calculate statistics
  const totalSourceFunctions = sourceAnalysis.reduce((sum, file) => sum + file.functions.length, 0);
  const totalSourceClasses = sourceAnalysis.reduce((sum, file) => sum + file.classes.length, 0);
  const totalSourceLines = sourceAnalysis.reduce((sum, file) => sum + file.totalLines, 0);
  
  const totalTestFunctions = testAnalysis.reduce((sum, file) => sum + file.functions.length, 0);
  const totalTestLines = testAnalysis.reduce((sum, file) => sum + file.totalLines, 0);
  
  console.log('📊 Coverage Analysis Summary:');
  console.log('-'.repeat(40));
  console.log(`Source Files: ${sourceFiles.length}`);
  console.log(`Source Functions: ${totalSourceFunctions}`);
  console.log(`Source Classes: ${totalSourceClasses}`);
  console.log(`Source Lines: ${totalSourceLines}`);
  console.log('');
  console.log(`Test Files: ${testFiles.length}`);
  console.log(`Test Functions: ${totalTestFunctions}`);
  console.log(`Test Lines: ${totalTestLines}`);
  console.log('');
  
  // Estimate coverage based on test-to-source ratio
  const functionCoverageRatio = totalTestFunctions / totalSourceFunctions;
  const lineCoverageRatio = totalTestLines / totalSourceLines;
  
  console.log('📈 Estimated Coverage Metrics:');
  console.log('-'.repeat(40));
  console.log(`Function Coverage Ratio: ${(functionCoverageRatio * 100).toFixed(1)}%`);
  console.log(`Line Coverage Ratio: ${(lineCoverageRatio * 100).toFixed(1)}%`);
  console.log('');
  
  // Identify files without tests
  const filesWithoutTests = [];
  for (const sourceFile of sourceAnalysis) {
    const testFileName = sourceFile.file.replace(/\.(ts|tsx)$/, '.test.$1');
    const hasTest = testAnalysis.some(test => 
      test.file.includes(testFileName) || 
      test.file.includes(sourceFile.file.replace('src/', '').replace(/\.(ts|tsx)$/, ''))
    );
    
    if (!hasTest && sourceFile.functions.length > 0) {
      filesWithoutTests.push(sourceFile);
    }
  }
  
  console.log('🚨 Files that may need more test coverage:');
  console.log('-'.repeat(40));
  filesWithoutTests.slice(0, 10).forEach(file => {
    console.log(`📄 ${file.file} (${file.functions.length} functions, ${file.classes.length} classes)`);
  });
  
  if (filesWithoutTests.length > 10) {
    console.log(`... and ${filesWithoutTests.length - 10} more files`);
  }
  
  console.log('');
  console.log('🎯 Recommendations to reach 80% coverage:');
  console.log('-'.repeat(40));
  
  if (functionCoverageRatio < 0.8) {
    const neededTests = Math.ceil((totalSourceFunctions * 0.8) - totalTestFunctions);
    console.log(`• Add approximately ${neededTests} more test functions`);
  }
  
  if (lineCoverageRatio < 0.8) {
    const neededLines = Math.ceil((totalSourceLines * 0.8) - totalTestLines);
    console.log(`• Add approximately ${neededLines} more test lines`);
  }
  
  console.log('• Focus on files with high function/class count but no tests');
  console.log('• Prioritize API routes and core business logic');
  console.log('• Add integration tests for complex workflows');
  
  return {
    sourceFiles: sourceFiles.length,
    testFiles: testFiles.length,
    functionCoverageRatio,
    lineCoverageRatio,
    filesWithoutTests: filesWithoutTests.length,
    recommendations: {
      needsMoreTests: functionCoverageRatio < 0.8 || lineCoverageRatio < 0.8,
      targetCoverage: 80
    }
  };
}

// Run the analysis
analyzeCoverage().catch(console.error);