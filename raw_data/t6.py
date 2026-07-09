import json

# 1. Sıralı istasyon listesini tanımlayın
ordered_names = [
    "Sirkeci", "Cankurtaran", "Kumkapı", "Yenikapı", 
    "Cerrahpaşa", "Kocamustafapaşa", "Yedikule", "Kazlıçeşme"
]

# 2. Kullanıcıdan JSON dosyasının adını isteyin
filename = input("JSON dosyasının yolunu girin: ")

# 3. JSON dosyasını okuyun
with open(filename, 'r', encoding='utf-8') as f:
    input_data = json.load(f)

# 4. İstasyonları isimlerine göre gruplayın (İsim çakışmalarını çözmek için)
# Ağ alanı "Türkiye Cumhuriyeti Devlet Demiryolları" olan istasyona öncelik verilir
station_map = {}
for item in input_data:
    name = item["name"]
    network = item.get("network")
    
    # İstasyon daha önce eklenmediyse veya mevcut istasyonun ağı "Türkiye Cumhuriyeti Devlet Demiryolları" değilse güncelleyin
    if name not in station_map:
        station_map[name] = item
    elif network == "Türkiye Cumhuriyeti Devlet Demiryolları":
        station_map[name] = item

# 5. Sıralı çıktı listesini oluşturun
output_data = []
for name in ordered_names:
    if name in station_map:
        # Eleman mevcut: verileri alın ve network alanını kaldırın
        existing_item = station_map[name]
        ordered_item = {
            "lat": existing_item["lat"],
            "lon": existing_item["lon"],
            "name": name
        }
        output_data.append(ordered_item)
        # Kullanılan elemanı takipten çıkarmak için sözlükten silin
        del station_map[name]
    else:
        # Eleman mevcut değil: 0 alanları ile oluşturun
        zero_item = {
            "lat": 0,
            "lon": 0,
            "name": name
        }
        output_data.append(zero_item)

# 6. Listede olmayan ama ağ listesinde kalan diğer tüm elemanları (TCDD olan/olmayan) listenin sonuna ekleyin
for remaining_item in station_map.values():
    ordered_item = {
        "lat": remaining_item["lat"],
        "lon": remaining_item["lon"],
        "name": remaining_item["name"]
    }
    output_data.append(ordered_item)

# 7. İşlenen verileri yeni bir dosyaya kaydedin
output_filename = "processed_tcdd.json"
with open(output_filename, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=4)

print(f"İşlem tamamlandı. Çıktı {output_filename} dosyasına kaydedildi.")