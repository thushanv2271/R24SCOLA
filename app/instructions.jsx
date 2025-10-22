import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import Swiper from 'react-native-swiper';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const instructions = [
  {
    id: 1,
    title: '  Welcome to Schola!',
    description: 'Login to request scholarships and manage your applications.  ',
    image: require('../assets/images/OPPORTUNITIES.png'),
  },
  {
    id: 2,
    title: '  Request a Scholarship',
    description: 'Click the "Request Scholarship" button to start your application.  ',
    image: require('../assets/images/OPPORTUNITIES.png'),
  },
  {
    id: 3,
    title: '  View Your Request',
    description: 'Check your email template and send your request directly to the university.  ',
    image: require('../assets/images/OPPORTUNITIES.png'),
  },
];

const InstructionScreen = () => {
  const router = useRouter();
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (!hasLaunched) {
        setShowInstructions(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      } else {
        router.replace('/tenHome');
      }
    };
    checkFirstLaunch();
  }, []);

  if (!showInstructions) {
    return null;
  }

  return (
    <ImageBackground
      source={require('../assets/images/pngwing.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <Swiper
        style={styles.wrapper}
        showsButtons={false}
        loop={false}
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
                onPress={() => router.replace('/tenHome')}
              >
                <Text style={styles.buttonText}>  Get Started</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </Swiper>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {},
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
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    marginTop: 20,
    textAlign: 'center',
    color: '#333',
  },
  description: {
    fontSize: 16,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
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
    backgroundColor: "#004aad",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#fff",
    paddingHorizontal: 10,
    marginRight: 5,
  },
});

export default InstructionScreen;