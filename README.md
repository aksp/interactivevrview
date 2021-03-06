This repo contains code for the project Shot Orientation Controls for Interactive 360 Degree Cinematography. See the project page [here](https://aksp.github.io/interactive360video/).

If you have any questions about the repo or project contact Amy Pavel at amypavel@berkeley.edu.

Running the interactive 360 video player
=======
First, clone the repo. 

Next, you will need a simple webserver. At a minimum it should support partial range requests (e.g., to support seek by loading only part of the video at a time). You can see if a server supports partial range requests by following [these instructions](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests#Checking_if_a_server_supports_partial_requests). Here are two options:

* **Using http-server:** If you already have `npm` then Node's [http-server](https://www.npmjs.com/package/http-server) is an easy-to-install server that supports partial range requests. To run the interactive 360 video player using Node's http-server:
	* `cd` into the repo directory
	* To install the server enter `npm install http-server -g`
	* Enter `http-server` to run the server
	* Record the address provided (for example 127.0.0.1:8080) 
	* Open a browser window and visit http://127.0.0.1:8080/examples/interactivevideo/interface-demo.html to run the online demo (see [here](https://people.eecs.berkeley.edu/~amypavel/vrview/examples/orientations/interface-demo.html))

* **Using MAMP:** If you do not have `npm` or ou would like to be able to record or save data from viewing sessions (e.g., head orientation and interactions), you will need a different server because `http-server` does not support POST requests. A local Apache web server works well, and [MAMP](https://www.mamp.info/en/) is an easy way to run an Apache server. Add the cloned repo to the `Applications/MAMP/htdocs/` folder and visit `http://localhost:8888/interactivevrview/examples/interactivevideo/interface-demo.html` to run the demo.

The videos within the demo will not work yet. To display a video with viewpoint-oriented cuts or active reorientation the system needs two files: a specification file to specify cut times and important points, and a corresponding mp4 video file. The repo contains one specification file (`interactivevrview/examples/interactivevideo/demo-spec-files/trees.json`) but it does not contain the required corresponding video. To add the video:
* Make this directory for videos (`mkdir interactivevrview/examples/interactivevideo/videos/`) 
* Download the trees video that can be found on YouTube [here](https://www.youtube.com/watch?v=f7wTolIlK_s)
* Title the video `trees.mp4` and save it to the created video directory 

You can now view the trees demo by selecting "Trees" on the interface-demo.html dropdown, then choosing from any technique (e.g., viewpoint-oriented, active, hybrid, fixed). 

Authoring a new interactive 360 degree video
=======
Now that you have the video player up and running you can view any 360 video using the system. To view a video file using the technique, you will need to add the video file to the system, and add a new specification file. 

* Add the video (`my-video.mp4`) to the server in the folder `interactivevrview/examples/interactivevideo/videos/` 
* To create a JSON specification file from scratch, use the same format as in `trees.json` and change the video filenames, the shot times (e.g., "start" and "end" for each shot), and the important points per shot (e.g., "orientations") in order of importance. Add the JSON file to the existing folder `demo-spec-files/'.
* To create a JSON specification file using our (ugly but functional) labeling interface
	* Start the webserver as above and visit `http://<webserver-address>/examples/interactivevideo/index.html?f=videos/<my-video.mp4>`. 
	* Navigate the video by using the timeline or the left and right arrow keys. 
	* When you have reached a cut point and you have dragged to an important orientation, press `o` to mark the cut (and the first important orientation). 
	* Press `m` to mark subsequent important orientations on the same frame. 
	* After you have finished marking cut times and orientations, press `s` to output the JSON to the javascript console. 
	* You can copy and paste the outputted JSON string to a file called `interactivevrview/examples/interactivevideo/demo-spec-files/<my-video.json>`. 

Then, you can see your video by visiting the relevant demo page directly. For instance, for viewpoint-oriented cuts, visit `http://<webserver-address>/examples/interactivevideo/demo.html?f=demo-spec-files/<my-video.json>&opts=forcedcuts`. 

API calls
=======
You can use our video player that implements fixed-orientation, viewpoint-oriented, and active reorientation as above. 

If you would like to edit this player to add additional functionality, you may want to use the player's API. This player is based on Google's VR View, but adds some functionality for changing video playback based on interaction and head orientation. 

These API calls in this repo were implemented in the original Google VRView player (for additional API info see here: <https://developers.google.com/vr/concepts/vrview-web>): 
* vrview = new VRView.Player("ID", {video: 'link/to/video.mp4', is_stereo: false}) -- Creates the vrview player
* vrview.play() -- Plays the video
* vrview.pause() -- Pauses the video 

New API calls for this project, these calls will work for desktop and cardboard/mobile: 
* vrview.setOrientation(_y-axis-rotation-in-radians_) -- Sets current camera orientation by rotating camera around y axis 
* vrview.getOrientation() -- Gets the current camera orientation about the y axis (offset by -pi/2). This doesn't actually get the orientation but instead calls an event that you can listen for
* vrview.currentTime() -- Gets the current time in the video. Again, this doesn't actually return the time, it just calls an event that you can listen for
* vrview.seek(_seconds_) -- Seeks to number of seconds within the video
* vrview.record("startRecording") -- Starts recording interactions (e.g., play, pause, seek) and camera orientation
* vrview.record(_filename_) -- Stops recording and saves recording to the file _filename_

To support these API new calls, I've edited the following files in the original API: build/embed.js, build/vrview.js, build/three.js
