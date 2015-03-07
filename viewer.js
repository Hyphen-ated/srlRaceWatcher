////// settings
////

var apiUrl = "http://api.speedrunslive.com"; //doing ajax to an http means this script won't play well hosted with

////// parameters we'll want to share with multiple functions
////

var race_list_object = {}; // stores the big "races" object returned by the SRL API
// try to get exclusion list from saved browser setting
var excluded_users = localStorage['excluded_users'] || '[]';
try { excluded_users = JSON.parse(excluded_users); }
catch (e) { excluded_users = [];}

////// utility functions
////

(function($,sr){  // debouncing function from John Hann
    // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
    // this prevents the browser window "resize" event from firing a zillion times
    var debounce = function (func, threshold, execAsap) {
        var timeout;
        return function debounced () {
            var obj = this, args = arguments;
            function delayed () {
                if (!execAsap)
                    func.apply(obj, args);
                timeout = null;
            };
            if (timeout)
                clearTimeout(timeout);
            else if (execAsap)
                func.apply(obj, args);
            timeout = setTimeout(delayed, threshold || 100);
        };
    }  // smartresize 
    jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };
})(jQuery,'smartresize');


// gets value(s) from the URL hash
function get_hash_args() {
    hashsplit = window.location.hash.substr(1).split(',');
    if (hashsplit[0]=='') return false;
    return hashsplit;
}


// spare utility function because racer names are only returned as keys instead of values by SRL
function implode_object_keys(obj) {
    var keys = [];
    for(var key in obj) keys.push(key);
    return keys;
}

////// the main attraction. these functions place streams on the page for you.
////

// coughs up an embeddable swf strea viewer object as a string
function format_stream( twitch_name ) {
    return '<object type="application/x-shockwave-flash" class="swf_stream" bgcolor="#000000">'+
    '<param name="allowFullScreen" value="true">'+
    '<param name="allowScriptAccess" value="always">'+
    '<param name="allowNetworking" value="all">'+
    '<param name="movie" value="http://www.twitch.tv/widgets/live_embed_player.swf">'+
    '<param name="flashvars" value="hostname=www.twitch.tv&channel='+twitch_name+'&auto_play=true&eventsCallback=onPlayerEvent">'+
    '</object>';
}

// ajaxes to get a single race's info from SRL API
function fetch_race_info(race_id) {
    if(race_id) {
        $.ajax({
            type : "GET",
            url : apiUrl + "/races/" + race_id,
            cache : false,
        }).done(insert_stream_boxes);
    }
}

// takes a race's info from fetch_race_info and embeds the race's streams using format_stream
function insert_stream_boxes(race_object) {
    // for each racer
    $.each(race_object.entrants, function(srl_name, srl_attr){
        // don't bother if they're excluded or don't have a twitch
        if ($.inArray(srl_attr.twitch, excluded_users) >= 0 || srl_attr.twitch == '') return true;
        $('#content').append(
            '<div class=container>'+
                '<div class=streamername>'+srl_attr.twitch+'</div>'+
                '<div class=stream>'+format_stream(srl_attr.twitch)+'</div>'+
                '<div class=barhider></div>'+
                '<div class=excluder></div>'+
            '</div>'
        );
    });
    // fire a window resize event to trigger stream auto-sizing
    $(window).resize();
}

////// secondary stuff. these functions let you choose a race and a stream to exclude
////

// gets SRL race list, runs build_race_list_object, and then kicks off the html build_list
function get_list_of_races() {
    $.ajax({
        type : "GET",
        url : apiUrl + "/races/",
        cache : false,
    }).done(build_race_list_object, build_race_list_html);
}

// puts list of races into global "race_list_object" so we can look them up by race ID later
function build_race_list_object(data_returned) {
    $.each(data_returned.races,function(i,race_object){
        // ignore races with 0 racers
        if (race_object.numentrants > 0) race_list_object[race_object.id] = race_object;
    });

}

