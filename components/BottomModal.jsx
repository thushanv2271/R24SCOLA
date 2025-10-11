import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Pressable, Modal, Dimensions  } from 'react-native';
import Swiper from 'react-native-swiper';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BottomModal = ({ visible, onClose }) => {
  const instructions = [
    {
      id: 1,
      title: 'Welcome to Schola!   ',
      description: 'Login to request scholarships and manage your applications.   ',
      image: require('../assets/images/OPPORTUNITIES.png'),
    },
    {
      id: 2,
      title: 'Request a Scholarship   ',
      description: 'Click the "Request Scholarship" button to start your application.   ',
      image: require('../assets/images/OPPORTUNITIES.png'),
    },
    {
      id: 3,
      title: 'View Your Request   ',
      description: 'Check your email template and send your request directly to the university.   ',
      image: require('../assets/images/OPPORTUNITIES.png'),
    },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Modal Overlay */}
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        {/* Empty View to allow touches to pass through */}
      </Pressable>

      {/* Modal Content */}
      <View style={styles.modalContent}>
        {/* Swipeable Pages */}
        <Swiper
          style={styles.swiper}
          showsButtons={false} // Hide default buttons
          loop={false} // Disable looping
          dot={<View style={styles.dot} />}
          activeDot={<View style={styles.activeDot} />}
        >
          {instructions.map((instruction, index) => (
            <View key={instruction.id} style={styles.slide}>
              <Image source={instruction.image} style={styles.image} />
              <Text style={styles.title}>{instruction.title}</Text>
              <Text style={styles.description}>{instruction.description}</Text>
              {index === instructions.length - 1 && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={onClose} // Close the modal on button press
                >
                  <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </Swiper>
      </View>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white', // Background color of the modal
    borderTopLeftRadius: 20, // Rounded corners at the top-left
    borderTopRightRadius: 20, // Rounded corners at the top-right
    elevation: 5, // Adds a shadow on Android
    shadowColor: '#000', // Shadow color for iOS
    shadowOffset: { width: 0, height: -2 }, // Shadow offset for iOS
    shadowOpacity: 0.25, // Shadow opacity for iOS
    shadowRadius: 4, // Shadow radius for iOS
    height: '70%', // Set height for the modal content
    padding: 20, // Padding inside the modal
  },
  swiper: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  image: {
    width: 300,
    height: 200,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    color: '#333', // Adjust text color for better contrast
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  dot: {
    backgroundColor: '#ccc',
    width: 10,
    height: 10,
    borderRadius: 24,
    margin: 3,
  },
  activeDot: {
    backgroundColor: '#007bff',
    width: 10,
    height: 10,
    borderRadius: 24,
    margin: 3,
  },
  button: {
    backgroundColor: '#004aad', // Add gradient background or use your own colors
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3, // For Android
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 10,
    marginRight: 5,
  },
});

export default BottomModal;