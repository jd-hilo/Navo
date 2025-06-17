/// <reference types="expo/types" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_GEMINI_API_KEY?: string;
      EXPO_PUBLIC_APIFY_API_TOKEN?: string;
      EXPO_PUBLIC_TIKTOK_API_KEY?: string;
      EXPO_PUBLIC_SUPABASE_URL?: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    }
  }
}

export {};