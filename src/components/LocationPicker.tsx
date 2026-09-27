"use client";

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  height?: string;
}

const CR_CENTER: [number, number] = [9.7489, -83.7534];

function ClickHandler({ onPick }: { onPick: (value: LatLng) => void }) {
  const map = useMapEvents({
    click: (e) => {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
      // Acercamos de a poco para que se pueda afinar el punto sin perder el contexto
      if (map.getZoom() < 15) map.flyTo(e.latlng, Math.min(map.getZoom() + 4, 16), { duration: 0.5 });
    },
  });
  return null;
}

// Acerca el mapa cuando el punto llega de afuera (GPS o campos de coordenadas), no cuando se tocó el mapa
function FollowValue({ value, pickedRef }: { value: LatLng | null; pickedRef: React.MutableRefObject<LatLng | null> }) {
  const map = useMap();
  useEffect(() => {
    if (!value || value === pickedRef.current) return;
    map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [value?.lat, value?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function LocationPicker({ value, onChange, height = '320px' }: Props) {
  const pickedRef = useRef<LatLng | null>(null);
  const pick = (next: LatLng) => {
    pickedRef.current = next;
    onChange(next);
  };

  return (
    <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer center={value ? [value.lat, value.lng] : CR_CENTER} zoom={value ? 16 : 7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={pick} />
        <FollowValue value={value} pickedRef={pickedRef} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const p = e.target.getLatLng();
                pick({ lat: p.lat, lng: p.lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
