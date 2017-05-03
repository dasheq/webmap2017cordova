var HOST = "http://138.68.177.124:8000"; // ask me for this in class

//URLs for REST api
var URLS = {
    login: "/rest/tokenlogin/",
    userme: "/rest/userme/",
    updateposition: "/rest/updateposition/",
    signup: "/signup",
    showlocations: "/rest/show_locations/",
    register: "/rest/signup", 
    showgroups: "/rest/show_groups",
    creategroup: "/rest/create_group/",
    showfriends: "/rest/show_friends/"
};

var groupName;
var groups = [];
var map;
var currentUser = "";

//Markers for map
//Last location marker
var curIcon = L.ExtraMarkers.icon({
    icon: 'fa-map-marker',
    iconColor: 'white',
    markerColor: 'red',
    shape: 'square',
    prefix: 'fa'
});

//Attraction marker
var attIcon = L.ExtraMarkers.icon({
    icon: 'fa-university',
    iconColor: 'white',
    markerColor: 'green',
    shape: 'square',
    prefix: 'fa'
})

function onLoad() {
    console.log("In onLoad.");
    logoutPressed();
    document.addEventListener('deviceready', onDeviceReady, false);
}

//What is loaded when app gets loaded
function onDeviceReady() {
    console.log("In onDeviceReady.");

//Button listeners
    $("#btn-login").on("touchstart", loginPressed);
    $("#sp-logout").on("touchstart", logoutPressed);
    $("#btn-signup").on("touchstart", signupPressed);
    $("#btn-signupsend").on("touchstart", registerPressed);
    $("#sp-addfriendbtn").on("touchstart", addFriendMenu);
    $("#sp-friendlist").on("touchstart", showFriendsListScreen);
    $("#btn-addgroup").on("touchstart", addGroup);

    if (localStorage.lastUserName && localStorage.lastUserPwd) {
        $("#in-username").val(localStorage.lastUserName);
        $("#in-password").val(localStorage.lastUserPwd);
    }

    $(document).on("pagecreate", "#map-page", function (event) {
        console.log("In pagecreate. Target is " + event.target.id + ".");

        $("#goto-currentlocation").on("touchstart", function () {
            getCurrentlocation();
        });
        $("#show-garda").on("touchstart", function () {
            showlocations();
        });
        $("#map-page").enhanceWithin();

        makeBasicMap();
        getCurrentlocation();
    });

    $(document).on("pageshow", function (event) {
        console.log("In pageshow. Target is " + event.target.id + ".");
        //$.mobile.navigate("#login-page");
        
        if(localStorage.authtoken){
            setUserName(); 
        }
    });

//Make sure to direct to login page if user tries to access map without logging in
    $(document).on("pageshow", "#map-page", function () {
        if(!localStorage.authtoken) {
            $.mobile.navigate("#login-page");
        }
        console.log("In pageshow / #map-page.");
        map.invalidateSize();
    });

    $(document.on("pageshow", "#signup-page", function() {
       // $.mobile.navigate("#signup-page");
       // showOkAlert("heya");
    }))

    $('div[data-role="page"]').page();

    console.log("TOKEN: " + localStorage.authtoken);
    if (localStorage.authtoken) {
        $.mobile.navigate("#map-page");
    } else {
        $.mobile.navigate("#signup-page");
    }
}


function loginPressed() {
    console.log("In loginPressed.");
    $.ajax({
        type: "GET",
        url: HOST + URLS["login"],
        data: {
            username: $("#in-username").val(),
            password: $("#in-password").val()
        }
    }).done(function (data, status, xhr) {
        localStorage.authtoken = localStorage.authtoken = "Token " + xhr.responseJSON.token;
        localStorage.lastUserName = $("#in-username").val();
        localStorage.lastUserPwd = $("#in-password").val();

        $.mobile.navigate("#map-page");
    }).fail(function (xhr, status, error) {
        var message = "Login Failed\n";
        if ((!xhr.status) && (!navigator.onLine)) {
            message += "Bad Internet Connection\n";
        }
        message += "Status: " + xhr.status + " " + xhr.responseText;
        showOkAlert(message);
        logoutPressed();
    });
}

