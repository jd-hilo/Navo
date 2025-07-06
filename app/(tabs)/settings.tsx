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
import {
  Key,
  Shield,
  Share,
  Bell,
  Moon,
  CircleHelp as HelpCircle,
  Info,
  ChevronRight,
  LogOut,
  User,
  Search,
  Crown,
  CheckCircle,
  RefreshCw,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SearchResultsService } from '@/services/database';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, signOut, deleteAccount } = useAuth();
  const { isPremium, restorePurchases, isLoading } = useSubscription();
  const router = useRouter();
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

  const handleUpgrade = () => {
    router.push('/(auth)/upgrade' as any);
  };

  const handleRestorePurchases = async () => {
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    }
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

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) {
              Alert.alert('Error', error);
            }
          },
        },
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
          color={
            isDestructive ? theme.colors.error : theme.colors.textSecondary
          }
          strokeWidth={2}
        />
        <View style={styles.settingText}>
          <Text
            style={[
              styles.settingTitle,
              isDestructive && { color: theme.colors.error },
            ]}
          >
            {title}
          </Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (
        <ChevronRight
          size={20}
          color={
            isDestructive ? theme.colors.error : theme.colors.textSecondary
          }
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
        <Text style={[styles.subtitle, { marginBottom: 16 }]}>
          Customize your Navo experience
        </Text>
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
                <Text style={styles.accountName}>{user?.name || 'User'}</Text>
                <Text style={styles.accountEmail}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <SettingRow
            icon={Moon}
            title="Dark Mode"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.surface}
              />
            }
          />
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>

          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionIcon}>
                {isPremium ? (
                  <Crown
                    size={24}
                    color={theme.colors.primary}
                    strokeWidth={2}
                  />
                ) : (
                  <Crown
                    size={24}
                    color={theme.colors.textSecondary}
                    strokeWidth={2}
                  />
                )}
              </View>
              <View style={styles.subscriptionText}>
                <Text style={styles.subscriptionTitle}>
                  {isPremium ? 'Premium Plan' : 'Free Plan'}
                </Text>
                <Text style={styles.subscriptionStatus}>
                  {isPremium
                    ? 'Active subscription'
                    : 'Upgrade for more features'}
                </Text>
                {isPremium && (
                  <Text style={styles.premiumDetails}>
                    Unlimited searches • 500 saved searches • Faster loading
                    times
                  </Text>
                )}
              </View>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <CheckCircle
                    size={16}
                    color={theme.colors.success}
                    strokeWidth={2}
                  />
                </View>
              )}
            </View>

            {!isPremium && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
                activeOpacity={0.8}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                <ChevronRight
                  size={20}
                  color={theme.colors.surface}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            )}

            {isPremium && (
              <View style={styles.premiumFeatures}>
                <Text style={styles.premiumFeaturesTitle}>
                  Your Premium Benefits:
                </Text>
                <View style={styles.premiumFeatureItem}>
                  <CheckCircle
                    size={16}
                    color={theme.colors.success}
                    strokeWidth={2}
                  />
                  <Text style={styles.premiumFeatureText}>
                    Unlimited searches
                  </Text>
                </View>
                <View style={styles.premiumFeatureItem}>
                  <CheckCircle
                    size={16}
                    color={theme.colors.success}
                    strokeWidth={2}
                  />
                  <Text style={styles.premiumFeatureText}>
                    500 saved searches
                  </Text>
                </View>
                <View style={styles.premiumFeatureItem}>
                  <CheckCircle
                    size={16}
                    color={theme.colors.success}
                    strokeWidth={2}
                  />
                  <Text style={styles.premiumFeatureText}>
                    Faster loading times
                  </Text>
                </View>
                <View style={styles.premiumFeatureItem}>
                  <CheckCircle
                    size={16}
                    color={theme.colors.success}
                    strokeWidth={2}
                  />
                  <Text style={styles.premiumFeatureText}>
                    Custom search settings
                  </Text>
                </View>
              </View>
            )}
          </View>

          {!isPremium && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              disabled={isLoading}
            >
              <RefreshCw
                size={16}
                color={theme.colors.primary}
                strokeWidth={2}
              />
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy Section */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <SettingRow
            icon={Shield}
            title="Privacy Policy"
            onPress={showPrivacyInfo}
          />

          <SettingRow icon={Info} title="About Navo" onPress={showAbout} />
        </View>

        {/* Account Actions */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <SettingRow
            icon={Share}
            title="Refer To a friend"
            onPress={() => router.push('/(auth)/refer-friend')}
          />
          <SettingRow
            icon={LogOut}
            title="Sign Out"
            onPress={handleSignOut}
            isDestructive
          />
          <SettingRow
            icon={User}
            title="Delete Account"
            subtitle="Permanently delete your account and all data"
            onPress={handleDeleteAccount}
            isDestructive
          />
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
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
    subscriptionCard: {
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
    subscriptionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    subscriptionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    subscriptionText: {
      flex: 1,
    },
    subscriptionTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
    },
    subscriptionStatus: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    premiumBadge: {
      backgroundColor: theme.colors.success,
      borderRadius: 12,
      padding: 4,
      position: 'absolute',
      top: 8,
      right: 8,
    },
    upgradeButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    upgradeButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.surface,
    },
    restoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    restoreButtonText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontFamily: 'Inter-Medium',
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
    premiumDetails: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    premiumFeatures: {
      marginTop: 16,
    },
    premiumFeaturesTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    premiumFeatureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    premiumFeatureText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
  });
