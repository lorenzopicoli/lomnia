import {
  Accordion,
  Button,
  Card,
  Container,
  Flex,
  Input,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconSearch } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../../api/trpc";
import { DrawablePoiMap } from "../../components/PoiMaps/DrawablePoiMap";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";
import { cardDarkBackground } from "../../themes/mantineThemes";
import type { PolygonFeature } from "../../types/PolygonFeature";
import { AddPlaceOfInterestAddressForm } from "./ AddPlaceOfInterestAddressForm";

export type PlaceOfInterestFormValues = {
  name: string;
  address?: {
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
  polygon: null,
};

function nullToUndefined<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T]: Exclude<T[K], null> | undefined } {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v ?? undefined])) as any;
}

export function AddPlaceOfInterestContainer(_props: { search?: string }) {
  const { theme } = useConfig();
  const { poiId } = useParams<{ poiId?: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const handleMapSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.currentTarget.value);
  };

  const form = useForm<PlaceOfInterestFormValues>({
    initialValues,
    validate: (values) => {
      if (!values.address) {
        return { missingAddress: "Couldn't find the address" };
      }
      if (!values.name) {
        return { missingName: "Missing name" };
      }
      if (!values.polygon) {
        return { missingPolygon: "Map is missing selection" };
      }

      return {};
    },
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
  const { data: geocodeData } = useQuery(
    trpc.placesOfInterest.searchLocationByText.queryOptions(
      {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        search: debouncedSearch,
      },
      { enabled: !!debouncedSearch },
    ),
  );
  const { data: allPOIsGeoJSONs } = useQuery(trpc.placesOfInterest.getAllGeoJSON.queryOptions({}));
  const { mutate: savePoi } = useMutation(
    trpc.placesOfInterest.save.mutationOptions({
      onSuccess() {
        navigate({
          pathname: "/poi",
        });
        notifications.show({
          color: theme.colors.green[9],
          title: isEditing ? "Place Updated" : "Place Created",
          message: "Soon locations will be linked to this place",
        });
      },
    }),
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

  useEffect(() => {
    if (poiToEdit) {
      const typedAddress = nullToUndefined(poiToEdit.locationDetails);
      form.setValues({
        ...poiToEdit,
        polygon: poiToEdit.geoJson as PolygonFeature | null,
        address: typedAddress,
      });
    }
  }, [poiToEdit, form.setValues]);

  const handleSave = () => {
    const values = form.getValues();
    const address = values.address;
    const name = values.name;
    const polygon = values.polygon;
    if (form.validate().hasErrors || !address || !name || !polygon) {
      return;
    }
    savePoi({ ...values, address: { ...address, name }, polygon });
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

              <Accordion>
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
            <Stack flex={1}>
              <Input
                flex={0}
                onChange={handleMapSearchChange}
                value={search}
                placeholder="Search"
                leftSection={<IconSearch size={16} />}
                maw={400}
              />
              <Container h={"100%"} w={"100%"} bdrs={"lg"} p={0} style={{ overflow: "clip" }}>
                <DrawablePoiMap
                  value={poiToEdit?.geoJson as any}
                  readonlyPolygons={allPOIsGeoJSONs?.map((poi) => ({ name: poi.name, feature: poi.geoJson as any }))}
                  center={geocodeData ?? undefined}
                  onChange={(poly) => {
                    console.group("on change", poly);
                    form.setFieldValue("polygon", poly);
                  }}
                />
              </Container>
            </Stack>
          </Card>
        </Flex>
      </ScrollArea>
    </Paper>
  );
}
