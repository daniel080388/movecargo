"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

export type MiniMarker = {
  lng: number;
  lat: number;
  color?: string;
  popup?: string;
};

export interface MapMiniProps {
  markers: MiniMarker[];
  height?: number | string; // e.g., 240 or '260px' or '40vh'
  className?: string;
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function MapMini({ markers, height = 260, className }: MapMiniProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      // Avoid initializing without token
      return;
    }

    // Europe bounding box: [west, south] to [east, north]
    const europeBounds: [[number, number], [number, number]] = [
      [-31, 34],
      [40, 72],
    ];

    mapInstance.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-3.7, 40.4], // Madrid approx, just as a neutral center in EU
      zoom: 4,
      maxBounds: europeBounds,
      attributionControl: true,
    });
    mapInstance.current.fitBounds(europeBounds, { padding: 20, animate: false });

    const map = mapInstance.current;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");

    // add markers and fit to them
    const addedMarkers: mapboxgl.Marker[] = [];
    const bounds = new mapboxgl.LngLatBounds();
    markers
      .filter((m) => Number.isFinite(m.lng) && Number.isFinite(m.lat))
      .forEach((m) => {
        const el = document.createElement("div");
        el.className = "rounded-full border-2 border-white shadow";
        el.style.width = "10px";
        el.style.height = "10px";
        el.style.backgroundColor = m.color || "#2563EB"; // blue-600
        const mk = new mapboxgl.Marker({ element: el })
          .setLngLat([Number(m.lng), Number(m.lat)])
          .addTo(map);
        if (m.popup) mk.setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML(m.popup));
        addedMarkers.push(mk);
        bounds.extend([Number(m.lng), Number(m.lat)] as [number, number]);
      });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 28, animate: true, maxZoom: 9 });
    }

    return () => {
      addedMarkers.forEach((mk) => mk.remove());
      map.remove();
      mapInstance.current = null;
    };
  }, [markers]);

  const style: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <div className={className}>
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
        <div className="text-sm text-red-600 p-3 border rounded bg-red-50">
          Defina NEXT_PUBLIC_MAPBOX_TOKEN no .env.local para ver o mapa.
        </div>
      ) : (
        <div ref={mapRef} className="w-full rounded overflow-hidden border" style={style} />
      )}
    </div>
  );
}
