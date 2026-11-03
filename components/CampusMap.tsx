"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export interface MapPin {
  code: string;
  lat: number;
  lng: number;
  free: number;
}

// Esri's gray canvas basemaps: quiet, label-light, with a dark variant.
const TILES = {
  light:
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
};

const isDark = () => document.documentElement.classList.contains("dark");

function pinIcon(pin: MapPin, selected: boolean) {
  const state = selected ? "selected" : pin.free > 0 ? "free" : "none";
  return L.divIcon({
    className: "",
    html: `<span class="map-pin" data-state="${state}"><b>${pin.code}</b>${pin.free}</span>`,
    iconSize: undefined,
    iconAnchor: [0, 0],
  });
}

// Buildings that share coordinates (wings of one building) would hide each
// other, so nudge repeats apart.
function spread(pins: MapPin[]) {
  const seen = new Map<string, number>();
  return pins.map((p) => {
    const key = `${p.lat},${p.lng}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    return n ? { ...p, lat: p.lat - n * 0.00018 } : p;
  });
}

export default function CampusMap({
  pins,
  selected,
  onSelect,
}: {
  pins: MapPin[];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const m = L.map(container.current!, { zoomControl: false });
    L.control.zoom({ position: "bottomright" }).addTo(m);
    m.attributionControl.setPrefix(
      '<a href="https://leafletjs.com">Leaflet</a>'
    );
    const tiles = L.tileLayer(isDark() ? TILES.dark : TILES.light, {
      attribution:
        'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxNativeZoom: 16,
      maxZoom: 19,
    }).addTo(m);
    const observer = new MutationObserver(() =>
      tiles.setUrl(isDark() ? TILES.dark : TILES.light)
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    // Zoomed out, pins show only their free count so they overlap less.
    const updateDensity = () =>
      container.current?.classList.toggle("map-compact", m.getZoom() < 16);
    m.on("zoomend", updateDensity);
    markers.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);

  // Refit only when the set of buildings changes (a new campus), not when
  // free counts change with the time.
  const pinSet = pins.map((p) => p.code).join(",");
  useEffect(() => {
    if (!map.current || pins.length === 0) return;
    map.current.fitBounds(
      L.latLngBounds(pins.map((p) => [p.lat, p.lng])),
      { padding: [36, 36], maxZoom: 17 }
    );
    container.current?.classList.toggle("map-compact", map.current.getZoom() < 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinSet]);

  useEffect(() => {
    const layer = markers.current;
    if (!layer) return;
    layer.clearLayers();
    for (const pin of spread(pins)) {
      L.marker([pin.lat, pin.lng], {
        icon: pinIcon(pin, pin.code === selected),
        title: `${pin.code}: ${pin.free} free`,
        zIndexOffset: pin.code === selected ? 1000 : pin.free > 0 ? 100 : 0,
      })
        .on("click", () => onSelectRef.current(pin.code))
        .addTo(layer);
    }
  }, [pins, selected]);

  return (
    <div
      ref={container}
      className="isolate h-[58dvh] min-h-[340px] w-full overflow-hidden rounded-2xl bg-fill shadow-card"
    />
  );
}
