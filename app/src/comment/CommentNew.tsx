import {Font, Space} from "../atoms";
import {StyleSheet, View} from "react-native";
import {Editor} from "../editor/Editor";
import {IconPatch} from "../molecules/IconPatch";
import React from "react";

export function CommentNew() {
  return (
    <View style={styles.container}>
      <Editor
        placeholder="Write a comment…"
        minHeight={CommentNew.minHeight}
        maxHeight={CommentNew.maxHeight}
        paddingRight={IconPatch.size + Space.space3 * 2}
      />
      <View style={styles.send}>
        <IconPatch icon="send" />
      </View>
    </View>
  );
}

CommentNew.minHeight = Font.size2.lineHeight + Space.space3 * 2;
CommentNew.maxHeight = Font.size2.lineHeight * 5 + Space.space3 * 2;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    minHeight: CommentNew.minHeight,
    maxHeight: CommentNew.maxHeight,
  },
  send: {
    // NOTE: We absolute position the send button so that the scroll indicator
    // on the editor can be all the way at the screen’s edge.
    position: "absolute",
    top: (CommentNew.minHeight - IconPatch.size) / 2,
    right: Space.space3,
  },
});