'use client'
import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet marker default icons fix
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface MapProps {
  position: [number, number]
  setPosition: (pos: [number, number]) => void
}

function MapEvents({ setPosition }: { setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.setView(position, map.getZoom())
    }
  }, [position, map])
  return null
}

export default function CheckOutMap({ position, setPosition }: MapProps) {
  if (!position || !position[0] || !position[1]) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-sm text-gray-500">
        Loading Map Location...
      </div>
    )
  }

  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={customIcon} />
      <MapEvents setPosition={setPosition} />
      <RecenterMap position={position} />
    </MapContainer>
  )
}