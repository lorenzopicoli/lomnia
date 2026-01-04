import {
  Accordion,
  Button,
  Card,
  Container,
  Flex,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { trpc } from "../../api/trpc";
import { DrawablePoiMap } from "../../components/DrawablePoiMap/DrawablePoiMap";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";
import { cardDarkBackground } from "../../themes/mantineThemes";
import type { PolygonFeature } from "../../types/PolygonFeature";
import { AddPlaceOfInterestAddressForm } from "./ AddPlaceOfInterestAddressForm";

export type PlaceOfInterestFormValues = {
  name: string;
  displayName: string;
  address?: {
    displayName?: string;
    name?: string;
    houseNumber?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    region?: string;
    state?: string;
    iso3166_2_lvl4?: string;
    postcode?: string;
    country?: string;
    countryCode?: string;
  };
  polygon: PolygonFeature | null;
};

const initialValues: PlaceOfInterestFormValues = {
  name: "",
  displayName: "",
  polygon: null,
};

export function AddPlaceOfInterestContainer() {
  const { theme } = useConfig();
  const { poiId } = useParams<{ poiId?: string }>();

  const form = useForm<PlaceOfInterestFormValues>({
    initialValues,
  });

  const { data: reverseGeocodeData } = useQuery(
    trpc.placesOfInterest.getAddressForPolygon.queryOptions(
      {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        polygon: form.values.polygon!,
      },
      { enabled: !!form.values.polygon },
    ),
  );
  const isEditing = !!poiId;
  const { data: poiToEdit, isFetching } = useQuery(
    trpc.placesOfInterest.getById.queryOptions(+(poiId || 0), { enabled: isEditing, gcTime: 0 }),
  );

  useEffect(() => {
    if (reverseGeocodeData) {
      form.setFieldValue("address", reverseGeocodeData);
    }
  }, [form.setFieldValue, reverseGeocodeData]);

  const handleSave = () => {
    notifications.show({
      color: theme.colors.blue[9],
      title: "Form Data Ready",
      message: "Submit logic not yet implemented. Form values are valid.",
    });
  };

  if (isFetching) {
    return <>Loading...</>;
  }

  return (
    <Paper component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        <Flex p={"lg"} gap={"lg"} mih={"90vh"} direction={"row"}>
          {/* Left panel */}
          <Card p={"md"} w={"40%"} bg={cardDarkBackground}>
            <Card.Section p={"md"}>
              <Title order={3}>General</Title>
            </Card.Section>
            <Stack gap={"md"}>
              <TextInput
                value={form.values.name}
                onChange={(e) => form.setFieldValue("name", e.target.value)}
                label="Name"
              />
              <TextInput
                value={form.values.displayName}
                onChange={(e) => form.setFieldValue("displayName", e.target.value)}
                label="Display name"
                description="The name used in charts"
              />

              <Accordion defaultValue={"address"}>
                <Accordion.Item value={"address"}>
                  <Accordion.Control p={0}>
                    <Title order={4}>Address Details</Title>
                    <Text size="xs" c="dimmed">
                      Address is auto-detected from the map. You should rarely want to update this.
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel p={0}>
                    <AddPlaceOfInterestAddressForm form={form} />
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>

              <Button onClick={handleSave} variant="filled" size="md">
                Save
              </Button>
            </Stack>
          </Card>
          {/* Right panel */}
          <Card flex={1} w={"60%"} title="Edit place in the map" bg={cardDarkBackground}>
            <Card.Section p={"md"}>
              <Title order={3}>Map area</Title>
              <Text size="sm">Draw one shape on the map to define the area covered by this place of interest.</Text>
            </Card.Section>
            <Container h={"100%"} w={"100%"} bdrs={"lg"} p={0} style={{ overflow: "clip" }}>
              <DrawablePoiMap onChange={(poly) => form.setFieldValue("polygon", poly)} />
            </Container>
          </Card>
        </Flex>
      </ScrollArea>
    </Paper>
  );
}
