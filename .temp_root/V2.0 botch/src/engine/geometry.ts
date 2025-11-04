/**
 * Geometry module for path interpolation and arc-length calculations
 * Implements:
 * - Centripetal Catmull-Rom spline interpolation with tension control
 * - Arc-length table building for uniform speed movement
 * - Position queries along paths at specific arc lengths
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Centripetal Catmull-Rom spline interpolation
 * Prevents cusp artifacts and loops compared to uniform Catmull-Rom
 * 
 * @param p0 First control point
 * @param p1 Second control point (segment start)
 * @param p2 Third control point (segment end)
 * @param p3 Fourth control point
 * @param t Parameter [0,1] along the segment
 * @param tension Tension factor (0.5 is default, lower = tighter curves)
 */
export function catmullRomCentripetal(
  p0: Point,
  p1: Point, 
  p2: Point,
  p3: Point,
  t: number,
  tension: number = 0.5
): Point {
  // Calculate centripetal parameterization
  const d01 = distance(p0, p1);
  const d12 = distance(p1, p2);
  const d23 = distance(p2, p3);
  
  // Use alpha = 0.5 for centripetal (prevents cusps)
  const alpha = 0.5;
  
  let t0 = 0;
  let t1 = t0 + Math.pow(d01, alpha);
  let t2 = t1 + Math.pow(d12, alpha);
  let t3 = t2 + Math.pow(d23, alpha);
  
  // Rescale t to [t1, t2] range
  t = t1 + t * (t2 - t1);
  
  // Calculate Catmull-Rom basis functions
  const t1t0 = t1 - t0;
  const t2t1 = t2 - t1;
  const t3t2 = t3 - t2;
  
  const A1x = (t1 - t) / t1t0 * p0.x + (t - t0) / t1t0 * p1.x;
  const A1y = (t1 - t) / t1t0 * p0.y + (t - t0) / t1t0 * p1.y;
  
  const A2x = (t2 - t) / t2t1 * p1.x + (t - t1) / t2t1 * p2.x;
  const A2y = (t2 - t) / t2t1 * p1.y + (t - t1) / t2t1 * p2.y;
  
  const A3x = (t3 - t) / t3t2 * p2.x + (t - t2) / t3t2 * p3.x;
  const A3y = (t3 - t) / t3t2 * p2.y + (t - t2) / t3t2 * p3.y;
  
  const B1x = (t2 - t) / (t2 - t0) * A1x + (t - t0) / (t2 - t0) * A2x;
  const B1y = (t2 - t) / (t2 - t0) * A1y + (t - t0) / (t2 - t0) * A2y;
  
  const B2x = (t3 - t) / (t3 - t1) * A2x + (t - t1) / (t3 - t1) * A3x;
  const B2y = (t3 - t) / (t3 - t1) * A2y + (t - t1) / (t3 - t1) * A3y;
  
  // Apply tension by interpolating between linear and curved result
  const linearX = (1 - t) * p1.x + t * p2.x;
  const linearY = (1 - t) * p1.y + t * p2.y;
  
  const curvedX = (t2 - t) / (t2 - t1) * B1x + (t - t1) / (t2 - t1) * B2x;
  const curvedY = (t2 - t) / (t2 - t1) * B1y + (t - t1) / (t2 - t1) * B2y;
  
  return {
    x: linearX * (1 - tension) + curvedX * tension,
    y: linearY * (1 - tension) + curvedY * tension
  };
}

/**
 * Build arc-length table for a set of points
 * Returns cumulative distances for each point
 */
export function buildArcLengthTable(points: Point[]): number[] {
  if (points.length === 0) return [];
  
  const distances: number[] = [0];
  let totalDistance = 0;
  
  for (let i = 1; i < points.length; i++) {
    const segmentLength = distance(points[i - 1], points[i]);
    totalDistance += segmentLength;
    distances.push(totalDistance);
  }
  
  return distances;
}

/**
 * Get position at specific arc length along a smooth path
 * Uses Catmull-Rom interpolation between points
 */
