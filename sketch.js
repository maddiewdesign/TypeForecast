
// ==========================
// LIVE WEATHER MASKED TEXT
// ==========================
let cell = 18;
let t = 0;

let precipitation = 0;  // %
let windSpeed = 0;      // mph
let windDirection = 0;  // degrees

let currentCity = "London";
let inputText = "London";
let isTyping = false;

let txtImg;
let fontReady = false;

// Initial coordinates for London
let lat = 51.5072;
let lon = -0.1276;

// ==========================
// P5 SETUP
// ==========================
function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  // Wait for Adobe font to load
  document.fonts.ready.then(() => {
    textFont("aktiv-grotesk");
    generateTextMask();
    fetchWeather();
    setInterval(fetchWeather, 300000); // refreshes every 5 mins
    fontReady = true;
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateTextMask();
}

// ==========================
// MASK
// ==========================
function getFittingTextSize(str) {
  textFont("aktiv-grotesk");

  let testSize = width;
  textSize(testSize);

  while (textWidth(str) > width * 0.75) {
    testSize -= 8;
    textSize(testSize);
  }

  if (testSize > height * 0.6) {
    testSize = height * 0.6;
  }

  return testSize;
}

function generateTextMask() {
  txtImg = createGraphics(width, height);
  txtImg.pixelDensity(1);
  txtImg.background(0);
  txtImg.fill(255);
  txtImg.textFont("aktiv-grotesk");
  txtImg.textAlign(CENTER, CENTER);

  let fittedSize = getFittingTextSize(currentCity);
  txtImg.textSize(fittedSize);
  txtImg.text(currentCity, width / 2, height / 2);
}

// ==========================
// WEATHER API
// ==========================
function fetchWeather() {
  let apiURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability&current_weather=true&windspeed_unit=mph`;

  fetch(apiURL)
    .then(res => res.json())
    .then(data => {
      // Wind data from current_weather
      if (data.current_weather) {
        windSpeed = data.current_weather.windspeed || 0;
        windDirection = data.current_weather.winddirection || 0;
      }

      // Precipitation probability from hourly data
      if (data.hourly && data.hourly.precipitation_probability) {
        precipitation = data.hourly.precipitation_probability[0] || 0;
      }
    })
    .catch(err => console.error("Weather fetch error:", err));
}

function fetchCity(city) {
  let geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;

  fetch(geoURL)
    .then(res => res.json())
    .then(data => {
      if (data.results && data.results.length > 0) {
        lat = data.results[0].latitude;
        lon = data.results[0].longitude;
        currentCity = data.results[0].name;
        inputText = currentCity;
        generateTextMask();
        fetchWeather();
      }
    });
}

// ==========================
// INTERACTION
// ==========================
function mousePressed() {
  let margin = 40;
  let citySize = min(width * 0.045, 42);

  if (
    mouseX > margin &&
    mouseX < width * 0.6 &&
    mouseY > margin &&
    mouseY < margin + citySize + 20
  ) {
    isTyping = true;
    inputText = ""; // clear field on click
  } else {
    isTyping = false;
    if (inputText === "") {
      inputText = currentCity;
    }
  }
}

function keyPressed() {
  if (!isTyping) return;

  if (keyCode === ENTER && inputText.length > 0) {
    fetchCity(inputText);
    isTyping = false;
  } else if (keyCode === BACKSPACE) {
    inputText = inputText.slice(0, -1);
  } else if (key.length === 1) {
    inputText += key;
  }
}

// ==========================
// DRAW LOOP
// ==========================
function draw() {
  if (!fontReady) return;

  background('#121212');

  // -------------------------
  // MAP WEATHER DATA
  // -------------------------
  let density = map(precipitation, 0, 100, 0.15, 0.85);
  let frequency = map(precipitation, 0, 100, 0.002, 0.02);

  let motionSpeed = map(windSpeed, 0, 60, 0.005, 0.12);
  let maxThickness = map(windSpeed, 0, 60, 0.6, 12);
  let densityField = map(windSpeed, 0, 60, 0.45, 0.2);

  t += frequency * 0.6;
  t += motionSpeed;

  let angle = radians(windDirection);
  let dx = cos(angle);
  let dy = sin(angle);
  let px = -dy;
  let py = dx;

  stroke(255); // white wind lines

  // -------------------------
  // WIND LINES
  // -------------------------
  for (let i = -height; i < width + height; i += 18) {
    let gust = noise(i * 0.01 + t);
    let thickness = 0.6 + pow(gust, 2) * maxThickness;
    strokeWeight(thickness);

    for (let j = -width; j < width * 2; j += 14) {
      let n = noise(j * 0.02 + t * 1.8, i * 0.01);
      if (n > densityField) {
        let x1 = width / 2 + px * i + dx * j;
        let y1 = height / 2 + py * i + dy * j;
        let x2 = x1 + dx * 14;
        let y2 = y1 + dy * 14;

        if (txtImg.get(x1, y1)[0] > 128) {
          line(x1, y1, x2, y2);
        }
      }
    }
  }

  // -------------------------
  // RAIN DOTS
  // -------------------------
  noStroke();
  fill(255); // white dots

  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      let rain = noise(x * 0.01, y * 0.01, t);
      let threshold = map(density, 0, 1, 0.7, 0.25);
      let intensity = constrain(map(rain, threshold, 1, 0, 1), 0, 1);
      let d = intensity * cell * 0.9;

      if (d > 0 && txtImg.get(x, y)[0] > 128) {
        ellipse(x + cell / 2, y + cell / 2, d, d);
      }
    }
  }

  drawUI();
}

// ==========================
// UI
// ==========================
function drawUI() {
  let margin = 40;

  textAlign(LEFT, TOP);
  textFont("aktiv-grotesk");

  fill(255); // white text
  noStroke();

  let citySize = min(width * 0.045, 42);
  textSize(citySize);

  let displayText = isTyping ? inputText + "|" : inputText;
  text(displayText, margin, margin);

  let w = textWidth(displayText);
  stroke(255); // white underline
  strokeWeight(2);
  line(margin, margin + citySize + 5, margin + w, margin + citySize + 5);

  noStroke();
  textSize(16);
  text(`Precipitation: ${round(precipitation)}%`, margin, margin + citySize + 20);
  text(`Wind: ${round(windSpeed)} mph`, margin, margin + citySize + 40);
}