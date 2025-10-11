import { StyleSheet } from 'react-native';

export const getDynamicStyles = (colorScheme) => StyleSheet.create({
  container: {
    backgroundColor: colorScheme === 'light' ? '#fff' : '#fff',
    height: 860, // Swapped colors
    
  },
  title: {
    color: colorScheme === 'light' ? '#000' : '#000',
    fontWeight: 'bold',
    fontSize: 23,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  input: {
    borderColor: colorScheme === 'light' ? '#ccc' : '#ccc',
    color: colorScheme === 'light' ? '#000' : '#000',
    backgroundColor: colorScheme === 'light' ? '#f0f0f0' : '#f0f0f0',
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  switchText: {
    color: colorScheme === 'light' ? 'blue' : 'blue',
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
});

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
    padding: 20,
  },
  title: {
    fontSize: 32,
    padding: 20,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: '100%',
    height: 60,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 15,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  logo: {
    width: 300,
    height: 100,
  },
  dropdown: {
    width: '100%',
    height: 60,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  button: {
    width: '100%',
    backgroundColor: '#004aad',
    padding: 20,
    borderRadius: 30,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    marginBottom: 10,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  switchText: {
    marginTop: 15,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    textAlign: 'center',
  },
});