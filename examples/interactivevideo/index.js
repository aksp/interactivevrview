var vrView;

var playButton;
var muteButton;
var orientationButton;
var forcedcutsButton;
var regularcutsButton;
var $nextButton;

var timelineSlider;
var durationVideoPlayer;

var SAVED_SESSION_ROOT =  "examples/interactivevideo/saved-sessions/";
var STUDY_URL_ROOT = "study-urls/";

var PI_DENOMINATOR = 2.6;
var FOV_RADIANS = 0.5;
var TOGGLE_ORIENTATION_OFFSET = 1.0;
var FRAME_INCREMENT = 0.01;
var circle_high = Math.PI + Math.PI/2;
var circle_low = - Math.PI/2;

// Names have changed: 
// forced cuts == viewpoint-oriented cuts
// regular cuts == fixed-orientation cuts
// optional cuts == active reorientation
// hybrid cuts == viewpoint-oriented cuts + active reorientation
var url_opts = {
  forcedcuts: onToggleForcedCuts,
  regularcuts: onToggleRegularCuts,
  hybridcuts: onToggleHybridCuts,
};

// first time play?
var firstTimePlay = true;
VIDEO_START_TIME = null;
var d = new Date();

// player settings
sts = {
  setOrientationOffset: 1.570796326794897,
  currentTime: 0,
  cuts: {
    required_time: 3,
    current_shot: {"name": null, "start": null, "end": null, "i": null},
    pause_shot_change: false,
    history_shot_change: false,
  },
  theta: {
    current: null,
    last: null,
    time_set: d.getTime(),
    shot_history: [],
    rec_change: 0.02
  },
  specs: { // specifications for playback
    fn: null,
    mode: "optional_cuts",
    playback: null,
  },
  timeline: null,
  boundaries: null,
  $spec_composer: $('#spec-composer'),
  $study_info: $('#study-info'),
  dirty: {
    currentTheta: false,
    currentTime: false,
    possible_orientations: false,
  },
  subtitle_history: [],
  cardboard_press_count: 0,
  playthrough: 0,
  recording_interactions: [],
  map_condition: {
    "forcedcuts": "Viewpoint-oriented cuts",
    "optionalcuts": "Active reorientation",
    "hybridcuts": "Hybrid active/viewpoint cuts",
    "regularcuts": "Fixed-orientation cuts"
  }
};

function getTimestamp(){
  var d = new Date();
  return d.getTime();
}

var randomId = function() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 5; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function saveJSON(j, fn) {
    var json_out = JSON.stringify(j);
    var filename = fn;
    var http = new XMLHttpRequest();

    http.open("POST", "../../save_results.php", true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.onreadystatechange = function() {//Call a function when the state changes.
        if(http.readyState == 4 && http.status == 200) {
            console.log(http.responseText);
        }
    }
    var sendString = "json=" + json_out +  "&filename=" + filename;
    http.send(sendString);

    sts.study_info_saved = true;
    $nextButton.removeClass("disabled");
}

function saveInteractions(){
  saveJSON(sts.recording_interactions, createStudyOutFilename("interactions"));
}

function recordInteraction(interaction, value) {
  sts.recording_interactions.push({
    "time": getTimestamp(), 
    "interaction": interaction,
    "videoTime": sts.currentTime,
    "value": value
  });
}

function setupStudyRecording(){
  recordInteraction("setupStudyRecording", "meow");
}

function seek(t){
  vrView.seek(t);
  recordInteraction("seek", t);
}

function isMobile() {
  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return true;
  } 
  return false;
}

function onSliderChange() {
  var value = sts.timeline.slider("value");
  seek(value/1000.0);
}

function updateTimeline() {
  sts.timeline.slider("value", sts.currentTime * 1000.0);
}

function additionalOrientation(orientation) {
  var sc = sts.$spec_composer;
  if (sc.is(":visible")) {
    var new_text = sc.val() + " " + orientation;
    sc.val(new_text);
  }
}

