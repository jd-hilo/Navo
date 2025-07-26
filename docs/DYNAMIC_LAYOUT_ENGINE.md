# Dynamic Layout Engine for Navo

The Dynamic Layout Engine is an AI-powered system that automatically classifies search queries by intent and returns optimal layout configurations for displaying content modules.

## 🧠 Overview

When a user searches in Navo, the engine:
1. **Analyzes the search query** to determine user intent
2. **Classifies the intent** into one of 9 categories
3. **Returns a layout configuration** that defines:
   - Which modules to show (Gemini, TikTok, Reddit, Pinterest)
   - Display priority for each module (high, medium, low, none)
   - Display mode for each module (full, expandable, collapsed, hidden)

## 📊 Intent Classification

The engine recognizes 9 different search intent types:

### 1. **Factual** 
- **Keywords**: who, what, when, where, why, news, weather, score, price, statistics
- **Examples**: "Who won the Super Bowl?", "What is the weather today?"
- **Layout**: Gemini (full) → Reddit (expandable) → TikTok (collapsed) → Pinterest (hidden)

### 2. **Local/Experience**
- **Keywords**: near me, restaurant, food, attraction, best, experience, try
- **Examples**: "Best food spots in Austin", "Restaurants near me"
- **Layout**: TikTok (full) → Reddit (expandable) → Gemini (collapsed) → Pinterest (collapsed)

### 3. **Visual/Design**
- **Keywords**: aesthetic, design, style, decor, outfit, fashion, inspiration
- **Examples**: "Bedroom aesthetic ideas", "Summer outfit inspiration"
- **Layout**: Pinterest (full) → TikTok (expandable) → Reddit (collapsed) → Gemini (hidden)

### 4. **Product Research**
- **Keywords**: best, review, compare, buy, price, budget, quality
- **Examples**: "Best budget headphones 2025", "iPhone vs Android comparison"
- **Layout**: Gemini (full) → Reddit (full) → TikTok (collapsed) → Pinterest (hidden)

### 5. **How-to/DIY**
- **Keywords**: how to, tutorial, guide, learn, make, create, cook, fix
- **Examples**: "How to make matcha", "DIY home decor ideas"
- **Layout**: TikTok (full) → Reddit (expandable) → Gemini (collapsed) → Pinterest (collapsed)

### 6. **Social Curiosity**
- **Keywords**: opinion, think, feel, experience, debate, reddit, community
- **Examples**: "Is LOL passive aggressive?", "Reddit opinions on remote work"
- **Layout**: Reddit (full) → TikTok (expandable) → Gemini (collapsed) → Pinterest (hidden)

### 7. **Entertainment/Trends**
- **Keywords**: trending, viral, funny, entertainment, dance, music, meme
- **Examples**: "Viral TikTok dances", "Trending memes this week"
- **Layout**: TikTok (full) → Reddit (expandable) → Gemini (collapsed) → Pinterest (collapsed)

### 8. **Lifestyle/Wellness**
- **Keywords**: health, wellness, fitness, diet, mental health, routine, habits
- **Examples**: "Morning routine ideas", "Healthy meal prep"
- **Layout**: TikTok (full) → Pinterest (expandable) → Reddit (collapsed) → Gemini (collapsed)

### 9. **General**
- **Fallback**: When no specific intent is detected
- **Layout**: TikTok (full) → Gemini (expandable) → Reddit (collapsed) → Pinterest (collapsed)

## 🔧 Usage

### Basic Usage

```typescript
import { analyzeSearchLayout } from '@/utils/layoutEngine';

// Analyze a search query
const query = "Best food spots in Austin";
const layoutConfig = analyzeSearchLayout(query);

console.log(layoutConfig);
// Output:
// {
//   intent: "local_experience",
//   layout: [
//     { module: "tiktok", priority: "high", display: "full" },
//     { module: "reddit", priority: "medium", display: "expandable" },
//     { module: "google_gemini", priority: "low", display: "collapsed" },
//     { module: "pinterest", priority: "low", display: "collapsed" }
//   ]
// }
```

