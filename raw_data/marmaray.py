import json

# 1. Define the ordered station list
ordered_names = [
    "Halkalı", "Mustafa Kemal", "Küçükçekmece", "Florya", "Florya Akvaryum", 
    "Yeşilköy", "Yeşilyurt", "Ataköy", "Bakırköy", "Yenimahalle", 
    "Zeytinburnu-Fişekhane", "Kazlıçeşme", "Yenikapı", "Sirkeci", "Üsküdar", 
    "Ayrılık Çeşmesi", "Söğütlüçeşme", "Feneryolu", "Göztepe", "Erenköy", 
    "Suadiye", "Bostancı", "Küçükyalı", "İdealtepe", "Süreyya Plajı", 
    "Maltepe", "Cevizli", "Atalar", "Başak", "Kartal", "Yunus", "Pendik", 
    "Kaynarca", "Tersane", "Güzelyalı", "Aydıntepe", "İçmeler", "Tuzla", 
    "Çayırova", "GTÜ - Fatih", "Osmangazi", "Darıca", "Gebze"
]

# 2. Get the input filename from the user
filename = input("Enter the path to the JSON file: ")

# 3. Read the JSON file
with open(filename, 'r', encoding='utf-8') as f:
    input_data = json.load(f)

# 4. Map existing items by their name for easy lookup
# Only take items that belong to the Marmaray network
marmaray_items = {}
for item in input_data:
    if item.get("network") == "Marmaray":
        marmaray_items[item["name"]] = item

# 5. Build the ordered output list
output_data = []
for name in ordered_names:
    if name in marmaray_items:
        # Item exists: extract data and remove the network field
        existing_item = marmaray_items[name]
        ordered_item = {
            "lat": existing_item["lat"],
            "lon": existing_item["lon"],
            "name": name
        }
        output_data.append(ordered_item)
        # Remove from our lookup dict to track what was used
        del marmaray_items[name]
    else:
        # Item does not exist: create with 0 fields
        zero_item = {
            "lat": 0,
            "lon": 0,
            "name": name
        }
        output_data.append(zero_item)

# 6. Append remaining unused Marmaray elements to the end of the output list
for remaining_item in marmaray_items.values():
    ordered_item = {
        "lat": remaining_item["lat"],
        "lon": remaining_item["lon"],
        "name": remaining_item["name"]
    }
    output_data.append(ordered_item)

# 7. Save the processed data back to a new file
output_filename = "processed_marmaray.json"
with open(output_filename, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=4)

print(f"Processing complete. Output saved to {output_filename}")