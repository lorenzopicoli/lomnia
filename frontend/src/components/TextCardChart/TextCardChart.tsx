import { Container, Flex, Text } from "@mantine/core";

export interface TextCardChartProps {
  value: string | number;
  title?: string;
  unit?: string;
  description?: string;
}

export function TextCardChart(props: TextCardChartProps) {
  const { title, description, value, unit } = props;
  return (
    <Flex component={Container} fluid gap={"sm"}>
      {title ? <Text size="md">{title}</Text> : null}
      <Text size="lg">{value + (unit ?? "")}</Text>
      <Text size="sm">{description}</Text>
    </Flex>
  );
}
