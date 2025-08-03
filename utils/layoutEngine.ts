export type ModuleType = 'tiktok' | 'reddit' | 'pinterest';
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
    keywords: ['aesthetic', 'design', 'outfit', 'style', 'decor', 'inspiration', 'ideas', 'trends', 'hair', 'makeup', 'fashion', 'interior', 'exterior', 'color', 'theme', 'look', 'outfit', 'clothing', 'dress', 'shoes', 'accessories', 'jewelry', 'bag', 'purse', 'heels', 'sneakers', 'jeans', 'dress', 'skirt', 'blouse', 'jacket', 'coat', 'sweater', 'shirt', 'pants', 'shorts', 'swimsuit', 'bikini', 'lingerie', 'underwear', 'bra', 'panties', 'socks', 'stockings', 'tights', 'leggings', 'yoga pants', 'workout clothes', 'athleisure', 'streetwear', 'casual', 'formal', 'business', 'professional', 'elegant', 'chic', 'trendy', 'vintage', 'retro', 'modern', 'minimalist', 'bohemian', 'boho', 'grunge', 'punk', 'gothic', 'preppy', 'classic', 'timeless', 'sustainable', 'ethical', 'fast fashion', 'luxury', 'designer', 'brand', 'logo', 'pattern', 'print', 'solid', 'stripes', 'polka dots', 'floral', 'animal print', 'leopard', 'zebra', 'snake', 'cow', 'tie dye', 'tie-dye', 'ombre', 'gradient', 'metallic', 'sequin', 'sparkle', 'glitter', 'velvet', 'satin', 'silk', 'cotton', 'denim', 'leather', 'suede', 'fur', 'faux fur', 'knit', 'crochet', 'lace', 'mesh', 'sheer', 'transparent', 'opaque', 'stretchy', 'loose', 'tight', 'fitted', 'oversized', 'cropped', 'long', 'short', 'mini', 'midi', 'maxi', 'ankle', 'floor length', 'high waisted', 'low waisted', 'mid rise', 'high rise', 'low rise', 'skinny', 'straight', 'wide leg', 'bootcut', 'flare', 'bell bottom', 'mom jeans', 'boyfriend jeans', 'girlfriend jeans', 'distressed', 'ripped', 'faded', 'dark wash', 'light wash', 'black', 'white', 'navy', 'khaki', 'beige', 'cream', 'ivory', 'gray', 'grey', 'silver', 'gold', 'rose gold', 'copper', 'bronze', 'brown', 'tan', 'camel', 'taupe', 'olive', 'army green', 'forest green', 'emerald', 'teal', 'turquoise', 'aqua', 'blue', 'royal blue', 'navy blue', 'sky blue', 'baby blue', 'powder blue', 'periwinkle', 'lavender', 'purple', 'violet', 'plum', 'burgundy', 'maroon', 'red', 'coral', 'salmon', 'pink', 'hot pink', 'fuchsia', 'magenta', 'orange', 'peach', 'apricot', 'yellow', 'mustard', 'chartreuse', 'lime', 'mint', 'sage', 'jade', 'turquoise', 'teal', 'indigo', 'periwinkle', 'lavender', 'lilac', 'mauve', 'rose', 'blush', 'dusty rose', 'terracotta', 'rust', 'copper', 'bronze', 'gold', 'silver', 'champagne', 'cream', 'ivory', 'off white', 'ecru', 'beige', 'tan', 'camel', 'khaki', 'olive', 'army green', 'forest green', 'hunter green', 'emerald', 'jade', 'sage', 'mint', 'seafoam', 'aqua', 'turquoise', 'teal', 'navy', 'royal blue', 'cobalt', 'periwinkle', 'lavender', 'lilac', 'mauve', 'plum', 'burgundy', 'wine', 'maroon', 'crimson', 'ruby', 'coral', 'salmon', 'peach', 'apricot', 'nude', 'blush', 'rose', 'dusty rose', 'magenta', 'fuchsia', 'hot pink', 'bubblegum', 'baby pink', 'powder pink', 'rose gold', 'copper', 'bronze', 'gold', 'silver', 'champagne', 'cream', 'ivory', 'off white', 'ecru', 'beige', 'tan', 'camel', 'khaki', 'olive', 'army green', 'forest green', 'hunter green', 'emerald', 'jade', 'sage', 'mint', 'seafoam', 'aqua', 'turquoise', 'teal', 'navy', 'royal blue', 'cobalt', 'periwinkle', 'lavender', 'lilac', 'mauve', 'plum', 'burgundy', 'wine', 'maroon', 'crimson', 'ruby', 'coral', 'salmon', 'peach', 'apricot', 'nude', 'blush', 'rose', 'dusty rose', 'magenta', 'fuchsia', 'hot pink', 'bubblegum', 'baby pink', 'powder pink'],
    examples: ['Bedroom aesthetic ideas', 'Summer outfit inspiration', 'Kitchen design trends', 'Fashion inspiration', 'Style ideas', 'Outfit combinations']
  },
  fashion: {
    keywords: ['fashion', 'outfit', 'style', 'clothing', 'dress', 'shoes', 'accessories', 'jewelry', 'bag', 'purse', 'heels', 'sneakers', 'jeans', 'skirt', 'blouse', 'jacket', 'coat', 'sweater', 'shirt', 'pants', 'shorts', 'swimsuit', 'bikini', 'lingerie', 'underwear', 'bra', 'panties', 'socks', 'stockings', 'tights', 'leggings', 'yoga pants', 'workout clothes', 'athleisure', 'streetwear', 'casual', 'formal', 'business', 'professional', 'elegant', 'chic', 'trendy', 'vintage', 'retro', 'modern', 'minimalist', 'bohemian', 'boho', 'grunge', 'punk', 'gothic', 'preppy', 'classic', 'timeless', 'sustainable', 'ethical', 'fast fashion', 'luxury', 'designer', 'brand', 'logo', 'pattern', 'print', 'solid', 'stripes', 'polka dots', 'floral', 'animal print', 'leopard', 'zebra', 'snake', 'cow', 'tie dye', 'tie-dye', 'ombre', 'gradient', 'metallic', 'sequin', 'sparkle', 'glitter', 'velvet', 'satin', 'silk', 'cotton', 'denim', 'leather', 'suede', 'fur', 'faux fur', 'knit', 'crochet', 'lace', 'mesh', 'sheer', 'transparent', 'opaque', 'stretchy', 'loose', 'tight', 'fitted', 'oversized', 'cropped', 'long', 'short', 'mini', 'midi', 'maxi', 'ankle', 'floor length', 'high waisted', 'low waisted', 'mid rise', 'high rise', 'low rise', 'skinny', 'straight', 'wide leg', 'bootcut', 'flare', 'bell bottom', 'mom jeans', 'boyfriend jeans', 'girlfriend jeans', 'distressed', 'ripped', 'faded', 'dark wash', 'light wash', 'black', 'white', 'navy', 'khaki', 'beige', 'cream', 'ivory', 'gray', 'grey', 'silver', 'gold', 'rose gold', 'copper', 'bronze', 'brown', 'tan', 'camel', 'taupe', 'olive', 'army green', 'forest green', 'emerald', 'teal', 'turquoise', 'aqua', 'blue', 'royal blue', 'navy blue', 'sky blue', 'baby blue', 'powder blue', 'periwinkle', 'lavender', 'purple', 'violet', 'plum', 'burgundy', 'maroon', 'red', 'coral', 'salmon', 'pink', 'hot pink', 'fuchsia', 'magenta', 'orange', 'peach', 'apricot', 'yellow', 'mustard', 'chartreuse', 'lime', 'mint', 'sage', 'jade', 'turquoise', 'teal', 'indigo', 'periwinkle', 'lavender', 'lilac', 'mauve', 'rose', 'blush', 'dusty rose', 'terracotta', 'rust', 'copper', 'bronze', 'gold', 'silver', 'champagne', 'cream', 'ivory', 'off white', 'ecru', 'beige', 'tan', 'camel', 'khaki', 'olive', 'army green', 'forest green', 'hunter green', 'emerald', 'jade', 'sage', 'mint', 'seafoam', 'aqua', 'turquoise', 'teal', 'navy', 'royal blue', 'cobalt', 'periwinkle', 'lavender', 'lilac', 'mauve', 'plum', 'burgundy', 'wine', 'maroon', 'crimson', 'ruby', 'coral', 'salmon', 'peach', 'apricot', 'nude', 'blush', 'rose', 'dusty rose', 'magenta', 'fuchsia', 'hot pink', 'bubblegum', 'baby pink', 'powder pink', 'rose gold', 'copper', 'bronze', 'gold', 'silver', 'champagne', 'cream', 'ivory', 'off white', 'ecru', 'beige', 'tan', 'camel', 'khaki', 'olive', 'army green', 'forest green', 'hunter green', 'emerald', 'jade', 'sage', 'mint', 'seafoam', 'aqua', 'turquoise', 'teal', 'navy', 'royal blue', 'cobalt', 'periwinkle', 'lavender', 'lilac', 'mauve', 'plum', 'burgundy', 'wine', 'maroon', 'crimson', 'ruby', 'coral', 'salmon', 'peach', 'apricot', 'nude', 'blush', 'rose', 'dusty rose', 'magenta', 'fuchsia', 'hot pink', 'bubblegum', 'baby pink', 'powder pink'],
    examples: ['Summer fashion trends', 'Work outfit ideas', 'Date night dress', 'Casual street style', 'Formal wear inspiration', 'Accessories styling']
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
    { module: 'reddit', priority: 'high', display: 'full' },
    { module: 'tiktok', priority: 'medium', display: 'expandable' },
    { module: 'pinterest', priority: 'low', display: 'collapsed' }
  ],
  local: [
    { module: 'tiktok', priority: 'high', display: 'full' },
    { module: 'reddit', priority: 'medium', display: 'expandable' },
    { module: 'pinterest', priority: 'low', display: 'collapsed' }
  ],
  visual: [
    { module: 'pinterest', priority: 'high', display: 'full' },
    { module: 'tiktok', priority: 'medium', display: 'expandable' },
    { module: 'reddit', priority: 'low', display: 'collapsed' }
  ],
  fashion: [
    { module: 'pinterest', priority: 'high', display: 'full' },
    { module: 'tiktok', priority: 'medium', display: 'expandable' },
    { module: 'reddit', priority: 'low', display: 'collapsed' }
  ],
  product_research: [
    { module: 'reddit', priority: 'high', display: 'full' },
    { module: 'tiktok', priority: 'medium', display: 'expandable' },
    { module: 'pinterest', priority: 'low', display: 'collapsed' }
  ],
  how_to: [
    { module: 'tiktok', priority: 'high', display: 'full' },
    { module: 'reddit', priority: 'medium', display: 'expandable' },
    { module: 'pinterest', priority: 'low', display: 'collapsed' }
  ],
  social: [
    { module: 'reddit', priority: 'high', display: 'full' },
    { module: 'tiktok', priority: 'medium', display: 'expandable' },
    { module: 'pinterest', priority: 'low', display: 'collapsed' }
  ],
  entertainment: [
    { module: 'tiktok', priority: 'high', display: 'full' },
    { module: 'reddit', priority: 'medium', display: 'expandable' },
    { module: 'pinterest', priority: 'low', display: 'collapsed' }
  ],
  lifestyle: [
    { module: 'pinterest', priority: 'high', display: 'full' },
    { module: 'tiktok', priority: 'medium', display: 'expandable' },
    { module: 'reddit', priority: 'low', display: 'collapsed' }
  ],
  general: [
    { module: 'tiktok', priority: 'high', display: 'full' },
    { module: 'reddit', priority: 'medium', display: 'expandable' },
    { module: 'pinterest', priority: 'low', display: 'collapsed' }
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