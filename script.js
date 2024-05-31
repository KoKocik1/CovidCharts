fetch(
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json"
)
  .then((response) => response.json())
  .then((data) => {
    worldGeoJSON = data;
    initMap();
  });

var map;
var geojsonLayer;
var covidData = [];
var currentIndex = 0;
var animationInterval;
var speed = 500;
var maxIndex = 999;
var dataType = "new_cases";
var wasZero = {};
var lastValue = {};
const thresholds = {
  new_cases: [
    10000000, 5000000, 1000000, 500000, 200000, 100000, 50000, 20000, 10000,
    5000,
  ],
  total_cases: [
    10000000, 5000000, 1000000, 500000, 200000, 100000, 50000, 20000, 10000,
    5000,
  ],
  new_deaths: [100000, 50000, 10000, 5000, 2000, 1000, 500, 200, 100, 50],
  total_deaths: [
    1000000, 500000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500,
  ],
  new_tests: [
    10000000, 5000000, 1000000, 500000, 200000, 100000, 50000, 20000, 10000,
    5000,
  ],
  total_tests: [
    100000000, 50000000, 10000000, 5000000, 2000000, 1000000, 500000, 100000,
    50000, 10000,
  ],
  total_cases_per_million: [
    500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500,
  ],
  new_cases_per_million: [
    200000, 150000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500,
  ],
  total_deaths_per_million: [
    6000, 5500, 5000, 4500, 4000, 3000, 2000, 1000, 500, 100,
  ],
  new_deaths_per_million: [900, 800, 700, 600, 500, 400, 300, 200, 100, 50],
  total_tests_per_thousand: [
    30000, 25000, 20000, 15000, 10000, 5000, 2000, 1000, 500, 100,
  ],
  new_tests_per_thousand: [500, 450, 400, 350, 300, 250, 200, 150, 100, 50],
};

const countryCodes = {};

const colors = [
  "#1b0008",
  "#540019",
  "#800026",
  "#BD0026",
  "#E31A1C",
  "#FC4E2A",
  "#FD8D3C",
  "#FEB24C",
  "#FED976",
  "#FFEDA0",
  "#FFFFFF",
];

// Initial legend
createLegend();

function initMap() {
  map = L.map("map", {}).setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  loadData();
}

function countryCodeToName(code) {
    return countryCodes[code] || "Unknown"; // Zwraca nazwę państwa lub "Unknown", jeśli skrót nie został znaleziony w słowniku
  }

