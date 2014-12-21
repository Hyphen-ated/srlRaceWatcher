function formatStream( name ) {

	return '<object type="application/x-shockwave-flash" id="live_embed_player_flash", class="stream" data="http://www.twitch.tv/widgets/live_embed_player.swf?channel=${name}" bgcolor="#000000"><param name="allowScriptAccess" value="sameDomain" /><param name="allowNetworking" value="all" /><param name="movie" value="http://www.twitch.tv/widgets/live_embed_player.swf" /><param name="flashvars" value="hostname=www.twitch.tv&channel='+ name +'&auto_play=true&start_volume=0" /></object>'
}


function setStreams( names ) {
    for(var i = 0; i < names.length; ++i) {
        var name=names[i];
        $( '#name' + i).html(name);
        $( '#stream' + i ).html(formatStream( name ) );
    }
}


function getParam(name){
   if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
      return decodeURIComponent(name[1]);
}

function parseSrlJson(response) {
    var me = getParam("me");
    var blocked = getParam("blocked");
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


function loadStreams() {
    var race = getParam("race");
    var apiUrl = "http://api.speedrunslive.com";
    if(race) {
        $.ajax({
            type : "GET",
            url : apiUrl + "/races/" + race,
            processData : true,
            data : {},
            dataType : "jsonp",
            jsonpCallback : "parseSrlJson",
            cache : true
        });
    }
    
}

function createHtmlTable() {
    var width = getParam("w");
    if(!width) {
        width = 2;
    }
    var height = getParam("h");
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

function init() {
    createHtmlTable();
    loadStreams();
}


$( document ).ready( init )