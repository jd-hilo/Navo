import React, { useState, useEffect } from 'react';
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
import { Heart, ExternalLink, RefreshCw } from 'lucide-react-native';
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
  const [retryLoading, setRetryLoading] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{[key: string]: {width: number, height: number}}>({});

  const handlePinPress = (pin: PinterestPin) => {
    setSelectedPin(pin);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPin(null);
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetryLoading(true);
    try {
      await Promise.resolve(onRetry());
    } finally {
      setRetryLoading(false);
    }
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

  // Function to get image dimensions
  const getImageDimensions = (imageUrl: string, pinId: string) => {
    if (imageDimensions[pinId]) {
      return imageDimensions[pinId];
    }
    
    // Default dimensions if not loaded yet
    return { width: 200, height: 200 };
  };

  // Function to load image dimensions
  const loadImageDimensions = (imageUrl: string, pinId: string) => {
    Image.getSize(imageUrl, (width, height) => {
      setImageDimensions(prev => ({
        ...prev,
        [pinId]: { width, height }
      }));
    }, (error) => {
      console.log('Error loading image dimensions:', error);
      // Set default dimensions on error
      setImageDimensions(prev => ({
        ...prev,
        [pinId]: { width: 200, height: 200 }
      }));
    });
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
              <View style={styles.errorIndicator}>
                <Text style={styles.errorIndicatorText}>Error</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{data.error}</Text>
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry} disabled={retryLoading}>
                {retryLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.text} />
                ) : (
                  <RefreshCw size={16} color={theme.colors.text} strokeWidth={2} />
                )}
                <Text style={styles.retryText}>{retryLoading ? 'Loading...' : 'Try Again'}</Text>
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
              <View style={styles.fallbackIndicator}>
                <Text style={styles.fallbackText}>No Pins</Text>
              </View>
            </View>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No Pinterest pins found for this search.</Text>
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry} disabled={retryLoading}>
                {retryLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.text} />
                ) : (
                  <RefreshCw size={16} color={theme.colors.text} strokeWidth={2} />
                )}
                <Text style={styles.retryText}>{retryLoading ? 'Loading...' : 'Try Again'}</Text>
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
            <Image 
              source={require('@/assets/images/pinterest.png')} 
              style={styles.pinterestLogo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Pinterest</Text>
            {!data.success && (
              <View style={styles.fallbackIndicator}>
                <Text style={styles.fallbackText}>Sample</Text>
              </View>
            )}
          </View>
        </View>

        {!data.success && data.error && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>{data.error}</Text>
          </View>
        )}

        <View style={styles.pinsContainer}>
          <View style={styles.leftColumn}>
            {data.pins.filter((pin) => pin.image_url && pin.image_url.trim() !== '' && pin.image_url !== 'null' && pin.image_url !== 'undefined').filter((_, index) => index % 2 === 0).map((pin, index) => {
              const dimensions = getImageDimensions(pin.image_url, pin.id);
              const aspectRatio = dimensions.width / dimensions.height;
              const calculatedHeight = 160 / aspectRatio; // 160 is the column width
              
              // Load dimensions if not already loaded
              if (pin.image_url && !imageDimensions[pin.id]) {
                loadImageDimensions(pin.image_url, pin.id);
              }
              
              return (
                <TouchableOpacity
                  key={pin.id}
                  style={styles.pinCard}
                  onPress={() => handlePinPress(pin)}>
                  
                  {pin.image_url && (
                    <Image 
                      source={{ uri: pin.image_url }} 
                      style={[
                        styles.pinImage,
                        { height: Math.max(120, Math.min(400, calculatedHeight)) } // Min 120, Max 400
                      ]}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={styles.rightColumn}>
            {data.pins.filter((pin) => pin.image_url && pin.image_url.trim() !== '' && pin.image_url !== 'null' && pin.image_url !== 'undefined').filter((_, index) => index % 2 === 1).map((pin, index) => {
              const dimensions = getImageDimensions(pin.image_url, pin.id);
              const aspectRatio = dimensions.width / dimensions.height;
              const calculatedHeight = 160 / aspectRatio; // 160 is the column width
              
              // Load dimensions if not already loaded
              if (pin.image_url && !imageDimensions[pin.id]) {
                loadImageDimensions(pin.image_url, pin.id);
              }
              
              return (
                <TouchableOpacity
                  key={pin.id}
                  style={styles.pinCard}
                  onPress={() => handlePinPress(pin)}>
                  
                  {pin.image_url && (
                    <Image 
                      source={{ uri: pin.image_url }} 
                      style={[
                        styles.pinImage,
                        { height: Math.max(120, Math.min(400, calculatedHeight)) } // Min 120, Max 400
                      ]}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
              {/* Header */}
              <View style={styles.modalHeader}>
                <Image 
                  source={require('@/assets/images/pinterest.png')} 
                  style={styles.modalPinterestLogo}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeModal}
                >
                  <Text style={styles.modalCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.modalScrollContent}
              >
                {selectedPin && (
                  <>
                    {/* Image Display Area */}
                    {selectedPin.image_url && (
                      <View style={styles.modalImageContainer}>
                        <Image 
                          source={{ uri: selectedPin.image_url }} 
                          style={styles.modalImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    
                    {/* Information Section */}
                    <View style={styles.modalInfoSection}>
                      <View style={styles.modalUserInfo}>
                        <View style={styles.modalUserAvatar}>
                          <Text style={styles.modalUserAvatarText}>
                            {selectedPin.user_name ? selectedPin.user_name.charAt(0).toUpperCase() : 'P'}
                          </Text>
                        </View>
                        <Text style={styles.modalUserName}>
                          {selectedPin.user_name || 'Timeless world'}
                        </Text>
                      </View>
                      
                      <View style={styles.modalTitleSection}>
                        <Text style={styles.modalTitle}>
                          {typeof selectedPin.title === 'string' ? selectedPin.title : 'Pinterest Pin'}
                        </Text>
                        
                        {selectedPin.description && (
                          <Text style={styles.modalDescription}>
                            {typeof selectedPin.description === 'string' ? selectedPin.description : ''}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {/* Visit Site Button */}
                    <TouchableOpacity 
                      style={styles.modalVisitButton}
                      onPress={() => selectedPin && Linking.openURL(selectedPin.link)}
                    >
                      <View style={styles.modalVisitButtonContent}>
                        <Text style={styles.modalVisitButtonText}>Visit site</Text>
                        <ExternalLink size={12} color="#020201" strokeWidth={2} />
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
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
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinterestLogo: {
    width: 20,
    height: 20,
    marginRight: 4,
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
  pinsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  leftColumn: {
    width: '48%',
  },
  rightColumn: {
    width: '48%',
  },
  pinCard: {
    width: '100%',
    marginBottom: 12, // Reduced spacing between rows
    borderRadius: 16,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  pinImage: {
    width: '100%',
    height: 200, // Base height, will be overridden by inline styles
    borderRadius: 16,
    marginBottom: 6, // Reduced spacing between image and title
  },
  pinTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    lineHeight: 18, // Reduced line height
    paddingHorizontal: 2, // Reduced horizontal padding
    marginBottom: 4, // Reduced bottom margin
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 24,
    width: 390,
    height: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 31.2,
    elevation: 8,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalPinterestLogo: {
    width: 50,
    height: 15,
  },
  modalCloseButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  modalImageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 16,
  },
  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  modalInfoSection: {
    width: '100%',
    marginBottom: 16,
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 2,
  },
  modalUserAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#9A9CA9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalUserAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalUserName: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  modalTitleSection: {
    gap: 4,
  },
  modalVisitButton: {
    width: '100%',
    height: 47,
    backgroundColor: '#E7E6E1',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalVisitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalVisitButtonText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#020201',
    lineHeight: 15,
  },
  modalLinkButton: {
    marginRight: 8,
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 19,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#9A9CA9',
    lineHeight: 17,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
}); 