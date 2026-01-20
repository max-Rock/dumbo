import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, Switch, FAB, ActivityIndicator, IconButton } from 'react-native-paper';
import { menuAPI } from '../services/api';

export default function MenuScreen({ navigation }: any) {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await menuAPI.getMenuItems();
      setMenuItems(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch menu items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

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

  const renderMenuItem = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.itemName}>
              {item.name}
            </Text>
            {item.description && (
              <Text variant="bodySmall" style={styles.description}>
                {item.description}
              </Text>
            )}
            <Text variant="titleSmall" style={styles.price}>
              ₹{item.price}
            </Text>
            {item.tags && item.tags.length > 0 && (
              <Text variant="bodySmall" style={styles.tags}>
                Tags: {item.tags.join(', ')}
              </Text>
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
          onPress={() => navigation.navigate('EditMenuItem', { item })}
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
      <FlatList
        data={menuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchMenuItems} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium">No menu items yet</Text>
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
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
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
    marginBottom: 4,
  },
  tags: {
    color: '#666',
    fontSize: 12,
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