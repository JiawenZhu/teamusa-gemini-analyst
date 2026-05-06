/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore — legacy DeckGL globe (replaced by Three.js GlobeScene)
"use client";

import React, { useState, useEffect, startTransition } from 'react';
import DeckGL from '@deck.gl/react';
import { _GlobeView as GlobeView, FlyToInterpolator } from '@deck.gl/core';
import { ArcLayer, ScatterplotLayer, SolidPolygonLayer, GeoJsonLayer } from '@deck.gl/layers';

const LA_COORDS = [-118.2437, 34.0522];
const COUNTRIES_URL = "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson";

// Full earth polygon for the ocean background
const EARTH_POLYGON = [
    [[-180, 90], [0, 90], [180, 90], [180, -90], [0, -90], [-180, -90]]
];

interface GlobeBgProps {
  userLocation?: { lat: number; lng: number } | null;
  triggerCity?: { lat: number; lng: number } | null;
  isInteractive?: boolean;
}

export default function GlobeBackground({ userLocation, triggerCity, isInteractive }: GlobeBgProps) {

    const [viewState, setViewState] = useState<{
        longitude: number; latitude: number; zoom: number; pitch: number; bearing: number;
        transitionDuration?: number; transitionInterpolator?: FlyToInterpolator;
    }>({
        longitude: LA_COORDS[0],
        latitude: LA_COORDS[1],
        zoom: 0.5,
        pitch: 0,
        bearing: 0
    });

    // Animate initial zoom when switching to interactive mode
    useEffect(() => {
        if (isInteractive && !userLocation && !triggerCity) {
            startTransition(() => {
                setViewState((v) => ({
                    ...v,
                    zoom: 1.2,
                    transitionDuration: 2000,
                    transitionInterpolator: new FlyToInterpolator()
                }));
            });
        }
    }, [isInteractive, userLocation, triggerCity]);

    // Fly to user location
    useEffect(() => {
        if (userLocation && userLocation.lng) {
            startTransition(() => {
                setViewState({
                    longitude: userLocation.lng,
                    latitude: userLocation.lat,
                    zoom: 1.2,
                    pitch: 25,
                    bearing: 0,
                    transitionDuration: 3000,
                    transitionInterpolator: new FlyToInterpolator()
                });
            });
        }
    }, [userLocation]);

    // Fly to triggered city from Chat
    useEffect(() => {
        if (triggerCity && triggerCity.lng) {
            startTransition(() => {
                setViewState({
                    longitude: triggerCity.lng,
                    latitude: triggerCity.lat,
                    zoom: 1.5,
                    pitch: 20,
                    bearing: 0,
                    transitionDuration: 4000,
                    transitionInterpolator: new FlyToInterpolator()
                });
            });
        }
    }, [triggerCity]);

    const layers = [
        // The Deep Blue "Glass" Ocean
        new SolidPolygonLayer({
            id: 'earth-ocean',
            data: [{ polygon: EARTH_POLYGON }],
            getPolygon: d => d.polygon,
            getFillColor: isInteractive ? [10, 25, 50, 255] : [10, 25, 50, 100], // Transparent in background mode
            stroked: false
        }),
        
        // The Futuristic glowing landmasses
        new GeoJsonLayer({
            id: 'earth-land',
            data: COUNTRIES_URL,
            stroked: true,
            filled: true,
            lineWidthMinPixels: 1,
            getLineColor: [50, 120, 255, 180], // Glowing blue borders
            getFillColor: [15, 35, 70, 200], // Darker landmass
        }),
        
        // The glowing arc from user to LA
        userLocation && new ArcLayer({
            id: 'flight-arc',
            data: [{
                sourcePosition: [userLocation.lng, userLocation.lat],
                targetPosition: LA_COORDS,
            }],
            getSourcePosition: d => d.sourcePosition,
            getTargetPosition: d => d.targetPosition,
            getSourceColor: [255, 215, 0, 255], // Gold
            getTargetColor: [255, 50, 50, 255], // Red
            getWidth: 4,
            getHeight: 0.3, // Keep the arc close to the earth so it doesn't fly out of frame
        }),
        
        // Glowing City Pins
        new ScatterplotLayer({
            id: 'cities-scatter',
            data: [
                { position: LA_COORDS, color: [255, 50, 50], size: 100000 },
                userLocation && { position: [userLocation.lng, userLocation.lat], color: [255, 215, 0], size: 80000 },
                triggerCity && { position: [triggerCity.lng, triggerCity.lat], color: [0, 255, 255], size: 90000 }
            ].filter(Boolean),
            getPosition: d => d.position,
            getFillColor: d => d.color,
            getRadius: d => d.size,
        })
    ].filter(Boolean);

    // CSS Transition for the wrapper to smoothly shift from background to interactive widget
    const containerStyle: React.CSSProperties = isInteractive 
        ? { 
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            minHeight: '500px',
            borderRadius: '24px', 
            overflow: 'hidden', 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)' 
          }
        : { 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            zIndex: -1, 
            pointerEvents: 'none', 
            transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)' 
          };

    return (
        <div style={containerStyle}>
            <DeckGL
                views={new GlobeView()}
                viewState={viewState}
                // @ts-ignore — deck.gl ViewState type mismatch with useState generic
                onViewStateChange={({ viewState }) => setViewState(viewState)}
                controller={isInteractive ? { dragPan: false, dragRotate: true, scrollZoom: true } : false}
                layers={layers}
                // @ts-ignore — deck.gl parameters type is intentionally untyped
                parameters={{
                    clearColor: [0.0, 0.0, 0.0, 0.0] // Fully transparent canvas background
                } as { clearColor: [number, number, number, number] }}
            />
        </div>
    );
}
