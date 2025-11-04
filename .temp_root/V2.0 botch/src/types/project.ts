import { z } from 'zod';

// Timing modes
export const TimingModeSchema = z.enum(['constantTime', 'constantSpeed']);
export type TimingMode = z.infer<typeof TimingModeSchema>;

// Pause modes
export const PauseModeSchema = z.enum(['none', 'seconds', 'click']);
export type PauseMode = z.infer<typeof PauseModeSchema>;

// Track types
export const TrackTypeSchema = z.enum(['path', 'camera', 'labels']);
export type TrackType = z.infer<typeof TrackTypeSchema>;

// Waypoint schema
export const WaypointSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  isMajor: z.boolean(),
  labelId: z.string().optional()
});
export type Waypoint = z.infer<typeof WaypointSchema>;

// Asset schema
export const AssetSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'audio', 'custom']),
  name: z.string(),
  mimeType: z.string(),
  path: z.string(),
  data: z.string().optional() // base64 for embedded assets
});
export type Asset = z.infer<typeof AssetSchema>;

// Path style schema
export const PathStyleSchema = z.object({
  stroke: z.object({
    color: z.string(),
    thickness: z.number(),
    variant: z.enum(['line', 'dashed', 'dots', 'squiggle'])
  }),
  waypoint: z.object({
    shape: z.enum(['circle', 'square', 'none']),
    size: z.number()
  }),
  head: z.object({
    kind: z.enum(['none', 'arrow', 'dot', 'custom']),
    customAssetId: z.string().nullable(),
    rotationOffsetDeg: z.number()
  })
});
export type PathStyle = z.infer<typeof PathStyleSchema>;

// Track schemas
export const PathTrackSchema = z.object({
  id: z.string(),
  type: z.literal('path'),
  name: z.string(),
  backgroundAssetId: z.string().optional(),
  timing: z.object({
    mode: TimingModeSchema,
    baseSpeedPxPerSec: z.number().default(200),
    easeInOut: z.boolean().default(true),
    pause: z.object({
      mode: PauseModeSchema,
      seconds: z.number().default(2)
    })
  }),
  style: PathStyleSchema,
  smoothing: z.object({
    type: z.literal('catmullRomCentripetal'),
    tension: z.number().default(0.5)
  }),
  waypoints: z.array(WaypointSchema)
});
export type PathTrack = z.infer<typeof PathTrackSchema>;

export const CameraTrackSchema = z.object({
  id: z.string(),
  type: z.literal('camera'),
  name: z.string(),
  followPathId: z.string().optional(),
  safetyMarginPct: z.number().default(8),
  zoom: z.object({
    min: z.number().default(1.0),
    max: z.number().default(3.0)
  }),
  waypoints: z.array(WaypointSchema.extend({
    zoom: z.number().optional()
  }))
});
export type CameraTrack = z.infer<typeof CameraTrackSchema>;

export const LabelSchema = z.object({
  id: z.string(),
  text: z.string(),
  mode: z.enum(['showFade', 'showPersist', 'alwaysOn']),
  soundAssetId: z.string().nullable(),
  anchor: z.enum(['auto', 'north', 'east', 'south', 'west'])
});
export type Label = z.infer<typeof LabelSchema>;

export const LabelsTrackSchema = z.object({
  id: z.string(),
  type: z.literal('labels'),
  items: z.array(LabelSchema)
});
export type LabelsTrack = z.infer<typeof LabelsTrackSchema>;

export const TrackSchema = z.discriminatedUnion('type', [
  PathTrackSchema,
  CameraTrackSchema,
  LabelsTrackSchema
]);
export type Track = z.infer<typeof TrackSchema>;

// Main project schema
export const ProjectSchema = z.object({
  schemaVersion: z.number(),
  meta: z.object({
    title: z.string(),
    attribution: z.string(),
    locale: z.string().default('en-GB')
  }),
  a11y: z.object({
    altText: z.string(),
    reducedMotion: z.boolean().default(false),
    paletteId: z.string().default('cb-safe-01')
  }),
  assets: z.array(AssetSchema),
  settings: z.object({
    contrastOverlay: z.object({
      mode: z.literal('linear'),
      value: z.number().min(-0.9).max(0.9).default(0.0)
    }),
    fps: z.number().default(25)
  }),
  tracks: z.array(TrackSchema),
  export: z.object({
    format: z.enum(['webm', 'pngSequence']).default('webm'),
    overlayAlpha: z.boolean().default(false),
    pngSequence: z.object({
      enabled: z.boolean().default(true)
    })
  })
});
export type Project = z.infer<typeof ProjectSchema>;
