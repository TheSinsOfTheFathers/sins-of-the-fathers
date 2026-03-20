import json
import os
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

def merge_geojson(input_file, output_file, name_prefix):
    if not os.path.exists(input_file):
        print(f"Skipping {input_file} (not found)")
        return
        
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    features = data.get('features', [])
    geoms = []
    included_names = []
    
    print(f"Processing {len(features)} features...")
    for feature in features:
        geom = shape(feature['geometry'])
        if not geom.is_valid:
            geom = geom.buffer(0)
        geoms.append(geom)
        props = feature.get('properties', {})
        included_names.append(str(props.get('name') or props.get('NAME') or props.get('EER13NM') or props.get('PC_NAME') or 'Unknown'))
    
    print(f"Merging {len(geoms)} geometries for {name_prefix}...")
    merged_geom = unary_union(geoms)
    
    output_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": f"{name_prefix} (Merged)",
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
    merge_geojson("wales_raw.geojson", "public/assets/maps/wales.geojson", "Wales")
    merge_geojson("ni_raw.geojson", "public/assets/maps/northern-ireland.geojson", "Northern Ireland")