// builds an html list of available races
function build_race_list_html() {
    var race_list_dom = $('<div class=question><h2>pick a race</h2><div id=race_list>Paste an <input id="srlraceid" placeholder="#srl-raceid"> or choose a race below: </div></div>');
    $.each(race_list_object,function(i,race_object){
        race_list_dom.children('div').append('<div class=race_list_entry raceid='+race_object.id+'><b>'+race_object.game.name+'</b> <u>played by</u> '+implode_object_keys(race_object.entrants).join(' <u>&</u> ')+'</div>');
    });
    $('#content').html(race_list_dom);

    // now waits for a race to be clicked //////////////////////////////////¯¯\/
    $('#race_list').on('click', '.race_list_entry', function(){
        // save chosen race id
        console.log('test');
        console.log($(this).attr('raceid'));
        var race_id = $(this).attr('raceid');
        // and follows up with racer list
        if (excluded_users.length == 0) ask_which_player(race_id);
        else complete_and_build(race_id);
    });
    // or for the input to be filled out   /////////////////////////////////__/\
    $('#srlraceid').on('mouseup mouseout keyup paste change', function(){
        if (!$(this).val().trim().match( /^#?srl-\w+$/i )) return;
        // save chosen race id
        var race_id = $(this).val().trim().match( /^#?srl-(\w+)$/i )[1];
        // and follow up with racer list
        if (excluded_users.length == 0) ask_which_player(race_id);
        else complete_and_build(race_id);
    });
}

// builds an html list of racers in selected race
function ask_which_player(race_id) {
    var race_list_dom = $('<div class=question><h2>exclude a stream (yourself)?</h2><div id=racer_list></div></div>');
    $.each(implode_object_keys(race_list_object[race_id].entrants),function(i,racer){
        race_list_dom.children('div').append('<div class=racer_list_entry racerid='+race_list_object[race_id].entrants[racer].twitch+'>'+racer+'</div>');
    });
    race_list_dom.children('div').append('<div class=racer_list_entry racerid="">no thanks</div>');
    $('#content').html(race_list_dom);
    // now waits for a racer to be clicked
    $('#racer_list').on('click', '.racer_list_entry', function(){
        // if a real username was selected and isn't already in the excluded users (shouldn't be), add it
        if ($(this).attr('racerid') != '' && $.inArray($(this).attr('racerid'), excluded_users)< 0) excluded_users.push($(this).attr('racerid'));
        // save preferences
        localStorage['excluded_users'] = JSON.stringify(excluded_users);
        // populate excluded users list
        $('#excludedlist').text(excluded_users.join(', '));
        // and follow up with last steps
        complete_and_build(race_id);
    });
}

// finish up selection mode by changing the URL to include the race ID, emptying the page, and firing up the single-race viewer mode
function complete_and_build(race_id) {
    window.location = '#'+race_id
    $('#content').html('');
    fetch_race_info(race_id);
}

////// binding and other DOM stuff here
////

function decide_stream_size() {
        //bail if there's no streams to resize
        var num_streams = $('.container').length;
        if (num_streams == 0) return false;
        //keep going
        var ratio=16/9;
        var name_height = $('.streamername').height();
        var avail_height = $('#content').height();
        var avail_width = $('#content').width();
        var try_height = 1000;
        var gtg = false;
        while (!gtg) {
            try_height = try_height * 0.99;
            var rows_fit = Math.floor(avail_height/try_height);
            var try_width = Math.floor((try_height-name_height) * ratio);
            var cols_fit = Math.floor(avail_width/try_width);
            if (rows_fit*cols_fit >= num_streams) {
                gtg = true;
                console.log('decided on '+rows_fit+' rows and '+cols_fit+' cols. fits '+rows_fit*cols_fit+' players but we need '+num_streams);
            }
            else console.log('cant fit '+rows_fit+' rows and '+cols_fit+' cols. fits '+rows_fit*cols_fit+' players but we need '+num_streams);

        }
        console.log('need video to be '+try_height+' tall and '+try_width+' wide');
        $('.container').css('width',''+try_width+'px');
    }

$(document).ready( function(){

    // always listen for stream SWFs to appear, and mute them
    window.onPlayerEvent = function (data) {
        data.forEach(function(event) {
            if (event.event == "playerInit") {
                $('object').each(function(){$(this)[0].mute()});
            }
        });
    }   

    // get page args
    var page_args = get_hash_args();
    // if there's no args, ask what race to view
    if (!page_args) get_list_of_races();
    // if there's one arg in the URL assume it's a race ID (for now) and build the page
    if (page_args.length==1) fetch_race_info(page_args[0]);
    // otherwise ask which race to run
    else get_list_of_races();

    //// prep other page elements
    //

    // "clear exclusion list" button
    $('#clearexcluded').click(function(){
        excluded_users = [];
        localStorage['excluded_users'] = JSON.stringify(excluded_users);
        $('#excludedlist').text('');
    });

    // exclude users
    $('#content').on('click', '.excluder', function(){
        // identify whose stream to remove
        var being_removed = $(this).parent().children('.streamername').text();
        // add them to excluded users
        excluded_users.push(being_removed);
        // save preferences
        localStorage['excluded_users'] = JSON.stringify(excluded_users);
        // repopulate excluded users list
        $('#excludedlist').text(excluded_users.join(', '));
        // and dump this stream
        $(this).parent().remove();
    });

    // populate excluded users list
    $('#excludedlist').text(excluded_users.join(', '));
    
    // start listening for the window resize event
    $(window).smartresize(decide_stream_size);

});
