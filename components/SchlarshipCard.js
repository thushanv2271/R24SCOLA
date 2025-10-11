// ScholarshipCard.jsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Linking 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { sendScholarshipEmail } from '../service/emailService';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_IMAGE_HEIGHT = SCREEN_WIDTH / 1.5;

const ScholarshipCard = ({ item, onFavorite, onLike, isFavorite, isLiked }) => {
  const [expandedSections, setExpandedSections] = useState({
    course: false,
    university: false,
    professors: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <View style={styles.card}>
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        style={styles.imageCarousel}
      >
        {item.images.map((imageUri, index) => (
          <Image
            key={`${item.id}-image-${index}`}
            source={{ uri: imageUri }}
            style={styles.cardImage}
          />
        ))}
      </ScrollView>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.university}</Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.cardFunding}>{item.funding} Schol</Text>
          <Text style={styles.cardFunding}>{item.country}</Text>
          <Text style={styles.cardFunding}>{item.major}</Text>
          <View style={styles.likesContainer}>
            <TouchableOpacity
              onPress={() => onFavorite(item.id)}
              disabled={isFavorite}
              style={[styles.likeButton, isFavorite && styles.likedButton]}
            >
              <FontAwesome
                name={isFavorite ? 'heart' : 'heart-o'}
                size={20}
                color={isFavorite ? 'red' : 'black'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* University Details Dropdown */}
        <TouchableOpacity 
          style={styles.dropdownToggle} 
          onPress={() => toggleSection('university')}
        >
          <Text style={styles.dropdownToggleText}>University Details</Text>
          <Ionicons 
            name={expandedSections.university ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="gray" 
          />
        </TouchableOpacity>
        {expandedSections.university && (
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>University:</Text> {item.university}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Details:</Text> {item.universityDetails}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Website:</Text>{' '}
              <Text 
                style={styles.linkText} 
                onPress={() => Linking.openURL(item.universityWebsite)}
              >
                {item.universityWebsite}
              </Text>
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Department Head:</Text>{' '}
              {item.departmentHead.name} ({item.departmentHead.position})
            </Text>
          </View>
        )}

        {/* Course Details Dropdown */}
        <TouchableOpacity 
          style={styles.dropdownToggle} 
          onPress={() => toggleSection('course')}
        >
          <Text style={styles.dropdownToggleText}>Course Details</Text>
          <Ionicons 
            name={expandedSections.course ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="gray" 
          />
        </TouchableOpacity>
        {expandedSections.course && (
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Major:</Text> {item.major}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Type:</Text> {item.type}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Level:</Text> {item.level}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Language Tests:</Text>{' '}
              {item.languageTests.join(', ')}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Funding:</Text> {item.funding}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Course Value:</Text> {item.courseValue}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Qualifications:</Text> {item.qualifications}
            </Text>
          </View>
        )}

        {/* Professors Details Dropdown */}
        <TouchableOpacity 
          style={styles.dropdownToggle} 
          onPress={() => toggleSection('professors')}
        >
          <Text style={styles.dropdownToggleText}>Professor Details</Text>
          <Ionicons 
            name={expandedSections.professors ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="gray" 
          />
        </TouchableOpacity>
        {expandedSections.professors && (
          <View style={styles.dropdownContent}>
            {item.contactProfessors.map((professor, index) => (
              <View 
                key={`${item.id}-professor-${professor.email}`} 
                style={styles.professorContainer}
              >
                <Text style={styles.dropdownText}>
                  <Text style={styles.boldText}>Name:</Text> {professor.name}
                </Text>
                <Text style={styles.dropdownText}>
                  <Text style={styles.boldText}>Position:</Text> {professor.position}
                </Text>
                <Text style={styles.dropdownText}>
                  <Text style={styles.boldText}>Email:</Text> {professor.email}
                </Text>
                <Text style={styles.dropdownText}>
                  <Text style={styles.boldText}>Research:</Text> {professor.research}
                </Text>
                <Text style={styles.dropdownText}>
                  <Text style={styles.boldText}>Office:</Text> {professor.office}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendScholarshipEmail(item.contactProfessors[0].email)}
          >
            <Text style={styles.buttonText}>Request Scholarship</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginBottom: 16, 
    overflow: 'hidden', 
    elevation: 8 
  },
  imageCarousel: { 
    height: CARD_IMAGE_HEIGHT 
  },
  cardImage: { 
    width: SCREEN_WIDTH - 20, 
    height: CARD_IMAGE_HEIGHT, 
    borderRadius: 10 
  },
  cardContent: { 
    padding: 12 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  cardSubtitle: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 8 
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  cardFunding: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: 'white', 
    backgroundColor: '#245292', 
    paddingHorizontal: 10, 
    paddingVertical: 10, 
    borderRadius: 20 
  },
  likesContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  likeButton: { 
    padding: 8 
  },
  likedButton: { 
    opacity: 0.7 
  },
  dropdownToggle: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ddd' 
  },
  dropdownToggleText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#007bff' 
  },
  dropdownContent: { 
    marginTop: 10, 
    padding: 10, 
    backgroundColor: 'white', 
    borderRadius: 5, 
    elevation: 2 
  },
  dropdownText: { 
    fontSize: 14, 
    lineHeight: 20, 
    marginBottom: 8 
  },
  boldText: { 
    fontWeight: 'bold' 
  },
  linkText: { 
    color: '#007bff', 
    textDecorationLine: 'underline' 
  },
  professorContainer: { 
    marginBottom: 10 
  },
  buttonContainer: { 
    marginTop: 10 
  },
  button: { 
    backgroundColor: '#004aad', 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 30, 
    alignItems: 'center', 
    elevation: 13 
  },
  buttonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff' 
  }
});

export default React.memo(ScholarshipCard);