import { Button, Card, Container, Flex, Paper, ScrollArea, Stack, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createControlComponent } from "@react-leaflet/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as L from "leaflet";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../../api/trpc";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "./LeafletOverwrites.css";
import { cardDarkBackground } from "../../themes/mantineThemes";

interface Props extends L.ControlOptions {
  position: L.ControlPosition;
  oneBlock?: boolean;
  drawMarker?: boolean;
  drawPolyline?: boolean;
  drawRectangle?: boolean;
  drawCircleMarker?: boolean;
  drawText?: boolean;
  drawFreehand?: boolean;
  rotateMode?: boolean;
  cutPolygon?: boolean;
  drawCircle?: boolean;
}

const Geoman = L.Control.extend({
  options: {},
  initialize(options: Props) {
    L.setOptions(this, options);
  },

  addTo(map: L.Map) {
    if (!map.pm) return;

    map.pm.addControls({
      ...this.options,
    });

    map.pm.setPathOptions({
      color: "var(--mantine-color-violet-9)",
      fillColor: "var(--mantine-color-violet-7)",
      fillOpacity: 0.4,
    });
  },
});

const createGeomanInstance = (props: Props) => {
  return new Geoman(props);
};

export const GeomanControl = createControlComponent(createGeomanInstance);

function MapEvents(props: { onChange: (geoJson: any) => void }) {
  const map = useMap();
  const toGeoJSON = useCallback((layer: L.Layer) => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    return (layer as any).toGeoJSON(15);
  }, []);

  useEffect(() => {
    if (map) {
      map.on("pm:create", (e) => {
        props.onChange(toGeoJSON(e.layer));
        map.pm.Toolbar.setButtonDisabled("Polygon", true);

        e.layer.on("pm:edit", () => {
          props.onChange(toGeoJSON(e.layer));
        });

        e.layer.on("pm:remove", (e) => {
          props.onChange(toGeoJSON(e.layer));
          map.pm.Toolbar.setButtonDisabled("Polygon", false);
        });
      });
    }
  }, [map, toGeoJSON, props.onChange]);

  return null;
}

export function AddPlaceOfInterestPage() {
  const { theme } = useConfig();
  const navigate = useNavigate();
  const { poiId } = useParams<{ poiId?: string }>();

  const [name, setName] = useState();

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

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const handleMapPolygonChange = useCallback((geoJson: any) => {
    console.log("Map upadte", geoJson);
  }, []);

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
              <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                scrollWheelZoom={true}
                style={{ margin: 0, width: "100%", height: "100%" }}
                zoomControl={false}
              >
                <ZoomControl position="bottomright" />
                <TileLayer
                  attribution='<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <GeomanControl
                  position="topright"
                  oneBlock
                  drawCircle={false}
                  drawMarker={false}
                  drawPolyline={false}
                  drawRectangle={false}
                  drawCircleMarker={false}
                  drawText={false}
                  drawFreehand={false}
                  rotateMode={false}
                  cutPolygon={false}
                />
                <MapEvents onChange={handleMapPolygonChange} />
              </MapContainer>
            </Container>
          </Card>
        </Flex>
      </ScrollArea>
    </Paper>
  );
}
