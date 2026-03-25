import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";

const { Icon, Label, VectorIcon } = NativeTabs.Trigger;

export default function TabLayout() {
  return (
    <NativeTabs tintColor="#0070D1">
      <NativeTabs.Trigger name="index">
        <Icon
          sf="house.fill"
          src={<VectorIcon family={MaterialIcons} name="home" />}
        />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="library">
        <Icon
          sf="gamecontroller.fill"
          src={<VectorIcon family={MaterialIcons} name="sports-esports" />}
        />
        <Label>Library</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role="search">
        <Icon
          sf="magnifyingglass"
          src={<VectorIcon family={MaterialIcons} name="search" />}
        />
        <Label>Search</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="deals">
        <Icon
          sf="tag.fill"
          src={<VectorIcon family={MaterialIcons} name="local-offer" />}
        />
        <Label>Deals</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="trophies">
        <Icon
          sf="trophy.fill"
          src={<VectorIcon family={MaterialIcons} name="emoji-events" />}
        />
        <Label>Trophies</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="friends">
        <Icon
          sf="person.2.fill"
          src={<VectorIcon family={MaterialIcons} name="group" />}
        />
        <Label>Friends</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
