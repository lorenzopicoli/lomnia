import { Button, Container, Flex, ScrollArea, Space, Stepper } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAdjustments, IconChartArrowsVertical } from "@tabler/icons-react";
import { subYears } from "date-fns/subYears";
import { useState } from "react";
import { type ChartAreaConfig, type ChartId, ChartSource } from "../../charts/types";
import { useAvailableCharts } from "../../charts/useAvailableCharts";
import { availableCharts, ChartDisplayer } from "../ChartDisplayer/ChartDisplayer";
import { AddChartId } from "./AddChartId";
import { AddChartPlaceholder } from "./AddChartPlaceholder";
import { AddChartSource } from "./AddChartSource";
import { AddChartStepper } from "./AddChartStepper";

export type AddChartProps = {
  onSave: (chart: ChartAreaConfig) => void;
  onDismiss: () => void;
};

export type AddChartFormValues = {
  source: ChartSource;
  chartId: ChartId | null;
};

const initialSource = ChartSource.Weather;
export function AddChart(props: AddChartProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { availableKeys } = useAvailableCharts();
  const form = useForm<AddChartFormValues>({
    mode: "uncontrolled",
    initialValues: {
      source: initialSource,
      chartId: availableCharts.find((chart) => chart.sources.includes(initialSource))?.id ?? null,
    },

    validate: (values) => {
      if (currentStep === 0) {
        if (!values.source) {
          return { missingSource: "Missing source" };
        }
      }
      if (currentStep === 1) {
        if (!values.chartId) {
          return { missingChartId: "Select a chart" };
        }
      }

      return {};
    },
  });

  const startDate = subYears(new Date(), 1);
  const endDate = new Date();
  const values = form.getValues();

  const nextStep = () => {
    if (form.validate().hasErrors) {
      return;
    }

    if (currentStep < 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    if (!values.chartId) {
      return;
    }

    // This should be on submit
    props.onSave({ id: values.chartId });
  };
  const previousStep = () => {
    if (currentStep === 0) {
      props.onDismiss();
      return;
    }

    setCurrentStep(currentStep - 1);
  };
  if (!availableKeys) {
    return <>Loading...</>;
  }

  return (
    <>
      <Space h={50} />
      <Flex w="100%" p={0} gap={"lg"}>
        <Container w={"40%"}>
          <form>
            <AddChartStepper active={currentStep} size="sm">
              {/* Step 1 */}
              <Stepper.Step icon={<IconAdjustments height="17px" width="17px" />}>
                <ScrollArea h="70vh">
                  <AddChartSource sources={Object.values(ChartSource)} form={form} />
                </ScrollArea>
              </Stepper.Step>

              {/* Step 2 */}
              <Stepper.Step icon={<IconChartArrowsVertical height="17px" width="17px" />}>
                <ScrollArea h="70vh">
                  <AddChartId form={form} />
                </ScrollArea>
              </Stepper.Step>
            </AddChartStepper>
            <Space h={"md"} />
            <Flex align={"flex-end"} justify={"flex-end"} gap={"sm"}>
              <Button onClick={previousStep} variant="light" size="md">
                {currentStep === 0 ? "Exit" : "Back"}
              </Button>
              <Button onClick={nextStep} variant="light" size="md">
                {currentStep === 0 ? "Next" : "Save"}
              </Button>
            </Flex>
          </form>
        </Container>
        <Container fluid flex={1}>
          {values.chartId && currentStep === 1 ? (
            <ChartDisplayer chartId={values.chartId} startDate={startDate} endDate={endDate} aggPeriod={"day"} />
          ) : (
            <AddChartPlaceholder />
          )}
        </Container>
      </Flex>
    </>
  );
}
