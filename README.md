# Station Typer — İstanbul

Station Typer: Istanbul is an interactive map-based typing game centered around Istanbul's public transportation network. Players test their speed, accuracy, and knowledge of the city's transit system by typing out the names of transit stations in real-time.

## What the Game Offers?

### Multiple Pool Options

The players can select either one or more of the transit lines of their desire from predefined options or a custom file to include the lines they want in their session.

* **Single Line:** Focus on a specific transit line and choose your starting direction.

* **Single Side:** Practice stations located exclusively on either the European or Anatolian side of Istanbul.

* **All Stations:** A comprehensive mode covering the entire transit system.

* **Custom List:** Upload a text file with a custom comma-separated list of transit lines or stations to build a customized game session.

### Gameplay Options

* **Typing Hints:** Toggle full hints, restrict hints to initial letters only, or hide the hints for a memory challenge.

* **Randomized Order:** Shuffle the sequence of lines and the direction of travel to keep sessions unpredictable.

* **Bilingual Support:** Full interface localization between English and Turkish.

### Performance Metrics

The players also use this as a evaluation of their typing speed with these metrics gathered:

* **WPM (Words Per Minute):** Measures your raw typing speed based on the word count of completed station names.

* **Accuracy:** Displays your precision percentage based on correct keystrokes versus total keystrokes.

* **Time:** Tracks elapsed minutes and seconds since the session countdown ended.

* **Progress:** Shows the number of completed transit lines against the total lines remaining in your current queue.

## How to play with custom pool?

To build a valid custom file for the game, write your desired transit line identifiers as a single-line list of names separated by commas.

The application is case-sensitive and requires exact character matches. Use the following strings exactly as shown:

* **Metro Lines:** `M1A`, `M1B`, `M2`, `M3`, `M4`, `M5`, `M6`, `M7`, `M8`, `M9`, `M11`
* **Tram Lines:** `T1`, `T2`, `T3`, `T4`, `T5`
* **Funicular Lines:** `F1`, `F2`, `F3`, `F4`
* **Cable Car Lines:** `TF1`, `TF2`
* **Other Transit Lines:** `Marmaray`, `B2`, `U3`, `TCDD`, `34G`

### Format Example

Create a plain text file (`.txt`) containing the line identifiers formatted exactly like this:

`M1A, M2, T1, Marmaray, 34G`

And then you can upload it by the *Custom* tab. You can check if it is correctly read by the text under it.

## Included Lines

The game features the following transit lines operating across Istanbul as of July 2026:

* **M1A**, Yenikapı-Atatürk Havalimanı Metro
* **M1B**, Yenikapı-Kirazlı Metro
* **M2**, Yenikapı-Hacıosman Metro
* **M3**, Bakırköy Sahil-Kayaşehir Merkez Metro
* **M4**, Kadıköy-Sabiha Gökçen Havalimanı Metro
* **M5**, Üsküdar-Sultanbeyli Metro
* **M6**, Levent-Boğaziçi Üniversitesi/Hisarüstü Metro
* **M7**, Yıldız-Mahmutbey Metro
* **M8**, Bostancı-Parseller Metro
* **M9**, Ataköy-Olimpiyat Metro
* **M11**, Gayrettepe-İstanbul Havalimanı-Halkalı Metro of TCDD
* **T1**, Kabataş-Bağcılar Tram
* **T2**, Taksim-Tünel Nostalgic Tram of İETT
* **T3**, Kadıköy-Moda Nostalgic Tram
* **T4**, Topkapı-Mescid-i Selam Tram
* **T5**, Eminönü-Alibeyköy Cep Otogarı Tram
* **F1**, Taksim-Kabataş Funicular
* **F2**, Karaköy-Beyoğlu Historic Tunnel of İETT
* **F3**, Seyrantepe-Vadi İstanbul Funicular of Vadiİstanbul AVM
* **F4**, Boğaziçi Üniversitesi/Hisarüstü-Aşiyan Funicular
* **TF1**, Maçka-Taşkışla Cable Car
* **TF2**, Eyüp-Piyer Loti Cable Car
* **Marmaray**, Halkalı-Gebze Suburban Train of TCDD
* **B2**, Halkalı-Bahçeşehir Suburban Train of TCDD
* **U3**, Sirkeci-Kazlıçeşme Rail System of TCDD
* **TCDD**, İstanbul-Çerkezköy Regional Train of TCDD
* **34G**, Beylikdüzü-Söğütlüçeşme Metrobus of İETT

## Licensing & Open Data

This project is built entirely on open-source software and open data. When using, modifying, or redistributing this application, you must adhere to the following license terms:

* **Source Code:** Distributed under the **GPL 3.0** license. You are free to use, modify, and publish the source code, provided that any derivative works are also open-source and licensed under the GPL 3.0.
* **Audio Assets:** Some sound effects are sourced under **CC0 (Public Domain)** or **Creative Commons Attribution 4.0** licenses.
* **Vector Graphics:** All SVG icons are available under the **MIT License**.
* **Map Components:** Map rendering and layout design utilize **OpenStreetMap** data.
* **Geographical Station Data:** Transit station coordinates are gathered and maintained under the **Open Data Commons Open Database License (ODbL)** via OpenStreetMap or the **"İstanbul Büyükşehir Belediyesi Açık Veri Lisansı"** (Istanbul Metropolitan Municipality Open Data License).

You can find detailed information about licenses inside the relative directories.

### Building for Your Own City

Because the project is open, you are encouraged to fork the repository, modify the logic, and swap out the underlying geographic datasets to create an independent version featuring your own city's transit network. Ensure your custom implementation retains the appropriate attributions and matches the copyleft requirements of the GPL 3.0 license.
