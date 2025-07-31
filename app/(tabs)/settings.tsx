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
  Linking,
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
  Trash2,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { GeneralSearchesService } from '@/services/database';
import { useRouter } from 'expo-router';
import AboutModal from '@/components/AboutModal';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, signOut, deleteAccount } = useAuth();
  const { isPremium, restorePurchases, isLoading } = useSubscription();
  const router = useRouter();
  const [searchCount, setSearchCount] = useState(0);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Load user stats on mount
  useEffect(() => {
    loadUserStats();
  }, [user]);

  const loadUserStats = async () => {
    if (!user?.id) return;

    try {
      // Get search count from general_searches
      const stats = await GeneralSearchesService.getUserSearchStats(user.id);
      setSearchCount(stats.totalSearches);
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
    Linking.openURL('https://www.notion.so/Privacy-Policy-Navo-21c2cec59ddf80af8976cfc4e5c9c30f?source=copy_link');
  };

  const showAbout = () => {
    setShowAboutModal(true);
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

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Cache',
      'This will delete all your cached search data. This action cannot be undone. Saved searches will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            
            try {
              const success = await GeneralSearchesService.clearSearchHistory(user.id);
              if (success) {
                Alert.alert('Success', 'Cache cleared successfully');
              } else {
                Alert.alert('Error', 'Failed to clear cache');
              }
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'An error occurred while clearing cache');
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
        <View style={styles.headerContent}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your Navo experience</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={24} color={theme.colors.text} strokeWidth={2} />
        </TouchableOpacity>
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

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionIcon}>
                <Crown
                  size={24}
                  color={isPremium ? theme.colors.primary : theme.colors.textSecondary}
                  strokeWidth={2}
                />
              </View>
              <View style={styles.subscriptionText}>
                <Text style={styles.subscriptionTitle}>
                  {isPremium ? 'Premium Plan' : 'Free Plan'}
                </Text>
                <Text style={styles.subscriptionStatus}>
                  {isPremium ? 'Active subscription' : 'Upgrade for more searches'}
                </Text>
                {isPremium && (
                  <Text style={styles.premiumDetails}>
                    Unlimited searches • 500 saved searches • Faster loading times
                  </Text>
                )}
              </View>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <CheckCircle size={16} color={theme.colors.success} strokeWidth={2} />
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
                <ChevronRight size={20} color={theme.colors.surface} strokeWidth={2} />
              </TouchableOpacity>
            )}

            {isPremium && (
              <View style={styles.premiumFeatures}>
                <Text style={styles.premiumFeaturesTitle}>Your Premium Benefits:</Text>
                <View style={styles.premiumFeatureItem}>
                  <CheckCircle size={16} color={theme.colors.success} strokeWidth={2} />
                  <Text style={styles.premiumFeatureText}>Unlimited searches</Text>
                </View>
                <View style={styles.premiumFeatureItem}>
                  <CheckCircle size={16} color={theme.colors.success} strokeWidth={2} />
                  <Text style={styles.premiumFeatureText}>500 saved searches</Text>
                </View>
                <View style={styles.premiumFeatureItem}>
                  <CheckCircle size={16} color={theme.colors.success} strokeWidth={2} />
                  <Text style={styles.premiumFeatureText}>Faster loading times</Text>
                </View>
                <View style={styles.premiumFeatureItem}>
                  <CheckCircle size={16} color={theme.colors.success} strokeWidth={2} />
                  <Text style={styles.premiumFeatureText}>Custom search settings</Text>
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
              <RefreshCw size={16} color={theme.colors.primary} strokeWidth={2} />
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>
          )}
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

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <SettingRow
            icon={Shield}
            title="Privacy Policy"
            onPress={showPrivacyInfo}
          />
          <SettingRow 
            icon={Info} 
            title="About Navo" 
            onPress={showAbout} 
          />
          <SettingRow
            icon={Trash2}
            title="Clear Cache"
            subtitle="Delete all your cached search data (saved searches will not be affected)"
            onPress={handleClearHistory}
          />
        </View>

        {/* Account Actions */}
        <View style={[styles.section, { marginBottom: 80 }]}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <SettingRow
            icon={Share}
            title="Invite Friends and Earn Searches"
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
        </View>
      </ScrollView>
      <AboutModal 
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
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
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerContent: {
      flex: 1,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.textSecondary,
      marginBottom: 16,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 4,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      marginBottom: 8,
      borderRadius: 12,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingText: {
      marginLeft: 12,
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
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    accountCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
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
      borderRadius: 16,
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
    premiumDetails: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    premiumBadge: {
      marginLeft: 12,
    },
    premiumFeatures: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    premiumFeaturesTitle: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: theme.colors.text,
      marginBottom: 12,
    },
    premiumFeatureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    premiumFeatureText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    upgradeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginTop: 16,
    },
    upgradeButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.surface,
      marginRight: 8,
    },
    restoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginTop: 8,
    },
    restoreButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: theme.colors.primary,
      marginLeft: 8,
    },
  });
