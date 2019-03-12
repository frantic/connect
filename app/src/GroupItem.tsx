import React, {ReactNode} from "react";
import {StyleSheet, View} from "react-native";
import {Account} from "./MockData";
import {AccountSignature} from "./AccountSignature";
import {Color} from "./atoms";

export function GroupItem({
  account,
  children,
}: {
  account: Account;
  children: ReactNode;
}) {
  return (
    <View style={styles.item}>
      <AccountSignature account={account}>{children}</AccountSignature>
    </View>
  );
}

GroupItem.height = AccountSignature.minHeight;

const styles = StyleSheet.create({
  item: {
    height: GroupItem.height,
    backgroundColor: Color.white,
  },
});