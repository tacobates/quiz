//TODO: adjust question font-size based on string length (so it doesn't grow too much)

//TODO: on score screen, don't do it by num questions, do it by top score as "100%" which is the max desired height, scale others accordingly.

//TODO: 3 players breaks player 2 input

//TODO: display total questions on score summary (maybe right, wrong, and timed out too down in a details pane???)
//TODO: timeout not always playing sound
//TODO: make pub/speed modes

var answerScreenTime = 4000; //TODO: set to 4000 (4 seconds to see the right answers)
var forward = true;
var ignoreCycles = 0; //How many cycles to ignore the button presses for
var ignoreLength = 5; //Standard num cycles to ignore (was 3)
var lockedPlayers = [true,true,true,true]; //Up to 4 players can be locked (then the timer is king)
var qBuzzCount = 0; //How many players have buzzed in so far for this question
var qData; //Holds the Quiz Data (Intro, Quips, Questions, Answers, etc...)
var qOrder; //Array to hold the order we will ask questions
var qA = 0; //Index for the correct answer for the current question
var qI = 0; //Index for qOrder
var qid; //The quiz id (like "test")
var qInterval; //Functions as the timer update & timeout for each question
var qNumPlayers = 0; //Will get updates after gamepad.js sees how many are connected
var qNumWrong = 0; //Checks if everyone has answered wrong so it can just move on
var qScores = [0,0,0,0]; //Hold scores for up to 4 players
var qStyle; //Type of Quiz ("buzz", "pub", or "speed")
var qTime; //How long each question gets
var qTimeLeft; //Counts down our time
var qTurns; //Number of turns for this quiz
var qVoice; //Holds the narrator voice choice
var who = -3; //Dont listen until quiz is loaded
//who values can be:
  //-3: dont listen to anything (transitioning question)
  //-2: listen to answers from all users.
  //-1: watch for buzz in.
  //0 or higher: watch for input from ONLY that player 


/** Listen for "Spacebar" key to trigger like nextBtn does **/
$(document).on('keyup', function(e) {
  var spacebar = 32; //key code for spacebar
  var tag = e.target.tagName.toLowerCase();
  if (tag == 'input' || tag == 'textarea')
    return; //Dont listen to input fields like player names
  if (e.which === spacebar) { //Can trigger next question
    if(qVoice == 0 && !$('#nextBtn').hasClass('invisible')) { //Only if Manual && nextBtn visible
      console.log('Spacebar says we are moving on!');
      $('#nextBtn').addClass('invisible'); //Flag to avoice double press of spacebar
      questionAsk();
    }
  }
});

/** Check for warnings to display **/
function checkWarnings() {
    var txt = '';
    $('.warning').each(function(){
        txt += '<div>' + this.innerHTML + '</div>';
    });
    if ('' != txt) {
        var prefix = '<div id="warnClose" onclick="warnClose()">&times;</div>';
        $('#warning').html(prefix + txt);
        $('#warning').removeClass('invisible');
    }
}
function warnClose() {
    $('#warning').addClass('invisible');
}

