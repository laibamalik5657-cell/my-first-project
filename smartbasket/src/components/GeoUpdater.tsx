"use client"
import { getSocket } from '@/lib/socket'
import React, { useEffect } from 'react'

function GeoUpdater({ userId }: { userId: string }) {
    const socket = getSocket()
    
    
        socket.emit('identity', userId)
     
    
    useEffect(() => {
        if (!userId) return
        if (!navigator.geolocation) return
        
        const watcher = navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude
                const lon = pos.coords.longitude
                socket.emit("update-location", {
                    userId,
                    latitude: lat,
                    longitude: lon
                })
            },
            (error) => {
                console.error(error)
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        )
        
        return () => {
            if (watcher) {
                navigator.geolocation.clearWatch(watcher)
            }

        }
       
    },
     [userId,])
    
    return null
}

export default GeoUpdater