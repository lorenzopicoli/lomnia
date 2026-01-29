import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { GeomanControl } from "./GeomanControl";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "./GeomanControl.css";
import L from "leaflet";
import type { PolygonFeature } from "../../types/PolygonFeature";

type ReadonlyPolygon = { name: string; feature: PolygonFeature };
export function DrawablePoiMap(props: {
  value?: PolygonFeature | null;
  onChange?: (geoJson: PolygonFeature | null) => void;
  readonlyPolygons?: ReadonlyPolygon[];
  center?: { lat: number; lng: number };
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
      {props.center ? <CenterWithPin center={props.center} zoom={13} /> : null}

      {props.readonlyPolygons ? <ReadOnlyPolygons readonlyPolygons={props.readonlyPolygons} /> : null}
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
function CenterWithPin(props: { center?: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // No center → remove marker and do nothing
    if (!props.center) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    // Center the map
    map.setView(props.center, props.zoom ?? map.getZoom(), {
      animate: true,
    });

    // Replace marker if it exists
    if (markerRef.current) {
      markerRef.current.setLatLng(props.center);
    } else {
      markerRef.current = L.marker(props.center).addTo(map);
    }
  }, [map, props.center, props.zoom]);

  return null;
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

function ReadOnlyPolygons(props: { readonlyPolygons: ReadonlyPolygon[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    for (const poly of props.readonlyPolygons) {
      const layer = L.geoJSON(poly.feature, {
        style: {
          weight: 2,
          color: "#666",
          fillOpacity: 0.15,
          dashArray: "4 4",
        },
        interactive: false,
      }).addTo(map);

      layer.eachLayer((l) => {
        l.options.pmIgnore = true;
      });

      const center = layer.getBounds().getCenter();

      L.tooltip({
        permanent: true,
        direction: "center",
        className: "polygon-label",
        opacity: 0.9,
      })
        .setLatLng(center)
        .setContent(poly.name)
        .addTo(map);
    }
  }, [map, props.readonlyPolygons]);
  return null;
}

function MapEvents(props: { value?: PolygonFeature | null; onChange?: (geoJson: PolygonFeature | null) => void }) {
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

      props.onChange?.(layerToPolygonFeature(e.layer));
      map.pm.Toolbar.setButtonDisabled("Polygon", true);

      e.layer.on("pm:edit", () => {
        props.onChange?.(layerToPolygonFeature(e.layer));
      });

      e.layer.on("pm:remove", () => {
        map.pm.Toolbar.setButtonDisabled("Polygon", false);
        layerRef.current = null;
        props.onChange?.(null);
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
      props.onChange?.(layerToPolygonFeature(polygonLayer));
    });

    polygonLayer.on("pm:remove", () => {
      layerRef.current = null;
      props.onChange?.(null);
      map.pm.Toolbar.setButtonDisabled("Polygon", false);
    });
  }, [map, props.value, props.onChange]);

  return null;
}
