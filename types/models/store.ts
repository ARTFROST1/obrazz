export interface Store {
  id: string;
  name: string;
  url: string;
  faviconUrl?: string;
  isDefault: boolean;
  order: number;
}

export interface BrowserTab {
  id: string;
  shopName: string;
  shopUrl: string;
  favicon?: string;
  currentUrl: string;
  scrollPosition?: number;
}

export interface DetectedImage {
  id: string; // Unique ID generated from URL + dimensions
  url: string;
  width: number;
  height: number;
  alt?: string;
  category?: string;
  confidence?: number;
}

export interface BrowserHistoryItem {
  url: string;
  title: string;
  timestamp: number;
  shopName: string;
}

export interface CartItem {
  id: string;
  image: DetectedImage;
  sourceUrl: string; // URL страницы, где найдено
  sourceName: string; // Название магазина
  addedAt: number; // Timestamp добавления
}

export interface BatchProcessingState {
  isActive: boolean;
  items: CartItem[];
  currentIndex: number;
  completedCount: number;
  skippedCount: number;
}
