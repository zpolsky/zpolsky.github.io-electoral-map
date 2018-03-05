const voteBased = false;

const stateMatrix = [
  ['AK', null, null, null, null, null, null, null, null, null, null, 'ME'],
  [null, null, null, null, null, null, null, null, null, null, 'VT', 'NH'],
  [null, 'WA', 'ID', 'MT', 'ND', 'MN', 'IL', 'WI', 'MI', 'NY', 'RI', 'MA'],
  [null, 'OR', 'NV', 'WY', 'SD', 'IA', 'IN', 'OH', 'PA', 'NJ', 'CT', null],
  [null, 'CA', 'UT', 'CO', 'NE', 'MO', 'KY', 'WV', 'VA', 'MD', 'DC', null],
  [null, null, 'AZ', 'NM', 'KS', 'AR', 'TN', 'NC', 'SC', 'DE', null, null],
  [null, null, null, null, 'OK', 'LA', 'MS', 'AL', 'GA', null, null, null],
  [null, 'HI', null, null, 'TX', null, null, null, null, 'FL', null, null]
];

function rgb(r, g, b) {
  return "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
}

// Returns the indexes of the given state in the state matrix
function getStateLoc(d) {
  const state = d.Abbreviation;
  for (i in stateMatrix) {
    for (j in stateMatrix[i]) {
      if (state === stateMatrix[i][j]) {
        return { i, j };
      }
    }
  }
  // If not found (shouldn't happen)
  return { i: -1, j: -1 };
}

// Adapted from https://stackoverflow.com/questions/5649803/remap-or-map-function-in-javascript
function convertRange(value, origMin, origMax, newMin, newMax) {
  return newMin + (newMax - newMin) * (value - origMin) / (origMax - origMin);
}

function pickColor(d, isVotes) {
  const { D_Votes, R_Votes, D_Percentage, R_Percentage } = d;
  let r, g, b;
  if (isVotes) {
    if (D_Votes > R_Votes) {
      const percent = D_Votes/(D_Votes + R_Votes) * 100.0;
      r = convertRange(percent, 0, 100, 255, 33);
      g = convertRange(percent, 0, 100, 255, 102);
      b = convertRange(percent, 0, 100, 255, 172);
    } else if (D_Votes < R_Votes) {
      const percent = R_Votes/(D_Votes + R_Votes) * 100.0;
      r = convertRange(percent, 0, 100, 255, 178);
      g = convertRange(percent, 0, 100, 255, 24);
      b = convertRange(percent, 0, 100, 255, 43);
    } else {
      return "#f7f7f7";
    }
  } else {
    if (D_Percentage + R_Percentage > 100) {
      return pickColor(d, true);
    }
    else if (D_Percentage > R_Percentage) {
      r = convertRange(D_Percentage - R_Percentage, -60, 60, 255, 33);
      g = convertRange(D_Percentage - R_Percentage, -60, 60, 255, 102);
      b = convertRange(D_Percentage - R_Percentage, -60, 60, 255, 172);
    } else if (D_Percentage < R_Percentage) {
      r = convertRange(R_Percentage - D_Percentage, -60, 60, 255, 178);
      g = convertRange(R_Percentage - D_Percentage, -60, 60, 255, 24);
      b = convertRange(R_Percentage - D_Percentage, -60, 60, 255, 43);
    } else {
      return "#f7f7f7";
    }
  }

  return rgb(r, g, b);
}

function pickTextColor(d) {
  if (d.D_Percentage === d.R_Percentage) {
    return "black"
  } else {
    // return pickColor(d);
    return pickColor(d, voteBased);
  }
}

function loadYear(year) {
  d3.csv(`./data/election-results-${year}.csv`, data => {
    d3.selectAll("svg").remove();
    createLegend();
    updateMap(data, year);
  });
}

function getVoteData(d) {
  return {
    state: d.State,
    eVotes: d.Total_EV,
    dVotes: d.D_Votes,
    rVotes: d.R_Votes,
    dCand: d.D_Nominee,
    rCand: d.R_Nominee,
    dPercent: d.D_Percentage,
    rPercent: d.R_Percentage,
  };
}

