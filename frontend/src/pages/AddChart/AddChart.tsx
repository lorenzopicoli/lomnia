import { Button, Container, Flex, Space, Stepper } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconChartAreaLine, IconCloud, IconPencilCog } from "@tabler/icons-react";
import { subYears } from "date-fns/subYears";
import { useMemo, useState } from "react";
import { v4 } from "uuid";
import { availableCharts, type ChartAreaConfig, type ChartId, ChartSource } from "../../charts/types";
import { ChartDisplayer } from "../../components/ChartDisplayer/ChartDisplayer";
import { ChartFeatures } from "../../components/ChartFeatures/ChartFeatures";
import { ChartPlaceholder } from "../../components/ChartPlaceholder/ChartPlaceholder";
import { useDashboard } from "../../contexts/DashboardContext";
import { AddChartId } from "./AddChartId";
import { AddChartSource } from "./AddChartSource";
import { AddChartStep } from "./AddChartStep";
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
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === 2;

  return (
    <form>
      <Space h={50} />
      <Flex w="100%" p={0} gap={"sm"}>
        <Container maw={"100%"} miw={"30%"} flex={0}>
          <AddChartStepper active={currentStep}>
            {/* Step 1 */}
            <Stepper.Step icon={<IconCloud height={stepperIconSize} width={stepperIconSize} />}>
              <AddChartStep>
                <AddChartSource sources={Object.values(ChartSource)} form={form} />
              </AddChartStep>
            </Stepper.Step>

            {/* Step 2 */}
            <Stepper.Step icon={<IconChartAreaLine height={stepperIconSize} width={stepperIconSize} />}>
              <AddChartStep>
                <AddChartId form={form} />
              </AddChartStep>
            </Stepper.Step>

            {/* Step 3 */}
            <Stepper.Step icon={<IconPencilCog height={stepperIconSize} width={stepperIconSize} />}>
              <AddChartStep>
                {values.chartId ? <ChartFeatures form={form} chartId={values.chartId} /> : null}
              </AddChartStep>
            </Stepper.Step>
          </AddChartStepper>

          {/* Back / Next */}
          <Flex pr={"sm"} pl={"sm"} align={"flex-end"} justify={"flex-end"} gap={"sm"}>
            <Button onClick={previousStep} variant="light" size="md">
              {isFirstStep ? "Exit" : "Back"}
            </Button>
            <Button flex={1} onClick={nextStep} variant="filled" size="md">
              {isLastStep ? "Save" : "Next"}
            </Button>
          </Flex>
        </Container>

        {/* Preview */}
        <Container mt={65} maw={"100%"} flex={1}>
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
