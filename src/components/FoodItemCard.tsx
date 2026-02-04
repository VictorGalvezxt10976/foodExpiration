import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodItem } from '../types';
import { useTheme } from '../hooks/useTheme';
import { getExpirationLabel, daysUntilExpiration } from '../utils/dates';
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
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons
              name={category?.icon as keyof typeof Ionicons.glyphMap ?? 'ellipsis-horizontal'}
              size={18}
              color={colors.textSecondary}
            />
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
            {item.currency} {item.price.toFixed(2)}
          </Text>
        )}

        <View style={styles.actions}>
          {onMarkConsumed && (
            <TouchableOpacity
              onPress={() => onMarkConsumed(item)}
              style={[styles.actionBtn, { backgroundColor: colors.success + '20' }]}
            >
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.actionText, { color: colors.success }]}>Consumido</Text>
            </TouchableOpacity>
          )}
          {onMarkThrownAway && (
            <TouchableOpacity
              onPress={() => onMarkThrownAway(item)}
              style={[styles.actionBtn, { backgroundColor: colors.danger + '20' }]}
            >
              <Ionicons name="trash" size={16} color={colors.danger} />
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
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
    overflow: 'hidden',
  },
  statusBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 12,
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
    gap: 6,
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
    marginTop: 4,
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
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
