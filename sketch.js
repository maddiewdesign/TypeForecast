// ==========================
// LIVE WEATHER TYPE SYSTEM (GRID-READY)
// ==========================

// --------------------------
// GLOBALS
// --------------------------
let cell = 18;
let t = 0;

let precipitation = 0;
let windSpeed = 0;
let windDirection = 0;
let temperature = 0;

let sandboxValues = {
  precipitation: 20,
  windSpeed: 10,
  windDirection: 180,
  temperature: 18
};

window.sandboxActive = false;

let currentCity = "London";

let txtImg;
let fontReady = false;

let lat = 51.5072;
let lon = -0.1276;

// --------------------------
// DEV: "/" ANYTHING MODE
// --------------------------
function devGenerateFromInput(value) {
  const str = value.slice(1); // remove "/"

  // Update visible type
  currentCity = str;
  generateTextMask();

  // Generate values from string
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }

  sandboxValues.precipitation = sum % 100;
  sandboxValues.windSpeed = (sum * 2) % 60;
  sandboxValues.windDirection = (sum * 5) % 360;
  sandboxValues.temperature = (sum % 60) - 15;

  updateUI();
}

// --------------------------
// DOM CACHE (IMPORTANT)
// --------------------------
const DOM = {};

function cacheDOM() {
  DOM.date = document.getElementById("date");
  DOM.location = document.getElementById("location");
  DOM.precip = document.getElementById("precip");
  DOM.wind = document.getElementById("wind");
  DOM.dir = document.getElementById("dir");
  DOM.temp = document.getElementById("temp");
}

let typeY = 0;

function updateTypePosition() {
  const row = document.querySelector(".type-row");
  const rect = row.getBoundingClientRect();

  typeY = rect.top + rect.height / 2;
}

