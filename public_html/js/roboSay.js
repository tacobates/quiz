var hal9000 = new SpeechSynthesisUtterance();
hal9000.onstart = function (event) {
  //console.log('HAL9000 started speaking at ' + event.timeStamp);
};
hal9000.onend = function (event) {
  console.log('HAL9000 finished speaking at ' + event.timeStamp);
  roboDoneTry();
};
roboVoice('Google UK English Female'); //Sounds best by Default

/** Tries to call roboDone() in the main JS, if it exists **/
function roboDoneTry() {
  if (typeof roboDone === 'function')
    roboDone();
  else
    console.log("HAL: I'm sorry Dave, I'm afraid I can't do that.");
}

/**
* Turns txt into robot voice audio
* @param txt: what you want the robot to say
* @param actorVoice: optionally specify a voice JS understands
* @param defaultSeconds: if actorVoice == 0, how long to wait before pretending like we're done talking
*/
function roboSay(txt, actorVoice, defaultSeconds){
  //replace any weird HTML
  txt = txt.replace(/<.*>/, ' ');
  txt = txt.replace('&amp;', '&');
  if (null == defaultSeconds)
    defaultSeconds = 5; //5 seconds of silence approximating how long I WOULD have spoken for
  console.log('roboSay as ' + actorVoice + '('+defaultSeconds+'): ' + txt);
  //console.log(speechSynthesis.getVoices());
  defaultSeconds *= 1000; //Turn into Milliseconds
  if (0 == actorVoice) {
    console.log("HAL silently waits for "+defaultSeconds+" ms");
    setTimeout(roboDoneTry, defaultSeconds);
    return; //0 is flag for silence
  }
  hal9000.text = txt;
  if (null != actorVoice) //None specified, use default
    hal9000.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == actorVoice; })[0];
//TODO: only let them set the voice once to avoid it using the wrong voice so much
  speechSynthesis.speak(hal9000);
};

/**
* While you can specify a voice on the fly, it seems to fail the first time.
* Use this function to give JS more of a heads up that you want a different voice
* @param actorVoice: optionally specify a voice JS understands
*/
function roboVoice(actorVoice) {
  if (null != actorVoice && 0 != actorVoice) {
    console.log("HAL's voice is now "+actorVoice);
    hal9000.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == actorVoice; })[0];
  }
}
