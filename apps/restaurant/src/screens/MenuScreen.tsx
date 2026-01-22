import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert, ScrollView } from 'react-native';
import { Card, Text, Button, Switch, FAB, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { menuAPI } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export default function MenuScreen({ navigation, route }: any) {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh when screen comes into focus or refresh param changes
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    if (route.params?.refresh) {
      fetchData();
      // Reset the param
      navigation.setParams({ refresh: false });
    }
  }, [route.params?.refresh]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, categoriesRes] = await Promise.all([
        menuAPI.getMenuItems(),
        menuAPI.getCategories(),
      ]);
      setMenuItems(itemsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch menu items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      await menuAPI.toggleAvailability(itemId, !currentStatus);
      setMenuItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, isAvailable: !currentStatus } : item
        )
      );
      Alert.alert('Success', `Item ${!currentStatus ? 'available' : 'unavailable'} now`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    Alert.alert('Delete Item', `Are you sure you want to delete "${itemName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await menuAPI.deleteMenuItem(itemId);
            setMenuItems((items) => items.filter((item) => item.id !== itemId));
            Alert.alert('Success', 'Item deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const handleEditItem = (item: any) => {
    navigation.navigate('AddMenuItem', { item });
  };

  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.categoryId === selectedCategory)
    : menuItems;

  const renderMenuItem = ({ item }: any) => (
    <Card style={styles.card}>
      {item.imageUrl && (
        <Card.Cover source={{ uri: item.imageUrl }} style={styles.cardImage} />
      )}
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.itemName}>
              {item.isVeg ? '🟢' : '🔴'} {item.name}
            </Text>
            {item.description && (
              <Text variant="bodySmall" style={styles.description}>
                {item.description}
              </Text>
            )}
            <Text variant="titleSmall" style={styles.price}>
              ₹{item.price}
            </Text>
            {item.category && (
              <Chip mode="outlined" style={styles.categoryBadge} compact>
                {item.category.name}
              </Chip>
            )}
          </View>

          <View style={styles.itemActions}>
            <Switch
              value={item.isAvailable}
              onValueChange={() => handleToggleAvailability(item.id, item.isAvailable)}
              color="#34C759"
            />
            <Text variant="bodySmall" style={styles.statusText}>
              {item.isAvailable ? 'Available' : 'Sold Out'}
            </Text>
          </View>
        </View>
      </Card.Content>

      <Card.Actions>
        <Button
          mode="outlined"
          onPress={() => handleEditItem(item)}
          icon="pencil"
        >
          Edit
        </Button>
        <IconButton
          icon="delete"
          iconColor="#FF3B30"
          onPress={() => handleDeleteItem(item.id, item.name)}
        />
      </Card.Actions>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <Chip
            mode={selectedCategory === null ? 'flat' : 'outlined'}
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            style={styles.categoryFilterChip}
          >
            All ({menuItems.length})
          </Chip>
          {categories.map((cat) => {
            const count = menuItems.filter((item) => item.categoryId === cat.id).length;
            return (
              <Chip
                key={cat.id}
                mode={selectedCategory === cat.id ? 'flat' : 'outlined'}
                selected={selectedCategory === cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={styles.categoryFilterChip}
              >
                {cat.name} ({count})
              </Chip>
            );
          })}
        </ScrollView>
      )}

      <FlatList
        data={filteredItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium">
              {selectedCategory ? 'No items in this category' : 'No menu items yet'}
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: 8 }}>
              Tap + to add your first item
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddMenuItem')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryScrollContent: {
    padding: 12,
    gap: 8,
  },
  categoryFilterChip: {
    marginRight: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardImage: {
    height: 200,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#666',
    marginBottom: 8,
  },
  price: {
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  itemActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    marginTop: 4,
    fontSize: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
});