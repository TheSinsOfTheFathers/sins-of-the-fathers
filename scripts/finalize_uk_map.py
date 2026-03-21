import json
import os
import topojson
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

def process_and_merge():
    # 1. Load Scotland (GeoJSON)
    print("Loading Scotland...")
    with open('temp_sco.json', 'r', encoding='utf-8') as f:
        sco_data = json.load(f)
    
    sco_features = sco_data.get('features', [])
    aberdeen_geoms = []
    rest_sco_geoms = []
    
    for feature in sco_features:
        props = feature.get('properties', {})
        name = props.get('NUTS3_NAME', '')
        geom = shape(feature['geometry'])
        if not geom.is_valid: geom = geom.buffer(0)
        
        if "Aberdeen" in name:
            print(f"Assigning Aberdeen: {name}")
            aberdeen_geoms.append(geom)
        else:
            rest_sco_geoms.append(geom)

    # 2. Load and Convert Wales (TopoJSON)
    print("Converting Wales...")
    with open('temp_wal.json', 'r', encoding='utf-8') as f:
        wal_topo = json.load(f)
    
    # Get the object key (usually 'eer' or 'data')
    obj_name = list(wal_topo['objects'].keys())[0]
    topo = topojson.Topology(wal_topo, object_name=obj_name)
    wal_geo = topo.to_geojson()
    if isinstance(wal_geo, str): wal_geo = json.loads(wal_geo)
    wal_geoms = [shape(f['geometry']) for f in wal_geo['features'] if f['geometry']]

    # 3. Load and Convert England (TopoJSON)
    print("Converting England...")
    with open('temp_eng.json', 'r', encoding='utf-8') as f:
        eng_topo = json.load(f)
    
    obj_name = list(eng_topo['objects'].keys())[0]
    topo = topojson.Topology(eng_topo, object_name=obj_name)
    eng_geo = topo.to_geojson()
    if isinstance(eng_geo, str): eng_geo = json.loads(eng_geo)
    
    eng_geoms = []
    london_geoms = []
    for f in eng_geo['features']:
        if not f['geometry']: continue
        geom = shape(f['geometry'])
        name = f.get('properties', {}).get('EER13NM', '')
        if name == 'London':
            print("Extracting London...")
            london_geoms.append(geom)
        else:
            eng_geoms.append(geom)

    # 4. Merge Everything for Ravenwood
    print("Merging GB territories (minus Aberdeen and London)...")
    all_ravenwood_geoms = [g.buffer(0) for g in (rest_sco_geoms + wal_geoms + eng_geoms) if g.is_valid or g.buffer(0).is_valid]
    
    try:
        ravenwood_merged = unary_union(all_ravenwood_geoms)
    except Exception as e:
        print(f"Union failed: {e}. Trying fallback...")
        ravenwood_merged = all_ravenwood_geoms[0]
        for g in all_ravenwood_geoms[1:]:
            try:
                ravenwood_merged = ravenwood_merged.union(g)
            except:
                continue

    # Simplify slightly to keep file size down
    ravenwood_simplified = ravenwood_merged.simplify(0.005)

    # 5. Save Files
    print("Saving GeoJSON files...")
    os.makedirs('public/assets/maps', exist_ok=True)
    
    # uk-no-london.geojson (Previously uk-no-aberdeen)
    with open('public/assets/maps/uk-custom.geojson', 'w', encoding='utf-8') as f:
        json.dump({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "UK Territory (Excluding Aberdeen & London)"},
                "geometry": mapping(ravenwood_simplified)
            }]
        }, f)

    # london.geojson
    london_merged = unary_union([g.buffer(0) for g in london_geoms])
    with open('public/assets/maps/london.geojson', 'w', encoding='utf-8') as f:
        json.dump({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "London Territory"},
                "geometry": mapping(london_merged)
            }]
        }, f)

    # aberdeen.geojson
    aberdeen_merged = unary_union([g.buffer(0) for g in aberdeen_geoms])
    with open('public/assets/maps/aberdeen.geojson', 'w', encoding='utf-8') as f:
        json.dump({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Aberdeen Territory"},
                "geometry": mapping(aberdeen_merged)
            }]
        }, f)

    print("Cleanup...")
    for f in ['temp_sco.json', 'temp_wal.json', 'temp_eng.json']:
        if os.path.exists(f): os.remove(f)
    print("Done!")

if __name__ == "__main__":
    process_and_merge()
