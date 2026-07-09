import json

# 1. M11 istasyonlarının sıralı listesini tanımlayın
ordered_names = [
    "Gayrettepe", "Kâğıthane", "Hasdal", "Kemerburgaz", "Göktürk", "İhsaniye", 
    "Terminal 2", "İstanbul Havalimanı", "Kargo Terminali", "Taşoluk", 
    "Arnavutköy Hastane", "İbn Haldun Üniversitesi", "Kayaşehir", "Olimpiyatköy", 
    "Halkalı Stadı", "Halkalı"
]

# 2. Kullanıcıdan JSON dosyasının adını isteyin
filename = input("JSON dosyasının yolunu girin: ")

# 3. JSON dosyasını okuyun
with open(filename, 'r', encoding='utf-8') as f:
    input_data = json.load(f)

# 4. Sadece "M11" ağına ait olan elemanları eşleştirme sözlüğüne alın
m11_items = {}
for item in input_data:
    if item.get("network") == "M11":
        m11_items[item["name"]] = item

# 5. Sıralı çıktı listesini oluşturun
output_data = []
for name in ordered_names:
    if name in m11_items:
        # Eleman mevcut: verileri alın ve network alanını kaldırın
        existing_item = m11_items[name]
        ordered_item = {
            "lat": existing_item["lat"],
            "lon": existing_item["lon"],
            "name": name
        }
        output_data.append(ordered_item)
        # Kullanılan elemanı takipten çıkarmak için sözlükten silin
        del m11_items[name]
    else:
        # Eleman mevcut değil: 0 alanları ile oluşturun
        zero_item = {
            "lat": 0,
            "lon": 0,
            "name": name
        }
        output_data.append(zero_item)

# 6. Listede olmayan ama M11 ağına ait olan kalan elemanları listenin sonuna ekleyin
for remaining_item in m11_items.values():
    ordered_item = {
        "lat": remaining_item["lat"],
        "lon": remaining_item["lon"],
        "name": remaining_item["name"]
    }
    output_data.append(ordered_item)

# 7. İşlenen verileri yeni bir dosyaya kaydedin
output_filename = "processed_m11.json"
with open(output_filename, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=4)

print(f"İşlem tamamlandı. Çıktı {output_filename} dosyasına kaydedildi.")