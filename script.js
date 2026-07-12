const DEFAULT_LOCATION = [28.9784, 41.0082]
const DEFAULT_ZOOM = 11

const METRO_TYPES = ["metro", "tram", "funicular", "cablecar"] // METRO_TYPES.includes(line.type)

// add string format
String.prototype.format = function (...args) {
    return this.replace(/{(\d+)}/g, (match, number) => {
        return typeof args[number] !== 'undefined' ? args[number] : match;
    });
};

// Initialize the map, centered on Istanbul coordinates
const map = new maplibregl.Map({
    container: 'map',
    // Requesting OpenFreeMap's open-source, keyless style manifest
    style: 'https://tiles.openfreemap.org/styles/bright',
    center: DEFAULT_LOCATION,
    zoom: DEFAULT_ZOOM,

    attributionControl: false,

    // Disable all user interactions
    interactive: false,          // Disables all default handlers
    dragPan: false,              // Disables dragging the map
    scrollZoom: false,           // Disables mouse wheel zooming
    boxZoom: false,              // Disables shift+drag zoom
    dragRotate: false,           // Disables map rotation
    keyboard: false,             // Disables keyboard navigation
    doubleClickZoom: false,      // Disables double click zoom
    touchZoomRotate: false       // Disables pinch/rotate gestures on mobile
});

