import { StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height / 3;

export default StyleSheet.create({
  // Base styles from FavoriteItemsList
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginTop: 80,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    color: '#888',
  },

  // Card styles from ScholarshipCard
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    marginHorizontal: 10,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageCarousel: {
    flexGrow: 0,
  },
  cardImage: {
    width: screenWidth - 20, // Adjust for margin
    height: screenHeight,
    borderRadius: 10,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardFunding: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: 'white',
    backgroundColor: '#245292',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    padding: 5,
    marginLeft: 5,
  },
  favoriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 5,
  },
  favoritedButton: {
    // No additional styling needed, color change handled by icon
  },

  // Dropdown styles
  dropDownToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  dropDownToggleText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#007bff',
  },
  dropDownContent: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fafafa',
    borderRadius: 5,
    elevation: 2,
  },
  dropDownText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  boldText: {
    fontFamily: 'Poppins_700Bold',
    color: '#333',
  },
  linkText: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  professorContainer: {
    marginBottom: 10,
  },

  // Button styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#004aad',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
});