function addOrientationChange(time, orientation) {
  var sc = sts.$spec_composer;
  if (sc.is(":visible")) {
     var new_text = sc.val() + "\n" + time + " " + orientation;
     sc.val(new_text);
  } else {
    sc.show();
    sc.val(time + " " + orientation);
  }
}

function outputNewSpec() {

  var sc_text = sts.$spec_composer.val();
  var sc_text_arr = sc_text.split("\n");
  var out = {"subtitles": [], "orientation": [], "videos": []};
  var titles_times = [];

  for (var i = 0; i < sc_text_arr.length; i++) {

    var els = sc_text_arr[i].split(" ");

    var start = undefined; 
    var orientations = [];
    var text = undefined;

    if (els.length > 0) {
      start = parseFloat(els[0]);
    }

    var k = 1;
    while (k < els.length && text === undefined) {
      if (isNaN(els[k])) {
        text = els.splice(k,els.length).join(" ");
      } else {
        var orientation = parseFloat(els[k]);
        orientations.push(orientation);
      }
      k++;
    }

    var res = {
      "start": start,
      "orientations": orientations,
      "text": text
    };
    console.log(res);
    titles_times.push(res);
  };

  function addToOut(tt1, tt2, out) {

    var start = tt1.start;
    var end = tt2.start;
    var text;

    if (tt1.text !== undefined && tt1.text !== "") {
      out.subtitles.push({
        start: start,
        end: end,
        text: tt1.text
      });
    }

    var out_orientation = {
      start: start,
      end: end,
      orientations: [],
    }
    if (tt1.orientations !== undefined) {
      console.log(tt1.orientations);
      out_orientation.orientations = tt1.orientations;
    }

    out.orientation.push(out_orientation);
    return out;

  }

  for (var i = 0; i < titles_times.length - 1; i++) {

    out = addToOut(titles_times[i], titles_times[i+1], out);

  };

  out.videos.push({
      fn: sts.specs.video_fn,
      stereo: sts.specs.stereo,
      name: "main"
  });
  if (sts.specs.background_video_fn) {
    out.videos.push({
     fn: sts.specs.background_video_fn,
     stereo: (sts.specs.background_video_fn.indexOf("invasion") > -1 ),  // only if invasion
     name: "establishing-shot"
    });
  }

  out = addToOut(titles_times[titles_times.length - 1], [sts.specs.duration], out);
  console.log(JSON.stringify(out));
}

function setTimelineKeycodes() {
  $(document).on("keypress", function(e){
    var k = e.keyCode;
    // if you've pressed space
    if (k === 32 && e.target == document.body) {
      e.preventDefault();
      onTogglePlay();
    // if you've pressed o, add the time and current orientation to a new line
    } else if (k === 111 && $(e.target).attr("id") !== "spec-composer") {
        addOrientationChange(sts.currentTime, sts.theta.current);
    // if you've pressed an m, append an orientation to the last line
    } else if (k === 109){
        additionalOrientation(sts.theta.current);
    // you've pressed s
    } else if (k === 115 && $(e.target).attr("id") !== "spec-composer") {
       outputNewSpec();
    }
  });

  $(document).on("keydown", function(e){
    if (e.keyCode === 39) {
      // pressed right arrow key, move forward
      seek(sts.currentTime + FRAME_INCREMENT);

    } else if (e.keyCode === 37) {
      // pressed left arrow key move back
      seek(sts.currentTime - FRAME_INCREMENT);
    }
  });
}

function seekToStartingTime(){
  if (sts.specs.video_start_time) {
    seek(sts.specs.video_start_time);
    recordInteraction("seekToStartTime", sts.specs.video_start_time);
    updateTimeline();
  }
}

