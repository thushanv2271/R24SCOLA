import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Linking, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Dropdown from "./Dropdown";

const ScholarshipCard = ({ item, favorites, toggleFavorite, sendScholarshipEmail }) => {
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
          <Text style={styles.cardFunding}>{item.funding}</Text>
          <Text style={styles.cardFunding}>{item.country}</Text>
          <Text style={styles.cardFunding}>{item.major}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item)}>
            <Ionicons
              name={favorites.includes(item) ? "heart" : "heart-outline"}
              size={24}
              color={favorites.includes(item) ? "red" : "gray"}
            />
          </TouchableOpacity>
        </View>

        <Dropdown title="University Details">
          <Text style={styles.dropdownText}>
            <Text style={styles.boldText}>University:</Text> {item.university}
          </Text>
          <Text style={styles.dropdownText}>
            <Text style={styles.boldText}>Details:</Text> {item.universityDetails}
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
          <Text style={styles.dropdownText}>
            <Text style={styles.boldText}>Department Head:</Text>{" "}
            {item.departmentHead.name} ({item.departmentHead.position})
          </Text>
        </Dropdown>

        <Dropdown title="Course Details">
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
            {item.languageTests.join(", ")}
          </Text>
          <Text style={styles.dropdownText}>
            <Text style={styles.boldText}>Funding:</Text> {item.funding}
          </Text>
          <Text style={styles.dropdownText}>
            <Text style={styles.boldText}>Course Value:</Text> {item.courseValue}
          </Text>
          <Text style={styles.dropdownText}>
            <Text style={styles.boldText}>Qualifications:</Text>{" "}
            {item.qualifications}
          </Text>
        </Dropdown>

        <Dropdown title="Professor Details">
          {item.contactProfessors.map((professor, index) => (
            <View
              key={`${item.id}-professor-${professor.email}`}
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
                <Text style={styles.boldText}>Office:</Text> {professor.office}
              </Text>
            </View>
          ))}
        </Dropdown>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              sendScholarshipEmail(item.contactProfessors[0].email)
            }
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
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
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
  },
  cardFunding: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    backgroundColor: "#a6a6a6",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cardImage: {
    width: 391,
    height: 250,
    borderRadius: 10,
    marginRight: 10,
  },
  dropdownText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: "bold",
  },
  linkText: {
    color: "#007bff",
    textDecorationLine: "underline",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#004aad",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 10,
    marginRight: 5,
  },
  professorContainer: {
    marginBottom: 10,
  },
});

export default ScholarshipCard;