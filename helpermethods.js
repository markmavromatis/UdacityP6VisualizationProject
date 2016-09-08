// Setup associated data file (either annual or 1-month of data)
var filename = `data/airport_carrier_stats_annual.csv`

var FLIGHT_DATA_2015 = [];
var myChart;
// Create a SVG container for our bar chart
var svg = dimple.newSvg("#chartContainer", 590, 400);

// For the zoom control, we need to store the Y axis maximum value at 100% zoom.
var originalYMax = 0;

var narrativeHiddenStatus = false;
var narrativePage = 1;

var narrativeScript = [];


initializePage();


function initializePage() {

	// Disable controls while the story is being told...
	disableControls(true);

	// Load the flight data file and setup the chart data
	d3.csv(filename, function (data) {
  		FLIGHT_DATA_2015 = data;
		console.log("Loaded flight data.");
		updateChart();

		// Now that flight data is loaded, also load narrative script data
		var xmlhttp = new XMLHttpRequest();
		var url = "./data/narrative.json";

		// Load narrative text from an external JSON file
		xmlhttp.onreadystatechange = function() {
			// console.log("ReadyState = " + this.readyState);
			// console.log("Status = " + this.status);
    		if (this.readyState == 4) {
	        	narrativeScript = JSON.parse(this.responseText);
	        	// Narrative script is loaded. Render page 1.
			  	renderNarrative(1);
	    	}
		};
		xmlhttp.open("GET", url, true);
		xmlhttp.send();


	})

	document.getElementById('chartModeFlights').addEventListener("change", function(evt) {
		console.log("Clicked Flight Counts mode!");
		updateChart();
	})

	document.getElementById('chartModePercent').addEventListener("change", function(evt) {
		console.log("Clicked Flight Percent mode!");
		updateChart();
	});

    // For airport and time frame selection controls, update the chart when the value changes
    d3.select("#airport").on("change", function() {updateChart()});
    d3.select("#timeframe").on("change", function() {updateChart()});





    // Zoom updates
    d3.select("#zoomLevel").on("change", function() {

      const zoomLevelValue = this.value;
      const newMax = 1.0 * originalYMax / (zoomLevelValue / 100);
      d3.select("#zoomLevelDisplay").text(zoomLevelValue + "%")
      myChart.axes[1].overrideMax = newMax;
      myChart.draw(500);
    })

    const percentagesRadio = document.getElementById('chartModePercent')

}

function renderNarrative(pageNumber) {
	// If page number passed here, then update narrativePage global variable
	if (pageNumber) {
		narrativePage = pageNumber;
	} else {
		// No page specified. Default to narrativePage global variable.
		pageNumber = narrativePage;
	}

	const storyDiv = document.getElementById('NarrativeText');
	const buttonsDiv = document.getElementById('NarrativeButtons');

	// Render the narrative text inside our narrative div section.
	if (!narrativeHiddenStatus) {
		const scriptDetails = narrativeScript[pageNumber - 1];
		storyDiv.innerHTML = `<h2>${scriptDetails['title']}</h2><p>${scriptDetails['text']}</p>`;
		storyDiv.innerHTML += `Page ${pageNumber}/${narrativeScript.length}<br>`;
		buttonsDiv.innerHTML = "";

		buttonsDiv.innerHTML += `<button id="HideNarrative" onclick="narrativeHiddenStatus = true;renderNarrative(${pageNumber});return false;">Hide Narrative</a>`;
		const disabledPrevious = (pageNumber === 1) ? "disabled" : "";
		buttonsDiv.innerHTML += `<button id="NarrativePreviousPage" onClick="renderNarrative(${pageNumber - 1});return false;" ${disabledPrevious}>Previous</button>&nbsp;`;
		const disabledNext = (pageNumber === narrativeScript.length) ? "disabled" : "";
		buttonsDiv.innerHTML += `<button id="NarrativeNextPage" onClick="renderNarrative(${pageNumber + 1});return false;" ${disabledNext}>Next</button>`;
	    d3.select("#airport").property("value", scriptDetails['airport']);
	    d3.select("#timeframe").property("value", scriptDetails['timeframe']);
	    const chartMode = scriptDetails['chartmode'];
	    d3.select("#chartModeFlights").property("checked", chartMode === 'size');
	    d3.select("#chartModePercent").property("checked", chartMode === 'percent');
		storyDiv.className = "story-visible";
		d3.select("#NarrativeText").transition().duration(250).style("opacity", 100).transition().style("display", "block");
	    updateChart();
		disableControls(true);
	} else {
		// Animate the narrative text being hidden. When the narrative is hidden, render a "Show Narrative" button 
		// so that a reader can go back to the narrative.
		d3.select("#NarrativeText").transition().duration(250).style("opacity", 0).transition().style("display", "none");
		buttonsDiv.innerHTML = `<button id="ShowNarrative" onclick="narrativeHiddenStatus = false;renderNarrative(${pageNumber});return false;">Show Narrative</a>`;
		disableControls(false);
	}

}


