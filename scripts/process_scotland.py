import json
import os
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

def process_scotland(input_file, output_file, exclude_name):
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    features = data.get('features', [])
    geoms = []
    included_names = []
    
    print(f"Processing {len(features)} features...")
    for feature in features:
        props = feature.get('properties', {})
        name = props.get('NUTS3_NAME', '')
        
        if exclude_name in name:
            print(f"Excluding: {name}")
            continue
        
        geom = shape(feature['geometry'])
        if not geom.is_valid:
            geom = geom.buffer(0)
        geoms.append(geom)
        included_names.append(name)
    
    print(f"Merging {len(geoms)} geometries...")
    merged_geom = unary_union(geoms)
    
    # Simplify slightly to reduce file size if needed, but keeping it detailed for now
    # merged_geom = merged_geom.simplify(0.001, preserve_topology=True)
    
    output_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "Scotland (Merged)",
                    "regions_included": included_names
                },
                "geometry": mapping(merged_geom)
            }
        ]
    }
    
    print(f"Saving to {output_file}...")
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_geojson, f)
    
    print("Done!")

if __name__ == "__main__":
    input_path = "scotland_nuts3.json"
    output_path = "public/assets/maps/scotland.geojson"
    process_scotland(input_path, output_path, "Aberdeen")
