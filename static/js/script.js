let attributes, remaining_attributes;
let currentSortCol;
let bins;
let stats = []; 
let highlightedPlayer;

let margin = {top: 10, right: 30, bottom: 50, left: 110},
    width = 500 - margin.left - margin.right,
    height = 750 - margin.top - margin.bottom;

let svg = d3.select("#dataPlot")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// non-numeric or non-relevant data to NOT plot
const noPlotAttributes = 
    ["Name", "Club", "Nationality", "National_Position", 
    "National_Kit", "Club_Position", "Club_Kit", "Club_Joining", 
    "Preffered_Foot", "Birth_Date", "Preffered_Position", "Work_Rate", "Contract_Expiry", "Height", "Weight"];


d3.json('http://127.0.0.1:5000/players/', function (err,data) {
    d3.json('http://127.0.0.1:5000/attributes/', function(err, json_data) {
      attributes = ['Name','Nationality','Club','National_Position','Height','Preffered_Foot','GK_Reflexes', 'GK_Diving', 'GK_Kicking'];
      let data_copy = json_data;
      remaining_attributes = data_copy.filter(n => !attributes.includes(n));
      
      tabulate(data, attributes)
      dropdown(data, remaining_attributes);

      drawPlot(json_data, data);
    });

      
    d3.select('#dropdownSubmit').on('click', function(e) {
      let selectedOption = d3.select('#dropdown').property("value");
      if (remaining_attributes.indexOf(selectedOption) > -1) {
        addColumn(data, selectedOption);
      }
      // updateTable(data, selectedOption);
    });
});

function tabulate(data, columns) {
    let table = d3.select('#dataTable');
    let thead = table.append('thead').attr('id','dataTableHead');
    let tbody = table.append('tbody').attr('id','dataTableBody');

    let sortAscending = true;
    
    let t = thead.append('tr')
      .attr('id', 'dataTableHeadRow')
      .selectAll('th')
      .data(columns).enter()
      .append('th')
      .append('div').style('display', 'flex');
    
    t.append('button')
      .attr('class', 'removeButton')
      .text(() => 'X')
      .on('click', (e) => removeColumn(data, e));

    t.append('div')
      .attr('class', 'header-text')
      .on('click', function(e) {
        d3.selectAll('.ascending').attr('class', 'header-text');
        d3.selectAll('.descending').attr('class', 'header-text');
        if (sortAscending || currentSortCol != e) {
          rows.sort(function(a,b) { return d3.ascending(a[e], b[e]); });
          sortAscending = false;

          d3.select(this).attr('class', 'ascending header-text');
        } else {
          rows.sort(function(a,b) { return d3.ascending(b[e], a[e]); });
          sortAscending = true;

          d3.select(this).attr('class', 'descending header-text');
        }
        currentSortCol = e;
      })
      .text(function (column) { return column.replace(/_/g,' '); })
        
    // create a row for each object in the data
    let rows = tbody.selectAll('tr')
      .data(data)
      .enter()
      .append('tr')
      .attr('class', 'table-row')
      .on('click', function(e) {
        d3.selectAll('.clicked-row').attr('class', 'table-row');
        d3.select(this).attr('class', 'table-row clicked-row');
        highlightedPlayer = e;
        updatePlot(data, attributes);
      });

    // create a cell in each row for each column
    let cells = rows.selectAll('td')
      .data(function (row) {
        return columns.map(function (column) {
          return {column: column, value: row[column]};
        });
      })
      .enter()
      .append('td')
        .text(function (d) { return d.value; });

  return table;
}

function dropdown(data, remaining_attributes) {
  d3.select('#dropdown')
    .html("") // find better option
    .selectAll('options')
    .data(remaining_attributes)
    .enter()
    .append('option')
    .text(function (d) { return d.replace(/_/g, ' '); })
    .attr("value", function (d) { return d; })
}

// messy way to do this.
// find a way to neatly append a column and rows instead.
// use update instead of enter to append?
function updateTable(data, attributes) {
  d3.select('#dataTable').html("");
  tabulate(data, attributes);
  dropdown(data, remaining_attributes);
}

