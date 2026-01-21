import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { authAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, setTokens } = useAuthStore();

  const handleRegister = async () => {
    // Validation
    if (!email || !phone || !password || !name || !restaurantName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (phone.length !== 10) {
      Alert.alert('Error', 'Phone number must be 10 digits');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      console.log('=== REGISTRATION DEBUG ===');
      console.log('Email:', email);
      console.log('Phone:', phone);
      console.log('Password:', password);
      console.log('Name:', name);
      console.log('Restaurant Name:', restaurantName);

      const response = await authAPI.register({
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
        name: name.trim(),
        role: 'RESTAURANT',
      });

      console.log('Registration response:', response.data);

      const { accessToken, refreshToken, user } = response.data;

      // Save tokens
      await setTokens(accessToken, refreshToken);
      setUser(user);

      Alert.alert('Success', 'Restaurant account created successfully!');
    } catch (error: any) {
      console.log('=== REGISTRATION ERROR ===');
      console.log('Error:', error.response?.data);

      console.log('=== FULL ERROR DETAILS ===');
      console.log('Status:', error.response?.status);
      console.log('Data:', JSON.stringify(error.response?.data, null, 2));
      console.log('Headers:', error.response?.headers);

      Alert.alert(
        'Registration Failed',
        JSON.stringify(error.response?.data?.message || 'Unknown error')
      );
      
      const errorMessage = error.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        Alert.alert('Registration Failed', errorMessage.join('\n'));
      } else {
        Alert.alert('Registration Failed', errorMessage || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineLarge" style={styles.title}>
        Create Restaurant Account
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Sign up to start managing your restaurant
      </Text>

      <TextInput
        label="Restaurant Name *"
        value={restaurantName}
        onChangeText={setRestaurantName}
        mode="outlined"
        style={styles.input}
        placeholder="e.g., Tasty Bites"
      />

      <TextInput
        label="Your Name *"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
        placeholder="e.g., John Doe"
      />

      <TextInput
        label="Email *"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="e.g., restaurant@example.com"
      />

      <TextInput
        label="Phone Number *"
        value={phone}
        onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
        mode="outlined"
        style={styles.input}
        keyboardType="phone-pad"
        maxLength={10}
        placeholder="10-digit mobile number"
      />

      <TextInput
        label="Password *"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
        placeholder="At least 6 characters"
      />

      <Button
        mode="contained"
        onPress={handleRegister}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        Already have an account? Login
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 16,
  },
});