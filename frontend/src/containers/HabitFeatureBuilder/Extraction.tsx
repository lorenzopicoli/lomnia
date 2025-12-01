import { ActionIcon, alpha, Flex, Select, Stack, Text, TextInput } from "@mantine/core";
import { IconArrowRightCircle, IconTrash } from "@tabler/icons-react";
import { DashedButton } from "../../components/DashedButton/DashedButton";
import { useConfig } from "../../contexts/ConfigContext";
import { isNumber } from "../../utils/isNumber";
import type { HabitFeatureExtraction } from "./types";

export function Extraction(props: {
  extraction: HabitFeatureExtraction;
  onExtractionChanged: (extraction: HabitFeatureExtraction) => void;
}) {
  const { extraction, onExtractionChanged } = props;
  const { theme } = useConfig();

  const handleTypeChanged = (value: string | null) => {
    const newType = (value as any) ?? "constant";
    onExtractionChanged({
      ...extraction,
      constantValue: newType === "constant" ? extraction.constantValue : undefined,
      mapping: newType === "map_values" ? (extraction.mapping ?? {}) : undefined,
      mappingFallbackTo: newType === "map_values" ? extraction.mappingFallbackTo : undefined,
      type: newType,
    });
  };

  const formatValue = (raw: string) => {
    let parsed: string | number | boolean = raw;

    if (raw === "true") {
      parsed = true;
    } else if (raw === "false") {
      parsed = false;
    } else if (isNumber(+raw)) {
      parsed = +raw;
    }
    return parsed;
  };

  console.log("rule", extraction);
  const handleConstantChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    console.log("r", formatValue(raw), typeof formatValue(raw));
    onExtractionChanged({
      ...extraction,
      constantValue: formatValue(raw),
    });
  };

  const handleMappingKeyChange = (oldKey: string, newKey: string) => {
    const mapping = { ...(extraction.mapping ?? {}) };
    const value = mapping[oldKey];
    delete mapping[oldKey];
    if (newKey) {
      mapping[newKey] = value;
    }
    onExtractionChanged({ ...extraction, mapping });
  };

  const handleMappingValueChange = (key: string, newValue: string) => {
    const mapping = { ...(extraction.mapping ?? {}) };
    mapping[key] = formatValue(newValue);
    onExtractionChanged({ ...extraction, mapping });
  };

  const handleRemoveMapping = (key: string) => {
    const mapping = { ...(extraction.mapping ?? {}) };
    delete mapping[key];
    onExtractionChanged({ ...extraction, mapping });
  };

  const handleAddMapping = () => {
    const mapping = { ...(extraction.mapping ?? {}), "": "" };
    onExtractionChanged({ ...extraction, mapping });
  };

  const handleFallbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onExtractionChanged({
      ...extraction,
      mappingFallbackTo: formatValue(raw),
    });
  };

  return (
    <Stack gap={"sm"}>
      <Text size="sm">Extract</Text>
      <Select
        placeholder=""
        value={extraction.type}
        onChange={handleTypeChanged}
        data={[
          { value: "entry_value", label: "Entry Value" },
          { value: "array_values", label: "Array Value" },
          { value: "constant", label: "Constant Value" },
          { value: "map_values", label: "Map Values" },
        ]}
      />
      {extraction.type === "constant" ? (
        <TextInput value={String(extraction.constantValue ?? "")} onChange={handleConstantChanged} />
      ) : null}
      {extraction.type === "map_values" ? (
        <Stack>
          <Stack gap={"sm"}>
            {Object.entries(extraction.mapping ?? {}).map(([key, value], idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <Flex key={idx} align="center" gap={"sm"}>
                <TextInput flex={1} value={key} onChange={(e) => handleMappingKeyChange(key, e.target.value)} />
                <IconArrowRightCircle />
                <TextInput
                  flex={1}
                  value={String(value)}
                  onChange={(e) => handleMappingValueChange(key, e.target.value)}
                />
                <ActionIcon flex={0} variant="subtle" onClick={() => handleRemoveMapping(key)}>
                  <IconTrash size={20} color={alpha(theme.colors.red[9], 0.8)} />
                </ActionIcon>
              </Flex>
            ))}
          </Stack>
          <DashedButton label="Add mapping" onClick={handleAddMapping} />
          <TextInput
            label={"Fallback"}
            value={String(extraction.mappingFallbackTo ?? "")}
            onChange={handleFallbackChange}
          />
        </Stack>
      ) : null}
    </Stack>
  );
}
