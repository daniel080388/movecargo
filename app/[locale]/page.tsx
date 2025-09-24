"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import LandingHero from "@/app/components/landing/Hero.client";
import HowItWorks from "@/app/components/landing/HowItWorks";

export default function HomePage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const t = useTranslations("HomePage");
  // NEXT_PUBLIC_MAPBOX_TOKEN is injected at build time for client-side use
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapboxToken) {
      // Avoid initializing Mapbox if token is not provided — mapbox-gl will throw.
      // Log a helpful warning so the developer knows to provide NEXT_PUBLIC_MAPBOX_TOKEN.
      // eslint-disable-next-line no-console
      console.warn(
        "Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment to enable the map."
      );
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Europe bounding box: [west, south] to [east, north]
    const europeBounds: [[number, number], [number, number]] = [
      [-31, 34],
      [40, 72],
    ];

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [10, 50], // Europa Central
      zoom: 4,
      maxBounds: europeBounds, // impede pan para fora da Europa
    });

    // Garante que a viewport inicial mostra a Europa inteira
    map.fitBounds(europeBounds, { padding: 40, animate: false });

    const markers = [
      {
        coordinates: [-9.1393, 38.7223], // Lisboa
        color: "green",
        popup: "Carga disponível: Lisboa → Madrid",
      },
      {
        coordinates: [2.3522, 48.8566], // Paris
        color: "green",
        popup: "Carga disponível: Paris → Berlim",
      },
      {
        coordinates: [12.4964, 41.9028], // Roma
        color: "red",
        popup: "Carga indisponível: Roma → Barcelona",
      },
      {
        coordinates: [-3.7038, 40.4168], // Madrid
        color: "green",
        popup: "Carga disponível: Madrid → Lisboa",
      },
      {
        coordinates: [13.405, 52.52], // Berlim
        color: "green",
        popup: "Carga disponível: Berlim → Paris",
      },
    ];

    markers.forEach((marker) => {
      const el = document.createElement("div");
      el.className = marker.color === "green" ? "marker-green" : "marker-red";

      new mapboxgl.Marker(el)
        .setLngLat(marker.coordinates as [number, number])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(marker.popup))
        .addTo(map);
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <main>
      <LandingHero />
      <HowItWorks />

      {/* Mapa */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("mapaTitulo")}</h2>
        <div
          ref={mapContainer}
          className="rounded-lg shadow-lg h-[500px] w-full"
        />
      </div>
    </main>
  );
}
