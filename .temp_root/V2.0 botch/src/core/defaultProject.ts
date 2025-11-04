import type { Project } from '../types/project';

/**
 * Creates a default empty project
 */
export function createDefaultProject(): Project {
  return {
    schemaVersion: 1,
    meta: {
      title: 'Untitled Project',
      attribution: '',
      locale: 'en-GB'
    },
    a11y: {
      altText: '',
      reducedMotion: false,
      paletteId: 'cb-safe-01'
    },
    assets: [],
    settings: {
      contrastOverlay: {
        mode: 'linear',
        value: 0.0
      },
      fps: 25
    },
    tracks: [],
    export: {
      format: 'webm',
      overlayAlpha: false,
      pngSequence: {
        enabled: true
      }
    }
  };
}

/**
 * Creates a sample project with basic tracks for demonstration
 */
export function createSampleProject(): Project {
  const project = createDefaultProject();
  
  // Add a sample background image asset
  project.assets.push({
    id: 'img:sample-bg',
    type: 'image',
    name: 'sample-background.png',
    mimeType: 'image/png',
    path: 'assets/sample-background.png'
  });

  // Add a sample path track
  project.tracks.push({
    id: 'path:main',
    type: 'path',
    name: 'Main Path',
    backgroundAssetId: 'img:sample-bg',
    timing: {
      mode: 'constantSpeed',
      baseSpeedPxPerSec: 200,
      easeInOut: true,
      pause: {
        mode: 'seconds',
        seconds: 2
      }
    },
    style: {
      stroke: {
        color: '#FF6B6B',
        thickness: 6,
        variant: 'line'
      },
      waypoint: {
        shape: 'circle',
        size: 10
      },
      head: {
        kind: 'arrow',
        customAssetId: null,
        rotationOffsetDeg: 0
      }
    },
    smoothing: {
      type: 'catmullRomCentripetal',
      tension: 0.5
    },
    waypoints: [
      { id: 'wp1', x: 100, y: 100, isMajor: true },
      { id: 'wp2', x: 300, y: 200, isMajor: false },
      { id: 'wp3', x: 500, y: 150, isMajor: true },
      { id: 'wp4', x: 700, y: 300, isMajor: true }
    ]
  });

  // Add a camera track
  project.tracks.push({
    id: 'cam:main',
    type: 'camera',
    name: 'Main Camera',
    followPathId: 'path:main',
    safetyMarginPct: 8,
    zoom: {
      min: 1.0,
      max: 3.0
    },
    waypoints: [
      { id: 'c1', x: 100, y: 100, isMajor: true, zoom: 1.0 },
      { id: 'c2', x: 500, y: 150, isMajor: true, zoom: 1.5 },
      { id: 'c3', x: 700, y: 300, isMajor: true, zoom: 1.2 }
    ]
  });

  // Add labels track
  project.tracks.push({
    id: 'labels',
    type: 'labels',
    items: [
      {
        id: 'lbl:start',
        text: 'Start Point',
        mode: 'showPersist',
        soundAssetId: null,
        anchor: 'auto'
      },
      {
        id: 'lbl:mid',
        text: 'Midpoint',
        mode: 'showFade',
        soundAssetId: null,
        anchor: 'auto'
      },
      {
        id: 'lbl:end',
        text: 'End Point',
        mode: 'showPersist',
        soundAssetId: null,
        anchor: 'auto'
      }
    ]
  });

  project.a11y.altText = 'A sample route with three waypoints moving from left to right';

  return project;
}