function winnerLoserData(voteData) {
  const { dVotes, rVotes, dCand, rCand, dPercent, rPercent } = voteData;
  let winData, loseData;
  if (voteBased) {
    if (dVotes > rVotes) {
      winData = {
        name: dCand,
        votes: dVotes,
        percent: dPercent,
        color: 'blue'
      };
      loseData = {
        name: rCand,
        votes: rVotes,
        percent: rPercent,
        color: 'red'
      };
    } else {
      winData = {
        name: rCand,
        votes: rVotes,
        percent: rPercent,
        color: 'red'
      };
      loseData = {
        name: dCand,
        votes: dVotes,
        percent: dPercent,
        color: 'blue'
      };
    }
  } else {
    if (dPercent > rPercent) {
      winData = {
        name: dCand,
        votes: dVotes,
        percent: dPercent,
        color: 'blue'
      };
      loseData = {
        name: rCand,
        votes: rVotes,
        percent: rPercent,
        color: 'red'
      };
    } else {
      winData = {
        name: rCand,
        votes: rVotes,
        percent: rPercent,
        color: 'red'
      };
      loseData = {
        name: dCand,
        votes: dVotes,
        percent: dPercent,
        color: 'blue'
      };
    }
  }

  return { winData, loseData };
}

function htmlWinnerLoser(data) {
  const { name, votes, percent, color } = data;
  return `<li style=color:${color}>${name}: ${votes} (${percent}%)</li>`;
}

function htmlTooltip(winData, loseData, state, stateColor, eVotes) {
  const winner = htmlWinnerLoser(winData);
  const loser = htmlWinnerLoser(loseData);
  return `<h3 style=color:${stateColor}>${state}</h3><br/>
  <p class="tip-votes">Electoral Votes: ${eVotes}<p/>
  <ul>
    ${winner}
    ${loser}
  </ul>`;
}

function drawTooltip(tooltip, d) {
  const { i, j } = getStateLoc(d);
  const voteData = getVoteData(d);
  const { state, eVotes, dVotes, rVotes, dCand, rCand, dPercent, rPercent } = voteData;
  const stateColor = pickTextColor(d);
  const { winData, loseData } = winnerLoserData(voteData);
  tooltip.transition()
      .duration(200)
      .style("opacity", 1);
  tooltip.html(htmlTooltip(winData, loseData, state, stateColor, eVotes))
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY) + "px");
}

// Adapted from https://stackoverflow.com/questions/5788741/remove-commas-from-the-string-using-javascript
function removeCommas(num) {
  return parseFloat(num.replace(/,/g, ''));
}

function updateMap(data, year) {
  let w = 1000;
  let h = 600;
  let padding = 20;

  let stateBoxes = d3.select("body")
              .append("svg")
              .attr("width", 1.2 * w)
              .attr("height", h);

  // Adapted from http://bl.ocks.org/d3noob/a22c42db65eb00d4e369
  let tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")

  let xScale = d3.scaleLinear()
             .domain([0, stateMatrix[0].length])
             .range([padding, w - padding]);
  let yScale = d3.scaleLinear()
             .domain([0, stateMatrix.length])
             .range([padding, h - padding]);

  let boxWidth = w * 0.065;

  // Convert text to numbers (some text results in NaN, so convert back if this occurs)
  data.forEach(d => {
    const { D_Votes, R_Votes } = d;
    d.Total_EV = +d.Total_EV;
    d.D_Votes = +d.D_Votes;
    d.R_Votes = +d.R_Votes;
    d.D_Percentage = +d.D_Percentage;
    d.R_Percentage = +d.R_Percentage;
    if (isNaN(d.D_Votes) || isNaN(d.R_Votes)) {
      d.D_Votes = +removeCommas(D_Votes);
      d.R_Votes = +removeCommas(R_Votes);
    }
  });

  stateBoxes.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => {
          const stateLoc = getStateLoc(d);
          return xScale(stateLoc.j);
        })
        .attr("y", d => {
          const stateLoc = getStateLoc(d);
          return yScale(stateLoc.i);
        })
        .attr("width", boxWidth)
        .attr("height", boxWidth)
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .style("fill", d => {
          // return pickColor(d);
          return pickColor(d, voteBased);
        })
        // Adapted from http://bl.ocks.org/d3noob/a22c42db65eb00d4e369
        .on("mouseover", d => {
            drawTooltip(tooltip, d);
          })
        .on("mouseout", d => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    stateBoxes.append("g").selectAll("text")
          .data(data)
          .enter()
          .append("text")
          .attr("x", d => {
            const stateLoc = getStateLoc(d);
            return xScale(stateLoc.j) + boxWidth/2;
          })
          .attr("y", d => {
            const stateLoc = getStateLoc(d);
            return yScale(stateLoc.i) + boxWidth/4;
          })
          .attr("dy","0.35em")
          .attr("text-anchor", "middle")
          .on("mouseover", d => {
              drawTooltip(tooltip, d);
            })
          .text(d => { return d.Abbreviation; });

    stateBoxes.append("g").selectAll("text")
          .data(data)
          .enter()
          .append("text")
          .attr("x", d => {
            const stateLoc = getStateLoc(d);
            return xScale(stateLoc.j) + boxWidth/2;
          })
          .attr("y", d => {
            const stateLoc = getStateLoc(d);
            return yScale(stateLoc.i) + boxWidth/2;
          })
          .attr("dy","0.35em")
          .attr("text-anchor", "middle")
          .text(d => { return d.Total_EV; });

      // Adapted from https://gist.github.com/mygoare/10340316
      stateBoxes.append("svg:image")
        .attr("xlink:href", `./images/${year}.jpg`)
        .attr("width", w * 0.2)
        .attr("height", 200)
        .attr("x", w)
        .attr("y", 300);
}