function setupTimeline(video_fn) {
  // next 5 lines to find duration
  $(durationVideoPlayer).hide();
  $(durationVideoPlayer).html('<video src=' + video_fn + ' preload="metadata"></video>');
  $(durationVideoPlayer).find("video").eq(0).on("durationchange", function(){
    var seconds = $(this)[0].duration;
    sts.specs.duration = seconds; 
    console.log("Video duration: " + seconds);

    // now setup the timeline with this duration
    var ms = seconds * 1000;
    $(timelineSlider).slider({
      max: ms,
      slide: onSliderChange
    });

    // if the cell phone is mobile, we're going to have to change the 
    if (sts.specs.isMobile) {
      $(timelineSlider).css({"width": "80%", "margin-left": "10%"});
    }

    sts.timeline = $(timelineSlider);
    $(durationVideoPlayer).remove();

    setTimelineKeycodes();
    seekToStartingTime();
  });
}

function getIframedocument(){
    return $('iframe').eq(0)[0].contentWindow.document;
}

function hideOptionalButtons(){
  $(orientationButton).hide();
  $(forcedcutsButton).hide();
  // $(orientationPauseButton).hide();
  // $(orientationVideoChangeButton).hide();
  $(regularcutsButton).hide();
  // $(historyshotchangeButton).hide();
  // $(pauseshotchangeButton).hide();

  if (sts.specs.orientationbutton) {
    $(orientationButton).show();
  }
}

function addButtons() {
  // define buttons and add event listeners
  playButton = document.querySelector('#toggleplay');
  muteButton = document.querySelector('#togglemute');
  orientationButton = document.querySelector('#toggleorientation');
  forcedcutsButton = document.querySelector('#toggleforcedcuts');
  regularcutsButton = document.querySelector('#toggleregularcuts');
  if (sts.specs.nobuttons) {
    hideOptionalButtons();
  }

  timelineSlider = document.querySelector('#slider');
  durationVideoPlayer = document.querySelector('#fake-video-player');

  playButton.addEventListener('click', onTogglePlay);
  muteButton.addEventListener('click', onToggleMute);
  orientationButton.addEventListener('click', onToggleOrientation);
  regularcutsButton.addEventListener('click', onToggleRegularCuts);
  forcedcutsButton.addEventListener('click', onToggleForcedCuts);
}

function createPlayer(video_fn, stereo) {
  sts.specs.current_video_fn = video_fn; // TODO move this somewhere better (for orientation change)
  console.log("about to load video - " + sts.specs.current_video_fn);

  // Load VR View.
  vrView = new VRView.Player('#vrview', {
    width: '100%',
    height: 480,
    video: video_fn,
    is_stereo: stereo ? true : false,
  });
  vrView.on('ready', onVRViewReady);
}

function getQueryVariable(variable) {
  // var query = window.location.search.substring(1);
  var query = window.location.href.split(".html?")[1];
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      var var_out = pair.slice(1,pair.length).join("=");
      return var_out;
    }
  } 
  return null;
}

function parseURL(url) {
  var known_variables = ["f", "backgroundVideo", "opts", 
    "stereo", "nobuttons", "study", "sessionID", "times",
    "participantID", "study_json", "study_i"];
  console.log(known_variables);
  var query_variables = {};
  for (var i = 0; i < known_variables.length; i++) {
    var q = known_variables[i];
    query_variables[q] = getQueryVariable(q);
  };
  console.log(query_variables);
  return query_variables;
}

function toggleURLOpts(opt_str){
  var keys = Object.keys(url_opts);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (opt_str.indexOf(k) > -1) {
      // toggle on if it appears
      url_opts[k]();
    } 
  };
}

function createStudyOutFilename(camera_or_interactions){
    var root = SAVED_SESSION_ROOT;
    var base = sts.specs.fn.split("/")[sts.specs.fn.split("/").length-1];
    base = base.split(".")[0];
    var ext = [base, sts.specs.opts, sts.specs.study_i,
        sts.specs.sessionID, sts.specs.participantID, 
        randomId(), camera_or_interactions];
    ext = ext.filter(function(d){return d !== undefined}); // don't want the null values
    var ext_str = ext.join("_");

    return  root + ext_str + ".json";
}

