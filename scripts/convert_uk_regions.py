import json
import os
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
import topojson

def topo_to_merged_geojson(input_file, output_file, name_prefix):
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        topology_data = json.load(f)
    
    # Rename first object to 'data' to satisfy the library's default
    object_names = list(topology_data.get('objects', {}).keys())
    if not object_names:
        print(f"No objects found in {input_file}")
        return
    
    orig_name = object_names[0]
    if orig_name != 'data':
        print(f"Renaming object '{orig_name}' to 'data'...")
        topology_data['objects']['data'] = topology_data['objects'].pop(orig_name)
    
    try:
        # Create Topology object
        tj = topojson.Topology(topology_data)
        geojson = tj.to_geojson()
        
        # Now the library should have used 'data'
        features = geojson.get('features', [])
            
    except Exception as e:
        print(f"Topojson conversion failed: {e}")
        return

    geoms = []
    included_names = []
    
    print(f"Processing {len(features)} features...")
    for feature in features:
        geom = shape(feature['geometry'])
        if not geom.is_valid:
            geom = geom.buffer(1e-9) # Tiny buffer to fix issues if needed
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
    topo_to_merged_geojson("wales_topo.json", "public/assets/maps/wales.geojson", "Wales")
    topo_to_merged_geojson("ni_topo.json", "public/assets/maps/northern-ireland.geojson", "Northern Ireland")
