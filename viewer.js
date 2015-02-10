function init() {
    params = getUrlVars();
    createHtmlTable();
    loadStreams();
}
$( document ).ready( init )



function createHtmlTable() {
    //make a table and put it on the page. 
    //put divs in the grid with numbers in their names, 
    //so we can stick twitch embeds and usernames in them
    var width = params["w"];
    if(!width) {
        width = 2;
    }
    var height = params["h"];
    if(!height) {
        height = 3;
    }

    var table = document.createElement("table");

    for(var i = 0; i < height; ++i) {
        var nameRow = table.insertRow(i*2);
        var streamRow = table.insertRow(i*2 + 1)
        for(var j = 0; j < width; ++j) {
            var streamIndex = i * width + j;
            //todo lol make this not so stupid
            var nameCell = nameRow.insertCell(j);
            nameCell.innerHTML = '<div id="name' + streamIndex + '" style="font-size:44"></div>';

            var streamCell = streamRow.insertCell(j);
            streamCell.innerHTML = '<div id="stream' + streamIndex + 'container" class="container"><div id="stream' + streamIndex + '" class="stream"></div></div>'
        }

    }

    document.body.appendChild(table);
}

function loadStreams() {
    //get info about the race from srl
    var racepar = params["race"];
    raceid = racepar.replace('#srl-', '');

    
    var apiUrl = "http://api.speedrunslive.com";
    if(raceid) {
        $.ajax({
            type : "GET",
            url : apiUrl + "/races/" + raceid,
            processData : true,
            data : {},
            dataType : "jsonp",
            jsonpCallback : "parseSrlJson",
            cache : true
        });
    }
    
}

function parseSrlJson(response) {
    //figure out which users in the race we should display
    var me = params["me"];
    var blocked = params["blocked"];
    var blockedUsers = [];
    if(blocked) {
        blockedUsers = blocked.split(',');
    }
    blockedUsers.push(me);

    var names = [];
    var entrants = response.entrants;
    for(var entrant in entrants) {
        var twitch = entrants[entrant].twitch;
        var userIsBlocked = twitch && ($.inArray(twitch, blockedUsers) > -1);
        if( twitch && !userIsBlocked ) {
            names.push(twitch);
        }
    }
    
    setStreams(names);
}

function setStreams( names ) {
    //put all the names and twitch embeds in the page
    for(var i = 0; i < names.length; ++i) {
        var name=names[i];
        $( '#name' + i).html(name);
        $( '#stream' + i ).html(formatStream( name ) );
    }
}

function formatStream( name ) {
    //put in a twitch embed to show the stream that has the given name
    //todo: this hardcoded size stuff seems fragile
	return '<iframe src="http://www.twitch.tv/'+name+'/embed" frameborder="0" scrolling="no" volume="0" height="280" width="400"></iframe>'

}




function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,    
    function(m,key,value) {
      vars[key] = value;
    });
    return vars;
  }








