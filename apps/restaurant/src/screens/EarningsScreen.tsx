import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { restaurantAPI, ordersAPI } from '../services/api';

export default function EarningsScreen() {
  const [todayEarnings, setTodayEarnings] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [earningsRes, historyRes] = await Promise.all([
        restaurantAPI.getTodayEarnings(),
        ordersAPI.getOrderHistory(1, 10),
      ]);
      setTodayEarnings(earningsRes.data);
      setOrderHistory(historyRes.data.orders);
    } catch (error) {
      console.error('Failed to fetch earnings data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
    >
      {/* Today's Earnings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Today's Earnings
          </Text>
          <Text variant="displayMedium" style={styles.earningsAmount}>
            ₹{todayEarnings?.totalEarnings || 0}
          </Text>
          <Text variant="bodyMedium" style={styles.orderCount}>
            {todayEarnings?.orderCount || 0} orders completed today
          </Text>
        </Card.Content>
      </Card>

      {/* Recent Orders */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recent Orders
          </Text>

          {orderHistory.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No completed orders yet
            </Text>
          ) : (
            orderHistory.map((order) => (
              <View key={order.id} style={styles.orderItem}>
                <View style={styles.orderHeader}>
                  <Text variant="titleSmall">{order.orderNumber}</Text>
                  <Text variant="titleSmall" style={styles.orderTotal}>
                    ₹{order.total}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.orderDate}>
                  {new Date(order.deliveredAt || order.placedAt).toLocaleDateString()}
                </Text>
                <Text variant="bodySmall" style={styles.orderStatus}>
                  Status: {order.status}
                </Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Summary Stats */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Summary
          </Text>

          <View style={styles.statRow}>
            <Text variant="bodyMedium">Total Orders:</Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {orderHistory.length}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text variant="bodyMedium">Average Order Value:</Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              ₹
              {orderHistory.length > 0
                ? Math.round(
                    orderHistory.reduce((sum, order) => sum + order.total, 0) /
                      orderHistory.length
                  )
                : 0}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
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
  card: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  earningsAmount: {
    color: '#34C759',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  orderCount: {
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderTotal: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  orderDate: {
    color: '#666',
    marginBottom: 2,
  },
  orderStatus: {
    color: '#666',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statValue: {
    fontWeight: 'bold',
  },
});