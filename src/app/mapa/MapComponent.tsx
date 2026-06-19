"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

export default function MapComponent() {
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}/tracking/public/map`)
      .then(res => res.json())
      .then(data => {
        setTrees(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando mapa interactivo...</div>;

  return (
    <div style={{ height: '600px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
      <MapContainer center={[9.7489, -83.7534]} zoom={8} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {trees.map((tree, idx) => (
          tree.latitude && tree.longitude ? (
            <Marker key={idx} position={[tree.latitude, tree.longitude]}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong>{tree.species_name}</strong><br />
                  <em style={{ color: '#666', fontSize: '0.85rem' }}>{tree.species_scientific_name}</em><br />
                  <small style={{ display: 'block', marginTop: '0.5rem' }}>Plantado por: {tree.planter_name}</small>
                  {tree.photo_url && (
                    <img src={tree.photo_url.startsWith('http') ? tree.photo_url : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1").replace('/api/v1', '') + tree.photo_url} alt="Evidencia" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', marginTop: '0.5rem' }} />
                  )}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
