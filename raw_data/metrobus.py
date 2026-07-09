import json
import re
from turkish_string import title_tr


def process_stop_data(input_filename, output_filename):
    # Load your existing JSON data
    with open(input_filename, "r", encoding="utf-8") as f:
        data = json.load(f)

    # If the input data has a top-level dict like {"stops": [...]}, extract the list
    if isinstance(data, dict) and "stops" in data:
        stops_list = data["stops"]
    elif isinstance(data, dict) and "line" in data:
        # Fallback if structure varies
        stops_list = data.get("stops", [])
    else:
        stops_list = data

    processed_stops = []
    processed_stop_names = []

    # Regex to extract numeric coordinate components from 'POINT (lon lat)'
    coord_pattern = re.compile(r"POINT\s*\(\s*([0-9.]+)\s+([0-9.]+)\s*\)")

    for stop in stops_list:
        # Drop elements that do not have "DURAK_TIPI": "ISTASYON"
        if stop.get("DURAK_TIPI") != "ISTASYON":
            continue
        if stop.get("SYON") not in ["SÖĞÜTLÜÇEŞME", "AVCILAR", "BEYLİKDÜZÜ", "BEYLIKDÜZÜ", "CEVİZLİBAĞ", "CEVIZLIBAĞ", "ZİNCİRLİKUYU", "ZINCIRLIKUYU", "SON DURAK"]:
            continue

        raw_name = stop.get("SDURAKADI", "")
        raw_coord = stop.get("KOORDINAT", "")

        name = title_tr(raw_name.replace(" - ", "-").strip())

        if name in processed_stop_names:
            continue

        # Parse longitude and latitude from the POINT string format
        lon = None
        lat = None
        match = coord_pattern.match(raw_coord)
        if match:
            # WGS84 format standard: POINT (Longitude Latitude)
            lon = float(match.group(1))
            lat = float(match.group(2))

        # Build clean element keeping only the requested fields
        clean_stop = {"name": name, "lat": lat, "lon": lon}
        processed_stops.append(clean_stop)
        processed_stop_names.append(name)

    sorted_stops = sorted(processed_stops, key=lambda x: x["lon"], reverse=True)

    # Save processed array to target file
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(sorted_stops, f, ensure_ascii=False, indent=4)


if __name__ == "__main__":
    # Replace these filenames with your actual local file paths
    process_stop_data(
        "all_iett.json", "clean_34g.json"
    )