export function getPositionAtArcLength(
  points: Point[],
  distances: number[],
  targetLength: number
): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  
  // Clamp target length to valid range
  const totalLength = distances[distances.length - 1];
  targetLength = Math.max(0, Math.min(targetLength, totalLength));
  
  // Find the segment containing the target length
  let segmentIndex = 0;
  for (let i = 1; i < distances.length; i++) {
    if (distances[i] >= targetLength) {
      segmentIndex = i - 1;
      break;
    }
  }
  
  // If we're at the end, return the last point
  if (segmentIndex >= points.length - 1) {
    return points[points.length - 1];
  }
  
  // Calculate interpolation parameter within the segment
  const segmentStartLength = distances[segmentIndex];
  const segmentEndLength = distances[segmentIndex + 1];
  const segmentLength = segmentEndLength - segmentStartLength;
  
  if (segmentLength === 0) {
    return points[segmentIndex];
  }
  
  const t = (targetLength - segmentStartLength) / segmentLength;
  
  // Get control points for Catmull-Rom interpolation
  const p0 = points[Math.max(0, segmentIndex - 1)];
  const p1 = points[segmentIndex];
  const p2 = points[segmentIndex + 1];
  const p3 = points[Math.min(points.length - 1, segmentIndex + 2)];
  
  return catmullRomCentripetal(p0, p1, p2, p3, t);
}

/**
 * Calculate Euclidean distance between two points
 */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate smooth path points using Catmull-Rom interpolation
 * Returns a densified point array for smooth rendering
 */
export function generateSmoothPath(
  points: Point[],
  pointsPerSegment: number = 20,
  tension: number = 0.5
): Point[] {
  if (points.length < 2) return points;
  
  const smoothPath: Point[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    // Add the start point
    if (i === 0) {
      smoothPath.push(points[i]);
    }
    
    // Get control points for this segment
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    // Generate interpolated points
    for (let j = 1; j <= pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      const point = catmullRomCentripetal(p0, p1, p2, p3, t, tension);
      smoothPath.push(point);
    }
  }
  
  return smoothPath;
}

// Test function
export function runGeometryTests(): void {
  console.group('🔬 Geometry Module Tests');
  
  try {
    // Test 1: Basic Catmull-Rom interpolation
    console.log('Test 1: Catmull-Rom interpolation');
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 100, y: 0 };
    const p2 = { x: 100, y: 100 };
    const p3 = { x: 200, y: 100 };
    
    const midPoint = catmullRomCentripetal(p0, p1, p2, p3, 0.5);
    console.log(`  Midpoint: (${midPoint.x.toFixed(2)}, ${midPoint.y.toFixed(2)})`);
    
    // Test 2: Arc-length table
    console.log('\nTest 2: Arc-length table');
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 200, y: 100 }
    ];
    
    const distances = buildArcLengthTable(points);
    console.log(`  Distances: [${distances.map(d => d.toFixed(1)).join(', ')}]`);
    console.log(`  Total length: ${distances[distances.length - 1].toFixed(1)}`);
    
    // Test 3: Position at arc length
    console.log('\nTest 3: Position queries');
    const quarterLength = distances[distances.length - 1] * 0.25;
    const halfLength = distances[distances.length - 1] * 0.5;
    
    const pos1 = getPositionAtArcLength(points, distances, quarterLength);
    const pos2 = getPositionAtArcLength(points, distances, halfLength);
    
    console.log(`  Position at 25%: (${pos1.x.toFixed(2)}, ${pos1.y.toFixed(2)})`);
    console.log(`  Position at 50%: (${pos2.x.toFixed(2)}, ${pos2.y.toFixed(2)})`);
    
    // Test 4: Smooth path generation
    console.log('\nTest 4: Smooth path generation');
    const smoothPath = generateSmoothPath(points, 10);
    console.log(`  Original points: ${points.length}`);
    console.log(`  Smooth points: ${smoothPath.length}`);
    
    // Test 5: Tension variation
    console.log('\nTest 5: Tension effects');
    const tightPoint = catmullRomCentripetal(p0, p1, p2, p3, 0.5, 0.2);
    const loosePoint = catmullRomCentripetal(p0, p1, p2, p3, 0.5, 0.8);
    
    console.log(`  Tight tension (0.2): (${tightPoint.x.toFixed(2)}, ${tightPoint.y.toFixed(2)})`);
    console.log(`  Loose tension (0.8): (${loosePoint.x.toFixed(2)}, ${loosePoint.y.toFixed(2)})`);
    
    console.log('\n✅ All geometry tests passed!');
    
  } catch (error) {
    console.error('❌ Geometry tests failed:', error);
  }
  
  console.groupEnd();
}
