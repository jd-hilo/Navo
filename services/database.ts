import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database operations
export interface SearchResultsRow {
  id: string;
  query: string;
  user_id: string;
  gemini_data: any;
  tiktok_data: any;
  reddit_data: any;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  search_count: number;
  created_at: string;
  updated_at: string;
}

export interface CachedSearchResults {
  gemini: any;
  tiktok: any;
  reddit: any;
  cached: boolean;
  cacheAge?: number;
}

export interface SavedSearchRow {
  id: string;
  user_id: string;
  query: string;
  gemini_data: any;
  tiktok_data: any;
  reddit_data: any;
  created_at: string;
  updated_at: string;
}

// Database service for search results
export class SearchResultsService {
  // Check if search results exist in cache and are still valid
  static async getCachedResults(query: string, userId?: string): Promise<CachedSearchResults | null> {
    try {
      if (!userId) {
        console.log('No user ID provided, skipping cache check');
        return null;
      }

      const { data, error } = await supabase
        .from('search_results')
        .select('*')
        .eq('user_id', userId)
        .eq('query', query.trim().toLowerCase())
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - this is expected for cache misses
          console.log('No cached results found for query:', query);
          return null;
        }
        console.error('Error fetching cached results:', error);
        return null;
      }

      if (data) {
        const cacheAge = Date.now() - new Date(data.created_at).getTime();
        console.log(`Found cached results for "${query}" (${Math.round(cacheAge / 1000 / 60)} minutes old)`);
        
        return {
          gemini: data.gemini_data,
          tiktok: data.tiktok_data,
          reddit: data.reddit_data,
          cached: true,
          cacheAge: cacheAge,
        };
      }

      return null;
    } catch (error) {
      console.error('Error in getCachedResults:', error);
      return null;
    }
  }

  // Save search results to cache
  static async saveResults(
    query: string, 
    results: { gemini: any; tiktok: any; reddit: any }, 
    userId?: string
  ): Promise<boolean> {
    try {
      if (!userId) {
        console.log('No user ID provided, skipping cache save');
        return false;
      }

      const normalizedQuery = query.trim().toLowerCase();
      
      // Check if results already exist for this query
      const { data: existing } = await supabase
        .from('search_results')
        .select('id')
        .eq('user_id', userId)
        .eq('query', normalizedQuery)
        .single();

      const searchData = {
        query: normalizedQuery,
        user_id: userId,
        gemini_data: results.gemini,
        tiktok_data: results.tiktok,
        reddit_data: results.reddit,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      };

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('search_results')
          .update(searchData)
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating cached results:', error);
          return false;
        }
        
        console.log(`Updated cached results for "${query}"`);
      } else {
        // Insert new record
        const { error } = await supabase
          .from('search_results')
          .insert([searchData]);

        if (error) {
          console.error('Error saving cached results:', error);
          return false;
        }
        
        console.log(`Saved new cached results for "${query}"`);
      }

      return true;
    } catch (error) {
      console.error('Error in saveResults:', error);
      return false;
    }
  }

  // Increment user's search count
  static async incrementSearchCount(userId: string): Promise<boolean> {
    console.log('🔄 Starting search count increment for user:', userId);
    try {
      // First, get the current profile
      console.log('📊 Fetching current profile...');
      const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('search_count')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No profile exists, create new one
          console.log('ℹ️ No existing profile found, creating new one');
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([{
              user_id: userId,
              search_count: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);

          if (insertError) {
            console.error('❌ Error creating new profile:', insertError);
            return false;
          }
          console.log('✅ Created new profile with count 1');
          return true;
        } else {
          console.error('❌ Error fetching user profile:', fetchError);
          return false;
        }
      }

      // Profile exists, update the count
      const currentCount = profile?.search_count || 0;
      const newCount = currentCount + 1;
      console.log(`📈 Current count: ${currentCount}, New count will be: ${newCount}`);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          search_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Error updating search count:', updateError);
        console.error('Error details:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details
        });
        return false;
      }

      console.log(`✅ Successfully incremented search count from ${currentCount} to ${newCount} for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Unexpected error in incrementSearchCount:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      return false;
    }
  }

  // Get user's search count
  static async getSearchCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_search_count', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting search count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in getSearchCount:', error);
      return 0;
    }
  }

  // Get user profile with search count
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile exists yet
          return null;
        }
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  // Get user's search history
  static async getSearchHistory(userId: string, limit: number = 20): Promise<SearchResultsRow[]> {
    try {
      const { data, error } = await supabase
        .from('search_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching search history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSearchHistory:', error);
      return [];
    }
  }

  // Delete a specific search result
  static async deleteSearchResult(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('search_results')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting search result:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSearchResult:', error);
      return false;
    }
  }

  // Clean up expired results (can be called periodically)
  static async cleanupExpiredResults(): Promise<void> {
    try {
      const { error } = await supabase.rpc('cleanup_expired_search_results');
      
      if (error) {
        console.error('Error cleaning up expired results:', error);
      } else {
        console.log('Cleaned up expired search results');
      }
    } catch (error) {
      console.error('Error in cleanupExpiredResults:', error);
    }
  }

  // Get cache statistics for a user
  static async getCacheStats(userId: string): Promise<{
    totalCached: number;
    oldestCache: string | null;
    newestCache: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('search_results')
        .select('created_at')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching cache stats:', error);
        return { totalCached: 0, oldestCache: null, newestCache: null };
      }

      if (!data || data.length === 0) {
        return { totalCached: 0, oldestCache: null, newestCache: null };
      }

      const dates = data.map(row => new Date(row.created_at));
      const oldest = new Date(Math.min(...dates.map(d => d.getTime())));
      const newest = new Date(Math.max(...dates.map(d => d.getTime())));

      return {
        totalCached: data.length,
        oldestCache: oldest.toISOString(),
        newestCache: newest.toISOString(),
      };
    } catch (error) {
      console.error('Error in getCacheStats:', error);
      return { totalCached: 0, oldestCache: null, newestCache: null };
    }
  }

  // Update user's search count
  static async updateSearchCount(userId: string, count: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          search_count: count,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating search count:', error);
        return false;
      }

      console.log(`Updated search count to ${count} for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error in updateSearchCount:', error);
      return false;
    }
  }
}

