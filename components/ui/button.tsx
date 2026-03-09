import { LinearGradient } from "expo-linear-gradient";
import React, { forwardRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { GRADIENTS, PS_COLORS } from "@/constants/colors";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "unstyled";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends PressableProps {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      label,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      style,
      labelStyle,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => {
    const isPrimary = variant === "primary";
    const isUnstyled = variant === "unstyled";

    const content = (
      <View style={[styles.content, size === "icon" && styles.contentIcon]}>
        {isLoading ? (
          <ActivityIndicator
            color={isPrimary ? "#fff" : PS_COLORS.blue}
            size="small"
          />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            {label ? (
              <Text
                style={[
                  styles.label,
                  styles[`label_${variant}`],
                  styles[`label_${size}`],
                  labelStyle,
                ]}
              >
                {label}
              </Text>
            ) : (
              children
            )}
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
        )}
      </View>
    );

    if (isUnstyled) {
      return (
        <Pressable
          ref={ref}
          disabled={disabled || isLoading}
          style={({ pressed }) => [style, pressed && styles.pressed]}
          {...props}
        >
          {content}
        </Pressable>
      );
    }

    return (
      <Pressable
        ref={ref}
        disabled={disabled || isLoading}
        style={({ pressed }) => [
          styles.base,
          styles[`variant_${variant}`],
          styles[`size_${size}`],
          (disabled || isLoading) && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
        {...props}
      >
        {isPrimary ? (
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, styles.gradient]}
          >
            {content}
          </LinearGradient>
        ) : (
          content
        )}
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    height: "100%",
    width: "100%",
  },
  contentIcon: {
    paddingHorizontal: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },

  // Variants
  variant_primary: {
    height: 52,
  },
  variant_secondary: {
    height: 52,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  variant_outline: {
    height: 52,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: PS_COLORS.blue,
  },
  variant_ghost: {
    height: 52,
    backgroundColor: "transparent",
  },
  variant_unstyled: {},

  // Sizes
  size_sm: { height: 36 },
  size_md: { height: 52 },
  size_lg: { height: 60 },
  size_icon: { width: 52, height: 52, paddingHorizontal: 0 },

  // Label Variants
  label_primary: { color: "#fff" },
  label_secondary: { color: "#fff" },
  label_outline: { color: PS_COLORS.blue },
  label_ghost: { color: PS_COLORS.blue },
  label_unstyled: { color: "#fff" },

  // Label Sizes
  label_sm: { fontSize: 14 },
  label_md: { fontSize: 16 },
  label_lg: { fontSize: 18 },
  label_icon: { fontSize: 0 },
});
