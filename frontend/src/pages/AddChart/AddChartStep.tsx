import { ScrollArea } from "@mantine/core";
import type { ReactNode } from "react";

interface AddChartStepProps {
  children: ReactNode;
}
export function AddChartStep(props: AddChartStepProps) {
  return (
    <ScrollArea.Autosize p={"sm"} mah={600} mx="auto">
      {props.children}
    </ScrollArea.Autosize>
  );
}