// General Searches Service
export const GeneralSearchesService = {
  // Track a new search or increment existing search count
  async trackSearch(userId: string, query: string): Promise<boolean> {
    try {
      const normalizedQuery = query.trim().toLowerCase();
      
      // First, try to find existing search
      const { data: existingData, error: selectError } = await supabase
        .from('general_searches')
        .select('id, search_count')
        .eq('user_id', userId)
        .eq('query', normalizedQuery)
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing search:', selectError);
        return false;
      }

      if (existingData) {
        // Update existing search count
        const { error: updateError } = await supabase
          .from('general_searches')
          .update({ 
            search_count: existingData.search_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) {
          console.error('Error updating search count:', updateError);
          return false;
        }
      } else {
        // Insert new search
        const { error: insertError } = await supabase
          .from('general_searches')
          .insert({ 
            user_id: userId,
            query: normalizedQuery,
            search_count: 1
          });

        if (insertError) {
          console.error('Error inserting new search:', insertError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in trackSearch:', error);
      return false;
    }
  },

  // Get search statistics for a user
  async getUserSearchStats(userId: string): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    mostSearched: string[];
    recentSearches: string[];
  }> {
    try {
      const { data, error } = await supabase
        .from('general_searches')
        .select('query, search_count, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user search stats:', error);
        return {
          totalSearches: 0,
          uniqueQueries: 0,
          mostSearched: [],
          recentSearches: []
        };
      }

      const totalSearches = data?.reduce((sum, item) => sum + item.search_count, 0) || 0;
      const uniqueQueries = data?.length || 0;
      const mostSearched = data
        ?.sort((a, b) => b.search_count - a.search_count)
        .slice(0, 5)
        .map(item => item.query) || [];
      const recentSearches = data
        ?.slice(0, 10)
        .map(item => item.query) || [];

      return {
        totalSearches,
        uniqueQueries,
        mostSearched,
        recentSearches
      };
    } catch (error) {
      console.error('Error in getUserSearchStats:', error);
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        mostSearched: [],
        recentSearches: []
      };
    }
  },

  // Get popular searches across all users (for admin)
  async getPopularSearches(limit: number = 20): Promise<Array<{ query: string; total_count: number }>> {
    try {
      const { data, error } = await supabase
        .from('general_searches')
        .select('query, search_count')
        .order('search_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting popular searches:', error);
        return [];
      }

      // Group by query and sum search counts
      const queryMap = new Map<string, number>();
      data?.forEach(item => {
        const current = queryMap.get(item.query) || 0;
        queryMap.set(item.query, current + item.search_count);
      });

      return Array.from(queryMap.entries())
        .map(([query, total_count]) => ({ query, total_count }))
        .sort((a, b) => b.total_count - a.total_count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getPopularSearches:', error);
      return [];
    }
  },

  // Clear user's search history
  async clearSearchHistory(userId: string): Promise<boolean> {
    try {
      // Delete from general_searches table
      const { error: generalError } = await supabase
        .from('general_searches')
        .delete()
        .eq('user_id', userId);

      if (generalError) {
        console.error('Error clearing general searches:', generalError);
        return false;
      }

      console.log('✅ Successfully cleared search history');
      return true;
    } catch (error) {
      console.error('Error in clearSearchHistory:', error);
      return false;
    }
  }
};

// Saved Searches Service
export class SavedSearchesService {
  // Get all saved searches for a user
  static async getSavedSearches(userId: string): Promise<SavedSearchRow[]> {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved searches:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSavedSearches:', error);
      return [];
    }
  }

  // Save a search
  static async saveSearch(
    userId: string,
    query: string,
    results: { gemini: any; tiktok: any; reddit: any }
  ): Promise<boolean> {
    try {
      const { data: existing } = await supabase
        .from('saved_searches')
        .select('id')
        .eq('user_id', userId)
        .eq('query', query)
        .single();

      const searchData = {
        user_id: userId,
        query: query,
        gemini_data: results.gemini,
        tiktok_data: results.tiktok,
        reddit_data: results.reddit,
      };

      if (existing) {
        // Update existing saved search
        const { error } = await supabase
          .from('saved_searches')
          .update(searchData)
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating saved search:', error);
          return false;
        }
      } else {
        // Insert new saved search
        const { error } = await supabase
          .from('saved_searches')
          .insert([searchData]);

        if (error) {
          console.error('Error saving search:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in saveSearch:', error);
      return false;
    }
  }

  // Delete a saved search
  static async deleteSavedSearch(userId: string, searchId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting saved search:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSavedSearch:', error);
      return false;
    }
  }

  // Check if a search is saved
  static async isSearchSaved(userId: string, query: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('id')
        .eq('user_id', userId)
        .eq('query', query)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return false;
        }
        console.error('Error checking saved search:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isSearchSaved:', error);
      return false;
    }
  }
}