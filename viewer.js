function formatStream( name ) {

	return '<object type="application/x-shockwave-flash" id="live_embed_player_flash", class="stream" data="http://www.twitch.tv/widgets/live_embed_player.swf?channel=${name}" bgcolor="#000000"><param name="allowScriptAccess" value="sameDomain" /><param name="allowNetworking" value="all" /><param name="movie" value="http://www.twitch.tv/widgets/live_embed_player.swf" /><param name="flashvars" value="hostname=www.twitch.tv&channel='+ name +'&auto_play=true" /></object>'
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
    var names = [];
    var entrants = response.entrants;
    for(var entrant in entrants) {
        var twitch = entrants[entrant].twitch;
        if(twitch && twitch !== me) {
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


$( document ).ready( loadStreams )