//CreateGroup
function createGroupFields() {
    var createGroupDiv = document.getElementById("creategroup-div");
    var label = document.createElement("label");
    label.innerHTML = "Group Name";
    groupName = document.createElement("input");
    groupName.type = "text";
    groupName.width= "100%";
    label.appendChild(groupName);
    createGroupDiv.appendChild(label);

}

//Registering a user
function registerPressed() {
    if($("#in-password1").val() == $("#in-password2").val()) {
        $.ajax({
            type: "GET",
            url: HOST + URLS["register"],
            data: {
                username: $("#in-username1").val(),
                password: $("#in-password1").val(),
                email: $("#in-email").val(),
                firstname: $("#in-fname").val(),
                lastname: $("#in-lname").val()
            }
        }).done(function (data, status, xhr) {
            $.mobile.navigate("#map-page");
        }).fail(function (xhr, status, error) {
            var message = "Signup failed\n";
            if ((!xhr.status) && (!navigator.onLine)) {
                message += "Bad Internet Connection\n";
            }
            message += "Status: " + xhr.status + " " + xhr.responseText;
            showOkAlert(message);
            logoutPressed();
        });
    }
    else {
        showOkAlert("Passwords aren't matching");
    }
}

//Send a request to display signup page
function signupPressed() {
    $.mobile.navigate("#signup-page")
    $.ajax({
        type:"GET",
        url: HOST + URLS["signup"]
    
    }).done(function (data, status, xhr) {
        $.mobile.navigate("#signup-page");
    }).fail(function (xhr, status, error) {
        var message = "Error\n";
        if((!xhr.status) && (!navigator.onLine)) {
            message += "Bad Internet Connection \n";    
        }
        message += "Status: " + xhr.status + " " + xhr.responseText;
        showOkAlert(message);
       // $.mobile.navigate("#login-page");
    });
}

function logoutPressed() {
    console.log("In logoutPressed.");
    localStorage.removeItem("authtoken");
    $.mobile.navigate("#login-page");
    // $.ajax({
    //     type: "GET",
    //     headers: {"Authorization": localStorage.authtoken}
    //     // url: HOST + URLS["logout"]
    // }).always(function () {
    //     localStorage.removeItem("authtoken");
    //     $.mobile.navigate("#login-page");
    // });
}

function showFriendsListScreen() {
    showFriendsList(groups);
    $.mobile.navigate("#showfriend-page");
}

function showFriendsList(groups) {
    for(var i =0; i<groups.length; i++) {
        showFriends(groups[i]);
    }
}

function showFriends(gName) {
    var keys;
     $.ajax({
            type: "GET",
            url: HOST + URLS["showfriends"],
            data: {
                owner: username,
                groupname: gName
            }
        }).done(function (data, status, xhr) {
            var friendDiv = document.getElementById("friends-div")
            var groupName = document.createElement("h2");
            friendDiv.appendChild(groupName);
            friendDiv.innerHTML += "<br>";
            keys = data.data;
            for (var i=0;i<keys.length;i++) {
                var label = document.createElement("label");
                label.innerHTML = keys[i].name;
                label.value = keys[i].name;
                friendDiv.appendChild(label);
                friendDiv.innerHTML += "<br><br>";
            }

        }).fail(function (xhr, status, error) {
            var message = "Getting Friends Failed";
            if ((!xhr.status) && (!navigator.onLine)) {
                message += "Bad Internet Connection\n";
            }
            message += "Status: " + xhr.status + " " + xhr.responseText;
            showOkAlert(message);
        });
}