### Using the Dynamic Layout Component

```typescript
import DynamicLayoutEngine from '@/components/DynamicLayoutEngine';

// In your search results component
<DynamicLayoutEngine
  searchResults={searchResults}
  query={searchQuery}
  onRetry={handleRetry}
  isLoading={isLoading}
/>
```

### Advanced Functions

```typescript
import { 
  getLayoutForIntent,
  getAvailableIntents,
  getIntentExamples,
  shouldShowModule,
  getDisplayOrder
} from '@/utils/layoutEngine';

// Get layout for specific intent
const productLayout = getLayoutForIntent('product_research');

// Get all available intents
const intents = getAvailableIntents();

// Get examples for an intent
const examples = getIntentExamples('how_to_diy');

// Check if module should be shown
const shouldShow = shouldShowModule('high'); // true

// Get ordered modules for display
const ordered = getDisplayOrder(layoutConfig.layout);
```

## 🎨 Display Modes

### Priority Levels
- **High**: Primary content, prominently displayed
- **Medium**: Secondary content, expandable
- **Low**: Tertiary content, collapsed by default
- **None**: Hidden, not shown to user

### Display Modes
- **Full**: Module displayed in full size
- **Expandable**: Module can be expanded/collapsed
- **Collapsed**: Module shown in compact form
- **Hidden**: Module not displayed

## 🧪 Testing

Run the test suite to see how different queries are classified:

```typescript
import { testLayoutEngine, getLayoutForQuery } from '@/utils/layoutEngine.test';

// Test all predefined queries
testLayoutEngine();

// Test a specific query
getLayoutForQuery("How to make matcha");
```

## 📈 Example Outputs

### Factual Query: "Who won the Super Bowl?"
```json
{
  "intent": "factual",
  "layout": [
    { "module": "google_gemini", "priority": "high", "display": "full" },
    { "module": "reddit", "priority": "medium", "display": "expandable" },
    { "module": "tiktok", "priority": "low", "display": "collapsed" },
    { "module": "pinterest", "priority": "none", "display": "hidden" }
  ]
}
```

### Visual Query: "Bedroom aesthetic ideas"
```json
{
  "intent": "visual_design",
  "layout": [
    { "module": "pinterest", "priority": "high", "display": "full" },
    { "module": "tiktok", "priority": "medium", "display": "expandable" },
    { "module": "reddit", "priority": "low", "display": "collapsed" },
    { "module": "google_gemini", "priority": "none", "display": "hidden" }
  ]
}
```

### Social Query: "Is LOL passive aggressive?"
```json
{
  "intent": "social_curiosity",
  "layout": [
    { "module": "reddit", "priority": "high", "display": "full" },
    { "module": "tiktok", "priority": "medium", "display": "expandable" },
    { "module": "google_gemini", "priority": "low", "display": "collapsed" },
    { "module": "pinterest", "priority": "none", "display": "hidden" }
  ]
}
```

## 🔄 Integration

The Dynamic Layout Engine integrates seamlessly with your existing Navo components:

1. **Replace** the current `AIAdaptiveLayout` with `DynamicLayoutEngine`
2. **Pass** the same props (searchResults, query, onRetry, isLoading)
3. **Get** intelligent layout optimization automatically

## 🎯 Benefits

- **Improved UX**: Users see the most relevant content first
- **Reduced Clutter**: Hidden modules don't distract from primary content
- **Better Performance**: Only load and display necessary modules
- **Adaptive**: Layout changes based on search intent
- **Consistent**: Predictable behavior across different query types

## 🚀 Future Enhancements

- **Machine Learning**: Train on user behavior to improve classification
- **Personalization**: Consider user preferences and search history
- **A/B Testing**: Test different layouts for optimization
- **Real-time Learning**: Adapt based on user interactions
- **Multi-language Support**: Intent classification for different languages 