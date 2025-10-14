import { Outfit } from '../models/outfit';

export interface OutfitCardProps {
  outfit: Outfit;
  onPress?: (outfit: Outfit) => void;
  onLongPress?: (outfit: Outfit) => void;
  onEdit?: (outfit: Outfit) => void;
  onDuplicate?: (outfit: Outfit) => void;
  onDelete?: (outfit: Outfit) => void;
  onShare?: (outfit: Outfit) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  showActions?: boolean;
}

export interface OutfitGridProps {
  outfits: Outfit[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onOutfitPress?: (outfit: Outfit) => void;
  onOutfitEdit?: (outfit: Outfit) => void;
  onOutfitDelete?: (outfit: Outfit) => void;
  onOutfitDuplicate?: (outfit: Outfit) => void;
  onOutfitShare?: (outfit: Outfit) => void;
  EmptyComponent?: React.ComponentType;
  numColumns?: number;
}

export interface OutfitEmptyStateProps {
  onCreatePress?: () => void;
  title?: string;
  message?: string;
  ctaText?: string;
}

export interface OutfitContextMenuOption {
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
}
