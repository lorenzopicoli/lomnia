import { Button, Card, Container, Flex, Paper, ScrollArea, Stack, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../../api/trpc";
import { DrawablePoiMap } from "../../components/DrawablePoiMap/DrawablePoiMap";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";
import { cardDarkBackground } from "../../themes/mantineThemes";
import type { PolygonFeature } from "../../types/PolygonFeature";

export function AddPlaceOfInterestPage() {
  const { theme } = useConfig();
  const navigate = useNavigate();
  const { poiId } = useParams<{ poiId?: string }>();

  const [name, setName] = useState();
  const [polygon, setPolygon] = useState<PolygonFeature | null>(null);

  const isEditing = !!poiId;
  const { data: poiToEdit, isFetching } = useQuery(
    trpc.placesOfInterest.getById.queryOptions(+(poiId || 0), { enabled: isEditing, gcTime: 0 }),
  );

  const { mutate: savePoi } = useMutation(
    trpc.placesOfInterest.save.mutationOptions({
      onSuccess() {
        navigate({
          pathname: "/",
        });
        notifications.show({
          color: theme.colors.green[9],
          title: isEditing ? "Place of Interest Updated" : "Place of Interest Created",
          message: "Changes may take a few minutes to appear in linked locations.",
        });
      },
    }),
  );

  const handleSave = useCallback(
    (poi: any) => {
      savePoi({ ...poi, id: poiToEdit?.id });
    },
    [savePoi, poiToEdit?.id],
  );

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value as any);
  };

  const handlePolygonChange = (updatedPolygon: PolygonFeature | null) => {
    setPolygon(updatedPolygon);
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
            <Stack>
              <TextInput value={name} onChange={handleNameChange} label="Name" />
              <TextInput
                value={name}
                onChange={handleNameChange}
                label="Display name"
                description="The name used in charts"
              />
              {JSON.stringify(polygon, null, 2)}
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
              <DrawablePoiMap onChange={handlePolygonChange} />
            </Container>
          </Card>
        </Flex>
      </ScrollArea>
    </Paper>
  );
}
