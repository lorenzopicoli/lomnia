import { Stepper, rem, type StepperProps } from "@mantine/core";

export function AddChartStepper(props: StepperProps) {
  return (
    <Stepper
      styles={{
        stepBody: {
          display: "none",
        },
        separator: {
          marginLeft: rem(-2),
          marginRight: rem(-2),
          height: rem(1),
        },
      }}
      {...props}
    />
  );
}
