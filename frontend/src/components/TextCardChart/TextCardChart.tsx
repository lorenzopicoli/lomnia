import { Container, Flex, Text } from "@mantine/core";

interface TextCardChartProps {
  value: string | number;
  title?: string;
  unit?: string;
  description?: string;
}

export function TextCardChart(props: TextCardChartProps) {
  const { title, description, value, unit } = props;
  return (
    <Flex
      ta={"center"}
      w={"100%"}
      h={"100%"}
      align={"center"}
      justify={"center"}
      component={Container}
      fluid
      direction={"column"}
      gap={"sm"}
    >
      {title ? <Text size="sm">{title}</Text> : null}
      <Flex ta={"center"} align={"center"} justify={"center"} component={Container} fluid>
        <Text fw={"bold"} fz={50}>
          {value + (unit ?? "")}
        </Text>
      </Flex>
      {description ? <Text size="sm">{description}</Text> : null}
    </Flex>
  );
}
