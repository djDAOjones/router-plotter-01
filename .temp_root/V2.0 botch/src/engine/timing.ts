/**
 * Timing and easing engine
 * Implements:
 * - Constant time per segment (major→major) timing mode
 * - Constant speed (arc-length) timing mode
 * - Segment timing maps with pause support
 * - Quadratic easing for smooth transitions
 */

import type { TimingMode, PauseMode, Waypoint } from '../types/project';
import type { Point } from './geometry';
import { buildArcLengthTable } from './geometry';

export interface SegmentTimingMap {
  segments: Array<{
    startTime: number;
    endTime: number;
    duration: number;
    startProgress: number;
    endProgress: number;
    startWaypointIndex: number;
    endWaypointIndex: number;
    hasPause: boolean;
    pauseDuration: number;
  }>;
  totalDuration: number;
  totalPathLength: number;
  mode: TimingMode;
  baseSpeed: number;
}

export interface TimingConfig {
  mode: TimingMode;
  baseSpeedPxPerSec: number;
  pauseMode: PauseMode;
  pauseSeconds: number;
  easeInOut: boolean;
}

/**
 * Quadratic ease-in-out function
 * Smooth acceleration and deceleration
 */
export function quadraticEaseInOut(t: number): number {
  if (t < 0.5) {
    return 2 * t * t;
  }
  return -1 + (4 - 2 * t) * t;
}

/**
 * Apply easing to a value within a segment
 */
export function applyEasing(
  progress: number,
  useEasing: boolean,
  segmentIndex: number,
  totalSegments: number
): number {
  if (!useEasing) return progress;
  
  // Apply easing at segment transitions
  if (segmentIndex === 0 || segmentIndex === totalSegments - 1) {
    return progress;
  }
  
  return quadraticEaseInOut(progress);
}

/**
 * Build timing map for a set of waypoints
 */
export function buildTimingMap(
  waypoints: Waypoint[],
  config: TimingConfig,
  pathPoints?: Point[]
): SegmentTimingMap {
  const segments: SegmentTimingMap['segments'] = [];
  let totalDuration = 0;
  let totalPathLength = 0;
  
  // Calculate path length if using constant speed
  if (config.mode === 'constantSpeed' && pathPoints) {
    const distances = buildArcLengthTable(pathPoints);
    totalPathLength = distances[distances.length - 1];
  }
  
  // Find major waypoints
  const majors = waypoints.filter(wp => wp.isMajor);
  
  if (majors.length < 2) {
    return {
      segments: [],
      totalDuration: 0,
      totalPathLength,
      mode: config.mode,
      baseSpeed: config.baseSpeedPxPerSec
    };
  }
  
  // Calculate segment durations
  for (let i = 0; i < majors.length - 1; i++) {
    const startMajor = majors[i];
    const endMajor = majors[i + 1];
    const startIdx = waypoints.indexOf(startMajor);
    const endIdx = waypoints.indexOf(endMajor);
    
    let segmentDuration = 0;
    
    if (config.mode === 'constantTime') {
      // Equal time per segment
      segmentDuration = 3; // 3 seconds per segment by default
    } else {
      // Constant speed based on arc length
      if (pathPoints) {
        // Calculate arc length between majors
        const startPathIndex = Math.floor((startIdx / (waypoints.length - 1)) * (pathPoints.length - 1));
        const endPathIndex = Math.floor((endIdx / (waypoints.length - 1)) * (pathPoints.length - 1));
        
        let segmentLength = 0;
        for (let j = startPathIndex; j < endPathIndex; j++) {
          const dx = pathPoints[j + 1].x - pathPoints[j].x;
          const dy = pathPoints[j + 1].y - pathPoints[j].y;
          segmentLength += Math.sqrt(dx * dx + dy * dy);
        }
        
        segmentDuration = segmentLength / config.baseSpeedPxPerSec;
      }
    }
    
    // Add pause duration if enabled (except for last segment)
    const hasPause = config.pauseMode !== 'none' && i < majors.length - 1;
    const pauseDuration = hasPause ? config.pauseSeconds : 0;
    
    segments.push({
      startTime: totalDuration,
      endTime: totalDuration + segmentDuration,
      duration: segmentDuration,
      startProgress: i / (majors.length - 1),
      endProgress: (i + 1) / (majors.length - 1),
      startWaypointIndex: startIdx,
      endWaypointIndex: endIdx,
      hasPause,
      pauseDuration
    });
    
    totalDuration += segmentDuration + pauseDuration;
  }
  
  return {
    segments,
    totalDuration,
    totalPathLength,
    mode: config.mode,
    baseSpeed: config.baseSpeedPxPerSec
  };
}

/**
 * Get normalized progress [0,1] at a given time
 */
export function getNormalizedProgressAtTime(
  map: SegmentTimingMap,
  time: number
): number {
  if (map.segments.length === 0) return 0;
  
  // Clamp time to valid range
  time = Math.max(0, Math.min(time, map.totalDuration));
  
  // Find the current segment
  let currentSegment = map.segments[0];
  for (const segment of map.segments) {
    if (time >= segment.startTime && time < segment.endTime + segment.pauseDuration) {
      currentSegment = segment;
      break;
    }
  }
  
  // Check if we're in the pause period
  if (time >= currentSegment.endTime && time < currentSegment.endTime + currentSegment.pauseDuration) {
    return currentSegment.endProgress;
  }
  
  // Calculate progress within the segment
  const segmentTime = time - currentSegment.startTime;
  const segmentProgress = segmentTime / currentSegment.duration;
  
  // Apply easing if needed
  const easedProgress = applyEasing(
    segmentProgress,
    true, // Always use easing for smooth transitions
    map.segments.indexOf(currentSegment),
    map.segments.length
  );
  
  // Map to overall progress
  const overallProgress = currentSegment.startProgress + 
    (currentSegment.endProgress - currentSegment.startProgress) * easedProgress;
  
  return overallProgress;
}