/** Start the Quiz with selected params **/
function quizFetch() {
  qid = document.getElementById('quiz').value;
  qTurns = document.getElementById('turns').value;
  qVoice = document.getElementById('voice').value;
  qStyle = document.getElementById('style').value;
  //For testing the Score Screen GUI
  var skipToScoreScreen = false; //only for testing
  if (skipToScoreScreen) {
    console.log('Skip to Final Score');
    qNumPlayers=4;
    qTurns=51;
    var temp = qTurns - 6;
    qScores = [25,temp,-1,12];
    gpActiveI = [true,true,true,true];
    $('#name0').html(document.getElementById('p0').value);
    $('#name1').html(document.getElementById('p1').value);
    $('#name2').html(document.getElementById('p2').value);
    $('#name3').html(document.getElementById('p3').value);
    scoreFinal();
    return; //Just for Testing Score Pane
  }
  quizGetQuestions(qid);
}
/** Get the JSON file for questions for this Quiz **/
function quizGetQuestions(id) {
  $.ajax({
    method:"POST",
    url:"quiz_questions/"+id+".json",
  }).done(function(data) {
    console.log('Fetched Quiz '+id);
    //qData = JSON.parse(data.responseText); //No need, .json pre-parses
    qData = data;
    //Decide the order to ask the questions in
    qOrder = [];
    for(var i=0; i < qData.questions.length; ++i)
      qOrder.push(i);
    if (!"order" in data || "random" == data.order)
      qOrder = shuffleArray(qOrder); //scramble question order
    qTime = 10; //10 seconds for answering after hal9000 took 5-ish seconds to ask the question
    if ("time" in data)
      qTime = data.time;
//qTime = 4; //TODO: deleteme. Shorter for testing

    //TODO: use qData.intro & qData.quips

    //Handle Too Few Questions Scenario (player selected large # of turns)
    if (qTurns > qOrder.length)
      qTurns = qOrder.length

    //Now that we have the data, start the quiz
    quizStart();
  });
}
/** Change the GUI, and begin questions & timers **/
function quizStart() {
  console.log("Started Quiz "+qid+"\n - "+qStyle+" mode\n -"+qTurns+" turns\n - Timeout "+qTime+" seconds\n - Host Voice "+qVoice);
  lockedPlayers = [true,true,true,true]; //Lock everyone until AFTER a question is asked
  //Set Player Names
  for(var i=0; i<qNumPlayers; ++i) {
    var pName = document.getElementById('p'+i).value;
    $('#name'+i).html(pName); //player names final scoreboard
    $('#s'+i+'Name').html(pName); //player names during quiz
    $('#s'+i).removeClass('invisible'); //make them visible
    //$('#corner'+i).removeClass('invisible'); //DEPRECATED
  }

  switchToPane('quizPane');

  //TODO: handle style "buzz" (answer driven... but also timer), "pub" (timer based), "speed" (REALLY timer based)
  questionAsk();
}


/** Displays a questions and begins controller listening for the answer **/
function questionAsk() {
  qBuzzCount = 0; //New Question, no one has buzzed in
  qNumWrong = 0; //New Question, no one has answered wrong
  //Remove Player Highlight from visualBuzzer
  $('body').removeClass('grad0 grad1 grad2 grad3');
  //Removed Locked Out & Buzzed In player styling
  $('.buzzedIn').removeClass('buzzedIn');
  $('.lockedOut').removeClass('lockedOut');

  if (qI >= qTurns) { //No more turns
    lockedPlayers = [true,true,true,true]; //No buzzing after game is over
    scoreFinal();
    return;
  } else if (qI == qTurns - 1) { //Last Turn
    $('#nextBtn').html('Show Scores'); //After last turn, it shouldnt prompt for "Next Question"
  }
  console.log("Question " + (qI + 1) + " of " + qTurns);

  //Reset Right/Wrong Answer GUI
  $('.answer', '#answerTable').removeClass('right wrong abstainRight abstainWrong');
  var q = qData.questions[qOrder[qI++]];
  qA = questionCorrectIndex(q); //Save the correct answer

  //Update Quiz Progress Bar
  var perc = Math.floor(100 * qI / qTurns); //Get percent done
  $('#quizProgressBar').css('width', perc+'%');

  //Hide the timer, & Populate Question/Answers (keep answers hidden though)
  $('#answerTable').addClass('invisible');
  $('#questionPane').html(q[0]);
  $('#a0').html(questionFormat(q[1]));
  $('#a1').html(questionFormat(q[2]));
  $('#a2').html(questionFormat(q[3]));
  $('#a3').html(questionFormat(q[4]));

  //Ask question, but wait to show answers and start timer
  roboSay(q[0], qVoice);
  //will trigger roboDone() when finished talking
}

/** Parses the Question Array to get the index of the right answer **/
function questionCorrectIndex(q) {
  var start = 1; //skip the question in index 0 (q.shift() alters orig array)
  for (var i=start; i<q.length; ++i)
    if ("*" == q[i].charAt(0)) //Correct answers flagged with a * at the start
      return i - start; //we want 0-based index, as if question was gone
}

/** Formats the question the way we want (and removes * at start of right answer) **/
function questionFormat(q) {
  if("*" == q.charAt(0))
    q = q.substr(1);
  //TODO: any other formatting we want?
  return q;
}