// for now we're just going to try *-1 on all of them
function changeOrientationsForMobile(){
  for (var i = 0; i < sts.specs.playback.orientation.length; i++) {
    var entry = sts.specs.playback.orientation[i];
    var entry_orientations = entry.orientations;
    var new_orientations = [];
    for (var j = 0; j < entry_orientations.length; j++) {
      var ori = entry_orientations[j] * -1.0;
      new_orientations.push(ori);
    };
    var out_orientations = new_orientations.slice();
    sts.specs.playback.orientation[i].orientations = out_orientations;
  };
}

function fillOutStudyInfo(){
  $nextButton = $("<button>")
      .addClass("btn btn-default btn-small");
  var title = sts.specs.base_name;
  var condition = sts.specs.opts;
  var study_i = sts.specs.study_i;

  $('#video-title').text(title);
  $('#condition').text(sts.map_condition[condition]);
  $('#study-i').text(study_i);

  if (sts.specs.next_study_url) {
    $nextButton.text("Next")
      .addClass("disabled")
      .on("click", function(){
        if (sts.study_info_saved) {
          // go to the next link
          window.location.href  = sts.specs.next_study_url;
        } else {
          console.log("Haven't saved study yet!");
          console.log(sts.specs.next_study_url);
        }
      });
  } else {
    $nextButton.text("Done!");
    $nextButton.addClass("disabled");
  }
  $('#study-button-div').append($nextButton);
}

function onLoad() {
  var url = window.location.href;
  var q = parseURL(url);

  sts.specs.fn = q.f;
  sts.specs.base_name = q.f.split("/")[q.f.split("/").length - 1].split(".")[0];
  sts.specs.background_video_fn = q.backgroundVideo;
  sts.specs.opts = q.opts;
  sts.specs.stereo = (q.stereo == "true");
  sts.specs.nobuttons = (q.nobuttons == "true");
  // TODO: get rid of sessionID - its just here to work with old links
  sts.specs.sessionID = q.sessionID; 

  // study specs
  sts.specs.study = (q.study == "true");
  sts.specs.participantID = q.participantID;
  sts.specs.study_i = q.study_i;
  sts.specs.study_json = q.study_json;

  sts.specs.randomID = randomId();
  sts.specs.isMobile = isMobile();

  if (q.times) {
    sts.specs.video_start_time = parseFloat(q.times.split("-")[0]);
    if (q.times.split("-").length > 1) {
      sts.specs.video_end_time = parseFloat(q.times.split("-")[1]);
    }
  }

  // we have some things to do for a study
  if (sts.specs.study) {
    sts.specs.camera_out_fn = createStudyOutFilename("camera");
    sts.specs.interaction_out_fn = createStudyOutFilename("interactions");
    setupStudyRecording();

    // extra things if we have a study json
    // here is our fancy study harness rather than just recording
    if (sts.specs.study_json) {
      console.log("We have a study json!");
      sts.specs.nobuttons = true;

      $.getJSON(STUDY_URL_ROOT + sts.specs.study_json, function(data){
          sts.specs.study_i = parseInt(sts.specs.study_i);
          var next_study_i = sts.specs.study_i + 1;
          var participant_json = data[sts.specs.participantID];

          if (next_study_i < participant_json.length) {
            sts.specs.next_study_url = participant_json[next_study_i];
          } 
          fillOutStudyInfo();
      });
    }
  } 

  if (url.indexOf("demo.html") > -1) {
    sts.specs.demo = true;
    sts.specs.nobuttons = true;
    $('#technique-title').text(sts.map_condition[sts.specs.opts]);
    if (sts.specs.opts.indexOf("optionalcuts") >  -1 
        || sts.specs.opts.indexOf("hybridcuts") >  -1) {
      sts.specs.orientationbutton = true;
    }
  }

  if (sts.specs.fn && sts.specs.fn.toLowerCase().indexOf(".json") > -1) {

    // load and playback from specification file
    $.getJSON(sts.specs.fn, function(data) {
      sts.specs.playback = data;

      // if its a mobile device, we gotta fix the orientations
      if (sts.specs.playback.orientation && sts.specs.isMobile) {
        changeOrientationsForMobile();
      }

      // todo: create player that cuts between multiple videos
      if (sts.specs.playback.videos.length >= 1) {
        var video_fn = sts.specs.playback.videos[0].fn;
        console.log(sts.specs.playback.videos);
        var stereo = sts.specs.playback.videos[0].stereo;

        var regular_cut_videos = sts.specs.playback.videos.filter(function(d){
            return d.name === "regular-cuts";
          });
        if ( regular_cut_videos.length === 1 ) {
          sts.cuts.all_regular_cuts_stopped = true;
          console.log("STOP ALL REGULAR CUTS");

        } else {
          sts.cuts.all_regular_cuts_stopped = false;
          console.log("DO NOT STOP ALL REGULAR CUTS");
        }

        sts.specs.video_fn = video_fn;
        sts.specs.stereo = stereo;

        addButtons();
        createPlayer(video_fn, stereo);

        if (sts.specs.opts) {
          toggleURLOpts(sts.specs.opts);
        }
      
        // we can get rid of currentTime because that ugly
        $('#currentTime').hide();
      }
    });
  } else if (sts.specs.fn 
             && sts.specs.fn.split(".")[1].length === 3) {
          // && sts.specs.fn.toLowerCase().indexOf(".mp4") > -1) {

    // just playback the video
    sts.specs.video_fn = sts.specs.fn;
    addButtons();
    createPlayer(sts.specs.video_fn, sts.specs.stereo);

    // we don't need some of the buttons
    hideOptionalButtons();
  }
}

