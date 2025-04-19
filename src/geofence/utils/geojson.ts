import { FeatureCollection, Polygon, MultiPolygon, Point, MultiPoint } from 'geojson';

export function validateGeoJson(geojson: any): asserts geojson is FeatureCollection<Polygon> {
    // Check if it's a valid GeoJSON FeatureCollection
    if (!geojson || typeof geojson !== 'object') {
        throw new Error('GeoJSON must be an object');
    }
    
    if (geojson.type !== 'FeatureCollection') {
        throw new Error('GeoJSON must be a FeatureCollection');
    }
    
    if (!Array.isArray(geojson.features) || geojson.features.length === 0) {
        throw new Error('GeoJSON must have at least one feature');
    }
    
    // Validate each feature
    geojson.features.forEach((feature, featureIndex) => {
        if (!feature || typeof feature !== 'object') {
            throw new Error(`Feature at index ${featureIndex} must be an object`);
        }
        
        if (feature.type !== 'Feature') {
            throw new Error(`Feature at index ${featureIndex} must have type 'Feature'`);
        }
        
        if (!feature.geometry || typeof feature.geometry !== 'object') {
            throw new Error(`Feature at index ${featureIndex} must have a geometry object`);
        }
        
        if (feature.geometry.type !== 'Polygon') {
            throw new Error(`Feature at index ${featureIndex} must have a Polygon geometry`);
        }
        
        if (!Array.isArray(feature.geometry.coordinates)) {
            throw new Error(`Feature at index ${featureIndex} must have coordinates array`);
        }
        
        // Validate polygon rings
        feature.geometry.coordinates.forEach((ring, ringIndex) => {
            if (!Array.isArray(ring)) {
                throw new Error(`Ring ${ringIndex} of feature ${featureIndex} must be an array`);
            }
            
            // Check if polygon has enough points (at least 4 for a closed shape)
            if (ring.length < 4) {
                throw new Error(`Ring ${ringIndex} of feature ${featureIndex} must have at least 4 points to form a valid polygon`);
            }
            
            // Check if polygon is closed (first and last points are identical)
            const firstPoint = ring[0];
            const lastPoint = ring[ring.length - 1];
            
            if (!Array.isArray(firstPoint) || firstPoint.length !== 2 || 
                !Array.isArray(lastPoint) || lastPoint.length !== 2) {
                throw new Error(`Points in ring ${ringIndex} of feature ${featureIndex} must be [longitude, latitude] arrays`);
            }
            
            if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                throw new Error(`Ring ${ringIndex} of feature ${featureIndex} must be closed (first and last points must be identical)`);
            }
            
            // Validate each point in the ring
            ring.forEach((point, pointIndex) => {
                if (!Array.isArray(point) || point.length !== 2) {
                    throw new Error(`Point ${pointIndex} in ring ${ringIndex} of feature ${featureIndex} must be a [longitude, latitude] array`);
                }
                
                const [longitude, latitude] = point;
                
                if (typeof longitude !== 'number' || isNaN(longitude)) {
                    throw new Error(`Longitude of point ${pointIndex} in ring ${ringIndex} of feature ${featureIndex} must be a number`);
                }
                
                if (typeof latitude !== 'number' || isNaN(latitude)) {
                    throw new Error(`Latitude of point ${pointIndex} in ring ${ringIndex} of feature ${featureIndex} must be a number`);
                }
                
                // Check coordinate ranges
                if (longitude < -180 || longitude > 180) {
                    throw new Error(`Longitude of point ${pointIndex} in ring ${ringIndex} of feature ${featureIndex} must be between -180 and 180`);
                }
                
                if (latitude < -90 || latitude > 90) {
                    throw new Error(`Latitude of point ${pointIndex} in ring ${ringIndex} of feature ${featureIndex} must be between -90 and 90`);
                }
            });
        });
    });
}

export function convertToMultiPolygon(featureCollection: FeatureCollection<Polygon>): MultiPolygon {
    const coordinates = featureCollection.features.map(feature => {
        if (!feature.geometry || feature.geometry.type !== 'Polygon') {
            throw new Error('All features must be Polygon features');
        }
        return feature.geometry.coordinates;
    });

    return {
        type: 'MultiPolygon',
        coordinates
    };
}

export interface CircleData {
  radius: number;
  center: [number, number]; 
}

export function createMultiPointFromCircles(circles: CircleData[]): MultiPoint {
    const coordinates = circles.map(circle => circle.center);
    
    return {
        type: 'MultiPoint',
        coordinates
    };
}

export function validateCircles(circles: any[]): asserts circles is CircleData[] {
    if (!Array.isArray(circles)) {
        throw new Error('Circles must be an array');
    }
    
    circles.forEach((circle, index) => {
        if (!circle || typeof circle !== 'object') {
            throw new Error(`Circle at index ${index} must be an object`);
        }
        
        if (typeof circle.radius !== 'number' || circle.radius <= 0) {
            throw new Error(`Circle at index ${index} must have a positive radius`);
        }
        
        if (!Array.isArray(circle.center) || circle.center.length !== 2) {
            throw new Error(`Circle at index ${index} must have a center as [longitude, latitude]`);
        }
        
        if (typeof circle.center[0] !== 'number' || typeof circle.center[1] !== 'number') {
            throw new Error(`Circle at index ${index} must have numeric coordinates`);
        }
        
        if (circle.center[0] < -180 || circle.center[0] > 180) {
            throw new Error(`Circle at index ${index} has invalid longitude (must be between -180 and 180)`);
        }
        
        if (circle.center[1] < -90 || circle.center[1] > 90) {
            throw new Error(`Circle at index ${index} has invalid latitude (must be between -90 and 90)`);
        }
    });
}