/** Waits a few seconds before asking the next question **/
async function questionSchedule() {
  if (qVoice == 0) { //Show Manual Next button where the timer is
    clearInterval(qInterval);
    $('#timerWrap').removeClass('flash'); //ensure flash is off
    $('#timer').addClass('invisible');
    $('#nextBtn').removeClass('invisible');
  } else { //Automatically do next Question in a few seconds
    await sleep(answerScreenTime); //Wait 4 seconds before moving to the next question
    questionAsk();
  }
}

/** Resets the time limit and the styling **/
function timerReset() {
  qTimeLeft = qTime;
  $('#timer').html = qTimeLeft;
  //Show the right elements
  if (qVoice == 0) { //Only on Manual hosting
    $('#nextBtn').addClass('invisible');
    $('#timer').removeClass('invisible');
  }
  $('#timerWrap').removeClass('flash');
  $('#timer').css({
    "width":"200px",
    "height":"200px",
    "line-height":"200px",
    "font-size":"500%"
  });
}
/** Animates the timer shrinking to 0px **/
function timerShrink() {
  $('#timer').animate({
    "width":"20px",
    "height":"20px",
    "line-height":"20px",
    "font-size":"90%"
  }, qTime*1000, function() {
     console.log('animation complete');
  });
}
/** Updates the Timer AND Force ends the question if no right answer came before then **/
function timerUpdate() {
  //console.log("Listening for: "+who);
  qTimeLeft -= 0.1; //Remove 1/10th of a second, as this runs every 100 ms
  var rTime = Math.ceil(qTimeLeft);
  $('#timer').html(rTime);
  var percent = qTimeLeft / qTime;

  //Time out, low time, or VERY low time
  var secondChance = false; //Assume time-out is final
  if (qTimeLeft <= 0) {
    qNumWrong++;
    //Everyone has timed out OR No one buzzed in since last timeout
    if(qNumWrong >= qNumPlayers || qNumWrong > qBuzzCount) {
      lockedPlayers = [true,true,true,true]; //Block all buzz-in or answers
//TODO: don't block all players in buzz mode.  Let others try to answer!
      qTimeLeft = qTime;
      //Show right answer, by highlighting wrong ones
      $('.answer', '#answerTable').addClass('abstainWrong');
      $('#a'+qA).removeClass('abstainWrong');
      $('#a'+qA).addClass('abstainRight');
    } else {
      secondChance = true;
    }
    $("#timerWrap").removeClass('flash'); //ensure it ends in an off state

    //Someone Buzzed in, so they lose points
    if (who >= 0) { //Not answering in pub/speed never loses points
      qScores[who]--;
      scoreShow();
      lockedPlayers[who] = true;
      $('#s'+who).removeClass('buzzedIn');
      $('#s'+who).addClass('lockedOut');
    }
    if (qStyle == 'buzz') { //No one answered in time
      wav('wrong');
    }

    if (secondChance) { //Reset the timer to let others try
      who = -2; //reset listen flag
      if (qStyle == 'buzz')
        who = -1;
      clearInterval(qInterval); //Stop counting down
      timerReset();
      $('body').removeClass('grad0 grad1 grad2 grad3'); //remove buzzed corner
      qInterval = setInterval(timerUpdate, 100); //Check every 10th of a second
      timerShrink();
    } else {
      clearInterval(qInterval);
      questionSchedule(); //Only rub there noses in it for a few seconds before moving on
    }
  } else if (qTimeLeft <= 1.5) { //Low Time (flash red background)
    $("#timerWrap").toggleClass('flash');
  }
}