function getPossibleOrientationsWithTimes(){

  if (sts.specs.playback !== null) {
    // get relevant orientation objects
    var res = $(sts.specs.playback.orientation).filter(function(){
      return this.start <= sts.currentTime 
          && this.end > sts.currentTime;
    });

    // for each relevant orientation object, append possible orientations
    var all_orientations = [];
    var all_times = [];
    for (var i = 0; i < res.length; i++) {
      all_orientations = all_orientations.concat(res[i].orientations);
      for (var j = 0; j < res[i].orientations.length; j++) {
        all_times.push([res[i].start, res[i].end]);
      };
    };
    return {times: all_times, orientations: all_orientations};
  }  

}

// force update the video player orientation
// to the first possible orientation
function updateOrientation(){
    // var res = getPossibleOrientations();
    var res = getPossibleOrientationsWithTimes();
    var orientations = res.orientations;
    var times = res.times;

    // if there are any possible orientations, we're just going 
    // to take the first one and trigger a cut
    if (orientations !== null && times && times.length > 0
      && (orientations[0] !== sts.current_orientation 
        || times[0].toString() !== sts.current_orientation_time )) {

      var first_orientation = orientations[0];
      if (sts.cuts.regular_cuts && !sts.cuts.all_regular_cuts_stopped) {
        // orient important to consistant direction
        if (sts.current_orientation === undefined || sts.current_orientation === null) {
          sts.current_orientation = 0;
        }
        var regular_cut_orientation = first_orientation + (sts.theta.current - sts.current_orientation);
        if (sts.specs.isMobile) {
          regular_cut_orientation = first_orientation - (sts.theta.current - sts.current_orientation);
        }

        vrView.setOrientation(regular_cut_orientation); 
        recordInteraction("regularCut", regular_cut_orientation);

      } else if (sts.cuts.regular_cuts && sts.cuts.all_regular_cuts_stopped) {
        recordInteraction("noCutPerformed");
      } else {
        // normal, orient important to viewer
        vrView.setOrientation(first_orientation); 
        console.log("setOrientation: " + first_orientation);
        recordInteraction("forcedCut", first_orientation);
      }
      sts.current_orientation = first_orientation;
      sts.current_orientation_time = times[0].toString();
    } 
}

// update the options for the video player
// orientation, but only change the orientation when the user asks to
function updateOrientationOptions(){
  var res = getPossibleOrientationsWithTimes();

  var is_changed = res && ((sts.specs.possible_orientations + "") !== (res.orientations + "")
                  || (sts.specs.possible_orientation_times + "") !== (res.times + ""));

  // we're only going to update if the possible orientations have changed
  if (is_changed) {
    sts.specs.possible_orientations = res.orientations;
    sts.specs.possible_orientation_times = res.times;
    sts.specs.next_orientation_i = 0;
    sts.specs.possible_orientations_dirty = true;

    if (sts.specs.mode === "forced_cuts" || sts.cuts.regular_cuts) {
      updateOrientation();
    }
  }
}

