import { StyleTag } from '@/types/models/user';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Compact, infinite carousel with background images
const TILE_WIDTH = SCREEN_WIDTH - 64; // More margins for premium look
const TILE_HEIGHT = 140; // Reduced height for modern compact design
const TILE_GAP = 16;

interface StyleItem {
  id: StyleTag;
  label: string;
  gradient: [string, string];
}

const STYLE_DATA: StyleItem[] = [
  {
    id: 'casual',
    label: 'Кэжуал',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: 'classic',
    label: 'Классика',
    gradient: ['#2c3e50', '#4a5568'],
  },
  {
    id: 'sport',
    label: 'Спорт',
    gradient: ['#11998e', '#38ef7d'],
  },
  {
    id: 'minimalism',
    label: 'Минимализм',
    gradient: ['#bdc3c7', '#2c3e50'],
  },
  {
    id: 'old_money',
    label: 'Old Money',
    gradient: ['#8E793E', '#AD974F'],
  },
  {
    id: 'scandi',
    label: 'Сканди',
    gradient: ['#a8e6cf', '#88d8b0'],
  },
  {
    id: 'indie',
    label: 'Инди',
    gradient: ['#ff7e5f', '#feb47b'],
  },
  {
    id: 'y2k',
    label: 'Y2K',
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    id: 'star',
    label: 'Звезда',
    gradient: ['#f12711', '#f5af19'],
  },
  {
    id: 'alt',
    label: 'Альт',
    gradient: ['#232526', '#414345'],
  },
  {
    id: 'cottagecore',
    label: 'Котеджкор',
    gradient: ['#ffecd2', '#fcb69f'],
  },
  {
    id: 'downtown',
    label: 'Даунтаун',
    gradient: ['#373B44', '#4286f4'],
  },
];

interface StylesCarouselProps {
  onStylePress?: (style: StyleTag) => void;
}

export default function StylesCarousel({ onStylePress }: StylesCarouselProps) {
  const flatListRef = useRef<FlatList>(null);

  // Create infinite loop data by tripling the array
  const infiniteData = [...STYLE_DATA, ...STYLE_DATA, ...STYLE_DATA];
  const dataLength = STYLE_DATA.length;

  useEffect(() => {
    // Start at the middle set for seamless looping
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: dataLength,
        animated: false,
      });
    }
  }, [dataLength]);

  const handleStylePress = (style: StyleTag) => {
    if (onStylePress) {
      onStylePress(style);
    }
  };

  const onScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (TILE_WIDTH + TILE_GAP));

    // Loop back to middle set when reaching edges
    if (index <= 0) {
      flatListRef.current?.scrollToIndex({
        index: dataLength,
        animated: false,
      });
    } else if (index >= dataLength * 2) {
      flatListRef.current?.scrollToIndex({
        index: dataLength,
        animated: false,
      });
    }

    // Index tracking removed; not used by UI
  };

  const renderStyleTile = ({ item }: { item: StyleItem }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => handleStylePress(item.id)}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={[...item.gradient, item.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.tileContent}>
          <Text style={styles.styleLabel}>{item.label}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={infiniteData}
        renderItem={renderStyleTile}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={TILE_WIDTH + TILE_GAP}
        decelerationRate="fast"
        snapToAlignment="center"
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: TILE_WIDTH + TILE_GAP,
          offset: (TILE_WIDTH + TILE_GAP) * index,
          index,
        })}
        ItemSeparatorComponent={() => <View style={{ width: TILE_GAP }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 32,
  },
  tile: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