/** Submit an Answer for this player **/
function answer(bNum, pNum) {
  if (lockedPlayers[pNum] == true) {
    console.log('Ignoring Locked Player '+pNum);
    return;
  }
  var diff = -1; //Assume it is buzz or speed mode
  who = -3; //wait for next question to reset the listen flag
  console.log('Player '+pNum+' Answered '+bNum);
  var wrong = true; //assume incorrect
  if (bNum == qA) { //Correct Answer
    wrong = false; //Not Incorrect
    console.log('Correct');
    clearInterval(qInterval);
    $("#timer").stop(); //halt shrinking animation
    diff = 1;
    $('.answer', '#answerTable').addClass('wrong');
    $('#a'+qA).removeClass('wrong');
    $('#a'+qA).addClass('right');
    $('#timerWrap').removeClass('flash'); //ensure it halts in an off state
    //Incorrect Sound Effects
    if (qStyle == 'buzz') //only in buzz mode
      wav('right');
    //TODO: trigger host congratulating contestants

    questionSchedule();
  } else {
    console.log('WRONG');
    who = -2; //reset listen flag
    if (qStyle == 'buzz')
      who = -1;

    qNumWrong++;
    $('#a'+bNum).addClass('wrong');
    //Remove Player Highlight from visualBuzzer
    $('body').removeClass('grad0 grad1 grad2 grad3');

    //Incorrect Sound Effects
    if (qStyle == 'buzz') //only in buzz mode
      wav('wrong');
    //TODO: trigger host insulting the contestants

    if (qStyle == 'pub')
      diff = 0; //No negative punishment for wrong answers in pub mode
    lockedPlayers[pNum] = true;
    $('#s'+pNum).removeClass('buzzedIn');
    $('#s'+pNum).addClass('lockedOut');
    console.log('Locked Array: '+lockedPlayers.join(', '));
  }

  //Update the Scores
  qScores[pNum] += diff; //TODO: could be more than one player who answers correctly in other game modes?
  scoreShow();

  //If everyone has answered wrong, just move on.
  if (qNumWrong >= qNumPlayers) {
    clearInterval(qInterval); //Pause Timer
    $("#timer").stop(); //stop timer shrinking animation
    $('#timerWrap').removeClass('flash'); //ensure flash is off

    //Show right answer, by highlighting wrong ones
    $('.answer', '#answerTable').addClass('wrong');
    $('#a'+qA).removeClass('wrong');

    questionSchedule(); //Only rub there noses in it for a few seconds before moving on
  } else if(wrong && qStyle == 'buzz') { //In buzz mode, timer resets for others
    //Reset the timer to let others try
    clearInterval(qInterval); //Stop counting down
    $('#timer').stop(); //Halt Animation
    timerReset();
    qInterval = setInterval(timerUpdate, 100); //Check every 10th of a second
    timerShrink();
  }
}
/** Checks if the selected user has answered **/
function answerCheck(buttons, pNum) { //buttons is only from player "who"
  if(Object.keys(buttons).length == 0)
    return; //No answer pressed
  //We only care about these buttons
  var mapped = ["b3","b2","b1","b0"]; //Orders Bnums to Y, X, B, A (GUI Order)
  for(var i=0; i < mapped.length; ++i) {
    if(mapped[i] in buttons) {
      answer(i, pNum);
      return; //Only accept the first button we see
    }
  }
}


/** Buzz in for this numbered user **/
function buzz(pNum) {
  if (lockedPlayers[pNum] == true) {
    console.log("Ignoring Buzz Attempt for Locked Player "+pNum);
    return; //Ignore this buzz in. They are locked.
  }
  wav('buzz'); //used to be sound('buzzer');
  qTimeLeft += 1; //Give them an extra second, in case they buzzed right before time ran out
  $('#timerWrap').removeClass('flash'); //Remove the flasher, in case this puts them back over that limit
  qBuzzCount++;
  ignoreCycles = ignoreLength; //Allow for 5 cycles after a buzz to not accidentally insta-press an answer
  who = pNum; //Now we are ONLY listening for their answer
  $('#s'+pNum).addClass('buzzedIn');
  visualBuzzer();
  console.log('Player '+pNum+' Buzzed In.');
}
/** Checks if someone has buzzed in **/
function buzzCheck(a) {
  //Allow Buzz In with all 4 buttons A,B,X,Y
  if (forward) {
    for(var i=0; i < a.length; ++i) {
      if ("b0" in a[i] || "b1" in a[i] || "b2" in a[i] || "b3" in a[i])
        buzz(i); //Buzz in for this player
        return; //Prevent 2nd buzz-in
    }
  } else {
    for(var i=a.length - 1; i >= 0; --i) {
      if ("b0" in a[i] || "b1" in a[i] || "b2" in a[i] || "b3" in a[i])
        buzz(i); //Buzz in for this player
        return; //Prevent 2nd buzz-in
    }
  }
}