function loadData() {
  d3.csv("covid.csv").then((data) => {
    const groupedData = {};
    let maxTests = 0;
    let maxCases = 0;
    let maxDeaths = 0;
    let maxNewCases = 0;
    let maxNewTests = 0;
    let maxNewDeaths = 0;
    let maxTotalCasesPerMillion = 0;
    let maxNewCasesPerMillion = 0;
    let maxTotalDeathsPerMillion = 0;
    let maxNewDeathsPerMillion = 0;
    let maxTotalTestsPerThousand = 0;
    let maxNewTestsPerThousand = 0;

    data.forEach(row => {

        const code = row.iso_code;
        const country = row.location;
        if (!(code in countryCodes)) {
          countryCodes[code] = country;
        }
      });
      console.log(countryCodes);

    // Iteracja po danych
    data.forEach((d) => {
      // Tworzenie klucza dla danej daty, jeśli nie istnieje
      if (!groupedData[d.date]) {
        groupedData[d.date] = {};
      }

      // Dodawanie danych dla danego kraju do danej daty
      groupedData[d.date][d.iso_code] = {
        new_cases: +d.new_cases,
        total_cases: +d.total_cases,
        new_deaths: +d.new_deaths,
        total_deaths: +d.total_deaths,
        new_tests: +d.new_tests,
        total_tests: +d.total_tests,
        total_cases_per_million: +d.total_cases_per_million,
        new_cases_per_million: +d.new_cases_per_million,
        total_deaths_per_million: +d.total_deaths_per_million,
        new_deaths_per_million: +d.new_deaths_per_million,
        total_tests_per_thousand: +d.total_tests_per_thousand,
        new_tests_per_thousand: +d.new_tests_per_thousand,
      };

      // Aktualizacja maksymalnych wartości
      if (+d.total_tests > maxTests) {
        maxTests = +d.total_tests;
      }
      if (+d.total_cases > maxCases) {
        maxCases = +d.total_cases;
      }
      if (+d.total_deaths > maxDeaths) {
        maxDeaths = +d.total_deaths;
      }
      if (+d.new_cases > maxNewCases) {
        maxNewCases = +d.new_cases;
      }
      if (+d.new_tests > maxNewTests) {
        maxNewTests = +d.new_tests;
      }
      if (+d.new_deaths > maxNewDeaths) {
        maxNewDeaths = +d.new_deaths;
      }
      if (+d.total_cases_per_million > maxTotalCasesPerMillion) {
        maxTotalCasesPerMillion = +d.total_cases_per_million;
      }
      if (+d.new_cases_per_million > maxNewCasesPerMillion) {
        maxNewCasesPerMillion = +d.new_cases_per_million;
      }
      if (+d.total_deaths_per_million > maxTotalDeathsPerMillion) {
        maxTotalDeathsPerMillion = +d.total_deaths_per_million;
      }
      if (+d.new_deaths_per_million > maxNewDeathsPerMillion) {
        maxNewDeathsPerMillion = +d.new_deaths_per_million;
      }
      if (+d.total_tests_per_thousand > maxTotalTestsPerThousand) {
        maxTotalTestsPerThousand = +d.total_tests_per_thousand;
      }
      if (+d.new_tests_per_thousand > maxNewTestsPerThousand) {
        maxNewTestsPerThousand = +d.new_tests_per_thousand;
      }
    });

    // Aktualizacja maksymalnej wartości suwaka daty
    const dates = Object.keys(groupedData);
    document.getElementById("dateSlider").max = dates.length - 1;

    // Zapisanie zgrupowanych danych do zmiennej covidData
    covidData = groupedData;
    maxIndex = dates.length - 1;

    console.log("Max Tests: " + maxTests);
    console.log("Max Cases: " + maxCases);
    console.log("Max Deaths: " + maxDeaths);
    console.log("Max New Cases: " + maxNewCases);
    console.log("Max New Tests: " + maxNewTests);
    console.log("Max New Deaths: " + maxNewDeaths);
    console.log("Max Total Cases Per Million: " + maxTotalCasesPerMillion);
    console.log("Max New Cases Per Million: " + maxNewCasesPerMillion);
    console.log("Max Total Deaths Per Million: " + maxTotalDeathsPerMillion);
    console.log("Max New Deaths Per Million: " + maxNewDeathsPerMillion);
    console.log("Max Total Tests Per Thousand: " + maxTotalTestsPerThousand);
    console.log("Max New Tests Per Thousand: " + maxNewTestsPerThousand);

    updateMap();
  });
}

function updateMap() {
  if (geojsonLayer) map.removeLayer(geojsonLayer);

  var dataType = document.getElementById("dataType").value;
  var currentDate = Object.keys(covidData)[currentIndex];
  var dateData = covidData[currentDate];
  //console.log(dateData);
  updateChartColumn(dateData);

  geojsonLayer = L.geoJSON(worldGeoJSON, {
    style: function (feature) {
      var countryData = dateData[feature.id];

      var value = countryData === undefined ? 0 : countryData[dataType];
      if (!wasZero[feature.id]) {
        wasZero[feature.id] = 0;
      }
      if (!lastValue[feature.id]) {
        lastValue[feature.id] = 0;
      }
      if (value === 0) {
        wasZero[feature.id]++;
      } else {
        wasZero[feature.id] = 0;
        lastValue[feature.id] = value;
      }

      // Jeśli było 7 kolejnych zer, ustaw wartość na 0
      if (wasZero[feature.id] >= 7) {
        value = 0;
      } else {
        value = lastValue[feature.id];
      }
      lastValue[feature.id] = value;
      return {
        fillColor: getColor(value),
        weight: 1,
        opacity: 1,
        color: "black",
        fillOpacity: 0.7,
      };
    },
  }).addTo(map);

  document.getElementById("dateLabel").innerText = currentDate;
  document.getElementById("dateSlider").value = currentIndex;
}

