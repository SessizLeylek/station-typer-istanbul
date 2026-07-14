# Istanbul Transit Lines and Stations Dataset

This JSON file contains structural and geographical data for transit lines and their stations in Istanbul, Turkey. It maps transit keys to their respective properties and ordered lists of stations.

---

## Schema Documentation

### Lines

Every top-level key (e.g., `"M1A"`, `"M2"`) represents a transit line object.

| Field | Type | Presence | Description |
| --- | --- | --- | --- |
| `name` | String | **Compulsory** | The official designation of the line (e.g., `"M1A"`). |
| `type` | String | **Compulsory** | The mode of transit. Examples: `"metro"`, `"tram"`. |
| `side` | String | **Compulsory** | The geographical side of Istanbul. `"EU"` for Europe, `"AN"` for Anatolia, `"ALL"` for intercontinental lines. |
| `circular` | Boolean | **Compulsory** | `true` if the last stations of the line is directly connected to the first station. |
| `stations` | Array | **Compulsory** | An ordered list of station objects belonging to the line. |

---

### Stations

Each object inside the `stations` array contains the geographical coordinate and connection metadata for a single station.

| Field | Type | Presence | Description |
| --- | --- | --- | --- |
| `name` | String | **Compulsory** | The official name of the station (e.g., `"Yenikapı"`). |
| `lat` | Float | **Compulsory** | Latitude coordinate of the station. |
| `lon` | Float | **Compulsory** | Longitude coordinate of the station. |
| `interlined_with` | Array of Strings | *Optional* | List of sibling lines that share physical tracks and platforms for this segment (e.g., `["M1B"]`). Station and line names must be identical! |
| `branched_from` | String | *Optional* | Name of the junction station where a physical branch splits off (e.g., `"Sanayi Mahallesi"`). Station name must be identical! |

## License and Terms of Use

The geographic coordinates for the transit stations in this dataset were aggregated from two primary sources:

* **OpenStreetMap Data**: Extracted via the Overpass API.
* **IBB Data Portal**: Sourced directly from the Istanbul Metropolitan Municipality open data sets.

By using this data, you agree to comply with the following conditions:

### OpenStreetMap Component (Overpass API)

Data extracted via the Overpass API is licensed under the **Open Data Commons Open Database License (ODbL)**.

* You must credit OpenStreetMap and its contributors. Any derivative database or public use of the data must include a visible attribution notice.
* If you alter, transform, or build upon this data, and choose to publicly distribute the resulting database, you must release your modified version under the same ODbL license.
* You cannot apply technical restrictions to lock down the redistributed database.

### İBB Data Portal Component

Data sourced from the Istanbul Metropolitan Municipality is governed by the **"İstanbul Büyükşehir Belediyesi Açık Veri Lisansı"** (IMM Open Data License).

* You are permitted to use, copy, distribute, transmit, and adapt this data for both commercial and non-commercial purposes.
* You must explicitly acknowledge the Istanbul Metropolitan Municipality as the source of the raw data in your product documentation, application, or metadata.
* The data is provided "as-is" without any explicit or implied warranties regarding accuracy, completeness, or up-to-date status for real-time transit routing.