// Wait until the map engine fetches the base stylesheet
map.on('style.load', () => {
    const layers = map.getStyle().layers;

    layers.forEach(layer => {
        // Identify if the layer handles road data ('highway' or 'tunnel' or 'bridge' designations)
        const isRoad = layer.id.includes('road') ||
            layer.id.includes('highway') ||
            layer.id.includes('tunnel') ||
            layer.id.includes('bridge') ||
            (layer['source-layer'] && layer['source-layer'].includes('transportation'));

        // Check if the layer contains text/icon labels or pinpoints
        const isLabelOrSymbol = layer.type === 'symbol' || layer.id.includes('label');

        if (isRoad && !isLabelOrSymbol) {
            // Ensure roads are clearly visible against the background
            try {
                map.setPaintProperty(layer.id, 'line-color', '#222222');    // ROADS COLOR HERE
                map.setLayoutProperty(layer.id, 'visibility', 'visible');
            } catch (err) {
                console.warn("Error", err);
            }
        } else {
            // Enforce zero visibility on landmasses, water, borders, signs, pins, and names
            map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
    });
});

function moveToNewLocation(location, zoom) {
    map.flyTo({
        center: location,           // New target coordinates (e.g., Besiktas)
        zoom: zoom,                    // New zoom level
        essential: true,             // Ensures animation runs even if user OS has reduced motion enabled
        duration: 500               // Animation duration in milliseconds 
    });
}

function followLine(lineId, stationNdx = 0) {
    const station = LINES[lineId].stations[stationNdx];
    moveToNewLocation([station.lon, station.lat], 14);

    if (LINES[lineId].stations.length > stationNdx + 1) {
        setTimeout(() => followLine(lineId, stationNdx + 1), 1000);
    } else {
        setTimeout(() => moveToNewLocation(DEFAULT_LOCATION, DEFAULT_ZOOM), 1000);
    }
}

// Start Menu Logic

const foregroundPanel = document.getElementById("foreground");
const startMenuPanel = document.getElementById("start-menu");
const gameMenuPanel = document.getElementById("game-menu");
const gameInputField = document.getElementById("game-input-field");
const backButtonField = document.getElementById("back-button-field");

function hideBlur() {
    foregroundPanel.className = "";
}

function showBlur() {
    foregroundPanel.className = "blurred";
}

function hideStartMenu() {
    startMenuPanel.style.display = "none";
}

function showStartMenu() {
    startMenuPanel.style.display = "flex";
}

function hideGameMenu() {
    gameMenuPanel.style.display = "none";
}

function showGameMenu() {
    gameMenuPanel.style.display = "flex";
}

function hideGameInputField() {
    gameInputField.style.display = "none";
    backButtonField.style.display = "flex";
}

function showGameInputField() {
    gameInputField.style.display = "flex";
    backButtonField.style.display = "none";
}

// Start button action
document.getElementById("start-button").addEventListener("click", () => {
    hideBlur();
    hideStartMenu();
    showGameMenu();
    showGameInputField();

    const linesQueue = [];

    const selectedPoolValue = document.querySelector('input[name="pool-options"]:checked').value;
    switch (selectedPoolValue) {
        case "single-line":
            const selectedLineId = document.querySelector('input[name="lines-options"]:checked').value;
            const traverseReverse = document.querySelector('input[name="direction-options"]:checked').value === "reverse";

            linesQueue.push({ name: selectedLineId, reverse: traverseReverse });
            break;
        case "single-side":
            break;
        case "all-stations":
            break;
    }

    Object.entries(LINES).toReversed().forEach(([k, v]) => buildMetroLine(k));
    startGame(linesQueue);
});

// Build single line options
window.addEventListener("load", () => {
    const optionLinesTemplate = (id, checked) => `
            <input type="radio" id="opt-lines-${id.toLowerCase()}" value="${id}" name="lines-options" ${checked ? "checked" : ""}>
            <label for="opt-lines-${id.toLowerCase()}">${id}</label>
            `;

    const optionLines = document.getElementById("option-lines");
    let newInnerHTML = "";
    let checkedOnce = false;
    Object.entries(LINES).forEach(([id, line]) => {
        newInnerHTML += optionLinesTemplate(line.name, !checkedOnce);
        checkedOnce = true;
    });
    optionLines.innerHTML = newInnerHTML;

    const labelDirectionNormal = document.getElementById("opt-direction-normal").nextElementSibling;
    const labelDirectionInverse = document.getElementById("opt-direction-inverse").nextElementSibling;
    const updateDirectionsForLine = (lineId) => {
        const stations = LINES[lineId].stations;
        labelDirectionNormal.textContent = stations[0].name;
        labelDirectionInverse.textContent = stations[stations.length - 1].name;
    };

    updateDirectionsForLine(Object.keys(LINES)[0]);
    optionLines.addEventListener("change", (event) => updateDirectionsForLine(event.target.value));
});

const optionPool = document.getElementById("option-pool");

// Change visibilty of all options
document.body.style.setProperty("--chosen-pool", "single-line");
optionPool.addEventListener("change", (event) => {
    document.body.style.setProperty("--chosen-pool", event.target.value);
});

// GAMEPLAY
const gameState = {
    isActive: false,

    // config variable
    linesQueue: [{ name: "", reverse: false }],

    // progress variables
    isLineReversed: false,
    currentStationNdx: 0,
    currentLineNdx: 0,
    maxStationCount: 0,

    // gameplay variables
    totalTypes: 0,
    correctTypes: 0,
    wordsTyped: 0,
    startTime: 0,
}

function getCurrentLineInfo() {
    return LINES[gameState.linesQueue[gameState.currentLineNdx].name];
}

function getCurrentStationInfo() {
    const stationInfo = structuredClone(getCurrentLineInfo().stations[gameState.currentStationNdx]);

    // Use alias for long station names
    if (stationInfo.name in STATION_NAME_ALIASES) {
        stationInfo.name = STATION_NAME_ALIASES[stationInfo.name];
    }

    return stationInfo;
}

// Game starting
function startGame(linesQueue) {
    gameState.isActive = true;

    gameState.linesQueue = linesQueue;

    gameState.totalTypes = 0;
    gameState.correctTypes = 0;
    gameState.wordsTyped = 0;
    gameState.startTime = performance.now();

    gameState.currentLineNdx = -1;
    tryContinueWithNextLine();

    tickGameTime();
    moveMapToTheCurrentStation();
}

function tryContinueWithNextLine() {
    gameState.currentLineNdx++;
    updateProgressInfo();

    if (gameState.currentLineNdx >= gameState.linesQueue.length) {
        gameState.isActive = false;
        return false;
    }

    gameState.maxStationCount = LINES[gameState.linesQueue[gameState.currentLineNdx].name].stations.length;

    gameState.isLineReversed = gameState.linesQueue[gameState.currentLineNdx].reverse;
    if (gameState.isLineReversed) {
        gameState.currentStationNdx = gameState.maxStationCount - 1;
    } else {
        gameState.currentStationNdx = 0;
    }

    buildMetroScheme(gameState.linesQueue[gameState.currentLineNdx].name);

    return true;
}

function tryContinueWithNextStation() {
    const wordCount = getCurrentStationInfo().name.split(/[ \/\-]+/).length;
    gameState.wordsTyped += wordCount;
    updateWpmInfo();

    updateSchemeProgress();

    if (gameState.isLineReversed) {
        gameState.currentStationNdx--;
        if (gameState.currentStationNdx < 0) {
            return tryContinueWithNextLine();
        }
    } else {
        gameState.currentStationNdx++;
        if (gameState.currentStationNdx >= gameState.maxStationCount) {
            return tryContinueWithNextLine();
        }
    }

    return true;
}

// calculate distance
function getDistance(p0, p1) {
    const nm0 = 84.013 * (p0[0] - p1[0]);
    const nm1 = 111.13 * (p0[1] - p1[1]);
    return Math.sqrt(nm0 * nm0 + nm1 * nm1);
}

// fly towards the current station
function moveMapToTheCurrentStation() {
    let otherLocation = [0, 0];
    if (gameState.currentStationNdx <= 0) {
        let otherStationNdx = 1;
        if (getCurrentLineInfo().circular === true) {
            otherStationNdx = gameState.maxStationCount - 1;
        }

        const otherStation = getCurrentLineInfo().stations[otherStationNdx];
        otherLocation[0] = otherStation.lon;
        otherLocation[1] = otherStation.lat;
    } else if (gameState.currentStationNdx >= gameState.maxStationCount - 1) {
        let otherStationNdx = gameState.maxStationCount - 2;
        if (getCurrentLineInfo().circular === true) {
            otherStationNdx = 0;
        }

        const otherStation = getCurrentLineInfo().stations[otherStationNdx];
        otherLocation[0] = otherStation.lon;
        otherLocation[1] = otherStation.lat;
    } else {
        const nextIndex = gameState.isLineReversed ? -1 : 1;
        const otherStation = getCurrentLineInfo().stations[gameState.currentStationNdx + nextIndex];
        otherLocation[0] = otherStation.lon;
        otherLocation[1] = otherStation.lat;
    }

    const currentLocation = [getCurrentStationInfo().lon, getCurrentStationInfo().lat];
    const calculatedZoom = -Math.log2(2 * getDistance(currentLocation, otherLocation) / 40_000);
    moveToNewLocation(currentLocation, calculatedZoom);
}

// Game info table updates
const gameWpmInfo = document.getElementById("ginfo-wpm");
const gameTimeInfo = document.getElementById("ginfo-time");
const gameAccuracyInfo = document.getElementById("ginfo-acc");
const gameProgressInfo = document.getElementById("ginfo-prog");

function getGameplayElapsedSeconds() {
    const msecsToSecs = 1_000;
    const elapsedSeconds = (performance.now() - gameState.startTime) / msecsToSecs;
    return elapsedSeconds;
}

function tickGameTime() {
    if (!gameState.isActive) return;

    updateTimeInfo();
    setTimeout(tickGameTime, 500);
}

function updateWpmInfo() {
    gameWpmInfo.textContent = (gameState.wordsTyped / getGameplayElapsedSeconds() * 60).toFixed(1);
}

function updateTimeInfo() {
    const mins = Math.floor(getGameplayElapsedSeconds() / 60).toString().padStart(2, '0');
    const secs = Math.floor(getGameplayElapsedSeconds() % 60).toString().padStart(2, '0');
    gameTimeInfo.textContent = `${mins}:${secs}`;
}

function updateAccuracyInfo() {
    gameAccuracyInfo.textContent = "{0}%".format(((gameState.correctTypes / gameState.totalTypes) * 100).toFixed(2));;
}

function updateProgressInfo() {
    const totalLines = gameState.linesQueue.length;
    const completedLines = gameState.currentLineNdx;
    gameProgressInfo.textContent = `${completedLines}/${totalLines}`;
}

// back button functionality
const backButton = document.getElementById("back-button");
backButton.addEventListener("click", () => {
    showBlur();
    showStartMenu();
    hideGameMenu();

    deconstructMetroLines();
});

// render input text with input
const inputField = document.getElementById("game-input");
const inputText = document.getElementById("game-input-text");
inputField.addEventListener("input", () => {
    if (!gameState.isActive) return;

    let result = checkInputAndRenderText();
    alignInputWithText();

    if (result) {
        inputField.value = "";

        const gameContinues = tryContinueWithNextStation();
        if (gameContinues) {
            moveMapToTheCurrentStation();
        } else {
            moveToNewLocation(DEFAULT_LOCATION, DEFAULT_ZOOM);
            hideGameInputField();
        }
    }
});

// register accuracy on input
inputField.addEventListener("beforeinput", (event) => {
    if (event.data == null) return;

    const targetText = getCurrentStationInfo().name;
    let cursorPosition = inputField.selectionStart;

    for (c of event.data) {
        gameState.totalTypes++;
        if (targetText.at(cursorPosition) === c) {
            gameState.correctTypes++;
        }

        cursorPosition++;
    }

    updateAccuracyInfo();
});

// rerender cursor movement
document.addEventListener("selectionchange", () => {
    if (!gameState.isActive) return;
    if (document.activeElement === inputField) {
        checkInputAndRenderText();
    }
});

// Automatically put us in the input field
document.addEventListener("click", (event) => {
    if (!gameState.isActive) return;
    if (event.target === inputField) return;

    inputField.focus();
    const length = inputField.value.length;
    inputField.setSelectionRange(length, length);
});

// render full text and compare with the target
function checkInputAndRenderText() {
    let identical = true;
    let builtText = "<span>";
    const targetText = getCurrentStationInfo().name;

    const inputtedText = inputField.value;
    const cursorPosition = inputField.selectionStart;

    let i = 0;
    let currentColor = "white";
    while (i < targetText.length) {
        const cursorHere = (cursorPosition === i) && (document.activeElement === inputField);

        // Check if input text is over then render rest gray
        if (inputtedText.length <= i) {
            currentColor = "gray";

            if (cursorHere) {
                builtText += "</span><span style='color:#999;background-color:#fff3'>" + targetText.at(i) +
                    "</span><span style='color:#999'>" + targetText.substring(i + 1) + "</span>";
            } else {
                builtText += "</span><span style='color:#999'>" + targetText.substring(i) + "</span>";
            }

            identical = false;

            break;
        }

        // Check if input equals target then render white
        if (targetText.at(i) === inputtedText.at(i)) {
            if (currentColor !== "white") {
                currentColor = "white";
                builtText += "</span><span>";
            }

            if (cursorHere) {
                builtText += "<span style='background-color:#fff3'>";
            }
        }
        // Otherwise render red
        else {
            if (currentColor !== "red") {
                currentColor = "red";
                builtText += "</span><span style='background-color:#d008'>";

                identical = false;
            }

            if (cursorHere) {
                builtText += "<span style='background-color:#fff3'>";
            }
        }

        builtText += inputtedText.at(i);
        if (cursorHere) {
            builtText += "</span>";
        }

        i++;
    }

    // delete remaining
    if (i < inputtedText.length) {
        inputField.value = inputField.value.substring(0, i);
        identical = false;
    }
    inputText.innerHTML = builtText;

    return identical;
}

function alignInputWithText() {
    // align input with text
    setTimeout(() => {
        const inputTextPosition = inputText.getBoundingClientRect();
        inputField.style.left = `${inputTextPosition.left}px`;
    }, 100);
}

//checkInputAndRenderText();
window.addEventListener("load", alignInputWithText);
window.addEventListener("resize", alignInputWithText);

// Game metro scheme
const metroScheme = document.getElementById("metro-scheme");
const stationsRow = document.getElementById("stations-row");
function buildMetroScheme(lineId) {
    const stationPointTemplate = (progress) => `
            <div class="station" style="left: ${progress}%;">
            <span class="station-dot"></span>
            </div>
            `;

    let stationRowInnerHtml = "";

    // --active-color, --inactive-color, --connections, --progress

    const stationCount = LINES[lineId].stations.length;

    metroScheme.style.setProperty("--active-color", colorFromHex(LINE_COLORS[lineId]));
    metroScheme.style.setProperty("--inactive-color", colorBrightFromHex(LINE_COLORS[lineId]));
    metroScheme.style.setProperty("--progress", "0%");
    metroScheme.style.setProperty("--connections", stationCount - 1);

    for (let i = 0; i < stationCount; i++) {
        stationRowInnerHtml += stationPointTemplate(i / (stationCount - 1) * 100);
    }
    stationsRow.innerHTML = stationRowInnerHtml;
}

function updateSchemeProgress() {
    const nodeNdx = gameState.isLineReversed ? gameState.maxStationCount - gameState.currentStationNdx - 1 : gameState.currentStationNdx;
    const progression = nodeNdx / (gameState.maxStationCount - 1) * 100;

    metroScheme.style.setProperty("--progress", `${progression}%`);
    setTimeout(() => stationsRow.children[nodeNdx].classList.add("visited"), 100);
}

// colors
function colorFromHex(hexInt) {
    return '#' + hexInt.toString(16).padStart(6, '0')
}
function colorBrightFromHex(hexInt) {
    const r = (hexInt >> 16) & 0xFF;
    const g = (hexInt >> 8) & 0xFF;
    const b = hexInt & 0xFF;
    const br = ((0xFF - r) >> 1) + r;
    const bg = ((0xFF - g) >> 1) + g;
    const bb = ((0xFF - b) >> 1) + b;

    return '#' + ((br << 16) | (bg << 8) | bb).toString(16).padStart(6, '0');
}

// Build metro line
const additionalMapData = {}
function buildMetroLine(lineId) {
    if (!(lineId in LINES)) {
        console.error("Wrong Line ID given:", lineId);
        return;
    }

    // Generate lines and branching lines
    const lineFeatures = [];
    let tempLineCoordinates = [];
    const pushCoordinatesToLineFeatures = () => {
        lineFeatures.push(
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": tempLineCoordinates
                },
                "properties": {}
            });
        tempLineCoordinates = [];
    };

    for (const station of LINES[lineId].stations) {
        if (station.branched_from) {
            pushCoordinatesToLineFeatures();

            const branchHead = LINES[lineId].stations.find((st) => st.name === station.branched_from);
            tempLineCoordinates.push([branchHead.lon, branchHead.lat]);
        }

        tempLineCoordinates.push([station.lon, station.lat]);
    }
    if (LINES[lineId].circular === true) {
        tempLineCoordinates.push([LINES[lineId].stations[0].lon, LINES[lineId].stations[0].lat]);
    }
    pushCoordinatesToLineFeatures();

    // Generate data for the map
    const mapLineData = {
        "type": "FeatureCollection",
        "features": lineFeatures
    }

    // Unvisited station points
    const mapHollowPointData = {
        "type": "Feature",
        "geometry": {
            "type": "MultiPoint",
            "coordinates": LINES[lineId].stations.map((station) => [station.lon, station.lat])
        },
        "properties": {}
    }

    // Visited station points
    const mapFilledPointData = {
        "type": "Feature",
        "geometry": {
            "type": "MultiPoint",
            "coordinates": []
        },
        "properties": {}
    }

    const lineColor = colorFromHex(LINE_COLORS[lineId]);
    const brightLineColor = colorBrightFromHex(LINE_COLORS[lineId]);

    // Register
    const lineLayerIdentifier = 'lines-' + lineId;
    const hollowPointLayerIdentifier = 'hpoints-' + lineId;
    const filledPointLayerIdentifier = 'fpoints-' + lineId;
    map.addSource(lineLayerIdentifier, {
        'type': 'geojson',
        'data': mapLineData
    });

    map.addSource(hollowPointLayerIdentifier, {
        'type': 'geojson',
        'data': mapHollowPointData
    });

    map.addSource(filledPointLayerIdentifier, {
        'type': 'geojson',
        'data': mapFilledPointData
    });

    additionalMapData[lineLayerIdentifier] = mapLineData;
    additionalMapData[hollowPointLayerIdentifier] = mapHollowPointData;
    additionalMapData[filledPointLayerIdentifier] = mapFilledPointData;

    // Add line layer
    map.addLayer({
        'id': lineLayerIdentifier,
        'type': 'line',
        'source': lineLayerIdentifier,
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': lineColor,
            'line-width': 4
        }
    });

    // Add point layers
    map.addLayer({
        'id': hollowPointLayerIdentifier,
        'type': 'circle',
        'source': hollowPointLayerIdentifier,
        'paint': {
            // Inner circle sizing and styling
            'circle-radius': 6,
            'circle-color': brightLineColor, // inner fill

            // Border configuration (Stroke)
            'circle-stroke-width': 3,       // Thickness of the border in pixels
            'circle-stroke-color': lineColor // Color of the border
        }
    });

    map.addLayer({
        'id': filledPointLayerIdentifier,
        'type': 'circle',
        'source': filledPointLayerIdentifier,
        'paint': {
            // Inner circle sizing and styling
            'circle-radius': 6,
            'circle-color': lineColor, // inner fill

            // Border configuration (Stroke)
            'circle-stroke-width': 3,       // Thickness of the border in pixels
            'circle-stroke-color': lineColor // Color of the border
        }
    });
}

function deconstructMetroLines() {
    Object.entries(additionalMapData).forEach(([k, v]) => {
        if (map.getLayer(k)) {
            map.removeLayer(k);
        }
        if (map.getSource(k)) {
            map.removeSource(k);
        }
    });
}