/** Called by roboSay.js when it is done talking **/
function roboDone() {
  //Show Answers
  $('#answerTable').removeClass('invisible');

  //Reset Timer & Start it
  timerReset();
  qInterval = setInterval(timerUpdate, 100); //Check every 10th of a second
  timerShrink();

  //Wait to unlock & listen until hal9000 done talking
  lockedPlayers = [false,false,false,false]; //Everyone unlocked for each question
  if ('buzz' == qStyle)
    who = -1; //Listen for buzz in "buzz" mode
  else
    who = -2; //Listen to everyon in speed/pub mode
}

/** Shows the Final Score Screen when Quiz is Complete **/
function scoreFinal() {
  //Populate the Score Table (Scores, Graphs, and Names)
  var scaler = getScaler();
  var winners = [];
  var max = 0;
  var maxHeight = 350; //Winner's barchart should be 350px tall

  for(var i=0; i < qNumPlayers; ++i) {
    //Calculate Winners
    if (winners.length == 0 || qScores[winners[0]] == qScores[i]) {
      console.log('Adding Score Leader '+i);
      winners.push(i); //Add first winner, or tied winners
    } else if (qScores[winners[0]] < qScores[i]) {
      console.log('Overwriting Score Leader '+i);
      winners = [i]; //Wipe out any previous players tied for the lead
    }

    //Display Name/Score
    $('#score'+i).html(qScores[i] + ' pts'); //player scores
    if (qScores[i] <= 0)
      $('#score'+i).addClass('negative');
  }

  //Handle 0 or negative as max score
  max = qScores[winners[0]];
  if(max < 1)
    max = 1; //Avoid divide by 0

  for(var i=0; i < qNumPlayers; ++i) {
    //Make Bar Chart
    var h = 0;
    if (qScores[i] > 0) //No negative bar chart
        h = Math.floor(maxHeight * qScores[i] / max); //Round down
    $('#bar'+i).css('height', h+'px'); //Makes the bar chart taller

    //if (gpActiveI[i]) { //This player touched a button, so show their score
      $('#graph'+i).removeClass('invisible');
      $('#name'+i).removeClass('invisible');
      $('#score'+i).removeClass('invisible');
    //} //Show all- not touching a button is still grounds for shame
  }

  //Display Winner
  if (winners.length == 1) { //Clear Winner
    var name = document.getElementById('p'+winners[0]).value;
    $('#winner').html(name + ' wins!!!');
  } else { //Tie
    $('#winner').html("It's a tie!");
  }
  for (var i=0; i<winners.length; ++i)
    $('#winner'+winners[i]).removeClass('invisible');

  switchToPane('scorePane');
}
/** Shows the Scores in the GUI **/
function scoreShow() {
  console.log('Scores: ', qScores.join(', '));
  for (var i=0; i<qScores.length; ++i) {
    var scoreDiv = document.getElementById('s' + i + 'Score');
    scoreDiv.innerHTML = qScores[i];
  }  
  /*** DEPRECATED ***
  //Resize Corners based on Score
  var min = 2; //2 Pixel Min, as well as granularity
  if (qTurns < 25)
    min = 4; //Make it bigger for short quizzes
  for (var i=0; i<qScores.length; ++i) {
    var px = (qScores[i] + 1) * min; //+1 because 0 should mean starting pox (which is 2px)
    if (px < min)
      px = min;
    $('#corner'+i).css({"height":px, "width":px});
  }
  *** END DEPRECATED ***/
}

/** Shuffles an array & returns the newly shuffled array **/
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Used by Async Functions to sleep for a number of milliseconds **/
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Hides all panes except the provided id **/
function switchToPane(id) {
  console.log('Switching to Pane '+id);
  $('.pane').addClass('invisible');
  $('#'+id).removeClass('invisible');
}

