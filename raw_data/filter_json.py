import json

filename = input("Input File Name: ")

# Read the raw JSON data from file
with open(filename, "r", encoding="utf-8") as f:
    data = json.load(f)

filtered_elements = []

# Process each element in the array
for element in data.get("elements", []):
    tags = element.get("tags", {})

    # Exclude elements that match the subway_entrance tag
    if tags.get("railway") == "subway_entrance":
        continue

    # Extract only the requested fields
    filtered_item = {
        "lat": element.get("lat"),
        "lon": element.get("lon"),
        "name": tags.get("name"),
        "network": tags.get("network"),
    }

    filtered_elements.append(filtered_item)

# Save the clean output to a new file
with open("output.json", "w", encoding="utf-8") as f:
    json.dump(filtered_elements, f, indent=4, ensure_ascii=False)