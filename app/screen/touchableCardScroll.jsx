import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";

const data = [
  { id: "1", title: "Card 1", image: "https://via.placeholder.com/100" },
  { id: "2", title: "Card 2", image: "https://via.placeholder.com/100" },
  { id: "3", title: "Card 3", image: "https://via.placeholder.com/100" },
  { id: "4", title: "Card 4", image: "https://via.placeholder.com/100" },
];

const TouchableCardScroll = () => {
  return (
    <View style={{ padding: 10 }}>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              padding: 10,
              borderRadius: 10,
              marginRight: 10,
              marginTop:70,
              alignItems: "center",
              elevation: 3,
            }}
            onPress={() => alert(`You clicked on ${item.title}`)}
          >
            <Image
              source={{ uri: item.image }}
              style={{ width: 80, height: 80, borderRadius: 10 }}
            />
            <Text style={{ marginTop: 5 }}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default TouchableCardScroll;
