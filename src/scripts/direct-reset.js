/* 
 * This script requires ts-node to run TypeScript files directly
 * Use it to reset the Firebase database for testing
 */

// Load environment variables
require('dotenv').config();

// Run the TypeScript reset file using ts-node
require('ts-node').register();
require('./reset-database.ts'); 