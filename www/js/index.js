var HOST = "http://138.68.177.124:8000"; // ask me for this in class

var URLS = {
    login: "/rest/tokenlogin/",
    userme: "/rest/userme/",
    updateposition: "/rest/updateposition/",
    signup: "/signup",
    showgarda: "/rest/show_garda/",
    register: "/rest/signup"
};

var map;

var curIcon = L.ExtraMarkers.icon({
    icon: 'fa-map-marker',
    iconColor: 'white',
    markerColor: 'red',
    shape: 'square',
    prefix: 'fa'
});

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

function onDeviceReady() {
    console.log("In onDeviceReady.");

    $("#btn-login").on("touchstart", loginPressed);
    $("#sp-logout").on("touchstart", logoutPressed);
    $("#btn-signup").on("touchstart", signupPressed);
    $("#btn-signupsend").on("touchstart", registerPressed);
    $("#sp-addfriendbtn").on("touchstart", addFriendMenu);
    $("#sp-friendlist").on("touchstart", showFriends);
    

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
            showgarda();
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

function showFriends() {
    showOkAlert("FriendsList");
}

function addFriendMenu() {
    showOkAlert("Add friends");
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

function setUserName() {
    console.log("In setUserName.");
    $.ajax({
        type: "GET",
        headers: {"Authorization": localStorage.authtoken},
        url: HOST + URLS["userme"]
    }).done(function (data, status, xhr) {
        $(".sp-username").html(xhr.responseJSON.properties.username);
    }).fail(function (xhr, status, error) {
        $(".sp-username").html("");
    });
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

function showgarda() {

    $.ajax({
        type: "GET",
        headers: {"Authorization": localStorage.authtoken},
        url: HOST + URLS["showgarda"]
    }).done(function (data, status, xhr) {
        var parsedJSON = JSON.parse(data.data);
        for (var i=0;i<parsedJSON.length;i++) {
           var myLatLon = L.latLng(parsedJSON[i].latitude,parsedJSON[i].longitude );
         }
       for (var i=0;i<parsedJSON.length;i++) {
           var myLatLon = L.latLng(parsedJSON[i].latitude,parsedJSON[i].longitude );
           var contentString = "";
           if(!parsedJSON[i].contactNumber == "") {
                contentString = "<h2>" + parsedJSON[i].name + "</h2> " +
            parsedJSON[i].description +
            "<br><br><button type=\"button\" id=\"callBtn\" style=\"color:white\;background-color:green\" onclick=callPhone("+parsedJSON[i].contactNumber+")>Call</button>";
           }
           else {
               contentString = "<h2>" + parsedJSON[i].name + "</h2> " +
            parsedJSON[i].description;         
           }

            L.marker(myLatLon, {icon: attIcon}).addTo(map).bindPopup(contentString);
         }
    }).fail(function (xhr, status, error) {
        $(".sp-username").html("");
    });
}
