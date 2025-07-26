export type ModuleType = 'google_gemini' | 'tiktok' | 'reddit' | 'pinterest';
export type PriorityLevel = 'high' | 'medium' | 'low' | 'none';
export type DisplayMode = 'full' | 'expandable' | 'collapsed' | 'hidden';

export interface LayoutConfig {
  intent: string;
  layout: ModuleLayout[];
}

export interface ModuleLayout {
  module: ModuleType;
  priority: PriorityLevel;
  display: DisplayMode;
}

const INTENT_PATTERNS: Record<string, { keywords: string[]; examples: string[] }> = {
  factual: {
    keywords: ['who', 'what', 'when', 'where', 'why', 'how many', 'latest', 'news', 'weather', 'population', 'capital', 'president', 'election', 'score', 'winner', 'definition', 'meaning'],
    examples: ['Who won the Super Bowl?', 'What is the weather today?', 'Latest news on AI']
  },
  local: {
    keywords: ['near me', 'restaurants', 'coffee', 'food spots', 'attractions', 'hotels', 'bars', 'shops', 'downtown', 'best', 'top', 'local'],
    examples: ['Best food spots in Austin', 'Restaurants near me', 'Coffee shops downtown']
  },
  visual: {
    keywords: ['aesthetic', 'design', 'outfit', 'style', 'decor', 'inspiration', 'ideas', 'trends', 'hair', 'makeup', 'fashion', 'interior', 'exterior', 'color', 'theme'],
    examples: ['Bedroom aesthetic ideas', 'Summer outfit inspiration', 'Kitchen design trends']
  },
  product_research: {
    keywords: ['best', 'review', 'comparison', 'vs', 'recommend', 'buy', 'purchase', 'price', 'budget', 'expensive', 'cheap', 'quality', 'features', 'specs'],
    examples: ['Best budget headphones 2025', 'iPhone vs Android comparison', 'Gaming laptop reviews']
  },
  how_to: {
    keywords: ['how to', 'diy', 'tutorial', 'learn', 'guide', 'steps', 'instructions', 'make', 'create', 'build', 'fix', 'repair', 'install', 'setup'],
    examples: ['How to make matcha', 'DIY home decor ideas', 'How to fix a flat tire']
  },
  social: {
    keywords: ['opinion', 'think', 'feel', 'reddit', 'people', 'community', 'discussion', 'debate', 'controversial', 'weird', 'normal', 'acceptable', 'passive aggressive'],
    examples: ['Is LOL passive aggressive?', 'Reddit opinions on remote work', 'What do people think about...']
  },
  entertainment: {
    keywords: ['viral', 'trending', 'funny', 'meme', 'dance', 'video', 'music', 'entertainment', 'comedy', 'joke', 'humor', 'tiktok', 'youtube'],
    examples: ['Viral TikTok dances', 'Trending memes this week', 'Funny cat videos']
  },
  lifestyle: {
    keywords: ['routine', 'wellness', 'health', 'fitness', 'meal', 'diet', 'sleep', 'stress', 'mindfulness', 'self care', 'habits', 'morning', 'evening'],
    examples: ['Morning routine ideas', 'Healthy meal prep', 'Stress relief techniques']
  }
};

function classifyIntent(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.keywords.some(keyword => lowerQuery.includes(keyword))) {
      return intent;
    }
  }
  
  return 'general';
}

const LAYOUT_CONFIGS: Record<string, ModuleLayout[]> = {
  factual: [
    { module: 'google_gemini', priority: 'high', display: 'full' },
    { module: 'reddit', priority: 'medium', display: 'expandable' },
    { module: 'tiktok', priority: 'low', display: 'collapsed' },
    { module: 'pinterest', priority: 'none', display: 'hidden' }
  ],
  local: [
    { module: 'tiktok', priority: 'high', display: 'full' },
    { module: 'reddit', priority: 'medium', display: 'expandable' },
    { module: 'google_gemini', priority: 'low', display: 'collapsed' },
    { module: 'pinterest', priority: 'none', display: 'hidden' }
  ],
  visual: [
    { module: 'pinterest', priority: 'high', display: 'full' },
    { module: 'tiktok', priority: 'medium', display: 'expandable' },
    { module: 'reddit', priority: 'low', display: 'collapsed' },
    { module: 'google_gemini', priority: 'none', display: 'hidden' }
  ],
  product_research: [
    { module: 'google_gemini', priority: 'high', display: 'full' },
    { module: 'reddit', priority: 'medium', display: 'expandable' },
    { module: 'tiktok', priority: 'low', display: 'collapsed' },
    { module: 'pinterest', priority: 'none', display: 'hidden' }
  ],
  how_to: [
    { module: 'tiktok', priority: 'high', display: 'full' },
    { module: 'reddit', priority: 'medium', display: 'expandable' },
    { module: 'google_gemini', priority: 'low', display: 'collapsed' },
    { module: 'pinterest', priority: 'none', display: 'hidden' }
  ],
  social: [
    { module: 'reddit', priority: 'high', display: 'full' },
    { module: 'tiktok', priority: 'medium', display: 'expandable' },
    { module: 'google_gemini', priority: 'low', display: 'collapsed' },
    { module: 'pinterest', priority: 'none', display: 'hidden' }
  ],
  entertainment: [
    { module: 'tiktok', priority: 'high', display: 'full' },
    { module: 'reddit', priority: 'medium', display: 'expandable' },
    { module: 'google_gemini', priority: 'low', display: 'collapsed' },
    { module: 'pinterest', priority: 'none', display: 'hidden' }
  ],
  lifestyle: [
    { module: 'pinterest', priority: 'high', display: 'full' },
    { module: 'tiktok', priority: 'medium', display: 'expandable' },
    { module: 'reddit', priority: 'low', display: 'collapsed' },
    { module: 'google_gemini', priority: 'none', display: 'hidden' }
  ],
  general: [
    { module: 'tiktok', priority: 'high', display: 'full' },
    { module: 'google_gemini', priority: 'medium', display: 'expandable' },
    { module: 'reddit', priority: 'low', display: 'collapsed' },
    { module: 'pinterest', priority: 'none', display: 'hidden' }
  ]
};

export function analyzeSearchLayout(query: string): LayoutConfig {
  const intent = classifyIntent(query);
  const layout = LAYOUT_CONFIGS[intent] || LAYOUT_CONFIGS.general;
  return { intent, layout };
}

export function shouldShowModule(priority: PriorityLevel): boolean {
  return priority !== 'none';
}

export function getDisplayOrder(layout: ModuleLayout[]): ModuleLayout[] {
  const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 };
  return layout
    .filter(module => module.priority !== 'none')
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

export function getAvailableIntents(): string[] {
  return Object.keys(INTENT_PATTERNS);
}

export function getIntentExamples(intent: string): string[] {
  return INTENT_PATTERNS[intent]?.examples || [];
} 