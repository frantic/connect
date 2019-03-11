import * as MockData from "./MockData";
import {
  Animated,
  Platform,
  SectionList,
  SectionListData,
  StyleSheet,
  View,
} from "react-native";
import {Border, Color, Shadow, Space} from "./atoms";
import {InboxItem, Post} from "./MockData";
import React, {useState} from "react";
import {GroupBanner} from "./GroupBanner";
import {GroupItemFeed} from "./GroupItemFeed";
import {GroupItemInbox} from "./GroupItemInbox";
import {GroupPostPrompt} from "./GroupPostPrompt";
import {GroupSectionHeader} from "./GroupSectionHeader";

const currentAccount = MockData.calebMeredith;

// NOTE: `Animated.SectionList` is typed as `any` so give it a proper type!
const AnimatedSectionList: SectionList<
  unknown
> = Animated.createAnimatedComponent(SectionList);

export function Group() {
  const groupTitle = "Definitely Work";

  // On iOS you can scroll up which results in a negative value for `scrollY`.
  // When that happens we want to scale up our group banner so that it
  // fills in the extra space. That’s what the `bannerScale` value is for. It
  // translates a negative scroll offset into a scale transformation.
  //
  // There’s some weirdness on iOS where where `scrollY` starts at some negative
  // value like -44 on an iPhone X instead of 0, so we record the first value of
  // `scrollY` and use it as an offset.
  const [scrollY] = useState(new Animated.Value(0));
  const [offsetScrollY, setOffsetScrollY] = useState<null | number>(null);
  const bannerScale =
    offsetScrollY === null
      ? 1
      : scrollY.interpolate({
          inputRange: [-GroupBanner.height, 0].map(y => y + offsetScrollY),
          outputRange: [2.7, 1], // NOTE: I would expect this number to be 2 and not 2.7, but experimental evidence proves otherwise.
          extrapolateLeft: "extend",
          extrapolateRight: "clamp",
        });

  const inboxSection: SectionListData<InboxItem> = {
    title: "Inbox",
    data: MockData.inbox,
    keyExtractor: item => String(item.id),
    renderItem: ({item}) => <GroupItemInbox item={item} />,
  };

  const feedSection: SectionListData<Post> = {
    title: "Feed",
    data: [...MockData.feed, ...MockData.feed, ...MockData.feed].map(
      (item, id) => ({...item, id}),
    ),
    keyExtractor: item => String(item.id),
    renderItem: ({item}) => <GroupItemFeed post={item} />,
  };

  return (
    <View style={styles.container}>
      {/* The banner which exists in the background of the view. */}
      <Animated.View
        // TODO: Scale background only instead of background and text? Only do
        // this when we have a background image to test against.
        style={[styles.banner, {transform: [{scale: bannerScale}]}]}
      >
        <GroupBanner title={groupTitle} />
      </Animated.View>

      {/* All the scrollable content in the group. This is a scroll view which
       * will scroll above the group banner. */}
      <AnimatedSectionList
        // Data stuff:
        sections={[inboxSection, feedSection] as any}
        // Layout stuff:
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <GroupPostPrompt account={currentAccount} />
            </View>
            <GroupSectionSeparator isLeading />
          </>
        }
        ListFooterComponent={<View style={styles.footer} />}
        ItemSeparatorComponent={GroupItemSeparator}
        stickySectionHeadersEnabled
        renderSectionHeader={({section: {title}}) => (
          <>
            <GroupSectionHeader title={title} />
            <GroupItemSeparator />
          </>
        )}
        SectionSeparatorComponent={({leadingItem, trailingSection}) => {
          return leadingItem && trailingSection ? (
            <>
              <GroupSectionSeparator isTrailing />
              <GroupSectionSeparator isLeading />
            </>
          ) : leadingItem ? (
            <GroupSectionSeparator isTrailing />
          ) : null;
        }}
        // Scroll event stuff:
        scrollEventThrottle={1}
        onScrollBeginDrag={event => {
          if (offsetScrollY === null) {
            setOffsetScrollY(event.nativeEvent.contentOffset.y);
          }
        }}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: Platform.OS !== "web"},
        )}
      />
    </View>
  );
}

function GroupItemSeparator() {
  return <View style={styles.separator} />;
}

function GroupSectionSeparator({
  isLeading,
  isTrailing,
}: {
  isLeading?: boolean;
  isTrailing?: boolean;
}) {
  return (
    <View style={styles.sectionSeparator}>
      {isLeading && <View style={styles.sectionSeparatorShadowLeading} />}
      {isTrailing && <View style={styles.sectionSeparatorShadowTrailing} />}
    </View>
  );
}

const backgroundColor = Color.grey0;
const sectionMargin = Space.space6;

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    flex: 1,
    position: "relative",
    width: "100%",
    maxWidth: GroupBanner.maxWidth,
    backgroundColor,
  },
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    marginTop: GroupBanner.height,
    paddingBottom: sectionMargin / 2,
    backgroundColor,
  },
  footer: {
    marginTop: sectionMargin / 2,
  },
  separator: {
    height: Border.width1,
    backgroundColor: "hsl(0, 0%, 90%)",
  },
  sectionSeparator: {
    overflow: "hidden",
    height: sectionMargin / 2,
    backgroundColor,
  },
  sectionSeparatorShadowLeading: {
    position: "relative",
    top: sectionMargin / 2,
    height: sectionMargin / 2,
    backgroundColor: "white",
    ...Shadow.elevation1,
  },
  sectionSeparatorShadowTrailing: {
    position: "relative",
    top: -sectionMargin / 2,
    height: sectionMargin / 2,
    backgroundColor: "white",
    ...Shadow.elevation1,
  },
});
