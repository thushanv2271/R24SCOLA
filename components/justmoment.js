import React from 'react';
import { View, Text, Modal, StyleSheet, Image, Dimensions } from 'react-native';

const LoaderModal = ({ visible }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalContainer}>
        <View style={styles.glassyBackground}>
          <View style={styles.modalContent}>
            <Image
              source={require('../assets/images/justframe.png')}
              style={styles.userIcon}
            />
            <Text style={styles.congratsText}>    Just a Moment!      </Text>
            <Text style={styles.messageText}>
              Hang tight while we load the content. You'll be redirected shortly!   
            </Text>
            <Image
              source={require('../assets/images/loader.gif')}
              style={styles.loaderImage}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    alignItems: 'center',
  },

  modalContent: {
    width: width * 0.8, // 80% of screen width for responsiveness
    maxWidth: 320,
    backgroundColor: 'rgb(255, 255, 255)', // Slightly translucent content
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  userIcon: {
    width: 80, // Reduced for responsiveness
    height: 80,
    marginBottom: 20,
  },
  congratsText: {
    fontSize: 18, // Slightly smaller for better scaling
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  messageText: {
    fontSize: 14, // Adjusted for readability on smaller screens
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
    lineHeight: 20,
  },
  loaderImage: {
    width: 100, // Slightly smaller for balance
    height: 100,
  },
});

export default LoaderModal;