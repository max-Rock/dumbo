import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { ordersAPI } from '../services/api';
import { useOrdersStore } from '../stores/orderStore';

export default function OrdersScreen() {
  const { activeOrders, setActiveOrders } = useOrdersStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getActiveOrders();
      setActiveOrders(response.data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAccept = async (orderId: string) => {
    Alert.prompt(
      'Accept Order',
      'Enter preparation time (minutes):',
      async (prepTime) => {
        if (!prepTime || isNaN(Number(prepTime))) {
          Alert.alert('Invalid', 'Please enter a valid number');
          return;
        }

        try {
          await ordersAPI.acceptOrder(orderId, Number(prepTime));
          Alert.alert('Success', 'Order accepted!');
          fetchOrders();
        } catch (error) {
          Alert.alert('Error', 'Failed to accept order');
        }
      },
      'plain-text',
      '20'
    );
  };

  const handleReject = async (orderId: string) => {
    Alert.alert('Reject Order', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await ordersAPI.rejectOrder(orderId);
            Alert.alert('Success', 'Order rejected');
            fetchOrders();
          } catch (error) {
            Alert.alert('Error', 'Failed to reject order');
          }
        },
      },
    ]);
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await ordersAPI.markOrderReady(orderId);
      Alert.alert('Success', 'Order marked as ready!');
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark order as ready');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FF3B30';
      case 'ACCEPTED': return '#007AFF';
      case 'PREPARING': return '#FF9500';
      case 'READY': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const renderOrder = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.orderNumber}>
            {item.orderNumber}
          </Text>
          <Chip
            mode="flat"
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: '#FFF' }}
          >
            {item.status}
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.customer}>
          Customer: {item.customer.user.name}
        </Text>
        <Text variant="bodySmall" style={styles.phone}>
          Phone: {item.customer.user.phone}
        </Text>

        <View style={styles.divider} />

        <Text variant="titleSmall">Items:</Text>
        {item.items.map((orderItem: any, index: number) => (
          <Text key={index} variant="bodyMedium">
            • {orderItem.quantity}x {orderItem.name} - ₹{orderItem.price}
          </Text>
        ))}

        {item.customerNotes && (
          <>
            <View style={styles.divider} />
            <Text variant="bodySmall" style={styles.notes}>
              Note: {item.customerNotes}
            </Text>
          </>
        )}

        <View style={styles.divider} />
        <Text variant="titleMedium" style={styles.total}>
          Total: ₹{item.total}
        </Text>
      </Card.Content>

      <Card.Actions>
        {item.status === 'PENDING' && (
          <>
            <Button mode="contained" onPress={() => handleAccept(item.id)}>
              Accept
            </Button>
            <Button mode="outlined" onPress={() => handleReject(item.id)}>
              Reject
            </Button>
          </>
        )}

        {(item.status === 'ACCEPTED' || item.status === 'PREPARING') && (
          <Button
            mode="contained"
            onPress={() => handleMarkReady(item.id)}
            buttonColor="#34C759"
          >
            Mark Ready
          </Button>
        )}
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
        data={activeOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium">No active orders</Text>
          </View>
        }
        contentContainerStyle={styles.list}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontWeight: 'bold',
  },
  customer: {
    marginTop: 8,
  },
  phone: {
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  notes: {
    fontStyle: 'italic',
    color: '#666',
  },
  total: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
});