function createLegendData(origStart) {
  let legendData = [];
  const numSections = Math.abs(origStart)/5;
  let startValue = origStart;
  let endValue, origEnd = origStart + 10;
  let finalEnd = origStart + (numSections * 10);
  for (let i = 0; i < numSections; i++) {
    startValue = origStart + (10 * i);
    endValue = origEnd + (10 * i);
    const mid = (startValue + endValue)/2;
    legendData.push({
      id: i,
      label: `${startValue.toFixed(1)} to ${endValue.toFixed(1)}`,
      r: (mid < 0) ? convertRange(-mid, origStart, finalEnd, 255, 33) : convertRange(mid, origStart, finalEnd, 255, 178),
      g: (mid < 0) ? convertRange(-mid, origStart, finalEnd, 255, 102) : convertRange(mid, origStart, finalEnd, 255, 24),
      b: (mid < 0) ? convertRange(-mid, origStart, finalEnd, 255, 172) : convertRange(mid, origStart, finalEnd, 255, 43),
    });
  }
  return legendData;
}

function createLegend() {
  const w = 1200;
  const h = 100;
  const padding = 20;

  const legend = d3.select("body")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  const legendData = createLegendData(-60);

  const xScale = d3.scaleLinear()
             .domain([0, legendData.length])
             .range([padding, w - padding]);

  const yScale = d3.scaleLinear()
             .domain([0, h/2])
             .range([padding, h/2 - padding]);

  const boxWidth = w/legendData.length;

  legend.selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", d => {
      return xScale(d.id);
    })
    .attr("y", d => {
      return yScale(legendData.length/2);
    })
    .attr("width", boxWidth)
    .attr("height", h/4)
    .attr("stroke", "black")
    .attr("stroke-width", 0.5)
    .style("fill", d => {
      return rgb(d.r, d.g, d.b);
    });

  legend.selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", d => {
      return xScale(d.id) + boxWidth/2;
    })
    .attr("y", d => {
      return yScale(2 * h);
    })
    .attr("text-anchor", "middle")
    .text(d => {
      return d.label;
    });
}

function loadMap() {
  d3.csv(`./data/yearwise-winner.csv`, data => {
    const maxYear = d3.max(data, d => { return d.YEAR; })
    d3.select("body").select("#buttons-div").selectAll("button")
      .data(data)
      .enter()
      .append("button")
      .attr("type", "button")
      .attr("class", d => {
        return (d.PARTY === 'D') ? "btn btn-primary" : "btn btn-danger";
      })
      .style("margin", "0.2%")
      .on("click", d => {
        loadYear(d.YEAR);
      })
      .text(d => {
        return d.YEAR;
      });
    loadYear(maxYear);
  });
}

window.onload = loadMap;
