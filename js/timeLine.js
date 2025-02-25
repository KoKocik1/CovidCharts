var timeLineWidth = 1000;
var timeLineHeight = 90;
if (window.innerWidth <= 1024) {
  timeLineWidth = window.innerWidth * 0.9;
}
const svgTime = d3.select("#timeLabel");
// event when window width changes
window.addEventListener("resize", function () {
  if (window.innerWidth <= 1024) {
    timeLineWidth = window.innerWidth * 0.9;
  } else {
    timeLineWidth = 1000;
  }
  svgTime.attr("width", timeLineWidth).attr("height", timeLineHeight);
  const widthTime = +timeLineWidth - marginTime.left - marginTime.right;
  const heightTime = +timeLineHeight - marginTime.top - marginTime.bottom;
  xTime.range([0, widthTime]);
  g.select(".x.axis").call(xAxis);
  g.select(".start-date").attr("y", heightTime);
  g.select(".end-date").attr("x", widthTime + 50);
  updateSliderPosition(startDateTime);
});

svgTime.attr("width", timeLineWidth).attr("height", timeLineHeight);
const marginTime = { top: 20, right: 100, bottom: 50, left: 100 };
const widthTime = +timeLineWidth - marginTime.left - marginTime.right;
const heightTime = +timeLineHeight - marginTime.top - marginTime.bottom;

// time for timeLine
const startDateTime = new Date("2019-12-31"); // for 2020 on x asix
const startDateData = new Date("2020-01-01"); // real data start
const endDateTime = new Date("2024-05-10"); //end data

//time under chart
const xTime = d3
  .scaleTime()
  .domain([startDateTime, endDateTime])
  .range([0, widthTime]);

const xAxis = (g) => {
  g.call(
    d3
      .axisBottom(xTime)
      .ticks(d3.timeMonth.every(1))
      .tickSize(6)
      .tickFormat(d3.timeFormat(""))
  )
    .call((g) =>
      g
        .selectAll(".tick text")
        .filter((d) => d.getMonth() === 0) // January
        .text(d3.timeFormat("%Y"))
    )
    .call((g) =>
      g.selectAll(".tick line").attr("y2", (d) => (d.getMonth() === 0 ? 10 : 5))
    );
};

// contruction of chart
const g = svgTime
  .append("g")
  .attr("transform", `translate(${marginTime.left},${marginTime.top})`);

g.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0,${heightTime})`)
  .call(xAxis);

g.append("text")
  .attr("class", "start-date")
  .attr("x", -50)
  .attr("y", heightTime)
  .attr("dy", ".35em")
  .attr("text-anchor", "start")
  .attr("color", "white")
  .text(d3.timeFormat("%b %d")(startDateData));

g.append("text")
  .attr("class", "end-date")
  .attr("x", widthTime + 50)
  .attr("y", heightTime)
  .attr("dy", ".35em")
  .attr("text-anchor", "end")
  .attr("color", "white")
  .text(d3.timeFormat("%b %d")(endDateTime));

//slider settings
const dateSliderTime = document.getElementById("dateSlider");
const timeDiffTime = endDateTime.getTime() - startDateData.getTime();
const daysDiffTime = Math.ceil(timeDiffTime / (1000 * 3600 * 24));
dateSliderTime.max = daysDiffTime;

//********** CHART DATALINE ***********//
function updateSliderPosition(date) {
  const xPos = xTime(date);
  g.selectAll(".slider-marker").remove();

  g.append("line")
    .attr("class", "slider-marker")
    .attr("x1", xPos)
    .attr("x2", xPos)
    .attr("y1", 0)
    .attr("y2", heightTime)
    .attr("stroke", "red")
    .attr("stroke-width", 2);

  g.append("text")
    .attr("class", "slider-marker")
    .attr("x", xPos)
    .attr("y", heightTime + 30)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .style("fill", "yellow")
    .text(d3.timeFormat("%b %d, %Y")(date));
}

//********** EVENT LISTENERS ***********/
dateSliderTime.addEventListener("input", function () {
  const selectedDateTime = new Date(
    startDateData.getTime() + this.value * 24 * 60 * 60 * 1000
  );
  updateSliderPosition(selectedDateTime);
});

updateSliderPosition(startDateTime);
