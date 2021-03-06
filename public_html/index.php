<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
?><!DOCTYPE html>
<html>
<head>
  <title>40 Bit Quiz</title>
  <link rel="stylesheet" type="text/css" href="style.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="js/roboSay.js"></script>
  <script src="js/quizzer.js"></script>
  <script src="js/gamepad.js"></script>
</head>
<body onload="checkWarnings()">
  <!-- Displays Control Form to setup the Quiz how you want -->
  <div id="controlPane" class="pane">
    <h3><span id='numPlayers'></span> <span id='numPlayersLabel'>Players</span> Detected</h3>
    (to add players, connect controllers, hit a button on each &amp; click the "Redetect Gamepads" button)
    <br/><br/>
    <?php echo getHtmlControls(); ?>
  </div>

  <!-- Displays the Quiz Questions & Proposed Answers -->
  <div id="quizPane" class="pane invisible">
    <div id="s0" class="invisible">
        <span id="s0Name"></span>: <span id="s0Score">0</span>
    </div>
    <div id="s1" class="invisible">
        <span id="s1Name"></span>: <span id="s1Score">0</span>
    </div>
    <div id="s2" class="invisible">
        <span id="s2Name"></span>: <span id="s2Score">0</span>
    </div>
    <div id="s3" class="invisible">
        <span id="s3Name"></span>: <span id="s3Score">0</span>
    </div>
    <div id="questionPane"></div>
    <div id="quizProgress"><div id="quizProgressBar"></div></div>
    <table id="answerTable" class="invisible">
      <tr>
        <td></td>
        <td id="a0" class="answer" colspan="5">Y</td>
        <td></td>
      <tr/><tr>
        <td id="a1" class="answer" colspan="3">X</td>
        <td id="timerWrap">
          <div id="timer"></div>
          <button id="nextBtn" class="submitButton invisible" onclick="$(this).addClass('invisible');questionAsk();" title="Or hit Spacebar or Start key">Next Question</button>
        </td>
        <td id="a2" class="answer" colspan="3">B</td>
      <tr/><tr>
        <td></td>
        <td id="a3" class="answer" colspan="5">A</td>
        <td></td>
      <tr/>
    </table>
  </div>

  <!-- Displays the Score graph at the end of the game -->
  <div id="scorePane" class="pane invisible">
    <h1 id="winner"></h1>

    <table id="scoreTable">
      <tr>
        <td id="graph0" class="invisible"><div id="bar0"></div></td>
        <td id="graph1" class="invisible"><div id="bar1"></div></td>
        <td id="graph2" class="invisible"><div id="bar2"></div></td>
        <td id="graph3" class="invisible"><div id="bar3"></div></td>
      </tr><tr>
        <td id="name0" class="invisible"></td>
        <td id="name1" class="invisible"></td>
        <td id="name2" class="invisible"></td>
        <td id="name3" class="invisible"></td>
      <tr/><tr>
        <td id="score0" class="invisible"></td>
        <td id="score1" class="invisible"></td>
        <td id="score2" class="invisible"></td>
        <td id="score3" class="invisible"></td>
      <tr/>
    </table>
  </div>

  <!-- This pane is not for display, but just holds the audio files for JS to trigger -->
  <div id="audioPane" class="invisible">
    Test WAV Files:
    <audio id="wav_buzz"><source src="wav/buzz.wav" type="audio/wav"></audio>
    <audio id="wav_right"><source src="wav/right.wav" type="audio/wav"></audio>
    <audio id="wav_wrong"><source src="wav/wrong.wav" type="audio/wav"></audio>
    <button onclick="wav('buzz')">Test Buzz</button>
    <button onclick="wav('right')">Test Right</button>
    <button onclick="wav('wrong')">Test Wrong</button>
    <br/><br/>
    Test Robot Voices:
    <button onclick="roboSay('Peter Piper Picked a Peck of Pickled Peppers')">Default Voice</button>
    <button onclick="roboSay('Am I a woman?', 'Google UK English Female')">F British</button>
    <button onclick="roboSay('Do I sound like a man?', 'Google UK English Male')">M British</button>
    <button onclick="roboSay('I am David', 'Microsoft David Desktop - English (United States)')">David</button>
    <button onclick="roboSay('Do I raise my voice at the end of a question?', 'Microsoft Zira Desktop - English (United States)')">Zira</button>
    <br/><br/>
  </div>

  <!-- Warning Pane displays errors like bad json in quiz files -->
  <div id="warning" class="invisible"></div>
</body>
</html>

