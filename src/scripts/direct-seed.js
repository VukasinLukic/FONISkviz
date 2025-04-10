/* 
 * This script requires ts-node to run TypeScript files directly
 * It's referenced in package.json's "seed" script
 */

// Load environment variables
require('dotenv').config();

// Run the TypeScript seed file using ts-node
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});
require('./seed-questions.ts'); 