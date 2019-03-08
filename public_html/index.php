<h2>Pushing 40-Bit Gaming</h2>
<h3>Ideas, images, mock-ups, etc...</h3>

<p>
   Shaun had the idea to do a podcast that is like a book club, but for single-player games (or at least games that have a single-player campaign).<br/>
   We'll play through the game over a set time period, meet, and talk about it.<br/>
   We'll say if we recommend the game, and for what audience.  We can also talk about glitches, hardware requirements, etc...<br/>
   We want to play a mix of old and new games or various genres to keep the content fresh.  While we'll want to pick some <a href="https://www.svg.com/118640/popular-game-released-year-born/" target="_blank">popular games</a> early on, we'll definitely want to throw in some more obscure games to carve out a niche of people that want to discover new games to play.<br/>
   We'll largely focus on PC games, as those are the most accessible for a modern audience.  It also allows us to try to do some affiliate links with gog.com.<br/>
   We'd like there to be some sort of voting element eventually to allow the community to pick the games.<br/>
   While we don't have a name, Rob thought of "pushing 40 bit" and that seemed to make us laugh, so it's a top contender.<br/>
</p>

<hr/>
<?php echo weirdLinks(); ?>
<hr/>

<h3>Image Mockup (no copied sprites, only in spirit):</h3>
<img src="img/pushing40.jpg" /><br/>



<?php
function weirdLinks() {
  $hrefs = array(
    "Rob's Games"=>'rob_games.php',
    'Facts About #40'=>'https://www.rd.com/culture/facts-about-number-40/',
  );
  $rtn = '<h3>Weird Links:</h3><ul>';
  foreach($hrefs as $name=>$href)
    $rtn .= "<li><a href='$href'>$name</a></li>\n";
  $rtn .= "</ul>\n";
  return $rtn;
}
?>