function updatePlot(data, attributes) {
  stats = [] // clear stats to avoid duplicate drawings
  svg.selectAll('*').remove();
  svg.html('');
  svg .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
  drawPlot(attributes, data);
}

function removeColumn(data, column) {
  remaining_attributes.push(attributes.splice(attributes.indexOf(column), 1)[0]);
  updateTable(data, attributes);
  updatePlot(data, attributes);
}

function addColumn(data, column) {
  // removes item from remaining_attributes and pushes it to attributes
  attributes.push(remaining_attributes.splice(remaining_attributes.indexOf(column), 1)[0]);
  updateTable(data, attributes);
  updatePlot(data, attributes);
}

function drawPlot(attribute_data, player_data) {
  bins = attributes.filter(n => !noPlotAttributes.includes(n));
        console.log(bins);
        bins.forEach(function(bin) {
            stats.push(
                d3.nest()
                .rollup(function(d) {
                    q1 = d3.quantile(d.map(function(p) { return p[bin];}).sort(d3.ascending),.25);
                    median = d3.quantile(d.map(function(p) { return p[bin];}).sort(d3.ascending),.5);
                    q3 = d3.quantile(d.map(function(p) { return p[bin];}).sort(d3.ascending),.75);
                    interQuantileRange = q3 - q1;

                    min = Math.min(...(d.map(function(p) { return p[bin]; }))); // Max and Min don't accept arrays as input
                    max = Math.max(...(d.map(function(p) { return p[bin]; }))); // spread operator converts to a list of parameters

                    let retval = {
                        q1: q1, 
                        median: median, 
                        q3: q3, 
                        interQuantileRange: interQuantileRange, 
                        min: min, 
                        max: max, 
                        name:bin
                    }
                    
                    return retval;
                })
                .entries(player_data));
        });

        // set the y axis scaling, ticks, and names
        let y = d3.scaleBand()
            .range([ height, 0 ])
            .domain(bins)
            .padding(.4);
        svg.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .select(".domain").remove()

        // set the x axis scaling and ticks
        let x = d3.scaleLinear()
            .domain([1,99])
            .range([0, width])
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(25))
            .select(".domain").remove()

        // x-axis label
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + margin.top + 30)
            .text("Attribute Score");

        console.log(stats);
        // horizontal distribution lines
        svg
            .selectAll("horizLines")
            .data(stats)
            .enter()
            .append("line")
              .attr("x1", function(d){return x(d.min)})
              .attr("x2", function(d){return x(d.max)})
              .attr("y1", function(d){return y(d.name) + y.bandwidth()/2})
              .attr("y2", function(d){return y(d.name) + y.bandwidth()/2})
              .attr("stroke", "black")
              .style("width", 40)
            
        // box-plot boxes
        svg
            .selectAll("boxes")
            .data(stats)
            .enter()
            .append("rect")
                .attr("x", function(d){return(x(d.q1))})
                .attr("width", function(d){ ; return(x(d.q3)-x(d.q1))})
                .attr("y", function(d) { return y(d.name); })
                .attr("height", y.bandwidth() )
                .attr("stroke", "black")
                .style("fill", "#69b3a2")
                .style("opacity", 0.3)

        // median line in boxes
        svg
            .selectAll("medianLines")
            .data(stats)
            .enter()
            .append("line")
            .attr("y1", function(d){return(y(d.name))})
            .attr("y2", function(d){return(y(d.name) + y.bandwidth())})
            .attr("x1", function(d){return(x(d.median))})
            .attr("x2", function(d){return(x(d.median))})
            .attr("stroke", "black")
            .style("width", 80)


        // Add individual points with jitter to separate them
        let jitterWidth = 20
        bins.forEach(function (bin) {
            svg
            .selectAll("indPoints")
            .data(player_data)
            .enter()
            .append("circle")
            .attr("cx", function(d){ return(x(d[bin]))})
            .attr("cy", function(d){ return( y(bin) + (y.bandwidth()/2) - jitterWidth/2 + Math.random()*jitterWidth )})
            .attr("r", 3)
            .style("fill", function(d){
              if (d == highlightedPlayer) {
                d3.select(this).attr("r", 5);
                return('#00a7ff');
              }
              return("#ffffff"); 
            })
            .attr("stroke", "black")
        });
}