//Menu for creating groups and adding friends
function addFriendMenu() {
    createGroupFields();
    var keys = [];

    $.mobile.navigate("#addfriend-page");
    var groupDiv = document.getElementById("groups-div");
    groupDiv.innerHTML ="";
    $.ajax({
            type: "GET",
            url: HOST + URLS["showgroups"],
            data: {
                owner: currentUser
            }
        }).done(function (data, status, xhr) {
            keys = data.data;
            for (var i=0;i<keys.length;i++) {
                var label = document.createElement("button");
                label.innerHTML = keys[i].name;
                groups[i] = keys[i].name;
                label.value = keys[i].name;
                groupDiv.appendChild(label);
                buttonClickListener(label);
                groupDiv.innerHTML += "<br><br>";

            }

        }).fail(function (xhr, status, error) {
            var message = "Getting Groups Failed";
            if ((!xhr.status) && (!navigator.onLine)) {
                message += "Bad Internet Connection\n";
            }
            message += "Status: " + xhr.status + " " + xhr.responseText;
            showOkAlert(message);
        });
}

function addGroup() {
    $.ajax({ 
        type: "GET", 
        url: HOST + URLS["creategroup"],
        data: {
            owner: currentUser,
            name: groupName
        }
    }).done(function (data, status, xhr) {
        alert("Group "+groupName+ " added");
    }).fail(function (xhr, status, error) {
        var message = "Group Creation Failed";
            if ((!xhr.status) && (!navigator.onLine)) {
                message += "Bad Internet Connection\n";
            }
            message += "Status: " + xhr.status + " " + xhr.responseText;
            showOkAlert(message);
    });
}


function updateGroup(groupName) {
 //   alert(groupName);
    /*
    var addFriendDiv = document.getElementById("addfriend-div");
    var groupHeader = document.getElementById("groupname");
    groupHeader.innerHTML = groupName; */
}


function showOkAlert(message) {
    navigator.notification.alert(message, null, "WMAP 2017", "OK");
}

function getCurrentlocation() {
    console.log("In getCurrentlocation.");
    var myLatLon;
    var myPos;

    navigator.geolocation.getCurrentPosition(
        function (pos) {
            // myLatLon = L.latLng(pos.coords.latitude, pos.coords.longitude);
            myPos = new myGeoPosition(pos);
            localStorage.lastKnownCurrentPosition = JSON.stringify(myPos);

            setMapToCurrentLocation();
            updatePosition();
        },
        function (err) {
        },
        {
            enableHighAccuracy: true
            // maximumAge: 60000,
            // timeout: 5000
        }
    );
}

function setMapToCurrentLocation() {
    console.log("In setMapToCurrentLocation.");
    if (localStorage.lastKnownCurrentPosition) {
        var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
        var myLatLon = L.latLng(myPos.coords.latitude, myPos.coords.longitude);
        L.marker(myLatLon, {icon: curIcon}).addTo(map);
        map.flyTo(myLatLon, 15);
    }
}

//Reset map view with no zoom
function setMapToCurrentLocationNoZoom() {
    console.log("In setMapToCurrentLocation.");
    if (localStorage.lastKnownCurrentPosition) {
        var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
        var myLatLon = L.latLng(myPos.coords.latitude, myPos.coords.longitude);
        L.marker(myLatLon, {icon: curIcon}).addTo(map);
    }
}

function updatePosition() {
    console.log("In updatePosition.");
    if (localStorage.lastKnownCurrentPosition) {
        var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
        $.ajax({
            type: "PATCH",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": localStorage.authtoken
            },
            url: HOST + URLS["updateposition"],
            data: {
                lat: myPos.coords.latitude,
                lon: myPos.coords.longitude
            }
        }).done(function (data, status, xhr) {
            showOkAlert("Position Updated");
        }).fail(function (xhr, status, error) {
            var message = "Position Update Failed\n";
            if ((!xhr.status) && (!navigator.onLine)) {
                message += "Bad Internet Connection\n";
            }
            message += "Status: " + xhr.status + " " + xhr.responseText;
            showOkAlert(message);
        }).always(function () {
            $.mobile.navigate("#map-page");
        });
    }
}

