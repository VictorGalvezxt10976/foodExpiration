import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Text } from './StyledText';
import { GlassView } from 'expo-glass-effect';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../hooks/useTheme';

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const ITEM_WIDTH = 56;
const ITEM_GAP = 8;
const TOTAL_DAYS = 14;
const TODAY_INDEX = 7;

export function DateSelector({ selectedDate, onDateChange }: Props) {
  const { colors, isDark } = useTheme();
  const listRef = useRef<FlatList>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = addDays(today, i - TODAY_INDEX);
    return {
      date: d,
      dateStr: format(d, 'yyyy-MM-dd'),
      dayName: format(d, 'EEE', { locale: es }).replace('.', ''),
      dayNumber: format(d, 'd'),
      isToday: isSameDay(d, today),
    };
  });

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: TODAY_INDEX,
        animated: false,
        viewPosition: 0.5,
      });
    }, 100);
  }, []);

  const androidItemStyle = {
    backgroundColor: isDark ? 'rgba(50, 50, 50, 0.92)' : 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    elevation: 2,
  };

  const renderItem = ({ item }: { item: typeof dates[0] }) => {
    const isSelected = item.dateStr === selectedDate;

    const content = (
      <>
        <Text
          style={[
            styles.dayName,
            { color: isSelected ? colors.primaryText : colors.textSecondary },
          ]}
        >
          {item.dayName}
        </Text>
        <Text
          style={[
            styles.dayNumber,
            { color: isSelected ? colors.primaryText : colors.text },
          ]}
        >
          {item.dayNumber}
        </Text>
      </>
    );

    if (isSelected) {
      return (
        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.primary }]}
          onPress={() => onDateChange(item.dateStr)}
          activeOpacity={0.7}
        >
          {content}
        </TouchableOpacity>
      );
    }

    if (Platform.OS === 'android') {
      return (
        <TouchableOpacity
          style={[
            styles.item,
            androidItemStyle,
            item.isToday && { borderColor: colors.primary, borderWidth: 1.5 },
          ]}
          onPress={() => onDateChange(item.dateStr)}
          activeOpacity={0.7}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => onDateChange(item.dateStr)}
        activeOpacity={0.7}
      >
        <GlassView
          style={[
            styles.item,
            item.isToday && { borderColor: colors.primary, borderWidth: 1.5 },
          ]}
        >
          {content}
        </GlassView>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={dates}
      renderItem={renderItem}
      keyExtractor={item => item.dateStr}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      getItemLayout={(_, index) => ({
        length: ITEM_WIDTH + ITEM_GAP,
        offset: (ITEM_WIDTH + ITEM_GAP) * index,
        index,
      })}
      onScrollToIndexFailed={() => {}}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    gap: ITEM_GAP,
    paddingVertical: 4,
  },
  item: {
    width: ITEM_WIDTH,
    height: 68,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
});
