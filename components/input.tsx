import * as React from "react";
import { TextInput } from "react-native";

import { cn } from "../util/cn";

const Input = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  React.ComponentPropsWithoutRef<typeof TextInput>
>(({ className, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      className={cn(
        "border-[1.5px] border-black rounded-md p-2 w-full ",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