// force update current shot and if the shot is
// different then clear out the shot history
function updateShot() {
  var rel_shot = sts.specs.playback.shots.filter(function(d){
    return sts.currentTime >= d.start && sts.currentTime < d.end;
  });
  if (rel_shot.length > 0 && sts.cuts.current_shot.i !== rel_shot[0].i) {
    sts.cuts.current_shot = rel_shot[0];
    sts.theta.shot_history = [];
  }
}

function stopPlayingVideoIfNeeded(){
    var stopPlaying = false;
    if (sts.currentTime >= sts.specs.video_end_time
      && !sts.playthrough) {
      stopPlaying = true;

    } else if (sts.currentTime >= sts.specs.duration - .5 
         && sts.specs.study && !sts.playthrough) {
      stopPlaying = true;
    }

    if (stopPlaying) {
      console.log("Automatically stopped at: " + sts.currentTime); 
      onTogglePlay();
      vrView.record(createStudyOutFilename("camera"));
      recordInteraction("stoppedPlayAutomatically");
      saveInteractions();
      sts.playthrough++;
    }
}

function listenForCurrentTime() {
  // we need to listen for events
  iframe = getIframedocument();

  iframe.addEventListener("currenttimeanswer" , function(e){
    // update that current time!
    var last_current_time = sts.currentTime;

    // if time has updated and its not the background video
    if (last_current_time !== e.detail
      && (!sts.specs.background_video_fn 
       || sts.specs.background_video_fn !== sts.specs.current_video_fn)) {

      // console.log(sts.currentTime + ", "  + sts.theta.current + ", " + sts.specs.current_video_fn);
      sts.currentTime = e.detail;

      if (sts.timeline) {
        updateTimeline();
        $('#currentTime').text(sts.currentTime);
      } 
      if (sts.specs.playback && sts.specs.playback.shots) {
        updateShot();
      }
      updateOrientationOptions();
      // filterBasedOnOrientationInteractions();
      stopPlayingVideoIfNeeded();
    }
  });

  // this could be useful
  iframe.addEventListener("getorientationanswer" , function(e) {
    
    var new_theta = e.detail +  sts.setOrientationOffset;

    if (new_theta !== sts.theta.current) {

      // we only want to update last theta/time changed if the 
      // theta looks like its more than noise
      if (Math.abs(new_theta - sts.theta.current) > sts.theta.rec_change) {
        sts.theta.last = sts.theta.current;
        sts.theta.time_set = getTimestamp();
        sts.theta.shot_history.push(sts.theta.current);
      }
      // we'll update the new theta no matter what
      sts.theta.current = new_theta;
      
      sts.current_theta_dirty = true;
      // filterBasedOnOrientationInteractions();
    }
  });

  // but also we need to ask for it all of the time :(
  setInterval(function() {
    vrView.currentTime();
    vrView.getOrientation(); 
  }, 1000/29);
}

function isTouchCardboardButton(e) {
  var clientHeight = e.target.clientHeight;
  var clientWidth = e.target.clientWidth;

  var firstTouch = e.originalEvent.touches[0];
  var x = firstTouch.clientX;
  var y = firstTouch.clientY;

  // if the x is between 40%-60% of width and y is in top 20%
  // TODO: also check cardboard mode
  if (x/clientWidth > .4 && x/clientWidth < .6
    && y/clientHeight < .2) {
    console.log("Detected cardboard touch");
    return true;
  } else {
    return false;
  }
}

function onCardboardButtonPress() {
  // if (sts.specs.study 
  //     && vrView.isPaused) {
  if (vrView.isPaused) {
    onTogglePlay();
    recordInteraction("cardboardButtonPlay");
  } else if (sts.specs.mode === "optional_cuts") {
    onToggleOrientation();
    recordInteraction("cardboardButtonToggleOrientation");
  } else {
    recordInteraction("cardboardButtonNone");
  }

}