/** Gets the scaler for the bar chart based on number of turns **/
function getScaler() {
  var rtn = 25;
  if      (qTurns > 100) rtn = 1;
  else if (qTurns > 80)  rtn = 2;
  else if (qTurns > 70)  rtn = 3;
  else if (qTurns > 60)  rtn = 4;
  else if (qTurns > 50)  rtn = 5;
  else if (qTurns > 40)  rtn = 6;
  else if (qTurns > 30)  rtn = 8;
  else if (qTurns > 20)  rtn = 12;
  return rtn;
}

/** Creates a visual flash that serves as a buzzer indication **/
function visualBuzzer() {
  if (who < 0)
    return; //No player buzzed in
  $('body').addClass('grad'+who);
}

/** Plays WAV files we have embedded with <audio id="wav_something"> **/
function wav(suffix) {
  var w = document.getElementById('wav_'+suffix);
  if (null == w)
    console.log("ERROR: Missing Audio wav_" + suffix);
  else
    w.play();
}
//TODO: delete sound function, after we move to wav
/** Makes some simple Beeps and Boops **/
function sound(name) {
  var duration = 80; //in milliseconds
  var sounds = {
    'buzzer':[-16, 'sawtooth'], //sine, square, sawtooth, triangle
  };
  if (name in sounds) {
    var ctx = new AudioContext();
    var osc = ctx.createOscillator();
    //var gain = ctx.createGain(); //volume control
    osc.connect(ctx.destination); //connect to speakers
    osc.type = sounds[name][1];
    //Calculate note frequency
    var note = sounds[name][0]; //0 seems to be middle of the piano range. can go +/- 25ish
    var freq = Math.pow(2, note/12) * 440;
    //Optional Duration
    if (sounds[name].length > 2)
      duration = sounds[name][2];
    duration /= 1000; //Turn Milliseconds into Seconds
    //console.log('Play: '+ note +' ('+freq+' Hz) ['+duration+' secs]');
    osc.frequency.value = freq;
    osc.start();
    osc.stop(duration);
  }
}

///////////////////// REQUIRED FUNCS for gamepad.js /////////////////////
/**
* Called by gamepad.js with each input press.
* @param a: 2D array like [[GP1 Buttons Currently ON],[Same for GP2],[GP3],[etc]]
**/
function gpInput(a) {
  //Ignores a few cycles, to avoid double pressings (i.e. buzz + insta-answer)
  if (ignoreCycles > 0) {
    ignoreCycles--;
    return;
  }

  //Check if they are triggering the next question
  if (qVoice == 0 && !$('#nextBtn').hasClass('invisible')) { //Only in Manual && nextBtn visible
    //b9 is the start key. Check for that to move on
    for (var i=0; i<a.length; ++i) {
      if ("b9" in a[i]) { //Just check a[0] if you only want player 1 to press it
        console.log('Start key means we are moving on!');
        ignoreCycles = ignoreLength;
        $('#nextBtn').addClass('invisible'); //Hiding this is an additional flag not to double count the start key
        questionAsk();
      }
    }
  }

  forward = !forward; //Alternate parsing gamepads forward or backward to even out buzzer-ties
  //Parse input based on the mode in "who"
  if(-2 == who) { //Accept Everyones Answers
    //TODO: how to take only their first answer??? and show a "locked in" indication
  } else if(-1 == who) { //Watching for Buzz In
    buzzCheck(a);
  } else if(who >= 0){ //Only listen to input from this numbered GP
    answerCheck(a[who], who);
  }
  //for(var i=0; i < a.length; ++i) console.log(a[i]);
}
/**
* Receives Number of connected Gamepads from gamepad.js
* You can check the variable numGP live, if you are worried about change
**/
function gpNum(n) {
  console.log(n + ' connected gamepads');
  document.getElementById('numPlayers').innerHTML = n;
  if (n == 1) //Show the singular "Player" not "Players"
    document.getElementById('numPlayersLabel').innerHTML = "Player";
  qNumPlayers = n;
  //Make those player name fields visible
  for (var i=0; i<n; ++i) {
    $('#p'+i).removeClass('invisible');
    $('#pLabel'+i).removeClass('invisible');
  }
}
/** Receives any fatal error from gamepad.js **/
function gpError(msg) {
  alert('Fatal Error: ' + msg); //TODO: display more elegantly
}