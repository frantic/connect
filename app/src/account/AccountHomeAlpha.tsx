import {
  BodyLinkText,
  BodyText,
  Color,
  MetaLinkText,
  Space,
  TitleText,
} from "../atoms";
import {GroupCache, GroupSlugCache} from "../group/GroupCache";
import {GroupRoute, SignInRoute} from "../router/AllRoutes";
import React, {useEffect, useState} from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {API} from "../api/API";
import {ErrorAlert} from "../frame/ErrorAlert";
import {Group} from "@connect/api-client";
import {Route} from "../router/Route";
import {useCurrentAccount} from "./AccountCache";

export function AccountHomeAlpha({route}: {route: Route}) {
  const account = useCurrentAccount();
  const [groups, setGroups] = useState<null | ReadonlyArray<Group>>(null);

  function handleSignOut() {
    API.account
      .signOut({refreshToken: "" as any}) // NOTE: sign-out is handled by our native/web API proxy.
      .then(() => route.nativeSwapRoot(SignInRoute, {}));
  }

  // Loads all the groups the current account is a member of...
  useEffect(() => {
    API.account
      .getCurrentGroupMemberships()
      .then(({groups}) => {
        groups.forEach(group => {
          GroupCache.insert(group.id, group);
          GroupSlugCache.insert(group.id, group.id);
          if (group.slug) GroupSlugCache.insert(group.slug, group.id);
        });
        setGroups(groups);
      })
      .catch(error => {
        ErrorAlert.alert("Could not get your group memberships", error);
      });
  }, []);

  return (
    <ScrollView style={styles.scrollView}>
      <SafeAreaView>
        <View style={styles.container}>
          {/* Account section */}
          <TitleText>Account</TitleText>
          <View style={styles.spacerSmall} />
          <BodyText>Hello {account.name}</BodyText>
          <TouchableOpacity onPress={handleSignOut}>
            <MetaLinkText>Sign Out</MetaLinkText>
          </TouchableOpacity>
          <View style={styles.spacerLarge} />

          {/* Group memberships section */}
          <TitleText>Groups</TitleText>
          <View style={styles.spacerSmall} />
          {groups === null ? (
            <BodyText>Loading...</BodyText>
          ) : groups.length === 0 ? (
            <BodyText>
              You aren’t a member of any groups 😔{"\n"}Ask for an invite!
            </BodyText>
          ) : (
            <BodyText>
              {groups.map(group => (
                <BodyText key={group.id}>
                  •{" "}
                  <TouchableOpacity
                    onPress={() =>
                      route.push(GroupRoute, {
                        groupSlug: group.slug || group.id,
                      })
                    }
                  >
                    <BodyLinkText>{group.name}</BodyLinkText>
                  </TouchableOpacity>
                  {"\n"}
                </BodyText>
              ))}
            </BodyText>
          )}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Color.white,
  },
  container: {
    padding: Space.space3,
  },
  spacerSmall: {
    height: Space.space0,
  },
  spacerLarge: {
    height: Space.space5,
  },
});