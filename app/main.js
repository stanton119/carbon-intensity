function submitPostcode(plottingFcn = adjustPlot) {
  var postCode = getPostcodeForm()
  postCode = formatPostcode(postCode)
  // document.getElementById("postcodeInput").value = postCode
  updatePageURL(postCode)

  getForecast(postCode, plottingFcn)
}

function getPostcodeForm() {
  var postCode = document.getElementById("postcodeInput").value;
  if (postCode == "") {
    postCode = document.getElementById("postcodeInput").getAttribute("placeholder");
  }
  return postCode
}

function formatPostcode(postCode) {
  // limit to first part of the postcode
  var spacePos = postCode.search(' ')
  if (spacePos > -1) {
    postCode = postCode.substring(0, spacePos)
  }
  return postCode
}

function getCarbonIntensityForecast(postcode, plottingFcn) {
  var today = new Date();
  datestr = today.toISOString()

  var url = "https://api.carbonintensity.org.uk/regional/intensity/" + datestr + "/fw48h/postcode/" + postcode

  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    })
    .then(data => processForcast(standardiseCarbonForecast(data), plottingFcn))
    .catch(err => { throw err });
}

function standardiseCarbonForecast(data) {
  // get output format of {date, carbon intensity}
  var outputData = []
  data['data']['data'].forEach(function (element) {
    var date = new Date(element['from'])
    var intensity = element['intensity']['forecast']
    outputData.push({ date: date, intensity: intensity })

  })
  return outputData
}


function getForecast(postcode, plottingFcn, source = 'carbon_intensity') {
  if (source == 'carbon_intensity') {
    return getCarbonIntensityForecast(postcode, plottingFcn)
  }
}

function processForcast(data, plottingFcn) {
  // data = [{date, value}]
  var traces = createTraces(data)
  plottingFcn(traces)
}

function createTraces(data) {
  var dateList = listFromDicts(data, 'date')

  // create trace for all non-date keys in the data
  var traces = []
  Object.keys(data[0]).forEach(function (key) {
    if (key == 'date') {
      return
    }
    traces.push(createTrace(dateList, listFromDicts(data, key), key))
  })
  return traces
}

function listFromDicts(data, key) {
  var list = []
  data.forEach(function (element) {
    list.push(element[key])
  })
  return list
}

function createTrace(x, y, name, visible = true) {
  var trace = {
    type: "scatter",
    mode: "lines",
    name: name,
    x: x,
    y: y,
    visible: visible,
  }
  return trace
}

function createPlot(traces) {
  var xrangemin = new Date;
  var xrangemax = new Date(xrangemin.getTime()).setDate(xrangemin.getDate() + 3);
  var layout = {
    title: plotTitle,
    height: 800,
    xaxis: {
      range: [xrangemin, xrangemax],
      rangeslider: {}
    },
    legend: {
      x: 0
    }
  };
  updatePlotData(traces)
  Plotly.newPlot(plotDiv, plotData, layout);
}

function updatePlotData(traces) {
  plotData.length = 0
  traces.forEach(trace => {
    plotData.push(trace)
  });
}

function adjustPlot(traces) {
  updatePlotData(traces)
  Plotly.redraw(plotDiv);
}

function findGetParameter(parameterName) {
  // https://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
  var result = null,
    tmp = [];
  location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    });
  return result;
}

function updatePageURL(postCode) {
  var path = window.location.pathname;
  var page = path.split("/").pop();

  history.pushState({}, null, page + "?postcode=" + postCode)

}

function defaultSetup() {
  var postCode = findGetParameter('postcode')
  if (postCode != null) {
    postCode = formatPostcode(postCode)
    document.getElementById("postcodeInput").value = postCode
  }
  submitPostcode(createPlot)
}

function handleForm(event) {
  // prevents submit button refreshing page
  event.preventDefault();
  submitPostcode();
}

// page setup
var form = document.getElementById("postCodeForm");
form.addEventListener('submit', handleForm);

const plotDiv = 'plotDiv'
const plotTitle = ''
var plotData = []

defaultSetup()