// --------------------------
// SETUP
// --------------------------
function setup() {
  let c = createCanvas(windowWidth, windowHeight);
  c.style("z-index", "0");

  cacheDOM();

  document.fonts.ready.then(() => {
    textFont("aktiv-grotesk");

    updateTypePosition();   // NEW
    generateTextMask();

    fetchWeather();
    updateDate();

    setInterval(fetchWeather, 300000);
    fontReady = true;

    fetchCity("London");
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateTypePosition();  
  generateTextMask();
}

// --------------------------
// TEXT MASK (FIXED CENTERING)
// --------------------------
function getFittingTextSize(str) {
  let size = width;
  textSize(size);

  while (textWidth(str) > width * 0.7) {
    size -= 8;
    textSize(size);
  }

  return min(size, height * 0.55);
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

  txtImg.text(currentCity, width / 2, typeY);
}

// --------------------------
// WEATHER API
// --------------------------
function fetchWeather() {
  let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability&current_weather=true&windspeed_unit=mph`;

  fetch(url)
    .then(r => r.json())
    .then(data => {

      if (!window.sandboxActive && data.current_weather) {
        windSpeed = data.current_weather.windspeed || 0;
        windDirection = data.current_weather.winddirection || 0;
        temperature = data.current_weather.temperature || 0;
      }

      if (!window.sandboxActive && data.hourly) {
        precipitation = data.hourly.precipitation_probability[0] || 0;
      }

      updateUI();
    });
}

// --------------------------
// LOCATION
// --------------------------
function fetchCity(city) {
  let url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (!data.results?.length) return;

      let place = data.results[0];

      lat = place.latitude;
      lon = place.longitude;
      currentCity = place.name;

      DOM.location.textContent = currentCity.toUpperCase();

      generateTextMask();
      fetchWeather();
    });
}

window.fetchCity = fetchCity;

// --------------------------
// UI UPDATE (OPTIMISED)
// --------------------------
function updateUI() {
  let p = window.sandboxActive ? sandboxValues.precipitation : precipitation;
  let w = window.sandboxActive ? sandboxValues.windSpeed : windSpeed;
  let d = window.sandboxActive ? sandboxValues.windDirection : windDirection;
  let temp = window.sandboxActive ? sandboxValues.temperature : temperature;

  let corrected = (d + 180) % 360;
  let dirLabel = getWindDirectionLabel(d);

  DOM.precip.textContent = Math.round(p) + "%";
  DOM.wind.textContent = Math.round(w) + " MPH";
  DOM.dir.textContent = `${dirLabel} / ${Math.round(corrected)}°`;
  DOM.temp.textContent = Math.round(temp) + "°C";

  updateDate();
}

// --------------------------
// DATE
// --------------------------
function updateDate() {
  let now = new Date();

  let d = String(now.getDate()).padStart(2, "0");
  let m = String(now.getMonth() + 1).padStart(2, "0");
  let y = String(now.getFullYear()).slice(-2);

  DOM.date.textContent = `${d}.${m}.${y}`;
}

// --------------------------
// WIND
// --------------------------
function getFlowAngle() {
  let dir = window.sandboxActive
    ? sandboxValues.windDirection
    : windDirection;

  return radians((dir + 180) % 360);
}

function getWindDirectionLabel(deg) {
  let c = (deg + 180) % 360;

  if (c < 22.5 || c >= 337.5) return "N";
  if (c < 67.5) return "NE";
  if (c < 112.5) return "E";
  if (c < 157.5) return "SE";
  if (c < 202.5) return "S";
  if (c < 247.5) return "SW";
  if (c < 292.5) return "W";
  return "NW";
}

// --------------------------
// COLOUR SYSTEM (UNCHANGED CORE)
// --------------------------
function getTempColor(x, y) {
  let temp = window.sandboxActive
    ? sandboxValues.temperature
    : temperature;

  temp = constrain(temp, -15, 45);

  let angle = getFlowAngle();
  let flow = x * cos(angle) + y * sin(angle);
  let n = noise(flow * 0.002, t * 0.4);

  const colors = [
    { t: -25, c: color(151, 193, 230) },
    { t: -15, c: color(45,37,111) },
    { t: -10, c: color(0, 0, 80) },
    { t: -5,  c: color(0, 0, 140) },
    { t: 0,   c: color(0, 80, 255) },
    { t: 5,   c: color(64, 224, 208) },
    { t: 12,  c: color(30, 121, 66) },
    { t: 18,  c: color(173, 255, 47) },
    { t: 24,  c: color(255, 255, 0) },
    { t: 30,  c: color(255, 165, 0) },
    { t: 35,  c: color(255, 0, 0) },
    { t: 40,  c: color(128, 0, 128) }
  ];

  let lower = colors[0];
  let upper = colors[colors.length - 1];

  for (let i = 0; i < colors.length - 1; i++) {
    if (temp >= colors[i].t && temp <= colors[i + 1].t) {
      lower = colors[i];
      upper = colors[i + 1];
      break;
    }
  }

  let amt = (temp - lower.t) / (upper.t - lower.t);
  let base = lerpColor(lower.c, upper.c, amt * (0.7 + 0.3 * n));

  colorMode(HSB, 360, 100, 100);

  let h = (hue(base) + map(noise(x*0.01,y*0.01,t),0,1,-20,20)) % 360;
  let s = saturation(base);
  let b = brightness(base);

  let final = color(h, s, b);

  colorMode(RGB, 255);

  return final;
}

// --------------------------
// DRAW
// --------------------------
function draw() {
  if (!fontReady) return;

  background("#0a0a0a");

  let p = window.sandboxActive ? sandboxValues.precipitation : precipitation;
  let w = window.sandboxActive ? sandboxValues.windSpeed : windSpeed;

  let density = map(p, 0, 100, 0.15, 0.85);
  let frequency = map(p, 0, 100, 0.002, 0.02);

  let motionSpeed = map(w, 0, 60, 0.005, 0.12);
  let maxThickness = map(w, 0, 60, 0.6, 12);
  let densityField = map(w, 0, 60, 0.45, 0.2);

  t += frequency * 0.6 + motionSpeed;

  let angle = getFlowAngle();
  let dx = cos(angle);
  let dy = sin(angle);
  let px = -dy;
  let py = dx;

  // WIND
  for (let i = -height; i < width + height; i += 18) {

    let gust = noise(i * 0.01 + t);
    strokeWeight(0.6 + pow(gust, 2) * maxThickness);

    for (let j = -width; j < width * 2; j += 14) {

      if (noise(j * 0.02 + t * 1.8, i * 0.01) > densityField) {

        let x1 = width/2 + px*i + dx*j;
        let y1 = height/2 + py*i + dy*j;

        if (txtImg.get(x1, y1)[0] > 128) {
          stroke(getTempColor(x1, y1));
          line(x1, y1, x1 + dx*14, y1 + dy*14);
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
        ellipse(x + cell/2, y + cell/2, d, d);
      }
    }
  }
}

// --------------------------
// SANDBOX UI (UNCHANGED BEHAVIOUR)
// --------------------------
document.addEventListener("DOMContentLoaded", () => {

  const toggleBtn = document.getElementById("toggleSandbox");
  const controls = document.querySelectorAll(".control");

  toggleBtn.addEventListener("click", () => {
    window.sandboxActive = !window.sandboxActive;
    toggleBtn.textContent = window.sandboxActive ? "ON" : "OFF";
    toggleBtn.classList.toggle("active", window.sandboxActive);

    if (!window.sandboxActive) fetchWeather();

    updateUI();
  });

  controls.forEach(control => {

    const track = control.querySelector(".track");
    const handle = control.querySelector(".handle");
    const valueText = control.querySelector(".value");

    let dragging = false;

    function update(e) {
      const rect = track.getBoundingClientRect();
      let percent = constrain((e.clientX - rect.left) / rect.width, 0, 1);

      handle.style.left = `${percent * 100}%`;

      let type = control.dataset.type;

      if (type === "precip") {
        sandboxValues.precipitation = Math.round(percent * 100);
        valueText.textContent = sandboxValues.precipitation;
      }

      if (type === "wind") {
        sandboxValues.windSpeed = Math.round(percent * 60);
        valueText.textContent = sandboxValues.windSpeed;
      }

      if (type === "dir") {
        sandboxValues.windDirection = Math.round(percent * 360);
        valueText.textContent = sandboxValues.windDirection;
      }

      if (type === "temp") {
        sandboxValues.temperature = Math.round(-25 + percent * 80);
        valueText.textContent = sandboxValues.temperature;
      }

      updateUI();
    }

    track.addEventListener("mousedown", e => {
      dragging = true;
      update(e);
    });

    window.addEventListener("mousemove", e => {
      if (dragging) update(e);
    });

    window.addEventListener("mouseup", () => dragging = false);

    track.addEventListener("click", update);
  });

});

window.devGenerateFromInput = devGenerateFromInput;

