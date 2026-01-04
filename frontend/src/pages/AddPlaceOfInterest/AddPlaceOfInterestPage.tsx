import { Container, Paper, ScrollArea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createControlComponent } from "@react-leaflet/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as L from "leaflet";
import { useCallback, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../../api/trpc";
import { safeScrollableArea } from "../../constants";
import { useConfig } from "../../contexts/ConfigContext";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

interface Props extends L.ControlOptions {
  position: L.ControlPosition;
  drawCircle?: boolean;
  oneBlock?: boolean;
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
  },
});

const createGeomanInstance = (props: Props) => {
  return new Geoman(props);
};

export const GeomanControl = createControlComponent(createGeomanInstance);

const Events = () => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.pm.setPathOptions({
        color: "orange",
        fillColor: "green",
        fillOpacity: 0.4,
      });
      map.on("pm:create", (e) => {
        console.log("Layer created:", e);

        e.layer.on("click", () => {
          console.log("Layer clicked", e);
        });

        e.layer.on("pm:edit", () => {
          console.log("Layer edited", e);
        });

        e.layer.on("pm:update", () => {
          console.log("Layer updated", e);
        });

        e.layer.on("pm:remove", (e) => {
          console.log("Layer removed:", e);
        });

        e.layer.on("pm:dragstart", (e) => {
          console.log("Layer dragstart:", e);
        });

        e.layer.on("pm:dragend", (e) => {
          console.log("Layer dragend:", e);
        });
      });

      map.on("pm:drawstart", (e) => {
        console.log("Layer drawstart:", e);
      });

      map.on("pm:drawend", (_e: any) => {
        const layersGeoJSON = map.pm.getGeomanLayers().map((layer) => layer.toGeoJSON());

        // Or as a FeatureCollection
        const featureCollection = {
          type: "FeatureCollection",
          features: layersGeoJSON,
        };

        console.log(featureCollection);
      });

      map.on("pm:globaldrawmodetoggled", (e) => {
        console.log("Layer globaldrawmodetoggled:", e);
      });

      map.on("pm:globaldragmodetoggled", (e) => {
        console.log("Layer globaldragmodetoggled:", e);
      });

      map.on("pm:globalremovalmodetoggled", (e) => {
        console.log("Layer globalremovalmodetoggled:", e);
      });

      map.on("pm:globalcutmodetoggled", (e) => {
        console.log("Layer globalcutmodetoggled:", e);
      });

      map.on("pm:globalrotatemodetoggled", (e) => {
        console.log("Layer globalrotatemodetoggled:", e);
      });
    }
  }, [map]);

  return null;
};

export default Events;

export function AddPlaceOfInterestPage() {
  const { theme } = useConfig();
  const navigate = useNavigate();
  const { poiId } = useParams<{ poiId?: string }>();

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
          message: "It might take a while to see locations linked to this place",
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

  if (isFetching) {
    return <>Loading...</>;
  }

  return (
    <Paper component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <ScrollArea h={safeScrollableArea} type="never">
        <MapContainer
          center={[51.505, -0.09]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: "100vw", height: "100vh" }}
        >
          <TileLayer
            attribution='<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeomanControl position="topleft" oneBlock />
          <Events />
        </MapContainer>
      </ScrollArea>
    </Paper>
  );
}
