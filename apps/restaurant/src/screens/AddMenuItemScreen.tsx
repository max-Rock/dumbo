import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { TextInput, Button, Text, Switch, Chip, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { menuAPI } from '../services/api';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Camera01Icon } from '@hugeicons/core-free-icons'

export default function AddMenuItemScreen({ navigation, route }: any) {
  const { item } = route.params || {}; // For editing
  const isEditing = !!item;

  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description ||'');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [isVeg, setIsVeg] = useState(item?.isVeg ?? true);
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [categoryId, setCategoryId] = useState(item?.categoryId || '');
  const [extras, setExtras] = useState<Array<{ name: string; price: string }>>(
    item?.addons?.map((a: any) => ({ name: a.name, price: a.price.toString() })) || []
  );
  const [imageUri, setImageUri] = useState<string | null>(item?.imageUrl || null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await menuAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter category name');
      return;
    }

    try {
      const response = await menuAPI.createCategory({
        name: newCategoryName.trim(),
        displayOrder: categories.length,
      });
      
      setCategories([...categories, response.data]);
      setCategoryId(response.data.id);
      setNewCategoryName('');
      setShowCategoryInput(false);
      Alert.alert('Success', 'Category created!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create category');
    }
  };

  const addExtra = () => {
    setExtras([...extras, { name: '', price: '' }]);
  };

  const updateExtra = (index: number, field: 'name' | 'price', value: string) => {
    const updated = [...extras];
    updated[index][field] = value;
    setExtras(updated);
  };

  const removeExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!name || !price) {
      Alert.alert('Error', 'Please fill in name and price');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = imageUri;

      // Upload new image if changed (and it's a local URI)
      if (imageUri && imageUri.startsWith('file://')) {
        setUploading(true);
        const uploadResponse = await menuAPI.uploadImage(imageUri) as { data: { imageUrl: string } };
        imageUrl = uploadResponse.data.imageUrl;
        setUploading(false);
      }

      const menuData = {
        name,
        description,
        price: parseFloat(price),
        isVeg,
        isAvailable,
        categoryId: categoryId || null,
        imageUrl,
      };

      if (isEditing) {
        // Update existing item
        await menuAPI.updateMenuItem(item.id, menuData);

        // Handle extras (add-ons)
        // Delete existing addons
        if (item.addons) {
          for (const addon of item.addons) {
            await menuAPI.deleteAddon(addon.id);
          }
        }

        // Create new addons
        for (const extra of extras) {
          if (extra.name && extra.price) {
            await menuAPI.createAddon(item.id, {
              name: extra.name,
              price: parseFloat(extra.price),
            });
          }
        }

        Alert.alert('Success', 'Menu item updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MenuList', { refresh: true }),
          },
        ]);
      } else {
        // Create new item
        const response = await menuAPI.createMenuItem(menuData);

        // Create addons/extras
        for (const extra of extras) {
          if (extra.name && extra.price) {
            await menuAPI.createAddon(response.data.id, {
              name: extra.name,
              price: parseFloat(extra.price),
            });
          }
        }

        Alert.alert('Success', 'Menu item added successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MenuList', { refresh: true }),
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {isEditing ? 'Edit Menu Item' : 'Add Menu Item'}
      </Text>

      {/* Image Picker */}
      <View style={styles.imageSection}>
        {imageUri ? (
          <View>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <Button mode="text" onPress={pickImage} style={styles.changeImageButton}>
              Change Image
            </Button>
          </View>
        ) : (
          <Button mode="outlined" onPress={pickImage} 
            icon={({ size, color }) => ( <HugeiconsIcon icon={Camera01Icon} size={size} color={color} /> )} 
            style={styles.uploadButton}>
            Upload Image (Optional)
          </Button>
        )}
        <Text variant="bodySmall" style={styles.imageHint}>
          Images will be optimized and converted to WebP format
        </Text>
      </View>

      {/* Category Selection */}
      <Text variant="titleSmall" style={styles.sectionTitle}>
        Category (Optional)
      </Text>
      
      {categories.map((cat) => (
        <Chip
          key={cat.id}
          selected={categoryId === cat.id}
          onPress={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
          style={styles.categoryChip}
          mode={categoryId === cat.id ? 'flat' : 'outlined'}
        >
          {cat.name}
        </Chip>
      ))}

      {!showCategoryInput ? (
        <Button
          mode="text"
          icon="plus"
          onPress={() => setShowCategoryInput(true)}
          style={styles.addCategoryButton}
        >
          Create New Category
        </Button>
      ) : (
        <View style={styles.categoryInputRow}>
          <TextInput
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            mode="outlined"
            style={styles.categoryInput}
            placeholder="Category name"
          />
          <Button mode="contained" onPress={handleCreateCategory}>
            Create
          </Button>
          <Button mode="text" onPress={() => setShowCategoryInput(false)}>
            Cancel
          </Button>
        </View>
      )}

      {/* Name */}
      <TextInput
        label="Item Name *"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
        placeholder="e.g., Chicken Biryani"
      />

      {/* Description */}
      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={3}
        placeholder="Describe your dish..."
      />

      {/* Price */}
      <TextInput
        label="Price (₹) *"
        value={price}
        onChangeText={setPrice}
        mode="outlined"
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="e.g., 250"
      />

      {/* Veg/Non-Veg */}
      <View style={styles.switchRow}>
        <Text variant="bodyLarge">Vegetarian</Text>
        <Switch value={isVeg} onValueChange={setIsVeg} color="#34C759" />
      </View>

      {/* Available */}
      <View style={styles.switchRow}>
        <Text variant="bodyLarge">Available</Text>
        <Switch value={isAvailable} onValueChange={setIsAvailable} color="#34C759" />
      </View>

      {/* Extras (Add-ons) */}
      <Text variant="titleSmall" style={styles.sectionTitle}>
        Extras / Add-ons (Optional)
      </Text>
      <Text variant="bodySmall" style={styles.extrasHint}>
        Add customizable options like "Extra Cheese", "Extra Sauce", etc.
      </Text>

      {extras.map((extra, index) => (
        <View key={index} style={styles.extraRow}>
          <TextInput
            value={extra.name}
            onChangeText={(text) => updateExtra(index, 'name', text)}
            mode="outlined"
            style={styles.extraNameInput}
            placeholder="e.g., Extra Cheese"
          />
          <TextInput
            value={extra.price}
            onChangeText={(text) => updateExtra(index, 'price', text)}
            mode="outlined"
            style={styles.extraPriceInput}
            placeholder="₹"
            keyboardType="decimal-pad"
          />
          <IconButton
            icon="delete"
            iconColor="#FF3B30"
            onPress={() => removeExtra(index)}
          />
        </View>
      ))}

      <Button
        mode="text"
        icon="plus"
        onPress={addExtra}
        style={styles.addExtraButton}
      >
        Add Extra
      </Button>

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        loading={loading || uploading}
        disabled={loading || uploading}
      >
        {uploading ? 'Uploading Image...' : loading ? 'Saving...' : isEditing ? 'Update Menu Item' : 'Add Menu Item'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  imageSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadButton: {
    marginVertical: 8,
  },
  changeImageButton: {
    marginTop: 8,
  },
  imageHint: {
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  addCategoryButton: {
    marginVertical: 8,
  },
  categoryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  categoryInput: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
  },
  extrasHint: {
    color: '#666',
    marginBottom: 12,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  extraNameInput: {
    flex: 2,
  },
  extraPriceInput: {
    flex: 1,
  },
  addExtraButton: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 40,
    paddingVertical: 8,
  },
});