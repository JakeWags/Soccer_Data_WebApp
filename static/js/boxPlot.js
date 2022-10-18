let margin = {top: 10, right: 30, bottom: 50, left: 110},
    width = 500 - margin.left - margin.right,
    height = 1100 - margin.top - margin.bottom;

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

d3.json("http://127.0.0.1:5000/players/", function(err, player_data) {
    let bins;
    let stats = [];
    d3.json("http://127.0.0.1:5000/attributes/", function(err, attribute_data) {
        bins = attribute_data.filter(n => !noPlotAttributes.includes(n));
        
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
            .attr("r", 2)
            .style("fill", function(d){ return("#ffffff") })
            .attr("stroke", "black")
        });
        
    });
});