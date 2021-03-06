import * as Color from "./Color";
import * as Font from "./Font";
import {TextProps as NativeTextProps, StyleSheet, Text} from "react-native";
import React from "react";

interface TextProps extends NativeTextProps {
  readonly children: React.Node;
}

/**
 * Used for body copy. The main content of a page often written by the users
 * of our application.
 *
 * We use a serif font for body text which goes a bit against the modern
 * sans-serif style in tech. Some would argue that serif fonts are better for
 * legibility when reading long blocks of text. This is a contributing factor
 * to why we picked a serif font. Mostly, we want to define a unique visual
 * style for our product. One that distinguishes us from products like Slack
 * and Facebook. The easiest place to start is with the font.
 */
export function BodyText(props: TextProps) {
  return <Text {...props} style={[props.style, styles.body]} />;
}

/**
 * Italic text within `<BodyText>`.
 */
export function BodyItalicText(props: TextProps) {
  return (
    <Text {...props} style={[props.style, styles.body, styles.bodyItalic]} />
  );
}

/**
 * A link inside of `<BodyText>`.
 */
export function BodyLinkText(props: TextProps) {
  return <Text {...props} style={[props.style, styles.body, styles.link]} />;
}

/**
 * Some information label in our UI. The same size and font of body text, a
 * smaller line height, limited to a single line, and bold.
 */
export function LabelText(props: TextProps) {
  return (
    <Text {...props} style={[props.style, styles.label]} numberOfLines={1} />
  );
}

/**
 * The title of a piece of content. This text is large and proud.
 */
export function TitleText(props: TextProps) {
  return <Text {...props} style={[props.style, styles.title]} />;
}

/**
 * Text used to decorate a UI with metadata. This has the smallest of all
 * text sizes.
 */
export function MetaText(props: TextProps) {
  return (
    <Text {...props} style={[props.style, styles.meta]} numberOfLines={1} />
  );
}

/**
 * Meta text with the styling of a link.
 */
export function MetaLinkText(props: TextProps) {
  return <Text {...props} style={[props.style, styles.meta, styles.link]} />;
}

const styles = StyleSheet.create({
  body: {
    color: Color.grey8,
    ...Font.serif,
    ...Font.size2,
  },
  bodyItalic: {
    ...Font.serifItalic,
  },
  label: {
    color: Color.black,
    ...Font.serifBold,
    ...Font.size2,
  },
  title: {
    color: Color.black,
    ...Font.sansBold,
    ...Font.size4,
  },
  meta: {
    color: Color.grey6,
    ...Font.sans,
    ...Font.size0,
  },
  link: {
    color: Color.blue5,
    textDecorationLine: "underline",
  },
});
