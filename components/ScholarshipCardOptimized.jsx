import React, { useState, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FastImage from "react-native-fast-image";

const ScholarshipCardOptimized = ({
  item,
  isFavorite = false,
  onFavoriteToggle,
  onRequestPress,
  showRequestButton = true,
}) => {
  const [isCourseVisible, setIsCourseVisible] = useState(false);
  const [isUniversityVisible, setIsUniversityVisible] = useState(false);
  const [isProfessorsVisible, setIsProfessorsVisible] = useState(false);

  return (
    <View style={styles.card}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.imageCarousel}
      >
        {item.images?.map((imageUri, index) => (
          <FastImage
            key={`${item.id}-image-${index}`}
            source={{
              uri: imageUri,
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.cardImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        ))}
      </ScrollView>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {item.university}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardFunding} numberOfLines={1}>
            {item.funding}
          </Text>
          <Text style={styles.cardFunding} numberOfLines={1}>
            {item.country}
          </Text>
          <Text style={styles.cardFunding} numberOfLines={1}>
            {item.major}
          </Text>
          {onFavoriteToggle && (
            <TouchableOpacity onPress={() => onFavoriteToggle(item)}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "red" : "gray"}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* University Details Dropdown */}
        <TouchableOpacity
          style={styles.dropdownToggle}
          onPress={() => setIsUniversityVisible(!isUniversityVisible)}
        >
          <Text style={styles.dropdownToggleText}>University Details</Text>
          <Ionicons
            name={isUniversityVisible ? "chevron-up" : "chevron-down"}
            size={20}
            color="gray"
          />
        </TouchableOpacity>
        {isUniversityVisible && (
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>University:</Text> {item.university}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Details:</Text>{" "}
              {item.universityDetails}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Website:</Text>{" "}
              <Text
                style={styles.linkText}
                onPress={() => Linking.openURL(item.universityWebsite)}
              >
                {item.universityWebsite}
              </Text>
            </Text>
            {item.departmentHead && (
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>Department Head:</Text>{" "}
                {item.departmentHead.name} ({item.departmentHead.position})
              </Text>
            )}
          </View>
        )}

        {/* Course Details Dropdown */}
        <TouchableOpacity
          style={styles.dropdownToggle}
          onPress={() => setIsCourseVisible(!isCourseVisible)}
        >
          <Text style={styles.dropdownToggleText}>Course Details</Text>
          <Ionicons
            name={isCourseVisible ? "chevron-up" : "chevron-down"}
            size={20}
            color="gray"
          />
        </TouchableOpacity>
        {isCourseVisible && (
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
              <Text style={styles.boldText}>Language Tests:</Text>{" "}
              {item.languageTests?.join(", ")}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Funding:</Text> {item.funding}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Course Value:</Text>{" "}
              {item.courseValue}
            </Text>
            <Text style={styles.dropdownText}>
              <Text style={styles.boldText}>Qualifications:</Text>{" "}
              {item.qualifications}
            </Text>
          </View>
        )}

        {/* Professor Details Dropdown */}
        <TouchableOpacity
          style={styles.dropdownToggle}
          onPress={() => setIsProfessorsVisible(!isProfessorsVisible)}
        >
          <Text style={styles.dropdownToggleText}>Professor Details</Text>
          <Ionicons
            name={isProfessorsVisible ? "chevron-up" : "chevron-down"}
            size={20}
            color="gray"
          />
        </TouchableOpacity>
        {isProfessorsVisible && (
          <View style={styles.dropdownContent}>
            {item.contactProfessors?.map((professor, index) => (
              <View
                key={`${item.id}-professor-${index}`}
                style={styles.professorContainer}
              >
                <Text style={styles.dropdownText}>
                  <Text style={styles.boldText}>Name:</Text> {professor.name}
                </Text>
                <Text style={styles.dropdownText}>
                  <Text style={styles.boldText}>Position:</Text>{" "}
                  {professor.position}
                </Text>
                <Text style={styles.dropdownText}>
                  <Text style={styles.boldText}>Email:</Text> {professor.email}
                </Text>
                <Text style={styles.dropdownText}>
                  <Text style={styles.boldText}>Research:</Text>{" "}
                  {professor.research}
                </Text>
                <Text style={styles.dropdownText}>
                  <Text style={styles.boldText}>Office:</Text>{" "}
                  {professor.office}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Request Button */}
        {showRequestButton && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => onRequestPress && onRequestPress(item)}
          >
            <Text style={styles.buttonText}>Request Scholarship</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageCarousel: {
    height: 200,
  },
  cardImage: {
    width: 350,
    height: 200,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Roboto",
    marginBottom: 4,
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  cardFunding: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Roboto",
    color: "white",
    backgroundColor: "#a6a6a6",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dropdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  dropdownToggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  dropdownContent: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
  },
  dropdownText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    color: "#333",
  },
  boldText: {
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
  linkText: {
    color: "#004aad",
    textDecorationLine: "underline",
  },
  professorContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#004aad",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

// Memoize component to prevent unnecessary re-renders
export default memo(
  ScholarshipCardOptimized,
  (prevProps, nextProps) =>
    prevProps.item.id === nextProps.item.id &&
    prevProps.isFavorite === nextProps.isFavorite,
);