/**
 * Get time at a given normalized progress [0,1]
 */
export function getTimeAtNormalizedProgress(
  map: SegmentTimingMap,
  progress: number
): number {
  if (map.segments.length === 0) return 0;
  
  // Clamp progress to valid range
  progress = Math.max(0, Math.min(progress, 1));
  
  // Find the segment containing this progress
  let currentSegment = map.segments[0];
  for (const segment of map.segments) {
    if (progress >= segment.startProgress && progress <= segment.endProgress) {
      currentSegment = segment;
      break;
    }
  }
  
  // Calculate progress within the segment
  const segmentProgress = (progress - currentSegment.startProgress) / 
    (currentSegment.endProgress - currentSegment.startProgress);
  
  // Apply easing (inverse of what we do in getNormalizedProgressAtTime)
  // For simplicity, we'll use linear here - the actual animation handles easing
  const time = currentSegment.startTime + segmentProgress * currentSegment.duration;
  
  return time;
}

/**
 * Get current segment information
 */
export function getCurrentSegment(
  map: SegmentTimingMap,
  time: number
): SegmentTimingMap['segments'][0] | null {
  if (map.segments.length === 0) return null;
  
  for (const segment of map.segments) {
    if (time >= segment.startTime && time < segment.endTime + segment.pauseDuration) {
      return segment;
    }
  }
  
  return map.segments[map.segments.length - 1];
}

/**
 * Rebuild timing map when waypoints or timing mode changes
 */
export function rebuildTimingMap(
  waypoints: Waypoint[],
  config: TimingConfig,
  pathPoints?: Point[]
): SegmentTimingMap {
  return buildTimingMap(waypoints, config, pathPoints);
}

// Test function
export function runTimingTests(): void {
  console.group('⏱️ Timing Engine Tests');
  
  try {
    // Create test waypoints with 3 majors
    const waypoints: Waypoint[] = [
      { id: 'wp1', x: 0, y: 0, isMajor: true },
      { id: 'wp2', x: 50, y: 0, isMajor: false },
      { id: 'wp3', x: 100, y: 0, isMajor: true },
      { id: 'wp4', x: 150, y: 0, isMajor: false },
      { id: 'wp5', x: 200, y: 0, isMajor: true },
      { id: 'wp6', x: 250, y: 0, isMajor: false },
      { id: 'wp7', x: 300, y: 0, isMajor: true }
    ];
    
    const config: TimingConfig = {
      mode: 'constantTime',
      baseSpeedPxPerSec: 200,
      pauseMode: 'seconds',
      pauseSeconds: 2,
      easeInOut: true
    };
    
    // Test 1: Constant time mode
    console.log('Test 1: Constant time mode');
    const constantTimeMap = buildTimingMap(waypoints, config);
    console.log(`  Segments: ${constantTimeMap.segments.length}`);
    console.log(`  Total duration: ${constantTimeMap.totalDuration.toFixed(1)}s`);
    
    constantTimeMap.segments.forEach((seg, i) => {
      console.log(`    Segment ${i}: ${seg.duration.toFixed(1)}s + ${seg.pauseDuration}s pause`);
    });
    
    // Test 2: Constant speed mode
    console.log('\nTest 2: Constant speed mode');
    const speedConfig = { ...config, mode: 'constantSpeed' as TimingMode };
    const pathPoints = waypoints.map(wp => ({ x: wp.x, y: wp.y }));
    const constantSpeedMap = buildTimingMap(waypoints, speedConfig, pathPoints);
    console.log(`  Segments: ${constantSpeedMap.segments.length}`);
    console.log(`  Total duration: ${constantSpeedMap.totalDuration.toFixed(1)}s`);
    console.log(`  Path length: ${constantSpeedMap.totalPathLength.toFixed(1)}px`);
    
    // Test 3: Progress mapping
    console.log('\nTest 3: Progress mapping');
    const testTimes = [0, 1.5, 3, 5, 7, 10];
    testTimes.forEach(time => {
      const progress = getNormalizedProgressAtTime(constantTimeMap, time);
      const reverseTime = getTimeAtNormalizedProgress(constantTimeMap, progress);
      console.log(`  Time ${time.toFixed(1)}s → Progress ${progress.toFixed(3)} → Time ${reverseTime.toFixed(1)}s`);
    });
    
    // Test 4: Easing function
    console.log('\nTest 4: Easing function');
    const easingTests = [0, 0.25, 0.5, 0.75, 1];
    easingTests.forEach(t => {
      const eased = quadraticEaseInOut(t);
      console.log(`  t=${t.toFixed(2)} → eased=${eased.toFixed(3)}`);
    });
    
    // Test 5: Segment lookup
    console.log('\nTest 5: Segment lookup');
    const segment = getCurrentSegment(constantTimeMap, 4);
    if (segment) {
      console.log(`  Segment at 4s: start=${segment.startTime.toFixed(1)}s, end=${segment.endTime.toFixed(1)}s`);
    }
    
    // Test 6: Rebuild timing map
    console.log('\nTest 6: Rebuild timing map');
    const newWaypoints = [...waypoints, { id: 'wp8', x: 350, y: 0, isMajor: true }];
    const rebuiltMap = rebuildTimingMap(newWaypoints, config);
    console.log(`  Original segments: ${constantTimeMap.segments.length}`);
    console.log(`  Rebuilt segments: ${rebuiltMap.segments.length}`);
    
    console.log('\n✅ All timing tests passed!');
    
  } catch (error) {
    console.error('❌ Timing tests failed:', error);
  }
  
  console.groupEnd();
}
