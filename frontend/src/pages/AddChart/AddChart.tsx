import { Button, Container, Flex, ScrollArea, Select, Space, Stepper, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconChartAreaLine, IconCloud, IconPencilCog } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { subYears } from "date-fns/subYears";
import { useMemo, useState } from "react";
import { v4 } from "uuid";
import { trpc } from "../../api/trpc";
import {
  availableCharts,
  type ChartAreaConfig,
  type ChartId,
  ChartSource,
  chartParamByChartId,
} from "../../charts/types";
import { ChartDisplayer } from "../../components/ChartDisplayer/ChartDisplayer";
import { ChartPlaceholder } from "../../components/ChartPlaceholder/ChartPlaceholder";
import { useDashboard } from "../../contexts/DashboardContext";
import { AddChartId } from "./AddChartId";
import { AddChartSource } from "./AddChartSource";
import { AddChartStepper } from "./AddChartStepper";

type AddChartProps = {
  onSave: (chart: ChartAreaConfig) => void;
  onDismiss: () => void;
};

export type AddChartFormValues = {
  source: ChartSource;
  chartId: ChartId | null;
  habitKey?: string;
  countKey?: string;
  title: string;
};

const initialSource = ChartSource.Weather;
export function AddChart(props: AddChartProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { aggPeriod } = useDashboard();

  const { data: habitKeysData } = useQuery(trpc.habits.getKeys.queryOptions());
  const { data: countKeysData } = useQuery(trpc.charts.counts.getCountKeys.queryOptions());

  // Form is controlled so it's easier to fetch updated values for chart title and habit keys
  // could change for uncontrolled if that's figured out
  const form = useForm<AddChartFormValues>({
    initialValues: {
      source: initialSource,
      chartId: availableCharts.find((chart) => chart.sources.includes(initialSource))?.id ?? null,
      title: "",
    },

    validate: (values) => {
      if (currentStep === 0) {
        if (!values.source) {
          return { missingSource: "Missing source" };
        }
      }
      if (currentStep === 2) {
        if (!values.chartId) {
          return { missingChartId: "Select a chart" };
        }
        if (!values.title) {
          return { missingChartId: "Choose a title" };
        }
      }

      return {};
    },
  });

  const startDate = useMemo(() => subYears(new Date(), 1), []);
  const endDate = useMemo(() => new Date(), []);
  const values = form.getValues();

  const nextStep = () => {
    if (form.validate().hasErrors) {
      return;
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      return;
    }

    if (!values.chartId) {
      return;
    }
    const chart = availableCharts.find((chart) => chart.id === values.chartId);

    if (!chart) {
      throw new Error("Couldn't match chart to chart id");
    }

    const chartToSave: ChartAreaConfig = {
      id: values.chartId,
      uniqueId: v4(),
      habitKey: values.habitKey,
      countKey: values.countKey,
      title: values.title,
    };

    // This should be on submit
    props.onSave(chartToSave);
  };
  const previousStep = () => {
    if (currentStep === 0) {
      props.onDismiss();
      return;
    }

    setCurrentStep(currentStep - 1);
  };

  const stepperIconSize = 17;
  const chartPreviewHeight = 400;

  return (
    <form>
      <Space h={50} />
      <Flex w="100%" p={0} gap={"sm"}>
        <Container maw={"100%"} miw={"30%"} flex={0}>
          <AddChartStepper active={currentStep} size="sm">
            {/* Step 1 */}
            <Stepper.Step icon={<IconCloud height={stepperIconSize} width={stepperIconSize} />}>
              <ScrollArea p={"sm"} h="70vh">
                <AddChartSource sources={Object.values(ChartSource)} form={form} />
              </ScrollArea>
            </Stepper.Step>

            {/* Step 2 */}
            <Stepper.Step icon={<IconChartAreaLine height={stepperIconSize} width={stepperIconSize} />}>
              <ScrollArea p={"sm"} h="70vh">
                <AddChartId form={form} />
              </ScrollArea>
            </Stepper.Step>

            {/* Step 3 */}
            <Stepper.Step icon={<IconPencilCog height={stepperIconSize} width={stepperIconSize} />}>
              <ScrollArea p={"sm"} h="70vh">
                <Flex direction={"column"} gap={"md"} pb={"md"}>
                  <TextInput flex={1} label="Title" withAsterisk {...form.getInputProps("title", { type: "input" })} />
                  {values.chartId
                    ? chartParamByChartId[values.chartId].map((feature) => {
                        switch (feature) {
                          case "countKey":
                            return (
                              <Select
                                key={feature}
                                label="What to count"
                                withAsterisk
                                data={countKeysData?.map((k) => ({ value: k, label: k })) ?? []}
                                searchable
                                {...form.getInputProps("countKey", { type: "input" })}
                              />
                            );
                          case "habitKey":
                            return (
                              <Select
                                key={feature}
                                label="Habit"
                                withAsterisk
                                data={habitKeysData?.numeric.map((hk) => ({ value: hk.key, label: hk.label })) ?? []}
                                searchable
                                {...form.getInputProps("habitKey", { type: "input" })}
                              />
                            );
                        }
                      })
                    : null}
                </Flex>
              </ScrollArea>
            </Stepper.Step>
          </AddChartStepper>

          <Space h={"md"} />
          <Flex align={"flex-end"} justify={"flex-end"} gap={"sm"}>
            <Button onClick={previousStep} variant="light" size="md">
              {currentStep === 0 ? "Exit" : "Back"}
            </Button>
            <Button onClick={nextStep} variant="light" size="md">
              {currentStep === 2 ? "Save" : "Next"}
            </Button>
          </Flex>
        </Container>
        <Container maw={"100%"} flex={1}>
          <Container fluid h={chartPreviewHeight} flex={1}>
            {values.chartId && currentStep > 0 ? (
              <ChartDisplayer
                chartId={values.chartId}
                habitKey={values.habitKey}
                countKey={values.countKey}
                title={values.title || "Title"}
                startDate={startDate}
                endDate={endDate}
                aggPeriod={aggPeriod}
              />
            ) : (
              <ChartPlaceholder text="Nothing to display yet" subText="Continue to see a preview of your chart here" />
            )}
          </Container>
        </Container>
      </Flex>
    </form>
  );
}