<?php
/** For outputting the HTML Controls for the Quiz **/
function getHtmlControls() {
  $quiz = optify(getQuizzes());
  $turn = optify(getTurns());
  $voice= optify(getVoices());
  $type = '<option value="buzz" title="Buzz in first to get to answer, but wrong answers are worth negative points.">Buzz In</option>' ."\n".
    '<option value="pub" title="All teams answer all questions. Answers and scores revealed in waves.">Pub Quiz</option>' ."\n".
    '<option value="speed" title="All teams answer all questions, but extra points are awarded for faster answers. If you are too slow, you won\'t get to answer.">Speed Demon</option>' ."\n";

  $html = "
    <table id='controlTable'><thead>
      <tr><th colspan='2'>Quiz Settings</th><th colspan='2'>Player Names</th></tr>
    </thead><tbody>
      <tr>
        <td>Quiz:</td>
        <td><select id='quiz' title='Which quiz do you want to play?'>$quiz</select></td>
        <td><span id='pLabel0' class='invisible'>Player 1:</span></td>
        <td><input id='p0' value='Frosty' class='invisible' maxlength='12' /></td>
      </tr><tr>
        <td>Turns:</td>
        <td><select id='turns' title='How many rounds do you want to play?'>$turn</select></td>
        <td><span id='pLabel1' class='invisible'>Player 2:</span></td>
        <td><input id='p1' value='Klipper' class='invisible' maxlength='12' /></td>
      </tr><tr>
        <td>Style:</td>
        <td><select id='style'>$type</select></td>
        <td><span id='pLabel2' class='invisible'>Player 3:</span></td>
        <td><input id='p2' value='Cynic' class='invisible' maxlength='12' /></td>
      </tr><tr>
        <td>Host:</td>
        <td><select id='voice' onclick='roboVoice(this.value)' title='Who do you want to narrate the quiz?'>$voice</select></td>
        <td><span id='pLabel3' class='invisible'>Player 4:</span></td>
        <td><input id='p3' value='Guest' class='invisible' maxlength='12' /></td>
      </tr><tr>
        <td colspan='2'>
            <button onclick='quizFetch()' class='submitButton'>Start Quiz</button>
        </td>
        <td></td>
        <td>
            <button onclick='numGP = null; gpPoll();' class='submitButton'>Redetect Gamepads</button>
        </td>
      </tr>
    </tbody></table>
  ";
  return $html;
}

/** For <select> for Quiz names from ./data **/
function getQuizzes() {
  $dir = dirname(__FILE__).'/quiz_questions';
  $files = scandir($dir);
  $rtn = array();
  foreach ($files as $file) {
      if ('.json' == substr($file, -5)) {
        $json = file_get_contents("$dir/$file");
        $json = json_decode($json, true);
        //Invalid JSON
        if (null == $json) {
            echo "<span class='warning'><h3>$file</h3>Bad JSON. Paste to <a href='https://jsonlint.com/' target='_blank'>jsonlint</a> for specific error</span>";
            continue;
        }
        //Missing or Empty Questions Array
        if (!array_key_exists('questions', $json) || count($json['questions']) == 0) {
            echo "<span class='warning'><h3>$file</h3>Must specify a 'questions' array with at least 1 question</span>";
            continue;
        }
        //Questions must all have 5 elements (Question + 4 Answers)
        //AND exactly 1 should start with a * (flag for correct answer)
        $badQ = false;
        foreach ($json['questions'] as $q) {
            $badQ = false;
            if(count($q) < 5) { #Ensure 1 Q, and 4 Answers
                echo "<span class='warning'><h3>$file</h3>Question must have 1 Q &amp; 4 A's:<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",json_encode($q),"</span>";
                $badQ = true;
                continue;
            }
            $numRight = 0;
            for ($i=1; $i<=4; $i++) { #Ensure exactly 1 answer has an *
                $char1 = substr($q[$i],0,1);
                if ($char1 == '*')
                    $numRight++;
            }
            if (1 != $numRight) {
                echo "<span class='warning'><h3>$file</h3>Need exactly 1 right answer:<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",htmlentities(json_encode($q)),"<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Right answer must start with *)</span>";
                $badQ = true;
                continue;
            }
        }
        if ($badQ) //Skip to next Quiz, as this one had a bad question
            continue;
        $numQs = count($json['questions']);
        $k = $v = substr($file,0,-5); #Use File Name for Display Name
        if (array_key_exists('name', $json)) #Unless Json Name specified
            $v = $json['name'];
        $rtn[$k] = $v . " [$numQs Questions]"; #Key is File, Value is Name
      }
  }
  return $rtn;
}

/** For <select> for Num Turns **/
function getTurns() {
  return array(
    '11'=>'11 Rounds',
    '21'=>'21 Rounds',
    '31'=>'31 Rounds',
    '41'=>'41 Rounds',
    '51'=>'51 Rounds',
    '99999'=>'All Questions', #TODO: move to top as default
  );
}

/** For <select> for Robot Voices **/
function getVoices() {
  return array(
    '0'=>"I'll host it manually", #TODO: put at bottom?
    'Google UK English Female'=>'Abigail',
    'Google UK English Male'=>'Bartholomew',
    'Microsoft David Desktop - English (United States)'=>'David',
    'Microsoft Zira Desktop - English (United States)'=>'Zira',
  );
}

/** Turn an associative array into a bunch of <option>s **/
function optify($a) {
  $html = '';
  foreach ($a as $k=>$v)
    $html .= "<option value=\"$k\">$v</option>\n";
  return $html;
}
?>