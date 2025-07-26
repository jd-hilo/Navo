// Test file to demonstrate the Dynamic Layout Engine
// This file shows how the layout engine classifies different search queries

import { analyzeSearchLayout, getAvailableIntents, getIntentExamples } from './layoutEngine';

// Test queries for different intent types
const testQueries = [
  // Factual queries
  "Who won the Super Bowl?",
  "What is the weather today?",
  "Latest news on AI",
  "How many people live in NYC?",
  
  // Local/Experience queries
  "Best food spots in Austin",
  "Restaurants near me",
  "Top attractions in Paris",
  "Coffee shops downtown",
  
  // Visual/Design queries
  "Bedroom aesthetic ideas",
  "Summer outfit inspiration",
  "Kitchen design trends",
  "Hair color ideas",
  
  // Product Research queries
  "Best budget headphones 2025",
  "iPhone vs Android comparison",
  "Gaming laptop reviews",
  "Best camera for beginners",
  
  // How-to/DIY queries
  "How to make matcha",
  "DIY home decor ideas",
  "How to fix a flat tire",
  "Learn guitar chords",
  
  // Social Curiosity queries
  "Is LOL passive aggressive?",
  "Reddit opinions on remote work",
  "What do people think about...",
  "Is it weird to...",
  
  // Entertainment/Trends queries
  "Viral TikTok dances",
  "Trending memes this week",
  "Funny cat videos",
  "Latest music trends",
  
  // Lifestyle/Wellness queries
  "Morning routine ideas",
  "Healthy meal prep",
  "Stress relief techniques",
  "Better sleep habits",
  
  // General queries
  "Summer trends 2025",
  "Random search query",
  "Something interesting",
  "What's new"
];

// Function to test and display results
export function testLayoutEngine() {
  console.log('🧠 Dynamic Layout Engine Test Results\n');
  
  // Test each query
  testQueries.forEach((query, index) => {
    const result = analyzeSearchLayout(query);
    console.log(`${index + 1}. Query: "${query}"`);
    console.log(`   Intent: ${result.intent}`);
    console.log(`   Layout:`);
    
    result.layout.forEach(module => {
      const visibility = module.priority === 'none' ? '❌ Hidden' : '✅ Visible';
      console.log(`     - ${module.module}: ${module.priority} priority, ${module.display} display ${visibility}`);
    });
    console.log('');
  });
  
  // Show available intents
  console.log('📊 Available Intent Types:');
  const intents = getAvailableIntents();
  intents.forEach(intent => {
    const examples = getIntentExamples(intent);
    console.log(`   - ${intent}: ${examples.length} examples`);
  });
  
  console.log('\n✨ Layout Engine Test Complete!');
}

// Example usage function
export function getLayoutForQuery(query: string) {
  const result = analyzeSearchLayout(query);
  
  console.log(`\n🔍 Layout Analysis for: "${query}"`);
  console.log(`Intent: ${result.intent}`);
  console.log('Module Configuration:');
  
  result.layout.forEach(module => {
    const status = module.priority === 'none' ? 'Hidden' : 'Visible';
    console.log(`  ${module.module}: ${module.priority} priority, ${module.display} display (${status})`);
  });
  
  return result;
}

// Export test function for easy access
export { testQueries }; 