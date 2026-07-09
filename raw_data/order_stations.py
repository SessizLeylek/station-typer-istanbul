import csv
import json

# 1. Get input file name from user
file_name = "input.json"

# 2. Read the JSON file
with open(file_name, "r", encoding="utf-8") as f:
    stations = json.load(f)

# 3. Get the ordered station names string from user
# Example input: "Bahçelievler", "Yenibosna", "Otogar"
order_input = input("Enter station names (quoted and comma-separated): ")

# 4. Parse the comma-separated string correctly respecting quotes
raw_order = list(csv.reader([order_input], skipinitialspace=True))[0]
desired_order = [name.strip('" ') for name in raw_order]

# 5. Create a lookup dictionary of the JSON items by their name
station_map = {item["name"]: item for item in stations}

# 6. Reorder items based on the input order
ordered_result = []
for name in desired_order:
    if name in station_map:
        ordered_result.append(station_map[name])

# 7. Identify and append remaining items that were not in the user's order list
ordered_names_set = set(desired_order)
for item in stations:
    if item["name"] not in ordered_names_set:
        ordered_result.append(item)

# 8. Save the sorted list to output.json
with open("output.json", "w", encoding="utf-8") as f:
    json.dump(ordered_result, f, indent=4, ensure_ascii=False)

print("Result saved to output.json")