// ==========================
// LIVE WEATHER MASKED TEXT
// ==========================
let cell = 18;
let t = 0;

let precipitation = 0;
let windSpeed = 0;
let windDirection = 0;
let temperature = 0;

let currentCity = "London";

let txtImg;
let fontReady = false;

let lat = 51.5072;
let lon = -0.1276;

// ==========================
// SETUP
// ==========================
function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  document.fonts.ready.then(() => {
    textFont("aktiv-grotesk");
    generateTextMask();
    fetchWeather();
    updateDate();
    setInterval(fetchWeather, 300000);
    fontReady = true;
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateTextMask();
}

// ==========================
// TEXT MASK
// ==========================
function getFittingTextSize(str) {
  textFont("aktiv-grotesk");

  let size = width;
  textSize(size);

  while (textWidth(str) > width * 0.7) {
    size -= 8;
    textSize(size);
  }

  if (size > height * 0.55) {
    size = height * 0.55;
  }

  return size;
}

function generateTextMask() {
  txtImg = createGraphics(width, height);
  txtImg.pixelDensity(1);
  txtImg.background(0);
  txtImg.fill(255);
  txtImg.textFont("aktiv-grotesk");
  txtImg.textAlign(CENTER, CENTER);

  let size = getFittingTextSize(currentCity);
  txtImg.textSize(size);

  txtImg.text(currentCity, width * 0.52, height * 0.55);
}

// ==========================
// WEATHER
// ==========================
function fetchWeather() {
  let apiURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability&current_weather=true&windspeed_unit=mph`;

  fetch(apiURL)
    .then(res => res.json())
    .then(data => {

      if (data.current_weather) {
        windSpeed = data.current_weather.windspeed || 0;
        windDirection = data.current_weather.winddirection || 0;
        temperature = data.current_weather.temperature || 0;
      }

      if (data.hourly && data.hourly.precipitation_probability) {
        precipitation = data.hourly.precipitation_probability[0] || 0;
      }

      // ==========================
      // WIND DIRECTION LABEL
      // ==========================
      let dirLabel = getWindDirectionLabel(windDirection);

      // ==========================
      // UPDATE UI
      // ==========================
      document.getElementById("precip").textContent =
        Math.round(precipitation) + "%";

      document.getElementById("wind").textContent =
        Math.round(windSpeed) + " MPH";

      document.getElementById("dir").textContent =
        `${dirLabel} / ${Math.round(windDirection)}°`;

      document.getElementById("temp").textContent =
        Math.round(temperature) + "°C";

      updateDate();
    });
}

// ==========================
// CITY SEARCH
// ==========================
function fetchCity(city) {
  let geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;

  fetch(geoURL)
    .then(res => res.json())
    .then(data => {
      if (data.results && data.results.length > 0) {

        lat = data.results[0].latitude;
        lon = data.results[0].longitude;
        currentCity = data.results[0].name;

        document.getElementById("location").textContent =
          currentCity.toUpperCase();

        generateTextMask();
        fetchWeather();
      }
    });
}

window.fetchCity = fetchCity;

// ==========================
// DATE
// ==========================
function updateDate() {
  let now = new Date();

  let d = String(now.getDate()).padStart(2, "0");
  let m = String(now.getMonth() + 1).padStart(2, "0");
  let y = String(now.getFullYear()).slice(-2);

  document.getElementById("date").textContent = `${d}.${m}.${y}`;
}

// ==========================
// WIND LABEL FUNCTION
// ==========================
function getWindDirectionLabel(deg) {
  if (deg >= 337.5 || deg < 22.5) return "N";
  if (deg < 67.5) return "NE";
  if (deg < 112.5) return "E";
  if (deg < 157.5) return "SE";
  if (deg < 202.5) return "S";
  if (deg < 247.5) return "SW";
  if (deg < 292.5) return "W";
  return "NW";
}

// ==========================
// COLOUR SYSTEM
// ==========================
function getTempColor(x, y) {
  let angle = radians(windDirection);
  let flow = x * cos(angle) + y * sin(angle);
  let n = noise(flow * 0.002, t * 0.4);

  if (temperature > 40) {
    return lerpColor(color(180, 0, 255), color(255, 120, 255), n);
  } else if (temperature > 30) {
    return lerpColor(color(255, 0, 0), color(255, 120, 0), n);
  } else if (temperature > 20) {
    return lerpColor(color(255, 120, 0), color(255, 200, 0), n);
  } else {
    return lerpColor(color(0, 150, 255), color(0, 255, 200), n);
  }
}

// ==========================
// DRAW
// ==========================
function draw() {
  if (!fontReady) return;

  background("#0a0a0a");

  let density = map(precipitation, 0, 100, 0.15, 0.85);
  let frequency = map(precipitation, 0, 100, 0.002, 0.02);

  let motionSpeed = map(windSpeed, 0, 60, 0.005, 0.12);
  let maxThickness = map(windSpeed, 0, 60, 0.6, 12);
  let densityField = map(windSpeed, 0, 60, 0.45, 0.2);

  t += frequency * 0.6 + motionSpeed;

  let angle = radians(windDirection);
  let dx = cos(angle);
  let dy = sin(angle);
  let px = -dy;
  let py = dx;

  // WIND
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
          stroke(getTempColor(x1, y1));
          line(x1, y1, x2, y2);
        }
      }
    }
  }

  // RAIN
  noStroke();

  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {

      let rain = noise(x * 0.01, y * 0.01, t);
      let threshold = map(density, 0, 1, 0.7, 0.25);
      let intensity = constrain(map(rain, threshold, 1, 0, 1), 0, 1);
      let d = intensity * cell * 0.9;

      if (d > 0 && txtImg.get(x, y)[0] > 128) {
        fill(getTempColor(x, y));
        ellipse(x + cell / 2, y + cell / 2, d, d);
      }
    }
  }
}