import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './StyledText';
import { Ionicons } from '@expo/vector-icons';
import { FoodItem } from '../types';
import { useTheme } from '../hooks/useTheme';
import { getExpirationLabel, daysUntilExpiration } from '../utils/dates';
import { formatPrice } from '../utils/currency';
import { CATEGORIES, STORAGE_LOCATIONS } from '../constants/categories';

interface Props {
  item: FoodItem;
  onPress: (item: FoodItem) => void;
  onMarkConsumed?: (item: FoodItem) => void;
  onMarkThrownAway?: (item: FoodItem) => void;
}

export function FoodItemCard({ item, onPress, onMarkConsumed, onMarkThrownAway }: Props) {
  const { colors } = useTheme();
  const days = daysUntilExpiration(item.expirationDate);
  const category = CATEGORIES.find(c => c.value === item.category);
  const location = STORAGE_LOCATIONS.find(l => l.value === item.storageLocation);

  const statusColor =
    item.status === 'expired'
      ? colors.statusExpired
      : item.status === 'expiring'
        ? colors.statusExpiring
        : colors.statusFresh;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }, colors.shadow]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.categoryIcon, { backgroundColor: statusColor + '20' }]}>
              <Ionicons
                name={category?.icon as keyof typeof Ionicons.glyphMap ?? 'ellipsis-horizontal'}
                size={16}
                color={statusColor}
              />
            </View>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <Text style={[styles.quantity, { color: colors.textSecondary }]}>
            {item.quantity} {item.unit}
          </Text>
        </View>

        <View style={styles.details}>
          <Text style={[styles.expiration, { color: statusColor }]}>
            {getExpirationLabel(item.expirationDate)}
          </Text>
          <Text style={[styles.location, { color: colors.textSecondary }]}>
            {location?.label ?? item.storageLocation}
          </Text>
        </View>

        {item.price != null && (
          <Text style={[styles.price, { color: colors.textSecondary }]}>
            {formatPrice(item.price, item.currency)}
          </Text>
        )}

        <View style={styles.actions}>
          {onMarkConsumed && (
            <TouchableOpacity
              onPress={() => onMarkConsumed(item)}
              style={[styles.actionBtn, { backgroundColor: colors.primary + '30' }]}
            >
              <Ionicons name="checkmark-circle" size={15} color={colors.primaryText} />
              <Text style={[styles.actionText, { color: colors.primaryText }]}>Consumido</Text>
            </TouchableOpacity>
          )}
          {onMarkThrownAway && (
            <TouchableOpacity
              onPress={() => onMarkThrownAway(item)}
              style={[styles.actionBtn, { backgroundColor: colors.danger + '15' }]}
            >
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
              <Text style={[styles.actionText, { color: colors.danger }]}>Tirar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    overflow: 'hidden',
  },
  statusBar: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  quantity: {
    fontSize: 13,
    marginLeft: 8,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  expiration: {
    fontSize: 13,
    fontWeight: '500',
  },
  location: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
