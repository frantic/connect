import {Color, Font, Shadow, Space} from "../atoms";
import React, {useContext, useRef} from "react";
import {ScrollView, StyleSheet, View} from "react-native";
import {AccountAvatarSmall} from "../account/AccountAvatarSmall";
import {CommentNewToolbar} from "../comment/CommentNewToolbar";
import {GroupCache} from "../group/GroupCache";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {NavbarScrollView} from "../frame/NavbarScrollView";
import {PostComments} from "./PostComments";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import {Route} from "../router/Route";
import {Trough} from "../molecules/Trough";
import {useCacheData} from "../cache/Cache";

function Post({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID;
}) {
  const scrollViewRef = useRef<ScrollView>(null);

  // Hide the navbar when we are using the laptop layout.
  const hideNavbar =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  function useTitle() {
    const group = useCacheData(GroupCache, groupSlug);
    return group.name;
  }

  return (
    <View style={styles.container}>
      <NavbarScrollView
        ref={scrollViewRef}
        route={route}
        useTitle={useTitle}
        hideNavbar={hideNavbar}
        keyboardDismissMode="interactive"
      >
        <PostContent postID={postID} />
        <Trough title="Comments" />
        <PostComments postID={postID} />
      </NavbarScrollView>
      <CommentNewToolbar scrollViewRef={scrollViewRef} />
    </View>
  );
}

// Don’t re-render `<Post>` unless the props change.
const PostMemo = React.memo(Post);
export {PostMemo as Post};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: Color.white,
    ...Shadow.elevation3,

    // The maximum width is designed to give a comment `Font.maxWidth` which
    // means the post text will end up being a bit wider.
    maxWidth:
      Space.space3 +
      AccountAvatarSmall.size +
      Space.space3 +
      Font.maxWidth +
      Space.space3,
  },
});
