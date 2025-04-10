/* 
 * This script requires ts-node to run TypeScript files directly
 * It's referenced in package.json's "reset" script
 */

// Load environment variables
require('dotenv').config();

// Run the TypeScript reset file using ts-node
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

// Import and run the resetGame function from quizService
const { resetGame } = require('../lib/quizService');

// Execute resetGame and log the result
resetGame()
  .then(() => {
    console.log('Game state reset successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error resetting game state:', error);
    process.exit(1);
  }); 