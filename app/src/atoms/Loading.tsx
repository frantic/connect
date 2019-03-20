import * as Color from "./Color";
import {ActivityIndicator, Platform} from "react-native";
import React from "react";

export function Loading() {
  return (
    <ActivityIndicator
      size="small"
      color={Platform.OS !== "ios" ? Color.blue6 : undefined}
    />
  );
}

// https://facebook.github.io/react-native/docs/activityindicator#size
Loading.size = 20;
