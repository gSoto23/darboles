"use client";

import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={[lat, lng]} radius={9} pathOptions={{ color: '#e4572e', weight: 3, fillColor: '#ffffff', fillOpacity: 1 }} />
      </MapContainer>
    </div>
  );
}
