import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { GeomanControl } from "./GeomanControl";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "./GeomanControl.css";
import L from "leaflet";
import type { PolygonFeature } from "../../types/PolygonFeature";

export function DrawablePoiMap(props: {
  value?: PolygonFeature | null;
  onChange: (geoJson: PolygonFeature | null) => void;
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
      <MapEvents value={props.value} onChange={props.onChange} />
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

function MapEvents(props: { value?: PolygonFeature | null; onChange: (geoJson: PolygonFeature | null) => void }) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);
  const doneInitialRef = useRef<boolean>(false);

  // Handle drawing new polygons
  useEffect(() => {
    if (!map) return;

    const onCreate = (e: any) => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }

      layerRef.current = e.layer;

      props.onChange(layerToPolygonFeature(e.layer));
      map.pm.Toolbar.setButtonDisabled("Polygon", true);

      e.layer.on("pm:edit", () => {
        props.onChange(layerToPolygonFeature(e.layer));
      });

      e.layer.on("pm:remove", () => {
        map.pm.Toolbar.setButtonDisabled("Polygon", false);
        layerRef.current = null;
        props.onChange(null);
      });
    };

    map.on("pm:create", onCreate);

    return () => {
      map.off("pm:create", onCreate);
    };
  }, [map, props.onChange]);

  // Prefill existing polygon
  useEffect(() => {
    if (!map || !props.value || layerRef.current || doneInitialRef.current) return;
    doneInitialRef.current = true;

    const geoJsonLayer = L.geoJSON(props.value, {
      style: {
        weight: 2,
      },
    });

    geoJsonLayer.addTo(map);
    map.fitBounds(geoJsonLayer.getBounds());

    const polygonLayer = geoJsonLayer.getLayers()[0] as any;
    layerRef.current = polygonLayer;

    // Without this, when editing, the polygon is set to disabled
    // and it can never be re-enabled
    requestAnimationFrame(() => {
      map.pm.Toolbar.setButtonDisabled("Polygon", true);
    });
    polygonLayer.on("pm:edit", () => {
      props.onChange(layerToPolygonFeature(polygonLayer));
    });

    polygonLayer.on("pm:remove", () => {
      layerRef.current = null;
      props.onChange(null);
      map.pm.Toolbar.setButtonDisabled("Polygon", false);
    });
  }, [map, props.value, props.onChange]);

  return null;
}
