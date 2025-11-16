import { Button, Container, Flex, Pill, PillGroup, Stepper, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconAdjustments, IconChartArrowsVertical, IconPresentation } from "@tabler/icons-react";
import { subYears } from "date-fns/subYears";
import { uniqBy } from "lodash";
import { useState } from "react";
import {
  type aggregationFunctions,
  type aggregationPeriods,
  type ChartAreaConfig,
  ChartSource,
  stringToChartSource,
} from "../../../charts/charts";
import { useAvailableCharts } from "../../../charts/useAvailableCharts";
import { getKeys } from "../../../utils/getKeys";
import { GenericChartContainer } from "../SimpleChart/GenericChartContainer";
import styles from "./AddCustomChart.module.css";
import { AddCustomChartGeneralConfig } from "./AddCustomChartGeneralConfig";
import { AddCustomChartShapePicker } from "./AddCustomChartShapePicker";
import { AddCustomChartSources } from "./AddCustomChartSources";
import { AddCustomChartStepper } from "./AddCustomChartStepper";

export type AddCustomChartProps = {
  opened: boolean;
  onSave: (chart: ChartAreaConfig) => void;
};

export type AddCustomChartFormValues = {
  sources: { [key in ChartSource]: boolean };
  xKey: string;
  aggregation: {
    period: (typeof aggregationPeriods)[number] | null;
    fun: (typeof aggregationFunctions)[number] | null;
  } | null;
  shapes: Array<
    ChartAreaConfig["shapes"][number] & {
      label: string;
    }
  >;
};

export function AddCustomChart(props: AddCustomChartProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wantsToAggregate, { toggle: toggleWantsToAggregate }] = useDisclosure(false);
  const { availableKeys } = useAvailableCharts();
  const form = useForm<AddCustomChartFormValues>({
    mode: "uncontrolled",
    initialValues: {
      sources: {
        [ChartSource.Weather]: false,
        [ChartSource.Habit]: false,
        [ChartSource.HeartRate]: false,
      },
      xKey: "",
      aggregation: {
        period: null,
        fun: null,
      },
      shapes: [],
    },

    validate: (values) => {
      if (currentStep === 0) {
        if (!Object.values(values.sources).some((v) => v)) {
          return { missingSource: "Missing source" };
        }
        if (!values.xKey) {
          return { missingXKey: "Missing xKey" };
        }
      }

      return {};
    },
  });

  const startDate = subYears(new Date(), 1);
  const endDate = new Date();
  const values = form.getValues();
  const aggregationFun = values.aggregation?.fun;
  const aggregationPeriod = values.aggregation?.period;
  const currentChart: ChartAreaConfig = {
    id: `${values.xKey}-${values.shapes.map((s) => s.yKey)}${crypto.randomUUID()}`,
    xKey: values.xKey.split("-")[1],
    aggregation: aggregationFun && aggregationPeriod ? { fun: aggregationFun, period: aggregationPeriod } : undefined,
    shapes: values.shapes.map((s, i) => ({
      ...s,
      isMain: i === 0,
    })),
    title: `${values.xKey}/${values.shapes.map((s) => s.yKey)}`,
  };
  const nextStep = () => {
    if (form.validate().hasErrors) {
      return;
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // This should be on submit
    props.onSave(currentChart);
  };
  const previousStep = () => {
    if (currentStep === 0) {
      return;
    }

    setCurrentStep(currentStep - 1);
  };
  if (!availableKeys) {
    return <>Loading...</>;
  }

  return (
    <Container p={0}>
      <form>
        <AddCustomChartStepper active={currentStep} size="sm">
          {/* Step 1 */}
          <Stepper.Step icon={<IconAdjustments height="17px" width="17px" />}>
            <AddCustomChartSources sources={Object.values(ChartSource)} form={form} />
            {Object.values(form.getValues().sources).some((v) => v) && availableKeys.xKeys ? (
              <AddCustomChartGeneralConfig
                form={form}
                xKeys={availableKeys.xKeys}
                selectedSources={getKeys(form.getValues().sources).filter((s) => form.getValues().sources[s])}
                showAggregationOptions={wantsToAggregate}
                toggleWantsToAggregate={toggleWantsToAggregate}
              />
            ) : null}
          </Stepper.Step>

          {/* Step 2 */}
          <Stepper.Step icon={<IconChartArrowsVertical height="17px" width="17px" />}>
            <Text pt={"xl"}>Add as many features as you want to analyze</Text>
            <Text className={styles.sourceCheckboxDescription}>
              The chart will expand the X/Y axis to fit the content. So make sure to pick things with similar orders of
              magnitude
            </Text>

            <AddCustomChartShapePicker
              onAdd={(added) =>
                form.setFieldValue("shapes", (prev) =>
                  uniqBy([...prev, ...added], (item) => `${item.yKey}-${item.source}`),
                )
              }
              data={getKeys(availableKeys.yKeys)
                .filter((s) => form.getValues().sources[s])
                .flatMap((key) =>
                  availableKeys.yKeys[key].map((item) => ({
                    yKey: item.key,
                    label: item.label,
                    source: stringToChartSource(key),
                  })),
                )}
            />
            <Text pt={"xl"}>Charts added:</Text>
            <PillGroup>
              {form.getValues().shapes.map((shape) => (
                <Pill key={shape.id} withRemoveButton>{`${shape.label} (${shape.source} - ${shape.type})`}</Pill>
              ))}
            </PillGroup>
          </Stepper.Step>

          {/* Step 3 */}
          <Stepper.Step icon={<IconPresentation height="17px" width="17px" />}>
            <Container w={"100%"} h={500}>
              <GenericChartContainer chart={currentChart} startDate={startDate} endDate={endDate} />
            </Container>
          </Stepper.Step>
        </AddCustomChartStepper>

        <Flex align={"space-between"} justify={"space-between"}>
          <Button onClick={previousStep} variant="light">
            Back
          </Button>
          <Button onClick={nextStep} variant="light">
            Next
          </Button>
        </Flex>
      </form>
    </Container>
  );
}
