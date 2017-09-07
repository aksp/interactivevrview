API calls
=======

Ones implemented by google (see here: <http://developers.google.com/cardboard/vrview>): 
* vrview.play()
* vrview.pause()

Ones I've implemented that work on both desktop and cardboard/mobile: 
* vrview.setOrientation(_y-axis-rotation-in-radians_) -- Sets current camera orientation by rotating camera around y axis 
* vrview.getOrientation() -- Gets the current camera orientation about the y axis (offset by -pi/2). This doesn't actually get the orientation but instead calls an event that you can listen for
* vrview.subtitle(_subtitle-text_) -- If the subtitle isn't currently on the screen, it puts the new text on the screen, if it is on the screen, it removes it. Doesn't handle multiple lines and the positioning is a little weird on cardboard
* vrview.currentTime() -- Gets the current time in the video. Again, this doesn't actually return the time, it just calls an event that you can listen for
* vrview.seek(_seconds_) -- Seeks to number of seconds within the video

Ones I've implemented that work on desktop (may work on cardboard) and are only partially finished:
* vrview.record(_"startRecording"_ or _"stopRecording"_) -- Starts and stops recording the user interactions. When it stops recording, right now it just console.logs timestamps with the rotations (longitude only for now). Needs some work to match up timestamps to video playback time.

I'm not actually building the project using node. I'm just editing the following files: build/embed.js, build/vrview.js, build/three.js

The video player with the ability to switch cuts is in the examples/orientations/ folder. Your URL should look something like this: "http://localhost/~apavel/360-video-project/vrview/examples/orientations/index.html?f=spec-files/nocuts.json". So, just navigate to examples/orientations/index.html then include the filename with the playback specifications (in this case spec-files/nocuts.json) after this signifier "?f=".  

You'll also want to download the video I've been using here: https://people.eecs.berkeley.edu/~amypavel/vrview/examples/orientations/nocuts.MP4. You may have to change the video path in spec-files/nocuts.json.


Branched from: VR View
=======
VR View allows you to embed 360 degree VR media into websites on desktop and
mobile. For more information, please read the documentation available at
<http://developers.google.com/cardboard/vrview>.
