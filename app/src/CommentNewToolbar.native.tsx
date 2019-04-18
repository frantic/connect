import {CommentNew} from "./CommentNew";
import {KeyboardTrackingView} from "react-native-keyboard-tracking-view";
import React from "react";
import {StyleSheet} from "react-native";

export function CommentNewToolbar() {
  return (
    <KeyboardTrackingView style={styles.toolbar}>
      <CommentNew />
    </KeyboardTrackingView>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});