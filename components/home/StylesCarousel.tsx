import { StyleTag } from '@/types/models/user';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Large banner-like tile that shows edges of neighbors (like OZON banners)
const TILE_WIDTH = SCREEN_WIDTH - 48; // 24px margins on each side, neighbors peek ~12px
const TILE_HEIGHT = 200;
const TILE_GAP = 12;

interface StyleItem {
  id: StyleTag;
  label: string;
  sticker: string;
  gradient: [string, string];
  description: string;
}

const STYLE_DATA: StyleItem[] = [
  {
    id: 'casual',
    label: 'Кэжуал',
    sticker: '👕',
    gradient: ['#667eea', '#764ba2'],
    description: 'Повседневный комфорт',
  },
  {
    id: 'classic',
    label: 'Классический',
    sticker: '🎩',
    gradient: ['#2c3e50', '#4a5568'],
    description: 'Вечная элегантность',
  },
  {
    id: 'sport',
    label: 'Спорт',
    sticker: '⚽',
    gradient: ['#11998e', '#38ef7d'],
    description: 'Активный образ жизни',
  },
  {
    id: 'minimalism',
    label: 'Минимализм',
    sticker: '⬜',
    gradient: ['#bdc3c7', '#2c3e50'],
    description: 'Чистые линии',
  },
  {
    id: 'old_money',
    label: 'Old Money',
    sticker: '💎',
    gradient: ['#8E793E', '#AD974F'],
    description: 'Роскошь без показухи',
  },
  {
    id: 'scandi',
    label: 'Сканди',
    sticker: '🌿',
    gradient: ['#a8e6cf', '#88d8b0'],
    description: 'Северный уют',
  },
  {
    id: 'indie',
    label: 'Инди',
    sticker: '🎸',
    gradient: ['#ff7e5f', '#feb47b'],
    description: 'Творческая свобода',
  },
  {
    id: 'y2k',
    label: 'Y2K',
    sticker: '💿',
    gradient: ['#f093fb', '#f5576c'],
    description: 'Ностальгия 2000-х',
  },
  {
    id: 'star',
    label: 'Звезда',
    sticker: '⭐',
    gradient: ['#f12711', '#f5af19'],
    description: 'Яркий выход',
  },
  {
    id: 'alt',
    label: 'Альт',
    sticker: '🖤',
    gradient: ['#232526', '#414345'],
    description: 'Альтернативный взгляд',
  },
  {
    id: 'cottagecore',
    label: 'Котеджкор',
    sticker: '🌻',
    gradient: ['#ffecd2', '#fcb69f'],
    description: 'Сельская романтика',
  },
  {
    id: 'downtown',
    label: 'Даунтаун',
    sticker: '🏙️',
    gradient: ['#373B44', '#4286f4'],
    description: 'Городской шик',
  },
];

interface StylesCarouselProps {
  onStylePress?: (style: StyleTag) => void;
}

export default function StylesCarousel({ onStylePress }: StylesCarouselProps) {
  const flatListRef = useRef<FlatList>(null);

  const handleStylePress = (style: StyleTag) => {
    if (onStylePress) {
      onStylePress(style);
    }
  };

  const renderStyleTile = ({ item }: { item: StyleItem }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => handleStylePress(item.id)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.tileContent}>
          <Text style={styles.sticker}>{item.sticker}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.styleLabel}>{item.label}</Text>
            <Text style={styles.styleDescription}>{item.description}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Стили</Text>
        <Text style={styles.sectionSubtitle}>Найди свой образ</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={STYLE_DATA}
        renderItem={renderStyleTile}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={TILE_WIDTH + TILE_GAP}
        decelerationRate="fast"
        snapToAlignment="start"
        ItemSeparatorComponent={() => <View style={{ width: TILE_GAP }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  tile: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  tileContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  sticker: {
    fontSize: 56,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  styleLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  styleDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
});
