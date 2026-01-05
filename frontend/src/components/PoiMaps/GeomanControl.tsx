import { createControlComponent } from "@react-leaflet/core";
import * as L from "leaflet";

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
