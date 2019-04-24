import {
  AccountProfile,
  CommentID,
  Comment as _Comment,
} from "@connect/api-client";
import {BodyText, Font, Space} from "../atoms";
import {StyleSheet, View} from "react-native";
import {AccountAvatarSmall} from "../account/AccountAvatarSmall";
import {AccountByline} from "../account/AccountByline";
import {AccountCache} from "../account/AccountCache";
import {CommentCache} from "./CommentCache";
import React from "react";
import {useCacheData} from "../cache/Cache";

// NOTE: Having a React component and a type with the same name is ok in
// TypeScript, but eslint complains when it’s an import. So import the type with
// a different name and alias it here.
type Comment = _Comment;

export function Comment({
  commentID,
  lastCommentID,
}: {
  commentID: CommentID;
  lastCommentID?: CommentID;
}) {
  if (lastCommentID != null) {
    CommentCache.preload(lastCommentID);
  }

  const comment = useCacheData(CommentCache, commentID);
  const author = useCacheData(AccountCache, comment.authorID);

  if (lastCommentID == null) {
    return <CommentWithByline comment={comment} author={author} />;
  } else {
    return (
      <CommentAfterFirst
        comment={comment}
        author={author}
        lastCommentID={lastCommentID}
      />
    );
  }
}

function CommentAfterFirst({
  comment,
  author,
  lastCommentID,
}: {
  comment: Comment;
  author: AccountProfile;
  lastCommentID: CommentID;
}) {
  const lastComment = useCacheData(CommentCache, lastCommentID);

  // If this comment has the same author as our last comment then don’t add a
  // byline to our comment.
  if (lastComment.authorID === comment.authorID) {
    return <CommentWithoutByline comment={comment} />;
  } else {
    return <CommentWithByline comment={comment} author={author} />;
  }
}

function CommentWithByline({
  comment,
  author,
}: {
  comment: Comment;
  author: AccountProfile;
}) {
  return (
    <View style={styles.comment}>
      <AccountAvatarSmall style={styles.commentAvatar} account={author} />
      <View style={styles.commentWithByline}>
        <AccountByline account={author} publishedAt={comment.publishedAt} />
        <BodyText selectable>{comment.content}</BodyText>
      </View>
    </View>
  );
}

function CommentWithoutByline({comment}: {comment: Comment}) {
  return (
    <View style={styles.commentWithoutByline}>
      <BodyText selectable>{comment.content}</BodyText>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: {
    flexDirection: "row",
    paddingTop: Space.space3,
    paddingHorizontal: Space.space3,
  },
  commentAvatar: {
    position: "relative",
    top: Font.size2.lineHeight - AccountAvatarSmall.size / 2 - 4,
  },
  commentWithByline: {
    flex: 1,
    paddingLeft: Space.space2,
  },
  commentWithoutByline: {
    paddingTop: Font.size2.lineHeight / 3,
    paddingLeft: Space.space3 + AccountAvatarSmall.size + Space.space2,
    paddingRight: Space.space3,
  },
});
