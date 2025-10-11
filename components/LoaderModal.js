import React from 'react';
import { View, Text, Modal, StyleSheet, Image } from 'react-native';

const LoaderModal = ({ visible }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Image
            source={require('../assets/images/loadertop.png')}
            style={styles.userIcon}
          />
          <Text style={styles.congratsText}>Congratulations!</Text>
          <Text style={styles.messageText}>
            Your account is ready to use. You will be redirected to the Login page in a few seconds.
          </Text>
          <Image
            source={require('../assets/images/loader.gif')}
            style={styles.loaderImage}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 320,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    height:450,
    elevation: 15,
  },
  userIcon: {
    width: 118,
    height: 111,
    marginBottom: 40,
  },
  congratsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
    lineHeight: 22,
  },
  loaderImage: {
    width: 120,
    height: 120,
  },
});

export default LoaderModal;