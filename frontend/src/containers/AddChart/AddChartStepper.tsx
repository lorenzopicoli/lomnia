import { Stepper, type StepperProps } from "@mantine/core";

export function AddChartStepper(props: StepperProps) {
  return (
    <Stepper
      styles={{
        stepBody: {
          display: "none",
        },
      }}
      {...props}
    />
  );
}