function onVRViewReady() {
  vrView.pause();

  playButton.classList.add('paused');
  vrView.isPaused = true;
  console.log('vrView.isPaused', vrView.isPaused);
  
  // Set the initial state of the buttons.
  if (vrView.isPaused) {
    playButton.classList.add('paused');
  } else {
    playButton.classList.remove('paused');
  }

  listenForCurrentTime();
  setupTimeline(sts.specs.video_fn);

  if (sts.specs.study) {
    vrView.record("startRecording");
  }

  $(getIframedocument()).on('touchstart', function(e){
      if (isTouchCardboardButton(e)) {
        onCardboardButtonPress();
      }
  });

  if (sts.specs.isMobile){
    FOV_RADIANS = 0.05;
  }
}

function advanceOrientation(){
  // figure out the next orientation_i;
  var i = parseInt(sts.specs.next_orientation_i);
  if (i + 1 < sts.specs.possible_orientations.length) {
    sts.specs.next_orientation_i = i + 1;
  } else {
    sts.specs.next_orientation_i = 0;
  }
}

function onToggleOrientation() {
  var orientations = sts.specs.possible_orientations;
  var i = parseInt(sts.specs.next_orientation_i);
  if (orientations.length > 0 && i !== undefined) {
    var orientation = orientations[i];

    // set orientation to the next orientation
    var new_i = parseInt(sts.specs.next_orientation_i);
    vrView.setOrientation(orientations[new_i]); 
    recordInteraction("onToggleOrientation", orientations[new_i]);

    // figure out the next orientation_i;
    var i = parseInt(sts.specs.next_orientation_i);
    if (i + 1 < sts.specs.possible_orientations.length) {
      sts.specs.next_orientation_i = i + 1;
    } else {
      sts.specs.next_orientation_i = 0;
    }

  }
}

function onTogglePlay() {

  if (vrView.isPaused) {
    if (firstTimePlay) {
      var time = getTimestamp();

      VIDEO_START_TIME = time;
      firstTimePlay = false;
    }
    vrView.play();
    playButton.classList.remove('paused');
    recordInteraction("play", sts.currentTime);
  } else {
    vrView.pause();
    playButton.classList.add('paused');
    recordInteraction("pause", sts.currentTime);
  }
}

function onToggleMute() {
  var isMuted = muteButton.classList.contains('muted');
  if (isMuted) {
    vrView.setVolume(1);
  } else {
    vrView.setVolume(0);
  }
  muteButton.classList.toggle('muted');
}

function onToggleForcedCuts() {
  console.log("Default: " + sts.specs.mode);
  if (sts.specs.mode === "forced_cuts") {
    sts.specs.mode = "optional_cuts";
    $(forcedcutsButton).text("Switch to forced cuts");
    $(orientationButton).removeClass("disabled");
    $(regularcutsButton).removeClass("disabled");
  } else if (sts.specs.mode === "optional_cuts"){
    sts.specs.mode = "forced_cuts";
    $(forcedcutsButton).text("Switch to optional cuts");
    $(orientationButton).addClass("disabled");
    $(regularcutsButton).addClass("disabled");
  }
}

function onToggleRegularCuts() {
  if (!sts.cuts.regular_cuts) { 
    sts.cuts.regular_cuts = true;
    sts.specs.mode = "regular_cuts";
    $(regularcutsButton).text("Turn off regular cuts");
    $(forcedcutsButton).addClass("disabled");
    $(orientationButton).addClass("disabled");
  } else {
    sts.cuts.regular_cuts = false;
    sts.specs.mode = "optional_cuts";
    $(regularcutsButton).text("Turn on regular cuts");
    $(forcedcutsButton).removeClass("disabled");
    $(orientationButton).removeClass("disabled");
  }
}

function onToggleHybridCuts() {
  onToggleForcedCuts();
  $(orientationButton).removeClass("disabled");
}

window.addEventListener('load', onLoad);