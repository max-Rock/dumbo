import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Switch, Button, ActivityIndicator } from 'react-native-paper';
import { restaurantAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchRestaurantProfile = async () => {
    try {
      setLoading(true);
      const response = await restaurantAPI.getProfile();
      setRestaurant(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantProfile();
  }, []);

  const handleToggleStatus = async (isOpen: boolean) => {
    try {
      await restaurantAPI.toggleStatus(isOpen);
      setRestaurant({ ...restaurant, isOpen });
      Alert.alert('Success', `Restaurant is now ${isOpen ? 'Open' : 'Closed'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Restaurant Status */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Restaurant Status
          </Text>

          <View style={styles.statusRow}>
            <View>
              <Text variant="titleMedium">
                {restaurant?.isOpen ? '🟢 Open' : '🔴 Closed'}
              </Text>
              <Text variant="bodySmall" style={styles.statusSubtext}>
                Toggle to open/close your restaurant
              </Text>
            </View>
            <Switch
              value={restaurant?.isOpen || false}
              onValueChange={handleToggleStatus}
              color="#34C759"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Restaurant Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Restaurant Information
          </Text>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Name:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {restaurant?.name || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Phone:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {restaurant?.phone || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Email:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {restaurant?.email || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Address:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {restaurant?.addressLine1 || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Avg Prep Time:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {restaurant?.averagePrepTime || 0} mins
            </Text>
          </View>

          <Button
            mode="outlined"
            onPress={() => Alert.alert('Coming Soon', 'Edit profile feature coming soon')}
            style={styles.editButton}
          >
            Edit Profile
          </Button>
        </Card.Content>
      </Card>

      {/* Account */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Account
          </Text>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Logged in as:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {user?.name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Email:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {user?.email}
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor="#FF3B30"
          >
            Logout
          </Button>
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusSubtext: {
    color: '#666',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    color: '#666',
  },
  value: {
    fontWeight: '500',
  },
  editButton: {
    marginTop: 16,
  },
  logoutButton: {
    marginTop: 16,
  },
});