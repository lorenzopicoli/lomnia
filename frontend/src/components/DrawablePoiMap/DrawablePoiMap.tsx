import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { GeomanControl } from "./GeomanControl";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "./GeomanControl.css";
import type { PolygonFeature } from "../../types/PolygonFeature";

export function DrawablePoiMap(props: { onChange: (geoJson: PolygonFeature | null) => void }) {
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
      <MapEvents onChange={props.onChange} />
    </MapContainer>
  );
}

function layerToPolygonFeature(layer: any): PolygonFeature {
  const geo = layer.toGeoJSON(15);

  if (geo?.type !== "Feature" || geo?.geometry?.type !== "Polygon") {
    throw new Error("Expected a single Polygon GeoJSON Feature");
  }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: geo.geometry.coordinates,
    },
  };
}

function MapEvents(props: { onChange: (geoJson: PolygonFeature | null) => void }) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.on("pm:create", (e) => {
        props.onChange(layerToPolygonFeature(e.layer));
        map.pm.Toolbar.setButtonDisabled("Polygon", true);

        e.layer.on("pm:edit", () => {
          props.onChange(layerToPolygonFeature(e.layer));
        });

        e.layer.on("pm:remove", () => {
          props.onChange(null);
          map.pm.Toolbar.setButtonDisabled("Polygon", false);
        });
      });
    }
  }, [map, props.onChange]);

  return null;
}
