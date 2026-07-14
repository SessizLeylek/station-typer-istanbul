const DEFAULT_LOCATION = [28.9784, 41.0082]
const DEFAULT_ZOOM = 11

const METRO_TYPES = ["metro", "tram", "funicular", "cablecar"] // METRO_TYPES.includes(line.type)

const sfxTypedCorrect = document.getElementById("sfx-correct");
const sfxTypedIncorrect = document.getElementById("sfx-incorrect");
const sfxDeleted = document.getElementById("sfx-delete");
const sfxCountdown = document.getElementById("sfx-countdown");
const sfxJingle = document.getElementById("sfx-jingle");
const sfxVisit = document.getElementById("sfx-visit");

const vfxVisit = document.getElementById("vfx-visit");

function playSfx(source, pitch = null) {
    source.preservesPitch = false;
    source.playbackRate = pitch ? pitch : Math.random() * 0.1 + 0.95;

    source.currentTime = 0;
    source.play();
}

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

const cursorElement = document.getElementById("vfx-cursor");
const cursorMarker = new maplibregl.Marker({
    element: cursorElement,
    anchor: 'center'
})
    .setLngLat([0, 0])
    .addTo(map);

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

function moveMapToNewLocation(location, zoom) {
    map.flyTo({
        center: location,           // New target coordinates (e.g., Besiktas)
        zoom: zoom,                    // New zoom level
        essential: true,             // Ensures animation runs even if user OS has reduced motion enabled
        duration: 500,               // Animation duration in milliseconds 
        offset: [0, -64],
    });
}

function fitLineToMap(lineId) {
    const bounds = new maplibregl.LngLatBounds();
    LINES[lineId].stations.forEach((station) => bounds.extend([station.lon, station.lat]));

    map.fitBounds(bounds, {
        padding: 200,
        maxZoom: 16
    });
}

