import * as React from "react";
import { TextInput, View, TextInputProps, StyleSheet } from "react-native";
import { ReactNode } from "react";

interface InputProps extends TextInputProps {
  icon?: ReactNode;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ style, icon, ...props }, ref) => {
    return (
      <View style={styles.container}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput ref={ref} style={[styles.input, style]} {...props} />
      </View>
    );
  }
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  input: {
    borderWidth: 2.5,
    borderColor: "#000",
    borderRadius: 6,
    padding: 8,
    width: "100%",
    paddingLeft: 32,
  },
});

export { Input };
