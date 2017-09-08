Running the interactive 360 video player
=======
* Download the repo by 



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

To support these API new calls, I've edited the following files in the original API (an old version found here: ): build/embed.js, build/vrview.js, build/three.js