function followLine(lineId, stationNdx = 0) {
    const station = LINES[lineId].stations[stationNdx];
    moveMapToNewLocation([station.lon, station.lat], 14);

    if (LINES[lineId].stations.length > stationNdx + 1) {
        setTimeout(() => followLine(lineId, stationNdx + 1), 1000);
    } else {
        setTimeout(() => moveMapToNewLocation(DEFAULT_LOCATION, DEFAULT_ZOOM), 1000);
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

    const linesQueue = [];

    const selectedPoolValue = document.querySelector('input[name="pool-options"]:checked').value;
    switch (selectedPoolValue) {
        case "single-line":
            const selectedLineId = document.querySelector('input[name="lines-options"]:checked').value;
            const traverseReverse = document.querySelector('input[name="direction-options"]:checked').value === "reverse";

            linesQueue.push({ name: selectedLineId, reverse: traverseReverse });
            break;
        case "single-side":
            const selectedSide = document.querySelector('input[name="side-options"]:checked').value;

            Object.entries(LINES).forEach(([key, value]) => {
                if (value.side == selectedSide)
                    linesQueue.push({ name: key, reverse: (Math.random() < 0.5) });
            });
            break;
        case "all-stations":
            const includeCommuter = document.querySelector('input[name="commuter-options"]:checked').value === "enabled";
            const includeRegional = document.querySelector('input[name="regional-options"]:checked').value === "enabled";
            const includeMetrobus = document.querySelector('input[name="metrobus-options"]:checked').value === "enabled";

            const includedTypes = [];
            includedTypes.push(...METRO_TYPES);
            if (includeCommuter) includedTypes.push("commuter");
            if (includeRegional) includedTypes.push("regional");
            if (includeMetrobus) includedTypes.push("metrobus");

            Object.entries(LINES).forEach(([key, value]) => {
                if (includedTypes.includes(value.type))
                    linesQueue.push({ name: key, reverse: (Math.random() < 0.5) });
            });
            break;
    }

    linesQueue.toReversed().forEach((line) => buildMetroLine(line.name));
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
    interlinesToSkip: { "line": ["station"] },
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
var gameTickIntervalID = 0;

function startGame(linesQueue) {
    showGameInputField();

    gameState.isActive = true;

    gameState.linesQueue = linesQueue;

    gameState.totalTypes = 0;
    gameState.correctTypes = 0;
    gameState.wordsTyped = 0;
    gameState.startTime = performance.now();

    gameState.interlinesToSkip = {};

    gameState.currentLineNdx = -1;
    tryContinueWithNextLine().then((res) => {
        startCountdown().then(() => {
            gameTickIntervalID = setInterval(updateTimeInfo, 500);

            putCursorOnStation();

            moveMapToTheCurrentStation();
            enableInputField();
        })
    });
}

function endGame(lastLineId) {
    clearInterval(gameTickIntervalID);

    putAwayCursor();
    fitLineToMap(lastLineId);
    hideGameInputField();
    disableInputField();
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function startCountdown() {
    const countdownText = document.getElementById("countdown-text");
    let resizeIntervalID = 0;
    let textFontSize = 50;

    const resizeCountdownText = () => {
        textFontSize *= 0.95;
        countdownText.style.fontSize = `${textFontSize}vh`;
    };

    const showCountdownText = async (text) => {
        countdownText.textContent = text;
        textFontSize = 50;
        resizeIntervalID = setInterval(resizeCountdownText, 20);
        await delay(1000);
        clearInterval(resizeIntervalID);

    };

    const notes = [1.0905, 1.0000, 0.9439, 0.8409];

    for (let i = 3; i > 0; i--) {
        playSfx(sfxCountdown, notes[i]);
        await showCountdownText(i);
    }

    playSfx(sfxJingle, 1);
    showCountdownText("GO!").then(() => countdownText.textContent = "");
}

async function tryContinueWithNextLine() {
    // Switch to the next line with delay
    gameState.isActive = false;
    await delay(500);
    gameState.isActive = true;

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

    putCursorOnStation();
    buildMetroScheme(gameState.linesQueue[gameState.currentLineNdx].name);

    return true;
}

async function tryContinueWithNextStation() {
    const wordCount = getCurrentStationInfo().name.split(/[ \/\-]+/).length;
    gameState.wordsTyped += wordCount;
    updateWpmInfo();

    updateSchemeProgress();

    if (gameState.isLineReversed) {
        gameState.currentStationNdx--;
        if (gameState.currentStationNdx < 0) {
            return await tryContinueWithNextLine();
        }
    } else {
        gameState.currentStationNdx++;
        if (gameState.currentStationNdx >= gameState.maxStationCount) {
            return await tryContinueWithNextLine();
        }
    }

    return true;
}

async function tryFindNextStation() {
    while (true) {
        markNodeOnMap(getCurrentLineInfo().name, gameState.isLineReversed);
        moveCursorAlongLine();

        const gameContinues = await tryContinueWithNextStation();
        if (!gameContinues) {
            return false;
        }

        // Continue loop if next station is an already completed interlining
        const lineInInterlines = gameState.interlinesToSkip[getCurrentLineInfo().name];
        if (lineInInterlines) {
            if (lineInInterlines.includes(getCurrentStationInfo().name)) {
                continue;
            }
        }

        break;
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
        const deltaIndex = gameState.isLineReversed ? 1 : -1;
        const otherStation = getCurrentLineInfo().stations[gameState.currentStationNdx + deltaIndex];
        otherLocation[0] = otherStation.lon;
        otherLocation[1] = otherStation.lat;
    }

    const currentLocation = [getCurrentStationInfo().lon, getCurrentStationInfo().lat];
    const calculatedZoom = -Math.log2(2 * getDistance(currentLocation, otherLocation) / 40_000);
    moveMapToNewLocation(currentLocation, calculatedZoom);
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

        if (getCurrentStationInfo().interlined_with) {
            const interlinedLines = getCurrentStationInfo().interlined_with;
            const stationName = getCurrentStationInfo().name;
            interlinedLines.forEach((line) => {
                if (!(line in gameState.interlinesToSkip)) gameState.interlinesToSkip[line] = [];
                gameState.interlinesToSkip[line].push(stationName);
            });
        }

        const lastLineId = gameState.linesQueue[gameState.currentLineNdx].name;
        tryFindNextStation().then((gameContinues) => {
            checkInputAndRenderText();
            if (gameContinues) {
                moveMapToTheCurrentStation();
            } else {
                endGame(lastLineId);
            }
        });
    }
});

// register accuracy on input
inputField.addEventListener("beforeinput", (event) => {
    if (!gameState.isActive) return;

    if (event.data == null) {
        playSfx(sfxDeleted);
        return;
    }

    let completelyCorrect = true;

    const targetText = getCurrentStationInfo().name;
    let cursorPosition = inputField.selectionStart;

    for (c of event.data) {
        gameState.totalTypes++;
        if (targetText.at(cursorPosition) === c) {
            gameState.correctTypes++;
        } else {
            completelyCorrect = false;
        }

        cursorPosition++;
    }

    if (completelyCorrect) {
        playSfx(sfxTypedCorrect);
    } else {
        playSfx(sfxTypedIncorrect);
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
    if (!gameState.isActive) return false;

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

window.addEventListener("load", alignInputWithText);
window.addEventListener("resize", alignInputWithText);

function disableInputField() {
    inputField.disabled = true;
    inputText.innerHTML = "";
}

function enableInputField() {
    inputField.disabled = false;
    inputField.focus();
    checkInputAndRenderText();
}

disableInputField();

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

    const currentLineNdx = gameState.currentLineNdx;
    setTimeout(() => {
        if (currentLineNdx !== gameState.currentLineNdx) return; // Cancel update if line changed during timeout

        stationsRow.children[nodeNdx].classList.add("visited");
    }, 100);
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
            tempLineCoordinates = smoothLines(tempLineCoordinates);
            pushCoordinatesToLineFeatures();

            const branchHead = LINES[lineId].stations.find((st) => st.name === station.branched_from);
            tempLineCoordinates.push([branchHead.lon, branchHead.lat]);
        }

        tempLineCoordinates.push([station.lon, station.lat]);
    }

    if (LINES[lineId].circular === true) {
        tempLineCoordinates.push([LINES[lineId].stations[0].lon, LINES[lineId].stations[0].lat]);
    }

    tempLineCoordinates = smoothLines(tempLineCoordinates);
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

// Spline method created by gemini because i am tired
/**
 * Calculates an interpolated point between p0 and p1 using Catmull-Rom spline.
 * @param {number[]} p0 - The starting point of the current segment [x, y].
 * @param {number[]} p1 - The ending point of the current segment [x, y].
 * @param {number} t - The interpolation factor between 0 and 1.
 * @param {number[]} [pPre=null] - The control point before p0. Defaults to p0 if null.
 * @param {number[]} [pPost=null] - The control point after p1. Defaults to p1 if null.
 * @returns {number[]} The interpolated point [x, y].
 */
function getSmoothedPosition(p0, p1, t, pPre = null, pPost = null) {
    const cPre = pPre || p0;
    const cPost = pPost || p1;

    const s = 0.6;

    // Calculate tangents (velocities) at p0 and p1
    const m0x = s * (p1[0] - cPre[0]);
    const m0y = s * (p1[1] - cPre[1]);
    const m1x = s * (cPost[0] - p0[0]);
    const m1y = s * (cPost[1] - p0[1]);

    const t2 = t * t;
    const t3 = t2 * t;

    // Standard Hermite spline basis functions
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    // Calculate final interpolated coordinates
    const x = h00 * p0[0] + h10 * m0x + h01 * p1[0] + h11 * m1x;
    const y = h00 * p0[1] + h10 * m0y + h01 * p1[1] + h11 * m1y;

    return [x, y];
}

// Spline method created by gemini because i am tired
// Smooths lines defined by an array of [lon, lat]
function smoothLines(pointArray) {
    if (pointArray.length < 2) {
        return pointArray;
    }

    const tempResult = [];
    const steps = 4;

    for (let i = 0; i < pointArray.length - 1; i++) {
        const p0 = pointArray[i];
        const p1 = pointArray[i + 1];

        const pPre = (i === 0) ? null : pointArray[i - 1];
        const pPost = (i === pointArray.length - 2) ? null : pointArray[i + 2];

        tempResult.push(p0);

        for (let j = 1; j < steps; j++) {
            const t = j / steps;
            tempResult.push(getSmoothedPosition(p0, p1, t, pPre, pPost));
        }
    }

    tempResult.push(pointArray[pointArray.length - 1]);

    return tempResult;
}

function markNodeOnMap(lineId, markFromTail) {
    const hollowPointId = `hpoints-${lineId}`;
    const filledPointId = `fpoints-${lineId}`;

    vfxVisit.style.setProperty("--color", colorBrightFromHex(LINE_COLORS[lineId]));

    setTimeout(() => {
        // Transfer points
        const hollowPointsData = additionalMapData[hollowPointId];
        const filledPointsData = additionalMapData[filledPointId];

        let removedCoordinate = null;
        [removedCoordinate] = hollowPointsData.geometry.coordinates.splice(markFromTail ? hollowPointsData.geometry.coordinates.length - 1 : 0, 1);
        filledPointsData.geometry.coordinates.push(removedCoordinate);

        map.getSource(hollowPointId).setData(hollowPointsData);
        map.getSource(filledPointId).setData(filledPointsData);

        // Play vfx
        playVisitEffectAtLocation(removedCoordinate);

        // Play sound
        playSfx(sfxVisit);
    }, 200);
}

function playVisitEffectAtLocation(location) {
    const marker = new maplibregl.Marker({
        element: vfxVisit,
        anchor: 'center'
    })
        .setLngLat(location)
        .addTo(map);

    void vfxVisit.offsetWidth;
    vfxVisit.classList.add("play-vfx");

    vfxVisit.addEventListener('animationend', () => {
        marker.remove();

        vfxVisit.classList.remove("play-vfx");
    }, { once: true });
}

function putAwayCursor() {
    cursorMarker.setLngLat([0, 0]);
}

function putCursorOnStation() {
    const station = getCurrentStationInfo();
    const nextStation = getCurrentLineInfo().stations[gameState.currentStationNdx + (gameState.isLineReversed ? -1 : 1)];

    const location = [station.lon, station.lat];
    const nextLocation = [nextStation.lon, nextStation.lat];

    putCursorBetweenLocations(location, nextLocation);
}

function putCursorBetweenLocations(location, nextLocation) {
    const angle = -Math.atan2(nextLocation[1] - location[1], nextLocation[0] - location[0]);

    cursorElement.style.setProperty("--angle", `${angle}rad`);
    cursorMarker.setLngLat(location);
}

async function moveCursorAlongLine() {
    const stations = getCurrentLineInfo().stations;

    // Decide on the indices of the bezier points
    let preP0Ndx, p0Ndx, p1Ndx, p2Ndx, postP2Ndx;
    if (gameState.isLineReversed) {
        p1Ndx = gameState.currentStationNdx;
        p0Ndx = p1Ndx + 1 < gameState.maxStationCount ? p1Ndx + 1 : gameState.maxStationCount - 1;
        preP0Ndx = p0Ndx + 1 < gameState.maxStationCount ? p0Ndx + 1 : gameState.maxStationCount - 1;
        p2Ndx = p1Ndx - 1 >= 0 ? p1Ndx - 1 : 0;
        postP2Ndx = p2Ndx - 1 >= 0 ? p2Ndx - 1 : 0;
    } else {
        p1Ndx = gameState.currentStationNdx;
        p0Ndx = p1Ndx - 1 >= 0 ? p1Ndx - 1 : 0;
        preP0Ndx = p0Ndx - 1 >= 0 ? p0Ndx - 1 : 0;
        p2Ndx = p1Ndx + 1 < gameState.maxStationCount ? p1Ndx + 1 : gameState.maxStationCount - 1;
        postP2Ndx = p2Ndx + 1 < gameState.maxStationCount ? p2Ndx + 1 : gameState.maxStationCount - 1;
        p1Ndx = gameState.currentStationNdx;
    }

    let nextStation = null;
    let nextStationBranch = null;
    let nextStationProximity = 0;

    if (gameState.isLineReversed) {
        // Handle branches for the past stations
        if (stations[p0Ndx].branched_from) {
            p0Ndx = p1Ndx;
            preP0Ndx = p1Ndx;
        } else if (stations[preP0Ndx].branched_from) {
            preP0Ndx = p0Ndx;
        }

        // Handle branches for the stations ahead
        if (stations[p1Ndx].branched_from) {
            nextStationBranch = stations[p2Ndx];
            nextStation = stations.find((s) => s.name === stations[p1Ndx].branched_from);

            const branchingStationNdx = stations.findIndex((s) => s.name === stations[p1Ndx].branched_from);

            p2Ndx = branchingStationNdx;

            // This is the actual correct solution but for now maps branches are drawn separetely
            // So this solution looks wrong on map now
            //p2Ndx = branchingStationNdx >= 0 ? branchingStationNdx : p1Ndx;

            // Redecide post index
            postP2Ndx = p2Ndx - 1 >= 0 ? p2Ndx - 1 : 0;
        }

        if (stations[p2Ndx].branched_from) {
            const branchingStationNdx = stations.findIndex((s) => s.name === stations[p2Ndx].branched_from);
            postP2Ndx = branchingStationNdx >= 0 ? branchingStationNdx : p2Ndx;
        }
    } else {
        // Handle branches for the past stations
        if (stations[p1Ndx].branched_from) {
            const branchingStationNdx = stations.findIndex((s) => s.name === stations[p1Ndx].branched_from);

            p0Ndx = branchingStationNdx;
            preP0Ndx = branchingStationNdx;

            /* This is the actual correct solution but for now maps branches are drawn separetely
            // So this solution looks wrong on map now
            p0Ndx = branchingStationNdx >= 0 ? branchingStationNdx : p1Ndx;

            // Redecide pre index
            preP0Ndx = p0Ndx - 1 >= 0 ? p0Ndx - 1 : 0;*/
        }

        if (stations[p0Ndx].branched_from) {
            const branchingStationNdx = stations.findIndex((s) => s.name === stations[p0Ndx].branched_from);
            preP0Ndx = branchingStationNdx >= 0 ? branchingStationNdx : p0Ndx;
        }

        // Handle branches for the stations ahead
        if (stations[p2Ndx].branched_from) {
            nextStation = stations[p2Ndx];
            nextStationBranch = stations.find((s) => s.name === stations[p2Ndx].branched_from);
            nextStationProximity = 0.5;

            p2Ndx = p1Ndx;
            postP2Ndx = p1Ndx;
        } else if (stations[postP2Ndx].branched_from) {
            postP2Ndx = p2Ndx;
        }
    }

    const loc = (s) => [s.lon, s.lat];

    const p0 = loc(stations[p0Ndx]);
    const p1 = loc(stations[p1Ndx]);
    const p2 = loc(stations[p2Ndx]);
    const preP0 = loc(stations[preP0Ndx]);
    const postP2 = loc(stations[postP2Ndx]);

    const easeIn = (t) => t * t * t;
    const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);

    const steps = 12;

    for (let i = -steps; i <= steps; i++) {
        await delay(16);
        if (i < 0) {
            if (p1Ndx === p0Ndx && p0Ndx === preP0Ndx) {
                // Skip interpolation for the first nodes
            } else {
                const t = easeIn(1 + (i / steps)) / 2 + 0.5;
                const pos2 = getSmoothedPosition(p0, p1, t - 0.01, preP0, p2);
                const pos = getSmoothedPosition(p0, p1, t, preP0, p2);
                const a = -Math.atan2(pos[1] - pos2[1], pos[0] - pos2[0]);

                cursorElement.style.setProperty("--angle", `${a}rad`);
                cursorMarker.setLngLat(pos);
            }
        } else {
            if (p1Ndx === p2Ndx && p2Ndx === postP2Ndx) {
                // If next target is the last station (so it control points are overlapped)
                // Just hide it
                putAwayCursor();
                break;
            } else {
                const t = easeOut(i / steps) / 2;
                const pos2 = getSmoothedPosition(p1, p2, t + 0.01, p0, postP2);
                const pos = getSmoothedPosition(p1, p2, t, p0, postP2);
                putCursorBetweenLocations(pos, pos2);
            }
        }
    }

    if (nextStation) {
        await delay(100);

        // If we have a specific next station to be placed, be placed there
        const pos2 = getSmoothedPosition(loc(nextStationBranch), loc(nextStation), nextStationProximity * 0.9 + 0.1);
        const pos = getSmoothedPosition(loc(nextStationBranch), loc(nextStation), nextStationProximity);
        putCursorBetweenLocations(pos, pos2);
    }
}
