'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';

// Fix default icon paths for Next.js on the client only
if (typeof window !== 'undefined') {
  try {
    // @ts-expect-error private API used by Leaflet docs workaround
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  } catch {}
}

type Props = { location: string };

type Coord = { lat: number; lon: number };

export default function LocationMap({ location }: Props) {
  const [coord, setCoord] = useState<Coord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function lookup() {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        if (Array.isArray(data) && data[0] && data[0].lat && data[0].lon) {
          const lat = parseFloat(data[0].lat as string);
          const lon = parseFloat(data[0].lon as string);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            setCoord({ lat, lon });
            setError(null);
          } else {
            setCoord(null);
            setError('Location not found');
          }
        } else {
          setCoord(null);
          setError('Location not found');
        }
      } catch (e) {
        console.error('geocode failed', e);
        setCoord(null);
        setError('Failed to load map');
      }
    }
    lookup();
  }, [location]);

  if (!location) return null;
  if (!coord) return <div className="border p-2 text-sm">{error ?? 'Loading map...'}</div>;

  const position = useMemo<[number, number]>(() => [coord.lat, coord.lon], [coord.lat, coord.lon]);
  const valid = Number.isFinite(position[0]) && Number.isFinite(position[1]);
  if (!valid) return <div className="border p-2 text-sm">Location not found</div>;

  return (
    <MapContainer key={`${position[0]},${position[1]}`} center={position} zoom={13} style={{ height: '250px', width: '100%' }} scrollWheelZoom={false}>
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
