
var map = L.map('map').setView([28, -92], 10, {
    crs: L.CRS.EPSG4326
});

var basemaps = {
    'Topo Map': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        crs: L.CRS.EPSG4326
    }),

    'Geo World Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        crs: L.CRS.EPSG4326
    }),
    
    'OSM':L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}, {
        crs: L.CRS.EPSG4326
    }),

};

L.control.layers(basemaps).addTo(map);
basemaps["OSM"].addTo(map);

// generating all time and dates for the available raster data
function generateDateTimes(startTime, endTime, interval) {
    var start = new Date(startTime);
    var end = new Date(endTime);
    var dateTimes = [];
    
    while (start <= end) {
        var name = 'vr_'+start.getFullYear()+'_'+`${start.getMonth()+1}`.padStart(2, '0')+'_'+`${start.getDate()}`.padStart(2, '0')+'_'+`${start.getHours()}`.padStart(2, '0');
        dateTimes.push(name); // Add the current date to the array
        start.setHours(start.getHours() + interval); // Move the time forward by the interval
    }

    return dateTimes;
};

// Time step generation in a list format
var startTime = '2023-08-12T01:00:00';
var endTime = '2023-09-28T00:00:00';
var interval = 1; // Interval in hours

var dateTimes = generateDateTimes(startTime, endTime, interval);


//setting max value of the slider
document.getElementById("slider").max = ""+dateTimes.length+"";

//setting default label of the slider
document.getElementById("sliderLabel").innerHTML = dateTimes[0];

var bounds = new L.LatLngBounds(
    new L.LatLng(30.806529, -98.232739),
    new L.LatLng(22.896634, -87.769914));
map.fitBounds(bounds);

var urlPrefix = "/v/"

var url = urlPrefix+dateTimes[0]+".json"
let vel_line = null;
let decorator = null;

function updatePolyline(data) {
    // If a polyline already exists, remove it
    if (vel_line) {
        map.removeLayer(vel_line);
    }
    if (decorator){
        map.removeLayer(decorator);
    }
    var myStyle = {
        "color": "#ff7800",
        "weight": 2,
        "opacity": 0.8
    };
    // Create a new polyline and add it to the map
    vel_line = L.geoJSON(data, {style:myStyle}).addTo(map);
    decorator = L.polylineDecorator(vel_line, {
        patterns: [

            // Arrowhead at the end
            {
                offset: '100%',
                repeat: 1,
                symbol: L.Symbol.arrowHead({
                    pixelSize: 60,
                    polygon: false,
                    pathline: true,
                    pathOptions: { stroke: true, fillOpacity: 1, weight: 1, color: 'red' }
                })
            }
        ]
    }).addTo(map);
    // vel_line.arrowheads().addto(map);
    // ,{arrowheads: {offset:'start'}}

    // vel_line.arrowhead();
    // decorator = L.polylineDecorator(vel_line, {
    //     patterns: [
    //         // Arrowhead at the end
    //         {
    //             offset: '100%',
    //             repeat: 0,
    //             symbol: L.Symbol.arrowHead({
    //                 pixelSize: 15,
    //                 polygon: false,
    //                 pathOptions: { stroke: true, color: 'red' }
    //             })
    //         }
    //     ]
    // }).addTo(map);




}
// Fetch polyline data
fetch(url)
    .then(response => response.json())
    .then(data => {
        // Add the polyline to the map using L.geoJSON()
        updatePolyline(data);
    })
    .catch(error => console.error('Error fetching polyline:', error));

//function when sliding
slider.oninput = function() {
    //changing the label
    document.getElementById("sliderLabel").innerHTML = dateTimes[this.value-1]
    //setting the url of the overlay
    // map.removeLayer(vel_line)
    fetch(urlPrefix+dateTimes[this.value-1]+".json")
    .then(response => response.json())
    .then(data => {
        // Add the polyline to the map using L.geoJSON()
        updatePolyline(data);
    })
    .catch(error => console.error('Error fetching polyline:', error));
  }
  
  var playTimeOut;
  
  function play() {
      playTimeOut = setTimeout(function () {
          //increasing the slider by 1 (if not already at the end)
          var val = document.getElementById("slider").value
          console.log(val)
          //if end of slider, stopping
          if(val == document.getElementById("slider").max){
              clearTimeout(playTimeOut);
                //hidding the stop button
                document.getElementById('stop').style.display = "none";
                //showing the play button
                document.getElementById('play').style.display = "block";
          }
          else{
          document.getElementById("slider").value = Number(val)+1
          play()
          }
          //changing the label
          document.getElementById("sliderLabel").innerHTML = dateTimes[Number(val)-1]
          //setting the url of the overlay

          fetch(urlPrefix+dateTimes[Number(val)-1]+".json")
            .then(response => response.json())
            .then(data => {
                // Add the polyline to the map using L.geoJSON()
                updatePolyline(data);
            })
            .catch(error => console.error('Error fetching polyline:', error));

        //   imageOverlay.setUrl(urlPrefix+dateTimes[Number(val)-1]+".png")
  
      }, 100);
  }
  
  document.getElementById('play').onclick = function(e){
    play()
    //showing the stop button
    document.getElementById('stop').style.display = "block";
    //hidding the play button
    document.getElementById('play').style.display = "none";
  }
  
  document.getElementById('stop').onclick = function(e){
    clearTimeout(playTimeOut);
    //hidding the stop button
    document.getElementById('stop').style.display = "none";
    //showing the play button
    document.getElementById('play').style.display = "block";
  }
  
  //hidding the stop button by default
  document.getElementById('stop').style.display = "none";

