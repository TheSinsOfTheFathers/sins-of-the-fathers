import json
import os
import topojson
from shapely.geometry import shape, mapping, Point
from shapely.ops import unary_union

def process_and_merge():
    # 1. Load Scotland (GeoJSON)
    print("Loading Scotland...")
    with open('temp_sco.json', 'r', encoding='utf-8') as f:
        sco_data = json.load(f)
    
    sco_features = sco_data.get('features', [])
    aberdeen_geoms = []
    fraser_geoms = []
    rest_sco_geoms = []
    
    # Fraser Clan region keywords
    fraser_keywords = ["edinburgh", "lothian", "scottish borders"]
    
    for feature in sco_features:
        props = feature.get('properties', {})
        name = props.get('NUTS3_NAME', '')
        geom = shape(feature['geometry'])
        if not geom.is_valid: geom = geom.buffer(0)
        
        name_lower = name.lower()
        if "aberdeen" in name_lower:
            print(f"Assigning Aberdeen: {name}")
            aberdeen_geoms.append(geom)
        elif any(kw in name_lower for kw in fraser_keywords):
            print(f"Extracting Fraser Clan Region: {name}")
            fraser_geoms.append(geom)
        else:
            # Everything else (including Highlands) goes to Ravenwood
            rest_sco_geoms.append(geom)

    # 2. Load Northern Ireland (GeoJSON)
    print("Loading Northern Ireland...")
    with open('temp_ni.json', 'r', encoding='utf-8') as f:
        ni_data = json.load(f)
    ni_geoms = [shape(feat['geometry']).buffer(0) for feat in ni_data['features'] if feat['geometry']]

    # 3. Load and Convert Wales (TopoJSON)
    print("Converting Wales...")
    with open('temp_wal.json', 'r', encoding='utf-8') as f:
        wal_topo = json.load(f)
    
    obj_name = list(wal_topo['objects'].keys())[0]
    topo = topojson.Topology(wal_topo, object_name=obj_name)
    wal_geo = topo.to_geojson()
    if isinstance(wal_geo, str): wal_geo = json.loads(wal_geo)
    wal_geoms = [shape(f['geometry']).buffer(0) for f in wal_geo['features'] if f['geometry']]

    # 4. Load and Convert England (TopoJSON)
    print("Converting England...")
    with open('temp_eng.json', 'r', encoding='utf-8') as f:
        eng_topo = json.load(f)
    
    obj_name = list(eng_topo['objects'].keys())[0]
    topo = topojson.Topology(eng_topo, object_name=obj_name)
    eng_geo = topo.to_geojson()
    if isinstance(eng_geo, str): eng_geo = json.loads(eng_geo)
    
    eng_geoms = []
    for f in eng_geo['features']:
        if not f['geometry']: continue
        geom = shape(f['geometry']).buffer(0)
        name = f.get('properties', {}).get('EER13NM', '')
        if name == 'London':
            # London is excluded (shows plain map style)
            continue
        else:
            eng_geoms.append(geom)

    # 5. Preliminary Merges
    print("Merging regions...")
    ravenwood_merged = unary_union(rest_sco_geoms + ni_geoms + wal_geoms + eng_geoms)
    fraser_merged = unary_union(fraser_geoms)
    
    # 6. Specific Adjustments (Hawick remove, Berwick add)
    print("Applying Hawick/Berwick adjustments...")
    
    # Hawick (Remove from Fraser, Add to Ravenwood)
    # Approx 4km radius
    hawick_area = Point(-2.783, 55.424).buffer(0.04)
    hawick_piece = fraser_merged.intersection(hawick_area)
    fraser_merged = fraser_merged.difference(hawick_piece)
    ravenwood_merged = ravenwood_merged.union(hawick_piece)
    
    # Berwick-upon-Tweed (Add to Fraser from Ravenwood)
    # Approx 4km radius
    berwick_area = Point(-2.007, 55.773).buffer(0.04)
    berwick_piece = ravenwood_merged.intersection(berwick_area)
    ravenwood_merged = ravenwood_merged.difference(berwick_piece)
    fraser_merged = fraser_merged.union(berwick_piece)

    # Simplify to keep file size down
    ravenwood_simplified = ravenwood_merged.simplify(0.005)
    fraser_simplified = fraser_merged.simplify(0.005)

    # 7. Save Files
    print("Saving GeoJSON files...")
    os.makedirs('public/assets/maps', exist_ok=True)
    
    # united-kingdom-main.geojson
    with open('public/assets/maps/united-kingdom-main.geojson', 'w', encoding='utf-8') as f:
        json.dump({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "UK Territory (Ravenwood Empire)"},
                "geometry": mapping(ravenwood_simplified)
            }]
        }, f)

    # edinburgh.geojson (Fraser Clan)
    with open('public/assets/maps/edinburgh.geojson', 'w', encoding='utf-8') as f:
        json.dump({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Edinburgh, Lothians & Borders (Fraser Clan)"},
                "geometry": mapping(fraser_simplified)
            }]
        }, f)

    # aberdeen.geojson (MacPherson Clan)
    aberdeen_merged = unary_union([g.buffer(0) for g in aberdeen_geoms])
    with open('public/assets/maps/aberdeen.geojson', 'w', encoding='utf-8') as f:
        json.dump({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Aberdeen Territory (MacPherson Clan)"},
                "geometry": mapping(aberdeen_merged)
            }]
        }, f)

    print("Cleanup...")
    for f in ['temp_sco.json', 'temp_ni.json', 'temp_wal.json', 'temp_eng.json']:
        if os.path.exists(f): os.remove(f)
    print("Done!")

if __name__ == "__main__":
    process_and_merge()
