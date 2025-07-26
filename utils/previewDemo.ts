// Demo of collapsed previews for different module types
// This shows how content looks when modules are collapsed

export const demoCollapsedPreviews = {
  gemini: {
    response: "The Super Bowl is the annual championship game of the National Football League (NFL). It is typically held in early February and is one of the most-watched television events in the United States. The game features the champions of the NFL's two conferences competing for the Vince Lombardi Trophy.",
    preview: "The Super Bowl is the annual championship game of the National Football League (NFL). It is typically held in early February and is one of the most-watched television events in the United States..."
  },
  
  tiktok: {
    videos: [
      {
        title: "How to make the perfect matcha latte at home",
        author: "CoffeeMaster",
        views: "2.1M views"
      },
      {
        title: "5-minute morning routine that changed my life",
        author: "WellnessGuru",
        views: "890K views"
      },
      {
        title: "Quick breakfast ideas for busy people",
        author: "FoodLover",
        views: "1.5M views"
      }
    ],
    preview: "2 videos shown, +1 more"
  },
  
  reddit: {
    posts: [
      {
        title: "What's your opinion on remote work vs office work?",
        subreddit: "AskReddit",
        upvotes: 1247,
        comments: 342
      },
      {
        title: "Best budget headphones under $100 for 2025",
        subreddit: "headphones",
        upvotes: 89,
        comments: 156
      },
      {
        title: "How do you stay productive when working from home?",
        subreddit: "productivity",
        upvotes: 567,
        comments: 234
      }
    ],
    preview: "2 posts shown, +1 more"
  },
  
  pinterest: {
    pins: [
      {
        title: "Minimalist bedroom design ideas",
        likes: 1240,
        saves: 567
      },
      {
        title: "Summer outfit inspiration for 2025",
        likes: 890,
        saves: 234
      },
      {
        title: "Healthy meal prep ideas for the week",
        likes: 1567,
        saves: 789
      }
    ],
    preview: "2 pins shown, +1 more"
  }
};

// Example of how the preview text is generated
export function generateGeminiPreview(text: string, wordLimit: number = 8): string {
  const words = text.split(' ');
  const preview = words.slice(0, wordLimit).join(' ');
  return words.length > wordLimit ? preview + '...' : preview;
}

// Example usage
console.log('Gemini Preview:', generateGeminiPreview(demoCollapsedPreviews.gemini.response));
console.log('TikTok Preview:', demoCollapsedPreviews.tiktok.preview);
console.log('Reddit Preview:', demoCollapsedPreviews.reddit.preview);
console.log('Pinterest Preview:', demoCollapsedPreviews.pinterest.preview); 