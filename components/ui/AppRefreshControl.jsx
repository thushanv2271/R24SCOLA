import React from "react";
import { RefreshControl } from "react-native";
import { haptic } from "./motion";
import { playSound } from "../../utils/feedback";

// RefreshControl that gives the pull-to-refresh a sound and a light tap.
const AppRefreshControl = ({ onRefresh, ...rest }) => (
  <RefreshControl
    {...rest}
    onRefresh={() => {
      playSound("refresh");
      haptic("select");
      onRefresh?.();
    }}
  />
);

export default AppRefreshControl;
