/***************************************************************************
* This script listens for up to 4 Gamepads and forwards their input.
* The JS using this lib MUST be included in the page before this script.
* That JS file also MUST have these functions:
*  - gpInput(a): receives an array of input for the gamepads
*  - gpError(msg): receives a fatal error message for the library
*  - gpNum(n): receives the number of connected gamepads
***************************************************************************/

var msGpPoll = 50; //Poll every 1/20th of a second
var numGP = null;
var gpActiveI = [false, false, false, false]; //No GPs have been touched yet
var gpInterval;

$(document).ready(function() {
  //Ensure Gamepad API is supported
  if ("getGamepads" in navigator) {
      //Assume desired GPs are Connected
      gpInterval = window.setInterval(gpPoll, msGpPoll);
  } else {
    gpError("Browser doesn't support Gamepad API.");
    return; //Bail
  }
});

/** Check for each button that is currently Pressed **/
function gpPoll() {
  var a = []; //Store inputs to pass to gpInput
  var c = 0;
  var gps = navigator.getGamepads();

  //Loop through all the Gamepads
  for(var i=0; i < gps.length; ++i) {
    //Skip Empty Gamepads
    if(gps[i] == null)
      continue;
    a[i] = [];
    c++;
    
    //Loop through all the Buttons
    for(var j=0; j < gps[i].buttons.length; ++j) {
      if(gps[i].buttons[j].pressed) {
        //console.log(gps[i].id + ') Button ' + j);
        a[i]['b'+j] = true;
        gpActiveI[i] = true;
      }
    }
  }
  if(null == numGP) //Only send the number once
    gpNum(c); //send to receiver function
  numGP = c; //save the current in case other script wants to poll live

  //Forward to receiver function
  gpInput(a); //gpInput MUST exist in the script that wants gamepad input
}

//TODO: check that gp* functions exist in JS somewhere like this:  if (typeof gpInput === 'function')