function getColor(value) {
  return value === 0
    ? "#FFFFFF"
    : value > thresholds[dataType][0]
    ? colors[0]
    : value > thresholds[dataType][1]
    ? colors[1]
    : value > thresholds[dataType][2]
    ? colors[2]
    : value > thresholds[dataType][3]
    ? colors[3]
    : value > thresholds[dataType][4]
    ? colors[4]
    : value > thresholds[dataType][5]
    ? colors[5]
    : value > thresholds[dataType][6]
    ? colors[6]
    : value > thresholds[dataType][7]
    ? colors[7]
    : value > thresholds[dataType][8]
    ? colors[8]
    : colors[9];
}

function startAnimation() {
  if (animationInterval) clearInterval(animationInterval);
  animationInterval = setInterval(() => {
    currentIndex = currentIndex + 1;
    if (currentIndex > maxIndex) {
      stopAnimation();
      currentIndex = 0;
      return;
    }
    document.getElementById("dateSlider").value = currentIndex;
    updateMap();
  }, speed);
}

function stopAnimation() {
  if (animationInterval) clearInterval(animationInterval);
}

function resetAnimation() {
  currentIndex = 0;
  document.getElementById("dateSlider").value = currentIndex;
  stopAnimation();
  updateMap();
}

document.getElementById("start").addEventListener("click", startAnimation);
document.getElementById("stop").addEventListener("click", stopAnimation);
document.getElementById("reset").addEventListener("click", resetAnimation);

document.getElementById("dateSlider").addEventListener("input", function () {
  currentIndex = +this.value;
  updateMap();
});

document.getElementById("speedControl").addEventListener("input", function () {
  speed = 500 - this.value;
  if (animationInterval) {
    startAnimation();
  }
});
document.getElementById("dataType").addEventListener("change", function () {
  dataType = this.value;
  createLegend();
  updateMap();
});
function createLegend() {
  const legend = document.getElementById("legend");
  legend.innerHTML = "";
  const legendData = thresholds[dataType];

  for (let i = 0; i < legendData.length; i++) {
    const color = colors[i];
    const value = legendData[i];

    const legendItem = document.createElement("div");
    const colorBox = document.createElement("span");
    colorBox.style.backgroundColor = color;
    legendItem.appendChild(colorBox);

    const text = document.createTextNode(`> ${value.toLocaleString()}`);
    legendItem.appendChild(text);

    legend.appendChild(legendItem);
  }
}
const margin = {top: 20, right: 30, bottom: 60, left: 90},
              width = 800 - margin.left - margin.right,
              height = 800 - margin.top - margin.bottom;

        const svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleBand().range([height, 0]).padding(0.1);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`);

        svg.append("g")
            .attr("class", "y-axis");

        function updateChartColumn(data) {
            const dataType = document.getElementById("dataType").value;
            
            if (!dataType.includes("total")) {
                svg.selectAll(".bar").remove();
                return;
            }

            let countries = Object.entries(data).map(([country, values]) => ({
                country: countryCodeToName(country),
                value: values[dataType]
            }));

            countries = countries.sort((a, b) => b.value - a.value).slice(0, 20);
            countries = countries.reverse();

            const maxValue = d3.max(countries, d => d.value);
            x.domain([0, maxValue]);
            y.domain(countries.map(d => d.country)).padding(0.1);

            svg.select(".x-axis")
                .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".2s")));

            svg.select(".y-axis")
                .call(d3.axisLeft(y));

            const bars = svg.selectAll(".bar")
                .data(countries, d => d.country);

            bars.enter().append("rect")
                .attr("class", "bar")
                .attr("y", d => y(d.country))
                .attr("height", y.bandwidth())
                .style("fill", d => colorScale(d.country))
                .merge(bars)
                .attr("x", 0)
                .attr("width", d => x(d.value))
                .attr("y", d => y(d.country))
                .attr("height", y.bandwidth());

            bars.exit().remove();
        }

        document.getElementById("dataType").addEventListener("change", () => updateChartColumn(data));
