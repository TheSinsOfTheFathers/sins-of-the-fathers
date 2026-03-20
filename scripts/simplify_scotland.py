import json
import os
from shapely.geometry import shape, mapping

def simplify_geojson(input_file, output_file, tolerance=0.001):
    print(f"Loading {input_file} for simplification...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    features = data.get('features', [])
    for feature in features:
        geom = shape(feature['geometry'])
        print(f"Original points: {len(str(feature['geometry']))}") # Rough measure
        simplified_geom = geom.simplify(tolerance, preserve_topology=True)
        feature['geometry'] = mapping(simplified_geom)
        print(f"Simplified points: {len(str(feature['geometry']))}")
    
    print(f"Saving simplified version to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f)
    
    size = os.path.getsize(output_file) / (1024 * 1024)
    print(f"Final size: {size:.2f} MB")

if __name__ == "__main__":
    input_path = "public/assets/maps/scotland.geojson"
    # A tolerance of 0.001 is usually good for web maps, it's roughly 100 meters at the equator.
    simplify_geojson(input_path, input_path, tolerance=0.001)
