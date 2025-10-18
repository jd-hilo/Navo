import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface PinterestPin {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link: string;
  created_at: string;
  user_name?: string;
}

export default function PinterestModal({ pin, isVisible, onClose }: { pin: PinterestPin; isVisible: boolean; onClose: () => void; }) {
  const { theme, isDark } = useTheme();
  return (
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: isDark ? '#000000' : '#FFFFFF', borderRadius: 12, padding: 24, width: 390, height: '80%', shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.32, shadowRadius: 31.2, elevation: 8, flexDirection: 'column' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Image source={require('@/assets/images/pinterest.png')} style={{ width: 50, height: 15 }} resizeMode="contain" />
            <TouchableOpacity style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center', padding: 2 }} onPress={onClose}>
              <Text style={{ color: isDark ? '#FFFFFF' : '#000000', fontSize: 18, fontWeight: 'bold', lineHeight: 20 }}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
            {pin.image_url && (
              <View style={{ width: '100%', height: 300, borderRadius: 16, overflow: 'hidden', marginVertical: 16 }}>
                <Image source={{ uri: pin.image_url }} style={{ width: '100%', height: '100%', borderRadius: 16 }} resizeMode="cover" />
              </View>
            )}
            <View style={{ width: '100%', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 2 }}>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: isDark ? '#9A9CA9' : '#6B7280', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: isDark ? '#FFFFFF' : '#000000', fontSize: 10, fontWeight: 'bold' }}>{(pin.user_name || 'P').charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={{ fontSize: 13, fontFamily: 'Inter', fontWeight: '500', color: isDark ? '#FFFFFF' : '#000000', lineHeight: 16 }}>{pin.user_name || 'Timeless world'}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 16, fontFamily: 'Inter', fontWeight: '600', color: isDark ? '#FFFFFF' : '#000000', lineHeight: 19 }}>{pin.title || 'Pinterest Pin'}</Text>
                {pin.description ? (
                  <Text style={{ fontSize: 14, fontFamily: 'Inter', fontWeight: '400', color: isDark ? '#9A9CA9' : '#6B7280', lineHeight: 17 }}>{pin.description}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity style={{ width: '100%', height: 47, backgroundColor: '#E7E6E1', borderRadius: 28, justifyContent: 'center', alignItems: 'center' }} onPress={() => pin.link && require('react-native').Linking.openURL(pin.link)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Inter', fontWeight: '500', color: '#020201', lineHeight: 15 }}>Visit site</Text>
                <ExternalLink size={12} color="#020201" strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}






