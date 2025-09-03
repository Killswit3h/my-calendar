'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';

// Fix default icon paths for Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type Props = { location: string };

type Coord = { lat: number; lon: number };

export default function LocationMap({ location }: Props) {
  const [coord, setCoord] = useState<Coord | null>(null);

  useEffect(() => {
    async function lookup() {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data[0]) {
          setCoord({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
        }
      } catch (e) {
        console.error('geocode failed', e);
      }
    }
    lookup();
  }, [location]);

  if (!location) return null;
  if (!coord) return <div className="border p-2 text-sm">Loading map...</div>;

  const position: [number, number] = [coord.lat, coord.lon];

  return (
    <MapContainer center={position} zoom={13} style={{ height: '250px', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>{location}</Popup>
      </Marker>
    </MapContainer>
  );
}
