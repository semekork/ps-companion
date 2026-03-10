import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import React from "react";

export default function TabLayout() {
  return (
    <NativeTabs tintColor="#0070D1">
      <NativeTabs.Trigger name="index">
        <Icon
          sf="house.fill"
          androidSrc={<VectorIcon family={MaterialIcons} name="home" />}
        />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="library">
        <Icon
          sf="gamecontroller.fill"
          androidSrc={
            <VectorIcon family={MaterialIcons} name="sports-esports" />
          }
        />
        <Label>Library</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role="search">
        <Icon
          sf="magnifyingglass"
          androidSrc={<VectorIcon family={MaterialIcons} name="search" />}
        />
        <Label>Search</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="trophies">
        <Icon
          sf="trophy.fill"
          androidSrc={<VectorIcon family={MaterialIcons} name="emoji-events" />}
        />
        <Label>Trophies</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="friends">
        <Icon
          sf="person.2.fill"
          androidSrc={<VectorIcon family={MaterialIcons} name="group" />}
        />
        <Label>Friends</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
