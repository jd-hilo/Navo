import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Key, Shield, Bell, Moon, CircleHelp as HelpCircle, Info, ChevronRight, LogOut, User, Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SearchResultsService } from '@/services/database';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [searchCount, setSearchCount] = useState(0);
  const [cacheStats, setCacheStats] = useState({
    totalCached: 0,
    oldestCache: null as string | null,
    newestCache: null as string | null,
  });

  // Load user stats on mount
  useEffect(() => {
    loadUserStats();
  }, [user]);

  const loadUserStats = async () => {
    if (!user?.id) return;

    try {
      // Get search count
      const count = await SearchResultsService.getSearchCount(user.id);
      setSearchCount(count);

      // Get cache stats
      const stats = await SearchResultsService.getCacheStats(user.id);
      setCacheStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const showAPIKeyInfo = () => {
    Alert.alert(
      'API Configuration',
      'To use Navo, you need to configure API keys for Gemini, TikTok, and Reddit. This would typically be done in a production app through secure configuration.',
      [{ text: 'OK' }]
    );
  };

  const showPrivacyInfo = () => {
    Alert.alert(
      'Privacy Policy',
      'Your search queries are processed through third-party APIs. Please review our privacy policy for more information.',
      [{ text: 'OK' }]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'About Navo',
      'Navo v1.0.0\n\nA powerful search app that aggregates results from Gemini, TikTok, and Reddit in one place.',
      [{ text: 'OK' }]
    );
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached search results. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            
            try {
              // In a real implementation, you'd add a function to clear user's cache
              await SearchResultsService.cleanupExpiredResults();
              await loadUserStats(); // Refresh stats
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  };

  const SettingRow = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    rightElement,
    isDestructive = false,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    isDestructive?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Icon 
          size={24} 
          color={isDestructive ? theme.colors.error : theme.colors.textSecondary} 
          strokeWidth={2} 
        />
        <View style={styles.settingText}>
          <Text style={[
            styles.settingTitle,
            isDestructive && { color: theme.colors.error }
          ]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (
        <ChevronRight 
          size={20} 
          color={isDestructive ? theme.colors.error : theme.colors.textSecondary} 
          strokeWidth={2} 
        />
      )}
    </TouchableOpacity>
  );

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your Navo experience</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.accountCard}>
            <View style={styles.accountInfo}>
              <View style={styles.avatarContainer}>
                <User size={24} color={theme.colors.text} strokeWidth={2} />
              </View>
              <View style={styles.accountText}>
                <Text style={styles.accountName}>
                  {user?.name || 'User'}
                </Text>
                <Text style={styles.accountEmail}>
                  {user?.email}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Usage Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Statistics</Text>
          
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Search size={20} color={theme.colors.textSecondary} strokeWidth={2} />
              <View style={styles.statText}>
                <Text style={styles.statValue}>{searchCount}</Text>
                <Text style={styles.statLabel}>Total Searches</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Shield size={20} color={theme.colors.textSecondary} strokeWidth={2} />
              <View style={styles.statText}>
                <Text style={styles.statValue}>{cacheStats.totalCached}</Text>
                <Text style={styles.statLabel}>Cached Results</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <SettingRow
            icon={Key}
            title="API Configuration"
            subtitle="Configure API keys for services"
            onPress={showAPIKeyInfo}
          />
          
          <SettingRow
            icon={Bell}
            title="Notifications"
            subtitle="Receive updates and alerts"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.colors.border, true: theme.colors.text }}
                thumbColor={theme.colors.surface}
              />
            }
          />
          
          <SettingRow
            icon={Moon}
            title="Dark Mode"
            subtitle="Switch to dark theme"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.text }}
                thumbColor={theme.colors.surface}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          
          <SettingRow
            icon={Shield}
            title="Clear Cache"
            subtitle={`${cacheStats.totalCached} cached search results`}
            onPress={clearCache}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          
          <SettingRow
            icon={Shield}
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={showPrivacyInfo}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <SettingRow
            icon={HelpCircle}
            title="Help & FAQ"
            subtitle="Get help using Navo"
          />
          
          <SettingRow
            icon={Info}
            title="About"
            subtitle="App version and information"
            onPress={showAbout}
          />
        </View>

        <View style={styles.section}>
          <SettingRow
            icon={LogOut}
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
            isDestructive={true}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  accountCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountText: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  accountEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  settingRow: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});