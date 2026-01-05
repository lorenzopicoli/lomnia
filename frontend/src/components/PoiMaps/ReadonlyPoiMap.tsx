import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import type { PolygonFeature, ReadonlyPolygon } from "../../types/PolygonFeature";

export function ReadonlyPoiMap(props: {
  value?: PolygonFeature | null;
  onChange?: (geoJson: PolygonFeature | null) => void;
  readonlyPolygons?: ReadonlyPolygon[];
}) {
  return (
    <MapContainer
      center={[-20.298105137021743, -40.2946917042161]}
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
      {props.readonlyPolygons ? <ReadOnlyPolygons readonlyPolygons={props.readonlyPolygons} /> : null}
    </MapContainer>
  );
}

function ReadOnlyPolygons(props: { readonlyPolygons: ReadonlyPolygon[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const group = L.layerGroup().addTo(map);

    for (const poly of props.readonlyPolygons) {
      const layer = L.geoJSON(poly.feature, {
        style: {
          weight: 2,
          color: "#666",
          fillOpacity: 0.15,
          dashArray: "4 4",
        },
        interactive: false,
      });

      layer.eachLayer((l: any) => {
        l.options.pmIgnore = true;
      });

      layer.addTo(group);

      const center = layer.getBounds().getCenter();

      L.tooltip({
        permanent: true,
        direction: "center",
        className: "polygon-label",
        opacity: 0.9,
      })
        .setLatLng(center)
        .setContent(poly.name)
        .addTo(group);
    }

    return () => {
      group.remove();
    };
  }, [map, props.readonlyPolygons]);

  return null;
}
