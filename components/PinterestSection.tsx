import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { Heart, ExternalLink, RefreshCw, Share2, Bookmark } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface PinterestPin {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link: string;
  likes: number;
  saves: number;
  created_at: string;
  board_name?: string;
  user_name?: string;
}

interface PinterestSectionProps {
  data: {
    pins: PinterestPin[];
    success: boolean;
    error?: string;
  };
  query: string;
  onRetry?: () => void;
  isLoading?: boolean;
}

export default function PinterestSection({ data, query, onRetry, isLoading }: PinterestSectionProps) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinterestPin | null>(null);

  const handlePinPress = (pin: PinterestPin) => {
    setSelectedPin(pin);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPin(null);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString();
  };

  const styles = createStyles(theme);

  // Show loading state
  if (isLoading) {
    return (
      <LinearGradient
        colors={theme.gradients.pinterest as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Heart size={20} color={theme.colors.text} strokeWidth={2} />
              <Text style={styles.title}>Pinterest</Text>
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            <Text style={styles.loadingText}>Searching Pinterest pins...</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Show error state
  if (!data.success && data.error) {
    return (
      <LinearGradient
        colors={theme.gradients.pinterest as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Heart size={20} color={theme.colors.text} strokeWidth={2} />
              <Text style={styles.title}>Pinterest</Text>
              <View style={styles.errorIndicator}>
                <Text style={styles.errorIndicatorText}>Error</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{data.error}</Text>
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <RefreshCw size={16} color={theme.colors.text} strokeWidth={2} />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Don't render if no pins
  if (!data.pins || data.pins.length === 0) {
    return (
      <LinearGradient
        colors={theme.gradients.pinterest as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Heart size={20} color={theme.colors.text} strokeWidth={2} />
              <Text style={styles.title}>Pinterest</Text>
              <View style={styles.fallbackIndicator}>
                <Text style={styles.fallbackText}>No Pins</Text>
              </View>
            </View>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No Pinterest pins found for this search.</Text>
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <RefreshCw size={16} color={theme.colors.text} strokeWidth={2} />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={theme.gradients.pinterest as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBorder}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Heart size={20} color={theme.colors.text} strokeWidth={2} />
            <Text style={styles.title}>Pinterest</Text>
            
            {data.success ? (
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>Live</Text>
              </View>
            ) : (
              <View style={styles.fallbackIndicator}>
                <Text style={styles.fallbackText}>Sample</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              if (data.pins && data.pins.length > 0) {
                Linking.openURL(data.pins[0].link);
              }
            }}
          >
            <ExternalLink size={16} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {!data.success && data.error && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>{data.error}</Text>
          </View>
        )}

        <View style={styles.pinsGrid}>
          {data.pins.slice(0, 6).map((pin, index) => (
            <TouchableOpacity
              key={pin.id}
              style={[
                styles.pinCard,
                index % 2 === 0 ? styles.pinCardLeft : styles.pinCardRight,
                index >= data.pins.length - 2 && styles.lastRowPin
              ]}
              onPress={() => handlePinPress(pin)}>
              
              {pin.image_url && (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: pin.image_url }} 
                    style={styles.pinImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <TouchableOpacity 
                      style={styles.saveButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        // Handle save action
                      }}>
                      <Bookmark size={16} color="#fff" fill="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              <View style={styles.pinContent}>
                <Text style={styles.pinTitle} numberOfLines={2}>
                  {pin.title}
                </Text>
                
                {pin.description && (
                  <Text style={styles.pinDescription} numberOfLines={1}>
                    {pin.description}
                  </Text>
                )}
                
                <View style={styles.pinFooter}>
                  {pin.user_name && (
                    <Text style={styles.userName}>@{pin.user_name}</Text>
                  )}
                  
                  <View style={styles.pinStats}>
                    <View style={styles.statItem}>
                      <Heart size={12} color={theme.colors.textSecondary} strokeWidth={1.5} />
                      <Text style={styles.statText}>{formatNumber(pin.likes)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Modal for full pin details */}
        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <View style={styles.modalHeaderRow}>
                  <TouchableOpacity
                    style={styles.modalLinkButton}
                    onPress={() => selectedPin && Linking.openURL(selectedPin.link)}
                    accessibilityLabel="Open in Pinterest"
                  >
                    <ExternalLink size={22} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                {selectedPin && (
                  <>
                    {selectedPin.image_url && (
                      <Image 
                        source={{ uri: selectedPin.image_url }} 
                        style={styles.modalImage}
                        resizeMode="cover"
                      />
                    )}
                    
                    <Text style={styles.modalTitle}>{selectedPin.title}</Text>
                    
                    {selectedPin.description && (
                      <Text style={styles.modalDescription}>{selectedPin.description}</Text>
                    )}
                    
                    <View style={styles.modalStats}>
                      <Text style={styles.modalStat}>{formatNumber(selectedPin.likes)} likes</Text>
                      <Text style={styles.modalStat}>{formatNumber(selectedPin.saves)} saves</Text>
                      {selectedPin.board_name && (
                        <Text style={styles.modalStat}>• {selectedPin.board_name}</Text>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
              <Pressable style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  gradientBorder: {
    borderRadius: 14,
    padding: 1,
    marginBottom: 16,
  },
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  liveIndicator: {
    backgroundColor: theme.colors.indicator.webSearch,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  liveText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: theme.colors.indicator.webSearchText,
  },
  fallbackIndicator: {
    backgroundColor: theme.colors.indicator.fallback,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  fallbackText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: theme.colors.indicator.fallbackText,
  },
  errorIndicator: {
    backgroundColor: theme.colors.indicator.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  errorIndicatorText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: theme.colors.indicator.errorText,
  },
  actionButton: {
    padding: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  warningContainer: {
    backgroundColor: theme.colors.warningBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warningBorder,
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.warningText,
    lineHeight: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.retryButton,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    marginLeft: 6,
  },
  pinsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pinCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pinCardLeft: {
    marginRight: 4,
  },
  pinCardRight: {
    marginLeft: 4,
  },
  lastRowPin: {
    marginBottom: 0,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  pinImage: {
    width: '100%',
    height: 180,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  saveButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinContent: {
    padding: 12,
  },
  pinTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 6,
    lineHeight: 22,
  },
  pinDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  pinFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  userName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    flex: 1,
  },
  pinStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  boardName: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  modalLinkButton: {
    marginRight: 8,
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    marginBottom: 16,
    lineHeight: 24,
  },
  modalStats: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  modalStat: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginRight: 16,
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  closeButtonText: {
    color: theme.colors.background,
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
}); 