function makeBasicMap() {
    console.log("In makeBasicMap.");
    map = L.map("map-var", {
        zoomControl: false,
        attributionControl: false
    }).fitWorld();
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        useCache: true
    }).addTo(map);

    $("#leaflet-copyright").html("Leaflet | Map Tiles &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors");
}

function myGeoPosition(p) {
    this.coords = {};
    this.coords.latitude = p.coords.latitude;
    this.coords.longitude = p.coords.longitude;
    this.coords.accuracy = (p.coords.accuracy) ? p.coords.accuracy : 0;
    this.timestamp = (p.timestamp) ? p.timestamp : new Date().getTime();
}

//Set a local user name
function setUserName() {
    console.log("In setUserName.");
    $.ajax({
        type: "GET",
        headers: {"Authorization": localStorage.authtoken},
        url: HOST + URLS["userme"]
    }).done(function (data, status, xhr) {
        $(".sp-username").html(xhr.responseJSON.properties.username);
        getUserName();
    }).fail(function (xhr, status, error) {
        $(".sp-username").html("");
    });
}

//Set a local user name other
function getUserName() {
    $.ajax({
        type: "GET",
        url: HOST + URLS["userme"]
    }).done(function (data, status, xhr) {
        currentUser = xhr.responseJSON.properties.username;
    }).fail(function (xhr, status, error) {
        showOkAlert("Failed to retrieve username");
    })
}

function onSuccess(result){
  console.log("Success:"+result);
}
 
function onError(result) {
  console.log("Error:"+result);
}

function callPhone(number) {
    window.plugins.CallNumber.callNumber(onSuccess, onError, number, true);
} 


//Get directions and routes to an attraction
function getDirections(lat, lng) {
    map.closePopup();
    map.remove();
    makeBasicMap();
    showlocations();
    setMapToCurrentLocationNoZoom();
    if(localStorage.lastKnownCurrentPosition) {
        var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
        L.Routing.control({
        waypoints: [
            L.latLng(myPos.coords.latitude, myPos.coords.longitude),
            L.latLng(lat, lng)]
        }).addTo(map);
    }
}


//Show attractions from the dataset
function showlocations() {

    $.ajax({
        type: "GET",
        headers: {"Authorization": localStorage.authtoken},
        url: HOST + URLS["showlocations"]
    }).done(function (data, status, xhr) {
        var parsedJSON = JSON.parse(data.data);
        for (var i=0;i<parsedJSON.length;i++) {
           var myLatLon = L.latLng(parsedJSON[i].latitude,parsedJSON[i].longitude );
         }
       for (var i=0;i<parsedJSON.length;i++) {
           var myLatLon = L.latLng(parsedJSON[i].latitude,parsedJSON[i].longitude );
           var lat = parsedJSON[i].latitude;
           var lng = parsedJSON[i].longitude;
           var contentString = "";
           if(!parsedJSON[i].contactNumber == "") {
                contentString = "<h2>" + parsedJSON[i].name + "</h2> " +
            parsedJSON[i].description +
            "<br><br><button type=\"button\" id=\"callBtn\" style=\"color:white\;background-color:green\" onclick=callPhone("+parsedJSON[i].contactNumber+")>Call</button> <br>"+
            "<h3> Get Directions </h3><button type=\"button\" id=\"dirBtn\" style=\"color:white\;background-color:black\" onclick=getDirections("+ lat + "," + lng + ")>Get Directions</button>";
           }
           else {
               contentString = "<h2>" + parsedJSON[i].name + "</h2> " +
            parsedJSON[i].description + "<h3> Get Directions </h3><button type=\"button\" id=\"dirBtn\" style=\"color:white\;background-color:black\" onclick=getDirections("+ lat + "," + lng + ")>Get Directions</button>" ;         
           }

            L.marker(myLatLon, {icon: attIcon}).addTo(map).bindPopup(contentString);
         }
    }).fail(function (xhr, status, error) {
        $(".sp-username").html("");
    });
}

/*
    <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.css" />
    <script src="http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.js"></script> */