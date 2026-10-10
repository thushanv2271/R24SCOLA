import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SvgXml } from "react-native-svg";
import { getFaceSvg } from "../../constants/avatarIcons";

// Extracted from both Profile screens' identical avatarCircle/avatarInitial.
// Optionally shows a preset icon (icon + color) instead of the initial
// letter — used by the avatar picker feature.
const Avatar = ({ name, size = 96, icon, color, borderWidth = 4, photoUri }) => {
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => {
    setPhotoFailed(false);
  }, [photoUri]);
  const showPhoto = !!photoUri && !photoFailed;
  const faceSvg = getFaceSvg(icon);
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const backgroundColor = color || "#004aad";

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
          backgroundColor,
          overflow: "hidden",
        },
      ]}
    >
      {showPhoto ? (
        <Image
          source={{ uri: photoUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="disk"
          transition={150}
          onError={() => setPhotoFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : faceSvg ? (
        <SvgXml xml={faceSvg} width="100%" height="100%" />
      ) : icon ? (
        <Ionicons name={icon} size={size * 0.5} color="#fff" />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
          {initial}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    borderColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
  },
  initial: {
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#fff",
  },
});

export default Avatar;
