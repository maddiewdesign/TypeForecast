// ==========================
// LIVE WEATHER TYPE SYSTEM
// ==========================

let cell = 18;
let t = 0;

// REAL DATA (API)
let precipitation = 0;
let windSpeed = 0;
let windDirection = 0;
let temperature = 0;

// SANDBOX DATA (PERSISTENT)
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
    fetchCity("London");
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
// WEATHER API
// ==========================
function fetchWeather() {
  let apiURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability&current_weather=true&windspeed_unit=mph`;

  fetch(apiURL)
    .then(res => res.json())
    .then(data => {

      // ONLY update real data if NOT in sandbox
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


// ==========================
// LOCATION SEARCH
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
// UI UPDATE
// ==========================
function updateUI() {
  let p = window.sandboxActive ? sandboxValues.precipitation : precipitation;
  let w = window.sandboxActive ? sandboxValues.windSpeed : windSpeed;
  let d = window.sandboxActive ? sandboxValues.windDirection : windDirection;
  let temp = window.sandboxActive ? sandboxValues.temperature : temperature;

  let corrected = (d + 180) % 360;
  let dirLabel = getWindDirectionLabel(d);

  document.getElementById("precip").textContent = Math.round(p) + "%";
  document.getElementById("wind").textContent = Math.round(w) + " MPH";
  document.getElementById("dir").textContent = `${dirLabel} / ${Math.round(corrected)}°`;
  document.getElementById("temp").textContent = Math.round(temp) + "°C";

  updateDate();
}


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
// WIND SYSTEM
// ==========================
function getFlowAngle() {
  let dir = window.sandboxActive
    ? sandboxValues.windDirection
    : windDirection;

  return radians((dir + 180) % 360);
}

function getWindDirectionLabel(deg) {
  let corrected = (deg + 180) % 360;

  if (corrected >= 337.5 || corrected < 22.5) return "N";
  if (corrected < 67.5) return "NE";
  if (corrected < 112.5) return "E";
  if (corrected < 157.5) return "SE";
  if (corrected < 202.5) return "S";
  if (corrected < 247.5) return "SW";
  if (corrected < 292.5) return "W";
  return "NW";
}


// ==========================
// COLOUR SYSTEM
// ==========================
function getTempColor(x, y) {
  let temp = window.sandboxActive
    ? sandboxValues.temperature
    : temperature;

  let angle = getFlowAngle();
  let dx = cos(angle);
  let dy = sin(angle);

  let flow = x * dx + y * dy;
  let n = noise(flow * 0.002, t * 0.4);

  if (temp > 40) {
    return lerpColor(color(180, 0, 255), color(255, 120, 255), n);
  } else if (temp > 30) {
    return lerpColor(color(255, 0, 0), color(255, 120, 0), n);
  } else if (temp > 20) {
    return lerpColor(color(255, 120, 0), color(255, 200, 0), n);
  } else {
    return lerpColor(color(0, 150, 255), color(0, 255, 200), n);
  }
}


// ==========================
// DRAW LOOP
// ==========================
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


// ==========================
// SANDBOX UI SYSTEM
// ==========================
document.addEventListener("DOMContentLoaded", () => {

  const toggleBtn = document.getElementById("toggleSandbox");
  const controls = document.querySelectorAll(".control");

  toggleBtn.addEventListener("click", () => {
    window.sandboxActive = !window.sandboxActive;
    toggleBtn.textContent = window.sandboxActive ? "ON" : "OFF";

    if (!window.sandboxActive) {
      fetchWeather();
    }

    updateUI();
  });

  controls.forEach(control => {
    const track = control.querySelector(".track");
    const handle = control.querySelector(".handle");
    const valueText = control.querySelector(".value");

    let dragging = false;

    function update(e) {
      const rect = track.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let percent = Math.max(0, Math.min(1, x / rect.width));

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
        sandboxValues.temperature = Math.round(percent * 45);
        valueText.textContent = sandboxValues.temperature;
      }

      updateUI();
    }

    track.addEventListener("click", update);

    track.addEventListener("mousedown", (e) => {
      dragging = true;
      update(e);
    });

    window.addEventListener("mousemove", (e) => {
      if (dragging) update(e);
    });

    window.addEventListener("mouseup", () => {
      dragging = false;
    });
  });

});