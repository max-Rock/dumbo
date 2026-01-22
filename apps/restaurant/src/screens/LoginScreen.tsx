import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { authAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { UserAdd02Icon } from '@hugeicons/core-free-icons'

export default function LoginScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setUser, setTokens } = useAuthStore();

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('=== LOGIN DEBUG ===');
    console.log('Identifier:', identifier);
    console.log('Password:', password);

    setLoading(true);
    try {
      const response = await authAPI.login(identifier.trim(), password.trim());
      console.log('Login success:', response.data);
      
      const { accessToken, refreshToken, user } = response.data;

      if (user.role !== 'RESTAURANT') {
        Alert.alert('Error', 'This app is only for restaurants');
        setLoading(false);
        return;
      }

      await setTokens(accessToken, refreshToken);
      setUser(user);
    } catch (error: any) {
      console.log('=== LOGIN ERROR ===');
      console.log('Error:', error.response?.data);
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Restaurant Login
      </Text>

      <TextInput
        label="Email or Phone"
        value={identifier}
        onChangeText={setIdentifier}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </Button>

      <Divider style={styles.divider} />

      <Text variant="bodyMedium" style={styles.orText}>
        Don't have an account?
      </Text>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('Register')}
        style={styles.registerButton}
        icon={({ size, color }) => ( <HugeiconsIcon icon={UserAdd02Icon} size={size} color={color} /> )}
      >
        Create New Account
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 32,
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  registerButton: {
    paddingVertical: 8,
  },
});