// Toggle access to the chart controls
// Prevent users from changing the input controls when the narrative is displayed.
// Narrative text should always match the displayed chart.
function disableControls(disableFlag) {
	// console.log("Disposable flag = " + disableFlag);
	document.getElementById('chartModePercent').disabled = disableFlag;
	document.getElementById('chartModeFlights').disabled = disableFlag;
	document.getElementById('airport').disabled = disableFlag;
	document.getElementById('timeframe').disabled = disableFlag;
	document.getElementById('zoomLevel').disabled = disableFlag;

	const userInputsDiv = document.getElementById('UserInputs');
	if (disableFlag) {
		userInputsDiv.className = "disabled";
	} else {
		userInputsDiv.classList.remove("disabled");
	}
}

// Format (ontime, delayed) percentage values for tooltips
function formatPercent(aPercentage) {
  return (Math.round(aPercentage.toFixed(2) * 100)).toString() + "%"
}

// Format large numbers (flight counts, delayed minutes) for tooltips
// Regex expression copied from:
// http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
function formatLargeNumber(aNumber) {
  return aNumber.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

// Code for setting the tooltip text on flight counts chart.
// This code calculates on-time and delayed percentages in addition to displaying the numbers.
function buildTooltip(e, chartDataSet) {
  var key = e.key;
  var fields = key.split("_");
  var recordType = fields[0];
  var carrier = fields[1];
  var returnValue = "";

  if (recordType === "OnTime") {
    // For ontime data, show the # of on-time flights and on-time percentage
    var onTimeFlights = e.yValue;
    var delayedFilter = chartDataSet.filter(function(row) {
      return row['RecordType'] === 'Delayed' && row['CarrierName'] === carrier;
    })
    var delayedFlights = delayedFilter.reduce(function(a, b) {
      return a + parseFloat(b['Count']);
    }, 0);
    const totalFlights = onTimeFlights + delayedFlights;
    const onTimeFlightsDisplay = formatLargeNumber(onTimeFlights);
    const onTimePercent = onTimeFlights / totalFlights;
    const onTimePercentDisplay = formatPercent(onTimePercent);
    returnValue = [
        `Airline: ${carrier}`,
        `  `,
        `On-Time Flights = ${onTimeFlightsDisplay} (${onTimePercentDisplay})`
    ];
  } else {
    // For delayed data, show the # of delayed flights, percentage, and delay reasons
    var filtered = chartDataSet.filter(function(row) {
      return row['RecordType'] === 'Delayed' && row['CarrierName'] === carrier;
    })
    var ontimeFilter = chartDataSet.filter(function(row) {
      return row['RecordType'] === 'OnTime' && row['CarrierName'] === carrier;
    })
    var ontimeFlights = ontimeFilter.reduce(function(a, b) {
      return a + parseFloat(b['Count']);
    }, 0);
    var delayedFlights = e.yValue;
    // console.log(`Delayed flights = ${delayedFlights}`)
    // console.log(`On-Time flights = ${ontimeFlights}`)
    var totalFlights = ontimeFlights + delayedFlights;
    var delayedPercent = delayedFlights / totalFlights; 

    var delayedMins = filtered.reduce(function(a, b) {
      return a + parseFloat(b['ArrDelayMins']);
    }, 0);
    var carrierDelayMins = filtered.reduce(function(a, b) {
      return a + parseFloat(b['CarrierDelayMins']);
    }, 0);
    // console.log("Delayed mins = " + delayedMins)
    // console.log("Carrier Delay mins = " + carrierDelayMins)
    var weatherDelayMins = filtered.reduce(function(a, b) {
      return a + parseFloat(b['WeatherDelayMins']);
    }, 0);
    var nasDelayMins = filtered.reduce(function(a, b) {
      return a + parseFloat(b['NasDelayMins']);
    }, 0);
    var securityDelayMins = filtered.reduce(function(a, b) {
      return a + parseFloat(b['SecurityDelayMins']);
    }, 0);
    var lateAircraftDelayMins = filtered.reduce(function(a, b) {
      return a + parseFloat(b['LateAircraftDelayMins']);
    }, 0);

    returnValue = [`Airline: ${carrier}`,
      `Delayed Flights = ${formatLargeNumber(e.yValue)} (${formatPercent(delayedPercent)})`,
      `Carrier Delay = ${formatPercent(carrierDelayMins / delayedMins)}`,
      `Weather Delay = ${formatPercent(weatherDelayMins / delayedMins)}`,
      `NAS Delay = ${formatPercent(nasDelayMins / delayedMins)}`,
      `Security Delay = ${formatPercent(securityDelayMins / delayedMins)}`,
      `Late Aircraft Delay = ${formatPercent(lateAircraftDelayMins / delayedMins)}`
    ];
  }
  return returnValue;
}

// Re-render the chart after a user control is changed  (or chart type changed)
function updateChart() {
	const flightCountsSelected = document.getElementById('chartModeFlights').checked;
	const filteredData = filterData();

	if (flightCountsSelected) {
		updateFlightCountsChart(filteredData);
	} else {
		const chartData = prepareOnTimePercentData(filteredData);
		updateFlightPercentsChart(chartData);
	}
}


// Filter annual 2015 flight data for the selected airport / timeframe
function filterData() {

	var selectedAirport = document.getElementById('airport').value;
	var selectedTimeframe = document.getElementById('timeframe').value;
	if (selectedTimeframe != "annual") {
		selectedTimeframe = selectedTimeframe.substring(5);
	}

	var filteredData = FLIGHT_DATA_2015.filter(function(row) {
		const airportMatch = selectedAirport === "000" || selectedAirport === row['Origin'];
		const timeframeMatch = selectedTimeframe === "annual" || selectedTimeframe === row['Month'];
		return airportMatch && timeframeMatch;
	})

    filteredData = filteredData.map(function(aRow) {
      // If the carrier name contains a space, then just keep the prefix
      // otherwise, display entire airline name
      const carrierFullName = aRow['CarrierName'];
      const carrierDisplayName = carrierFullName.indexOf(' ') > -1 ? carrierFullName.split(' ')[0] : carrierFullName;
      aRow['CarrierName'] = carrierDisplayName;
      return aRow;
    })


	return filteredData;
}

// Aggregate filtered flight data to show ontime percent
// (Data needs to be aggregated to display in a simple bar chart)
function prepareOnTimePercentData(flightData) {

	// Array will hold airlines and flight data
	// Lookup object will hold airline -> row mapping

	// console.log("Entering method prepareOnTimePercentData...");
	// console.log("# rows = " + flightData.length);
	var carrierData = [];
	var carrierLookup = {};

	for (var i = 0; i < flightData.length; i++) {
		const row = flightData[i];
		const carrierName = row['CarrierName'];
		// console.log("Carrier = " + carrierName);
		var statRow = {}

		if (carrierLookup[carrierName]) {
			// Get existing carrier row
			statRow = carrierLookup[carrierName];
		} else {
			// add new row to carrierData array and lookup table 
			carrierData.push(statRow);
			statRow['CarrierName'] = carrierName;
			statRow['OnTimeFlights'] = 0;
			statRow['DelayedFlights'] = 0;
			carrierLookup[carrierName] = statRow;
		}

		const recordType = row['RecordType'];
		if (recordType === 'OnTime') {
			statRow['OnTimeFlights'] += parseFloat(row['Count']);
		} else if (recordType === 'Delayed') {
			statRow['DelayedFlights'] += parseFloat(row['Count']);
		} else {
			throw "Unexpected record type: " + recordType;
		}

	}
	const airlineOnTimePercentages = [];
	const carrierDataKeys = Object.keys(carrierData);

	var results = [];
	for (var i = 0; i < carrierDataKeys.length; i++) {
		const newRow = {};

		const aRecord = carrierData[carrierDataKeys[i]];
		newRow['CarrierName'] = aRecord['CarrierName'];
		newRow['OnTimeFlights'] = aRecord['OnTimeFlights'];
		newRow['DelayedFlights'] = aRecord['DelayedFlights'];
		const totalCount = newRow['OnTimeFlights'] + newRow['DelayedFlights'];
		newRow['TotalFlights'] = totalCount
		const onTimePercent = aRecord['OnTimeFlights'] / totalCount;
		newRow['OnTimePercent'] = Math.round(onTimePercent * 100, 2);
		results.push(newRow);

	}
	return results;
}

// Update the chart using Javascript
// Update the chart data and rebuild tooltips
function updateFlightCountsChart(chartData) {

	// Reset zoom control (and associated label) to 100% zoom 
	var zoomLevelControl = document.getElementById('zoomLevel');
	zoomLevelControl.disabled = false;
	zoomLevelControl.value = 100;
	zoomLevelControl.hidden = false;
	d3.select("#zoomLevelDisplay").text("100%")

	// When DimpleJS redraws a bar chart with new data, if there are missing values for existing categories,
	// I see error messages in the console.
	//
	// This happens when a user transitions from a large airport with many airlines (i.e. LAX) to a smaller airport (i.e. IAH).
	// 
	// To get around this, draw graph again from scratch.
	if (myChart) {
		myChart.svg.selectAll('*').remove();

	}
	myChart = new dimple.chart(svg, null);
	myChart.setBounds(60, 45, 510, 250);
	myChart.addLegend(200, 10, 380, 20, "right");


	// X axis
	var carrierAxis = myChart.addCategoryAxis("x", "CarrierName");
	carrierAxis.title = "Airlines";
	carrierAxis.fontSize = "12px";

	// Y Axis
	var flightsAxis = myChart.addMeasureAxis("y", "Count");
	flightsAxis.title = "Flights";
	flightsAxis.fontSize = "12px";
	flightsAxis.overrideMax = null;


	// Series data and chart type
	const mySeries = myChart.addSeries(["RecordType"], dimple.plot.bar);

	// Reset the chart data, reset the y-axis zoom, and update the tooltips
	myChart.data = chartData;

	myChart.axes[1].overrideMax = null;
	mySeries.getTooltipText = function(e) {
	  return buildTooltip(e, chartData);
	};
	mySeries.tooltipFontSize="12px";

	// Now refresh the chart
	myChart = myChart.draw(500,false);

	// Update the maximum Y axis value (for zoom calculations)
	originalYMax = flightsAxis._max;
};

    


function updateFlightPercentsChart(chartData) {

	// Reset zoom control (and associated label) to 100% zoom 
	var zoomLevelControl = document.getElementById('zoomLevel');
	zoomLevelControl.hidden = true;

	// zoomLevelControl.value = 100;
	d3.select("#zoomLevelDisplay").text("100%")

	if (myChart) {
		myChart.svg.selectAll('*').remove();
	}

    myChart = new dimple.chart(svg, null);
    myChart.setBounds(60, 45, 510, 250);

    // Reset the chart data, reset the y-axis zoom, and update the tooltips
    myChart.data = chartData;

    // X axis
    var carrierAxis = myChart.addCategoryAxis("x", "CarrierName");
    carrierAxis.title = "Airlines";
    carrierAxis.fontSize = "12px";
    carrierAxis.addOrderRule("TotalFlights", true);

    // Y Axis
    var flightsAxis = myChart.addMeasureAxis("y", "OnTimePercent");
    flightsAxis.title = "On-Time Percent";
    flightsAxis.fontSize = "12px";
    flightsAxis.overrideMax = 100;


    myChart.addSeries(null, dimple.plot.bar)

    myChart.series[0].tooltipFontSize="12px";

    // Now refresh the chart
    myChart.draw(500,false);

    // Update the maximum Y axis value (for zoom calculations)
    originalYMax = myChart.axes[1]._max;

}

