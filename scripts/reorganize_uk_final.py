import json
import os
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

def reorganize_uk():
    # 1. Load Scotland NUTS3
    print("Loading temp_scotland.json...")
    with open('temp_scotland.json', 'r', encoding='utf-8') as f:
        scotland_data = json.load(f)
    
    # 2. Extract Aberdeen
    features = scotland_data.get('features', [])
    aberdeen_geoms = []
    
    print("Extracting Aberdeen...")
    for feature in features:
        props = feature.get('properties', {})
        name = props.get('NUTS3_NAME', '')
        if "Aberdeen" in name:
            print(f"Found: {name}")
            geom = shape(feature['geometry'])
            if not geom.is_valid:
                geom = geom.buffer(0)
            aberdeen_geoms.append(geom)
            
    if not aberdeen_geoms:
        print("Error: Aberdeen not found!")
        return
        
    aberdeen_merged = unary_union(aberdeen_geoms)
    
    # Save aberdeen.geojson
    print("Saving aberdeen.geojson...")
    os.makedirs('public/assets/maps', exist_ok=True)
    with open('public/assets/maps/aberdeen.geojson', 'w', encoding='utf-8') as f:
        json.dump({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Aberdeen Territory"},
                "geometry": mapping(aberdeen_merged)
            }]
        }, f)
        
    # 3. Load UK border
    print("Loading united-kingdom-border.geojson...")
    with open('public/assets/maps/united-kingdom-border.geojson', 'r', encoding='utf-8') as f:
        uk_data = json.load(f)
        
    # 4. Subtract Aberdeen from UK
    print("Subtracting Aberdeen from UK map...")
    uk_geom = shape(uk_data['features'][0]['geometry'])
    if not uk_geom.is_valid:
        uk_geom = uk_geom.buffer(0)
        
    # Difference operation
    # Sometimes buffer(0) is needed before difference if there are invalid topologies
    uk_no_aberdeen = uk_geom.difference(aberdeen_merged)
    
    # Save uk-no-aberdeen.geojson
    print("Saving uk-no-aberdeen.geojson...")
    with open('public/assets/maps/uk-no-aberdeen.geojson', 'w', encoding='utf-8') as f:
        json.dump({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "UK Territory (Excluding Aberdeen)"},
                "geometry": mapping(uk_no_aberdeen)
            }]
        }, f)
        
    print("Done!")

if __name__ == "__main__":
    reorganize_uk()
