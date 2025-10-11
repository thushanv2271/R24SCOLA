import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, router } from 'expo-router';
import { fetchUserByEmail, updateUser } from '../services/userService';

export default function Profile() {
  const { email } = useLocalSearchParams(); // Get the email from query parameters
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [editedData, setEditedData] = useState({}); // State to hold edited user data

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await fetchUserByEmail(email);
        setUserData(data);
        setEditedData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [email]);

  // Logout Function
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userEmail', 'userPassword', 'userToken']);
      console.log('User logged out');
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleGoHome = () => {
    router.back(); // Navigate back to the previous screen (home page)
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing); // Toggle edit mode
  };

  const validateInput = () => {
    if (isNaN(editedData.age) || editedData.age <= 0) {
      Alert.alert('Invalid Input', 'Age must be a positive number.');
      return false;
    }
    if (!editedData.country.trim()) {
      Alert.alert('Invalid Input', 'Country cannot be empty.');
      return false;
    }
    return true;
  };

  const prepareDataForAPI = () => {
    return {
      id: userData.id,
      email: editedData.email,
      password: editedData.password,
      age: editedData.age,
      country: editedData.country,
      favoriteScholarshipIds: editedData.favoriteScholarshipIds || [],
    };
  };

  const handleSave = async () => {
    if (!validateInput()) return;
  
    try {
      const userId = userData.id;
      const dataToSend = prepareDataForAPI();
      const token = await AsyncStorage.getItem('userToken');
      
      const updatedData = await updateUser(userId, dataToSend, token);
      setUserData(updatedData || dataToSend);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating user data:', error);
      Alert.alert('Error', error.message || 'Failed to update profile.');
    }
  };

  const handleChange = (field, value) => {
    setEditedData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  // Function to convert country name to flag emoji
  const getFlagEmoji = (countryName) => {
    // Simple mapping of country names to ISO 3166-1 alpha-2 codes
    const countryCodes = {
      'Algeria': 'DZ',
      'Argentina': 'AR',
      'Australia': 'AU',
      'Austria': 'AT',
      'Bangladesh': 'BD',
      'Belgium': 'BE',
      'Brazil': 'BR',
      'Canada': 'CA',
      'Chile': 'CL',
      'China': 'CN',
      'Colombia': 'CO',
      'Cuba': 'CU',
      'Czech Republic': 'CZ',
      'Denmark': 'DK',
      'Egypt': 'EG',
      'Ethiopia': 'ET',
      'Finland': 'FI',
      'France': 'FR',
      'Germany': 'DE',
      'Ghana': 'GH',
      'Greece': 'GR',
      'Hungary': 'HU',
      'India': 'IN',
      'Indonesia': 'ID',
      'Iran': 'IR',
      'Iraq': 'IQ',
      'Ireland': 'IE',
      'Israel': 'IL',
      'Italy': 'IT',
      'Japan': 'JP',
      'Kenya': 'KE',
      'Malaysia': 'MY',
      'Mexico': 'MX',
      'Morocco': 'MA',
      'Netherlands': 'NL',
      'New Zealand': 'NZ',
      'Nigeria': 'NG',
      'Norway': 'NO',
      'Pakistan': 'PK',
      'Peru': 'PE',
      'Poland': 'PL',
      'Portugal': 'PT',
      'Russia': 'RU',
      'Saudi Arabia': 'SA',
      'South Africa': 'ZA',
      'South Korea': 'KR',
      'Spain': 'ES',
      'Sri Lanka': 'LK',
      'Sweden': 'SE',
      'Switzerland': 'CH',
      'Thailand': 'TH',
      'Turkey': 'TR',
      'Ukraine': 'UA',
      'United Kingdom': 'GB',
      'United States': 'US',
      'Venezuela': 'VE',
      'Vietnam': 'VN',
    };

    const countryCode = countryCodes[countryName] || '??'; // Default to '??' if country not found
    return String.fromCodePoint(...countryCode.toUpperCase().split('').map(char => 0x1F1A5 + char.charCodeAt(0)));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header with Icons */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoHome} style={styles.iconButton}>
            <Ionicons name="home" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out" size={24} color="red" />
          </TouchableOpacity>
        </View>

        {/* Edit Button */}
        {/* <TouchableOpacity style={styles.editButton} onPress={toggleEditMode}>
          <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity> */}

        {/* User Profile Card */}
        <View style={styles.card}>
          {userData ? (
            <>
              {/* Profile Picture */}
              <View style={styles.profilePictureContainer}>
                <Image
                  source={{ uri: userData.profilePicture || 'https://img.freepik.com/free-psd/contact-icon-illustration-isolated_23-2151903337.jpg' }}
                  style={styles.profilePicture}
                />
              </View>

              {/* Name and Title */}
              <View style={styles.infoContainer}>
                <Text style={styles.name}>{userData.name}</Text>
                <Text style={styles.title}>{userData.title}</Text>
              </View>

              {/* Bio */}
              <View style={styles.bioContainer}>
                <Text style={styles.bio}>{userData.bio}</Text>
              </View>

              {/* Personal Information Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View style={styles.sectionContent}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{userData.email}</Text>

                  <Text style={styles.label}>Age:</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={String(editedData.age)}
                      onChangeText={(text) => handleChange('age', parseInt(text, 10))}
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.value}>{userData.age}</Text>
                  )}

                  <Text style={styles.label}>Country:</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={editedData.country}
                      onChangeText={(text) => handleChange('country', text)}
                    />
                  ) : (
                    <View style={styles.countryContainer}>
                      <Text style={styles.value}>{userData.country}</Text>
                      <Text style={styles.flag}>{getFlagEmoji(userData.country)}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Save Button */}
              {isEditing && (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.noDataText}>No user data found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  iconButton: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  bioContainer: {
    marginBottom: 20,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 10,
  },
  sectionContent: {
    paddingLeft: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: '#333',
    marginBottom: 15,
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  editButton: {
    alignSelf: 'flex-end',
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    marginBottom: 20,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    alignSelf: 'flex-end',
    padding: 10,
    backgroundColor: 'green',
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  flag: {
    fontSize: 20,
    marginLeft: 10,
  },
});