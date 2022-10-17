let attributes, remaining_attributes;

d3.json('http://127.0.0.1:5000/players/', function (err ,data) {

    d3.json('http://127.0.0.1:5000/attributes/', function(err, json_data) {
      attributes = ['Name','Nationality','Club','National_Position','Club','Height','Preffered_Foot','Age','Weak_foot','Skill_Moves'];
      let data_copy = json_data;
      remaining_attributes = data_copy.filter(n => !attributes.includes(n));
      
      tabulate(data, attributes)
      dropdown(data, remaining_attributes);
    });

    d3.select('#dropdownSubmit').on('click', function(e) {
      let selectedOption = d3.select('#dropdown').property("value");
      if (remaining_attributes.indexOf(selectedOption) > -1) {
        // removes item from remaining_attributes and pushes it to attributes
        addColumn(data, selectedOption);
      }

      updateTable(data, attributes);
      // updateTable(data, selectedOption);
    });
});

let currentSortCol;

function tabulate(data, columns) {
    let table = d3.select('#dataTable');
    let thead = table.append('thead').attr('id','dataTableHead');
    let tbody = table.append('tbody').attr('id','dataTableBody');

    let sortAscending = true;
    
    thead.append('tr')
      .attr('id', 'dataTableHeadRow')
      .selectAll('th')
      .data(columns).enter()
      .append('th')
        .append('div')
          .attr('class', 'header-text')
          .on('click', function click(e) {
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
        .append('button')
          .attr('class', 'removeButton')
          .text(() => 'X')
          .on('click', (e) => removeColumn(data, e));
        
    // create a row for each object in the data
    let rows = tbody.selectAll('tr')
      .data(data)
      .enter()
      .append('tr');

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

function removeColumn(data, column) {
  remaining_attributes.push(attributes.splice(attributes.indexOf(column), 1)[0]);
  updateTable(data, attributes);
}

function addColumn(data, column) {
  attributes.push(remaining_attributes.splice(remaining_attributes.indexOf(column), 1)[0]);
  updateTable(data, attributes);
}