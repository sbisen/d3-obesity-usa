import drawLineChart from '../../modules/line-chart/line-chart.js'

const geoPath = d3.geoPath();

// chart parameters
const width = 800;
const height = 600;
const NODE = { MIN_RADIUS: 15, MAX_RADIUS: 40, PADDING: 2 };

// creates, appends and returns base outline map of US 
const createBaseMap = (stateBoundaries, nation) => {
  const svg = d3
    .select("#d3-cartogram")
    .attr("viewBox", `0 0 960 ${height}`)
    .style("width", "100%")
    .style("height", "auto");

  svg
    .append("path")
    .classed("state-boundaries", true)
    .datum(stateBoundaries)
    .attr("fill", "none")
    .attr("stroke", "lightgray")
    .attr("stroke-width", 1)
    .attr("stroke-linejoin", "round")
    .attr("d", d3.geoPath());

  svg
    .append("path")
    .classed("nation-boundary", true)
    .datum(nation)
    .attr("fill", "none")
    .attr("stroke", "gray")
    .attr("stroke-linejoin", "round")
    .attr("d", d3.geoPath());

  return svg.node();
};

const applySimulation = (nodes) => {
  const simulation = d3.forceSimulation(nodes)
    .force("cx", d3.forceX().x(d => width / 2).strength(0.02))
    .force("cy", d3.forceY().y(d => height / 2).strength(0.02))
    .force("x", d3.forceX().x(d => d.x).strength(0.3))
    .force("y", d3.forceY().y(d => d.y).strength(0.3))
    .force("charge", d3.forceManyBody().strength(-1))
    .force("collide", d3.forceCollide().radius(d => d.r + NODE.PADDING).strength(1))
    .stop()

  while (simulation.alpha() > 0.01) {
    simulation
      .tick()
  }

  return simulation.nodes();
}

const drawCartogram = async () => {
  const us = await d3.json("./resources/us-atlas@2.1.0-us-10m.json");
  const combined_data = await d3.json("./scatter_cartogram.json");
  console.log(combined_data);

  const stateBoundaries = topojson.mesh(us, us.objects.states, (a, b) => a !== b);
  const nation = topojson.mesh(us, us.objects.nation);
  const states = topojson.feature(us, us.objects.states);

  const year_selector = (year) => 0
  const year = year_selector(2008)


  // creating the general outline of the US with states
  const baseMap = createBaseMap(stateBoundaries, nation);

  // this is a scale for converting obesity % to a radius
  const obesityToRadius = d3.scaleSqrt()
    .domain(d3.extent(Object.values(combined_data), d => d.obese[year_selector(2008)]))
    .range([NODE.MIN_RADIUS, NODE.MAX_RADIUS])

  states.features.forEach((feature) => {
    const [x, y] = geoPath.centroid(feature);
    const { name } = feature.properties
    const combined = combined_data[name]
    const r = obesityToRadius(combined.obese[year])
    feature.properties = { ...feature.properties, ...combined_data[name], x, y, r };
  });
  console.log(states)

  const data = states.features.map((d) => d.properties)
  // const dataByState = d3.group(data, d => d.state)
  // const statesPacked = createStatePacks(dataByState, radius, csv_data);
  // let values = [...new Map(statesPacked).values()];
  const values = applySimulation(data)

  const bubbles = d3.select(baseMap)
    .append("g")
    .classed("centroids", true)


  let bubbles_group = bubbles.selectAll("g")
    .data(values)

  bubbles_group = bubbles_group
    .join("g")
    .classed('scatterBubbleGroup', true)
    .on("click", function (d) { click(d) })
  // .style('opacity', '50%')


  bubbles_group.append('circle')
    // .classed('scatterBubble', true)
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.r)
    .attr("fill", "rgba(63, 191, 108)")
    .attr("stroke", "black")
    .attr("stroke-width", 1)

  bubbles_group.exit().transition().delay(40)
    .duration(1000)
    .attr("r", 0)
    .remove();




  bubbles_group.on('mouseover', function (d, i) {
    d3.select(this)
      // .classed('bubbleHover', true)
      .transition()
      .duration(250)
      .style("transform", 'translate(0px, -5px)')
    // .style('opacity', '100%')
  })

  bubbles_group.on('mouseout', function (d, i) {
    d3.select(this)
      // .classed('bubbleHover', false)
      .transition()
      .duration(250)
      .style("transform", 'translate(0px, 0px)')
    // .style('opacity', '50%')
  })

  // adding the State Abbreviation to the bubbles
  bubbles_group
    .append('text')
    .classed('stateText', true)
    .attr("x", d => d.x)
    .attr("y", d => d.y - 5)
    .text(d => d.abbreviation)

  // adding the Value (obesity % at first) annotation to the bubbles
  bubbles_group
    .append('text')
    .classed('stateValue', true)
    .attr("x", d => d.x)
    .attr("y", d => d.y + 13)
    .text(d => `${d.obese[year]}%`)

  // const year_slider = d3.select('input[type=range]#cartogram_year')
  //   .on('input', function () {
  //     const year = this.value
  //     d3.select("#cartogram_year_label")
  //       .text(year)
  //   })
  // console.log(year_slider)
  function click(d) {
    const buttons_container = d3.select("#buttons")
    .style("display","block");

    const buttons_container1 = d3.select("#age-button")
    selected_button = "Age"
    drawLineChart(d.scatter.state, 'Age Group');

    const buttons_container2 = d3.select("#ed-button")
    drawLineChart(d.scatter.state, 'Education Attained');

    const buttons_container3 = d3.select("#race-button")
    drawLineChart(d.scatter.state, 'Race/Ethnicity');

    const buttons_container4 = d3.select("#income-button")
    drawLineChart(d.scatter.state, 'Household Income');

    const buttons_container5 = d3.select("#gender-button")
    drawLineChart(d.scatter.state, 'Gender');
    //console.log(d.name)
    drawLineChart(d.scatter.state, 'Age Group');
    // drawLineChart(d.scatter.state, 'Education Attained');
    // drawLineChart(d.scatter.state, 'Race/Ethnicity');
    // drawLineChart(d.scatter.state, 'Household Income');
    // drawLineChart(d.scatter.state, 'Gender');
  }

  let moving = false;
  let currentValue = 0;
  const targetValue = 2018;
  let timer;

  function step() {
    const yearslider = d3.select("#cartogram_year")
    currentValue = yearslider.attr("value");
    //update(x.invert(currentValue));
    currentValue = currentValue + 1;
    yearslider.attr("value", currentValue);
    if (currentValue > targetValue) {
      moving = false;
      currentValue = 0;
      clearInterval(timer);
      // timer = 0;
      playButton.text("Play");
      console.log("Slider moving: " + moving);
    }
  }


  const playButton = d3.select("#play-button")
    .on("click", function () {

      var button = d3.select(this);
      if (button.text() == "Pause") {
        moving = false;
        clearInterval(timer);
        timer = 0;
        button.text("Play");
      } else {
        moving = true;
        timer = setInterval(step, 1000);
        button.text("Pause");
      }
      console.log("Slider moving: " + moving);

    })


};

drawCartogram()