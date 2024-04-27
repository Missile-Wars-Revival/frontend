import * as React from "react";
import { TextInput, View, TextInputProps } from "react-native";
import { ReactNode } from "react";
import { cn } from "../util/cn";

interface InputProps extends TextInputProps {
  icon?: ReactNode;
  className?: string;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <View className={`flex-row items-center ${className}`}>
        {icon && (
          <View className="absolute inset-y-0 left-2 flex items-center justify-center">
            {icon}
          </View>
        )}
        <TextInput
          ref={ref}
          className={`border-[1.5px] border-black rounded-md p-2 w-full pl-8 ${className}`}
          {...props}
        />
      </View>
    );
  }
);

Input.displayName = "Input";

export { Input };
