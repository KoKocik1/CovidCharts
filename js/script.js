//get geojson
var content = document.getElementsByClassName("content")[0];
var loader = document.getElementsByClassName("loaderBox")[0];

fetch(
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json"
)
  .then((response) => response.json())
  .then((data) => {
    worldGeoJSON = data;
    initMap();
  });

//********************* Init *********************//
var map;
var geojsonLayer;
var covidData = []; //main data of program
var currentIndex = 0;
var animationInterval;
var speedAnimation = 500;
var maxIndex = 999; //index to stop animation
var dataType = "new_cases"; // type of data to show
var sevenDaysWithouData = {}; //list to delete data from map after 7 days without data
var lastValueOnMap = {};
var dataTypeColumnChart = "countries"; // countries, continents
const countryCodes = {}; // switch country code to country name

// color pallete for column chart
const colorPalette = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];
const countryColorMap = {}; // unique colors for column chart

// colors for map legend
const thresholds = {
  new_cases: [
    10000000, 5000000, 1000000, 500000, 200000, 100000, 50000, 20000, 10000,
    5000,
  ],
  total_cases: [
    100000000, 50000000, 10000000, 5000000, 1000000, 500000, 100000, 50000,
    10000, 5000,
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

//colors for map
const colorsMap = [
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

//********************* column chart prepare *********************//
let margin = { top: 20, right: 30, bottom: 60, left: 150 },
  width = 700 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

let fontSize = "16px";
function changeWidth() {
  if (window.innerWidth <= 1024) {
    width = window.innerWidth * 0.9 - margin.left * 0.8 - margin.right * 0.8;
    fontSize = "12px";
  } else {
    width = 700 - margin.left - margin.right;
    fontSize = "16px";
  }
}
changeWidth();
const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

//resize chart when width change
window.addEventListener("resize", function () {
  changeWidth();
  // set new width:
  d3.select("#chart")
    .select("svg")
    .attr("width", width + margin.left + margin.right);
  x.range([0, width]);
  svg
    .select(".x-axis")
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".2s")));
  updateChartColumn(covidData[Object.keys(covidData)[currentIndex]]);
});
svg
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("transform", `translate(${margin.left},${margin.top})`)
  .append("g");

const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().range([height, 0]).padding(0.1);

svg
  .append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${height})`);

svg.append("g").attr("class", "y-axis");

//********************** CSV LOAD DATA *********************//
function loadData() {
  d3.csv("covid.csv").then((data) => {
    const groupedData = {};
    let groupedDataTemp = {};
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

    //prepare dist to change shortcut to country name
    data.forEach((row) => {
      const code = row.iso_code;
      const country = row.location;
      if (!(code in countryCodes)) {
        countryCodes[code] = country;
      }
    });

    // group data and calculate max points
    data.forEach((d) => {
      if (!groupedDataTemp[d.date]) {
        groupedDataTemp[d.date] = {};
      }

      groupedDataTemp[d.date][d.iso_code] = {
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

    let tempDates = Object.keys(groupedDataTemp);
    const dates = tempDates.sort();

    // delete data after 10.05.24 - strange data
    dates.forEach((key) => {
      if (new Date(key) <= new Date("2024-05-10")) {
        groupedData[key] = groupedDataTemp[key];
      }
    });

    // main data use for map and column chart
    covidData = groupedData;

    maxIndex = Object.keys(covidData).length - 1;

    //data slider max point
    document.getElementById("dateSlider").max = maxIndex;

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

    loader.hidden = true;
    //content.hidden = false;

    updateMap();
  });
}

//********************** MAP CHART *********************//
function initMap() {
  map = L.map("map", {}).setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  loadData();
}

function createLegend() {
  const legend = document.getElementById("legend");
  legend.innerHTML = "";
  const legendData = thresholds[dataType];

  for (let i = 0; i < legendData.length; i++) {
    const color = colorsMap[i];
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

function countryCodeToName(code) {
  return countryCodes[code] || "Unknown";
}

//********************** UPDATE MAP CHART **********************//
function updateMap() {
  if (geojsonLayer) map.removeLayer(geojsonLayer);
  var currentDate = Object.keys(covidData)[currentIndex];
  var dateData = covidData[currentDate];

  updateChartColumn(dateData);

  geojsonLayer = L.geoJSON(worldGeoJSON, {
    style: function (feature) {
      var countryData = dateData[feature.id];

      var value = countryData === undefined ? 0 : countryData[dataType];
      if (!sevenDaysWithouData[feature.id]) {
        sevenDaysWithouData[feature.id] = 0;
      }
      if (!lastValueOnMap[feature.id]) {
        lastValueOnMap[feature.id] = 0;
      }
      if (value === 0) {
        sevenDaysWithouData[feature.id]++;
      } else {
        sevenDaysWithouData[feature.id] = 0;
        lastValueOnMap[feature.id] = value;
      }

      // Jeśli było 7 kolejnych zer, ustaw wartość na 0
      if (sevenDaysWithouData[feature.id] >= 7) {
        value = 0;
      } else {
        value = lastValueOnMap[feature.id];
      }
      lastValueOnMap[feature.id] = value;
      return {
        fillColor: getColor(value),
        weight: 1,
        opacity: 1,
        color: "black",
        fillOpacity: 0.7,
      };
    },
  }).addTo(map);

  updateSliderPosition(new Date(currentDate));
  document.getElementById("dateSlider").value = currentIndex;
}

//********************** MAP CHART ANIMATION *********************//
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
  }, speedAnimation);
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
//**********************  COLUMN CHART MANAGEMENT *********************//
function updateChartColumn(data) {
  if (!dataType.includes("total")) {
    svg.selectAll(".bar").remove();
    return;
  }

  let countries = Object.entries(data).map(([country, values]) => ({
    country: countryCodeToName(country),
    value: values[dataType],
  }));
  const allowedCountries = [
    "Asia",
    "Europe",
    "European Union",
    "North America",
    "South America",
    "Africa",
    "South Africa",
    "Australia",
  ];

  const notAllowedPositions = [
    "World",
    "High income",
    "Upper middle income",
    "Lower middle income",
  ];

  if (dataTypeColumnChart == "countries") {
    countries = countries.filter(
      (entry) =>
        !allowedCountries.includes(entry.country) &&
        !notAllowedPositions.includes(entry.country)
    );
  } else {
    countries = countries.filter((entry) =>
      allowedCountries.includes(entry.country)
    );
  }

  countriesBest = countries.sort((a, b) => b.value - a.value).slice(0, 10);
  countriesBest = countriesBest.reverse();

  updateCountryColors(countriesBest.map((d) => d.country));

  const maxValue = d3.max(countriesBest, (d) => d.value);
  x.domain([0, maxValue]);
  y.domain(countriesBest.map((d) => d.country)).padding(0.1);

  svg
    .select(".x-axis")
    .style("font-size", fontSize)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".2s")));

  svg
    .select(".y-axis")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", fontSize);

  const bars = svg.selectAll(".bar").data(countriesBest, (d) => d.country);

  bars
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("y", (d) => y(d.country))
    .attr("height", y.bandwidth())
    .style("fill", (d) => countryColorMap[d.country])
    .merge(bars)
    .attr("x", 0)
    .attr("width", (d) => x(d.value))
    .attr("y", (d) => y(d.country))
    .attr("height", y.bandwidth());

  bars.exit().remove();
}

//********************** Colors management column chart *********************//
function updateCountryColors(countries) {
  for (const country in countryColorMap) {
    if (!countries.includes(country)) {
      colorPalette.push(countryColorMap[country]);
      delete countryColorMap[country];
    }
  }
  countries.forEach((country, index) => {
    if (countryColorMap[country] === undefined) {
      countryColorMap[country] = colorPalette.shift(); // Przypisz kolor i usuń go z dostępnych
    }
  });
}
//********************** Colors management map *********************//
function getColor(value) {
  return value === 0
    ? "#FFFFFF"
    : value > thresholds[dataType][0]
    ? colorsMap[0]
    : value > thresholds[dataType][1]
    ? colorsMap[1]
    : value > thresholds[dataType][2]
    ? colorsMap[2]
    : value > thresholds[dataType][3]
    ? colorsMap[3]
    : value > thresholds[dataType][4]
    ? colorsMap[4]
    : value > thresholds[dataType][5]
    ? colorsMap[5]
    : value > thresholds[dataType][6]
    ? colorsMap[6]
    : value > thresholds[dataType][7]
    ? colorsMap[7]
    : value > thresholds[dataType][8]
    ? colorsMap[8]
    : colorsMap[9];
}

//********************** Event listeners **********************//
document.getElementById("start").addEventListener("click", startAnimation);
document.getElementById("stop").addEventListener("click", stopAnimation);
document.getElementById("reset").addEventListener("click", resetAnimation);

document.getElementById("dateSlider").addEventListener("input", function () {
  currentIndex = +this.value;
  updateMap();
});

document
  .getElementById("dataTypeColumnChart")
  .addEventListener("input", function () {
    dataTypeColumnChart = this.value;
    updateMap();
  });

document.getElementById("speedControl").addEventListener("input", function () {
  speedAnimation = 500 - this.value;
  if (animationInterval) {
    startAnimation();
  }
});
document.getElementById("dataType").addEventListener("change", function () {
  dataType = this.value;
  createLegend();
  updateMap();
});

// Initial legend
createLegend();
