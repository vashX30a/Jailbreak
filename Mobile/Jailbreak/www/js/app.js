(function ($) {

var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');

var stop;
var player, score;
var distance = {};
var police = {};
var pmen = [];
var psize = 3, pdistance;
var mediaStatus;

var W = canvas.width;
var H = canvas.height;
var gameWidth = 225;
var gameHeight = 850;
var my_media = null;
var mediaTimer = null;
// localStorage pairings
if (!window.localStorage.hiScore){
  window.localStorage.hiScore = 0;
}
if (!window.localStorage.music){
  window.localStorage.music = "true";
}
if (!window.localStorage.sfx){
  window.localStorage.sfx = "true";
}
if (!window.localStorage.accel){
  window.localStorage.accel = 5;
}

// High Score Variables
var highScore = window.localStorage.hiScore;
// Settings vars
var musicSwitch = window.localStorage.music;
var sfxSwitch = window.localStorage.sfx;
var accelSlider = window.localStorage.accel;

var watchMove = null;
var retAcceleration = {};
//window.localStorage.clear();


/**
 * Get a random number between range
 * @param {integer}
 * @param {integer}
 */
function rand(low, high) {
  return Math.floor( Math.random() * (high - low + 1) + low );
}

/**
 * Bound a number between range
 * @param {integer} num - Number to bound
 * @param {integer}
 * @param {integer}
 */
function bound(num, low, high) {
  return Math.max( Math.min(num, high), low);
}

   /**
   * Asset pre-loader object. Loads all images
   */
var assetLoader = (function() {
  // images dictionary
  this.imgs        = {
    'wallsbg'       : 'img/wallsbg.png',
    'wallsimg'      : 'img/JBGameEWalls.png',
    'prisoner'      : 'img/spritecharacter2.png',
    'police'        : 'img/spritepolice.png'
  };

  // sounds dictionary
  this.sounds      = {
    'bg'            : 'sounds/bg.mp3',
    'jump'          : 'sounds/jump.mp3',
    'gameOver'      : 'sounds/gameOver.mp3'
  };

  var assetsLoaded = 0;                                // how many assets have been loaded
  var numImgs      = Object.keys(this.imgs).length;    // total number of image assets
  var numSounds    = Object.keys(this.sounds).length;  // total number of sound assets
  this.totalAssest = numImgs;                          // total number of assets

  /**
   * Ensure all assets are loaded before using them
   * @param {number} dic  - Dictionary name ('imgs', 'sounds', 'fonts')
   * @param {number} name - Asset name in the dictionary
   */
  function assetLoaded(dic, name) {
    // don't count assets that have already loaded
    if (this[dic][name].status !== 'loading') {
      return;
    }

    this[dic][name].status = 'loaded';
    assetsLoaded++;

    // progress callback
    if (typeof this.progress === 'function') {
      this.progress(assetsLoaded, this.totalAssest);
    }

    // finished callback
    if (assetsLoaded === this.totalAssest && typeof this.finished === 'function') {
      this.finished();
    }
  }

  /**
   * Check the ready state of an Audio file.
   * @param {object} sound - Name of the audio asset that was loaded.
   */
  function _checkAudioState(sound) {
    if (this.sounds[sound].status === 'loading' && this.sounds[sound].readyState === 4) {
      assetLoaded.call(this, 'sounds', sound);
    }
  }

  /**
   * Create assets, set callback for asset loading, set asset source
   */
  this.downloadAll = function() {
    var _this = this;
    var src;

    // load images
    for (var img in this.imgs) {
      if (this.imgs.hasOwnProperty(img)) {
        src = this.imgs[img];

        // create a closure for event binding
        (function(_this, img) {
          _this.imgs[img] = new Image();
          _this.imgs[img].status = 'loading';
          _this.imgs[img].name = img;
          _this.imgs[img].onload = function() { assetLoaded.call(_this, 'imgs', img) };
          _this.imgs[img].src = src;
        })(_this, img);
      }
    }

    // load sounds
    for (var sound in this.sounds) {
      if (this.sounds.hasOwnProperty(sound)) {
        src = this.sounds[sound];

        // create a closure for event binding
        (function(_this, sound) {
          _this.sounds[sound] = new Audio();
          _this.sounds[sound].status = 'loading';
          _this.sounds[sound].name = sound;
          _this.sounds[sound].addEventListener('canplay', function() {
            _checkAudioState.call(_this, sound);
          });
          _this.sounds[sound].src = src;
          _this.sounds[sound].preload = 'auto';
          _this.sounds[sound].load();
        })(_this, sound);
      }
    }
  }

  return {
    imgs: this.imgs,
    sounds: this.sounds,
    totalAssest: this.totalAssest,
    downloadAll: this.downloadAll
  };
})();

/**
 * Show asset loading progress
 * @param {integer} progress - Number of assets loaded
 * @param {integer} total - Total number of assets
 */
assetLoader.progress = function(progress, total) {
  var pBar = document.getElementById('progress-bar');
  pBar.value = progress / total;
  document.getElementById('p').innerHTML = Math.round(pBar.value * 100) + "%";
}

/**
 * Load the main menu
 */
assetLoader.finished = function() {
  mainMenu();
}

/*************************************************************************************/
 // rAF
  window.requestAnimationFrame = function() {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    function(f) {
      window.setTimeout(f,1e3/60);
    }
  }();


/**
 * A vector for 2d space.
 * @param {integer} x - Center x coordinate.
 * @param {integer} y - Center y coordinate.
 * @param {integer} dx - Change in x.
 * @param {integer} dy - Change in y.
 */
function Vector(x, y, dx, dy) {
  // position
  this.x = x || 0;
  this.y = y || 0;
  // direction
  this.dx = dx || 0;
  this.dy = dy || 0;
}

/**
 * Advance the vectors position by dx,dy
 */
Vector.prototype.advance = function() {
  this.x += this.dx;
  this.y += this.dy;
};

/**
 * Creates a Spritesheet
 * @param {string} - Path to the image.
 * @param {number} - Width (in px) of each frame.
 * @param {number} - Height (in px) of each frame.
 */
function SpriteSheet(path, frameWidth, frameHeight) {
  this.image = new Image();
  this.frameWidth = frameWidth;
  this.frameHeight = frameHeight;

  // calculate the number of frames in a row after the image loads
  var self = this;
  this.image.onload = function() {
    self.framesPerRow = Math.floor(self.image.width / self.frameWidth);
  };

  this.image.src = path;
}

/**
 * Creates an animation from a spritesheet.
 * @param {SpriteSheet} - The spritesheet used to create the animation.
 * @param {number}      - Number of frames to wait for before transitioning the animation.
 * @param {array}       - Range or sequence of frame numbers for the animation.
 * @param {boolean}     - Repeat the animation once completed.
 */
function Animation(spritesheet, frameSpeed, startFrame, endFrame) {

  var animationSequence = [];  // array holding the order of the animation
  var currentFrame = 0;        // the current frame to draw
  var counter = 0;             // keep track of frame rate

  // start and end range for frames
  for (var frameNumber = startFrame; frameNumber <= endFrame; frameNumber++)
    animationSequence.push(frameNumber);

  /**
   * Update the animation
   */
  this.update = function() {

    // update to the next frame if it is time
    if (counter == (frameSpeed - 1))
      currentFrame = (currentFrame + 1) % animationSequence.length;

    // update the counter
    counter = (counter + 1) % frameSpeed;
  };

  /**
   * Draw the current frame
   * @param {integer} x - X position to draw
   * @param {integer} y - Y position to draw
   */
  this.draw = function(x, y) {
    // get the row and col of the frame
    var row = Math.floor(animationSequence[currentFrame] / spritesheet.framesPerRow);
    var col = Math.floor(animationSequence[currentFrame] % spritesheet.framesPerRow);

    ctx.drawImage(
      spritesheet.image,
      col * spritesheet.frameWidth, row * spritesheet.frameHeight,
      spritesheet.frameWidth, spritesheet.frameHeight,
      x, y,
      spritesheet.frameWidth, spritesheet.frameHeight);
  };
}

/**
 * Get the minimum distance between two vectors
 * @param {Vector}
 * @return minDist
 */
Vector.prototype.minDist = function(vec) {
  var minDist = Infinity;
  var max     = Math.max( Math.abs(this.dx), Math.abs(this.dy),
                          Math.abs(vec.dx ), Math.abs(vec.dy ) );
  var slice   = 1 / max;

  var x, y, distSquared;

  // get the middle of each vector
  var vec1 = {}, vec2 = {};
  vec1.x = this.x + this.width/2;
  vec1.y = this.y + this.height/2;
  vec2.x = vec.x + vec.width/2;
  vec2.y = vec.y + vec.height/2;
  for (var percent = 0; percent < 1; percent += slice) {
    x = (vec1.x + this.dx * percent) - (vec2.x + vec.dx * percent);
    y = (vec1.y + this.dy * percent) - (vec2.y + vec.dy * percent);
    distSquared = x * x + y * y;

    minDist = Math.min(minDist, distSquared);
  }

  return Math.sqrt(minDist);
};

/**********************************************************************************************
/**
 * Create a parallax background
 */
var background = (function() {
  var walls = {};
  //var wires = {};

  /*
   * Draw the backgrounds to the screen at different speeds
   */
  this.draw = function() {
    ctx.drawImage(assetLoader.imgs.wallsbg, 0, 0);

    walls.y +=  walls.speed;   
    //wires.y +=  wires.speed;   
    
    ctx.drawImage(assetLoader.imgs.wallsimg, 0, walls.y);
    ctx.drawImage(assetLoader.imgs.wallsimg, 0, walls.y - H);

    if (walls.y - H >= 0) {
        walls.y = 0;
    }
      
  };

  /**
   * Reset background to zero
   */
  this.reset = function()  {
    walls.y = 0;
    walls.speed = 4;
  }

  return {
    draw: this.draw,
    reset: this.reset
  };
})();

/**
 * The player object
 */
var player = (function(player) {
  // add properties directly to the player imported object
  player.width     = 100;
  player.height    = 92;
  player.speed     = 4;
  // spritesheets
  player.sheet     = new SpriteSheet(assetLoader.imgs.prisoner, player.width, player.height);
  player.walkAnim  = new Animation(player.sheet, 8, 0, 2);
  player.anim      = player.walkAnim;

  Vector.call(player, 0, 0, 0, player.dy);

  /**
   * Update the player's position and animation
   */
  player.update = function() {
    player.anim.update();
  };

  /**
   * Draw the player at it's current position
   */
  player.draw = function() {
    //player.y -=  player.speed;
    player.pos = player.x;
    if(retAcceleration.x > 0 ){
      player.x -= player.speed;
    }else if(retAcceleration.x < 0){
      player.x += player.speed;
    }
    if(player.x < 70 || player.x > 310){
      player.x = player.pos;
    }
    player.anim.draw(player.x, player.y);

    //if (player.y + H <= 0) {
    //    player.y = 700;
    //}
  };

  /**
   * Reset the player's position
   */
  player.reset = function() {
    player.x = 185;
    player.y = 700;
    player.pos = player.x;
  };

  return player;
})(Object.create(Vector.prototype));

/* The police object
 */
function PoliceMen (police) {
  // add properties directly to the player imported object
  this.width = police.width;
  this.height = police.height;
  this.speed = police.speed;
  this.x = police.x;
  this.y = police.y;

  // spritesheets
  this.sheet = police.sheet;     //= new SpriteSheet(assetLoader.imgs.police, police.width, police.height);
  this.walkAnim  = new Animation(this.sheet, 12, 0, 2);
  this.anim      = this.walkAnim;

  /**
   * Update the player's position and animation
   */
  this.update = function() {
    this.anim.update();
  };

  /**
   * Draw the player at it's current position
   */
  this.draw = function() {
    this.y +=  this.speed;     
    this.anim.draw(this.x, this.y);
  };

  /*this.init = function() {
    police.x = Math.floor((Math.random() * 305) + 1);
    police.y = 0;
  }*/

}

PoliceMen.prototype = Object.create(Vector.prototype)


/**
 * Update the player position and draw
 */
function updatePlayer() { 
  player.update();
  player.draw();

}

/**
 * Update the police position and draw
 */
function updatePolice() {
  if(score/20 % 20 == 0 && score/20 > 30){
    police.speed+=0.3;
  }
  for (var i = 0; i < pmen.length; i++) {
      pmen[i].update();
      pmen[i].draw();
  
    distance.x = (player.x+player.width/2) -(pmen[i].x+police.width/2);
    distance.y = player.y - pmen[i].y;
    if((distance.x > -95 && distance.x < 0) | (distance.x > 0&& distance.x < 90)){
      if((distance.x > -95 && distance.x < -80) && (distance.y > -70 && distance.y < 20) && (player.y > pmen[i].y)){
        gameOver();
      }
      if((distance.x < 90 && distance.x > 80) && (distance.y > -70 && distance.y < 25) && (player.y > pmen[i].y)){
        gameOver();
      }
      if((distance.x < 0 && distance.x > -80) | (distance.x > 0 && distance.x < 80) && (distance.y > -75 && distance.y < 65) && ((player.y + player.height - 10) > pmen[i].y - 10)){
        gameOver();
      }
    }
  }

    // remove enemies that have gone off screen
  if (pmen[0] && pmen[0].y > gameHeight) {
    pmen.splice(0, 1);
  }
}


function spawnPoliceSprites() {
  score++;
  var valX = rand(80,305);
  police.x = valX;
  if(score/20 > 50 && score/20 % 20 == 0){
    if(psize >= 5){
      psize = 3;
    }else{
      psize+=1;
    }
  }
  police.y = rand(-80,-500);

  if(score > 10 && Math.random() < 0.96 && pmen.length < psize && (pmen.length ? H - pmen[pmen.length-1].y >= score/20 && police.speed > 3.5 && pmen[pmen.length-1].y > pdistance: true)){
    pmen.push(new PoliceMen(police));
  }
  
}
/*************************************************************************************/
/**
 * Game loop
 */

function gameLoop() {

  if (!stop) {
    window.requestAnimationFrame(gameLoop);
    
    ctx.clearRect(0, 0, W, H);
    background.draw();

    //draw the score
    ctx.font = "18pt Calibri";
    ctx.fillStyle = 'white';
    ctx.fillText('SCORE: ' + parseInt(score/20) + ' m', canvas.width - 250, 70);
    ctx.fillText('HIGH SCORE: ' + highScore + ' m', canvas.width - 250, 40);

    spawnPoliceSprites();
    updatePolice();
    updatePlayer();


  };

}


function startGame() {
  pmen = [];
  police.width = 112;
  police.height = 95;
  police.speed = 3;
  police.y = -100;
  police.sheet = new SpriteSheet('img/spritepolice.png', 112, 95);
  pdistance = police.height;
  stop = false;
  score = 0;

  background.reset();
  player.reset();
  //police.init();
  gameLoop();

}  

/**
 * End the game and restart
 */
function gameOver() {
  stop = true;
  pauseAudio();
  $('#go-container').show();
  storeHighScore(score);
  //$('#score').html(score);
}

  /**********************************************/

  /*
     * Show the main menu after loading all assets
     */
  function gameInit(){
    musicSwitch = document.getElementById("music-switch").checked;
    sfxSwitch = document.getElementById("sounds-switch").checked;
    accelSlider = document.getElementById("sensitivity").value - 5;
    startGame();
    startAccel();
    playMusic();  
  }

  // Accelerometer functions
  function startAccel(){
    var options = { frequency: 300 };
    watchMove = navigator.accelerometer.watchAcceleration(onSuccess, onError, options); 
  }

  function onSuccess(acceleration) {
     //alert('onSuccess! ' + acceleration.x);
     //accelSlider = document.getElementById("sensitivity").value - 5;
     retAcceleration.x = acceleration.x + accelSlider;
     retAcceleration.y = acceleration.y + accelSlider;
     retAcceleration.z = acceleration.z + accelSlider;
    //alert(retAcceleration.x + " " + retAcceleration.y + " " + retAcceleration.z);

  }
  // onError: Failed to get the acceleration
  function onError() {
     alert('onErrorAccel!');
  }

//Background music
function playMusic(){
  if(musicSwitch == true){
    playAudio("/android_asset/www/sounds/bg.mp3");
  }
}

function playAudio(src) {
    var loop = function(status){
      mediaStatus = status;
      if(status === Media.MEDIA_STOPPED){
        my_media.play();
      }
    };
    // Create Media object from src
    my_media = new Media(src, onSuccessAudio, onErrorAudio, loop);
    // Play audio
    my_media.play();
    // Update my_media position every second
    if (mediaTimer == null) {
        mediaTimer = setInterval(function() {
            // get my_media position
            my_media.getCurrentPosition(
                // success callback
                function(position) {
                    if (position > -1) {
                        setAudioPosition((position) + " sec");
                    }
                },
                // error callback
                function(e) {
                    console.log("Error getting pos=" + e);
                    setAudioPosition("Error: " + e);
                }
            );
        }, 1000);
    } 
}

function playAudioNoLoop(src) {
    // Create Media object from src
    var stat = function(status){
      mediaStatus = status
    };
    my_media = new Media(src, onSuccessAudio, onErrorAudio, stat);
    // Play audio
    my_media.play();
    // Update my_media position every second
    if (mediaTimer == null) {
        mediaTimer = setInterval(function() {
            // get my_media position
            my_media.getCurrentPosition(
                // success callback
                function(position) {
                    if (position > -1) {
                        setAudioPosition((position) + " sec");
                    }
                },
                // error callback
                function(e) {
                    console.log("Error getting pos=" + e);
                    setAudioPosition("Error: " + e);
                }
            );
        }, 1000);
    }
}
// Pause audio
function pauseAudio() {
  if(musicSwitch == true){
    if (my_media) {
      if(mediaStatus === Media.MEDIA_RUNNING){
          my_media.pause();
        }
    }
  }
}

// Stop audio

function stopAudio() {
  if(musicSwitch == true){
    if (my_media) {
        if(mediaStatus === Media.MEDIA_RUNNING){
          my_media.stop();
        }
    }
    clearInterval(mediaTimer);
    mediaTimer = null;
  }
}

function releaseAudio(){
  if(my_media != null) { 
    my_media.release(); 
    my_media = null; 
  }
}

function onSuccessAudio() {
  console.log("playAudio():Audio Success");
}

// onError: Failed to get the audio
function onErrorAudio() {
  alert('audio error!');
}

// Storing High Score
function storeHighScore(newScore){
  var score = parseInt(newScore/20);
  if(highScore < score){
    $('#highscore').show();
    highScore = score;
    window.localStorage.hiScore = highScore;
    if(sfxSwitch == true){
      playAudioNoLoop("/android_asset/www/sounds/NewHighScore.mp3");
    }
  }
  else{
    if(sfxSwitch == true){
      playAudioNoLoop("/android_asset/www/sounds/gameOver.mp3");
    }
  }
}

// Getting settings values
function initOptions(){
  document.getElementById("music-switch").checked = musicSwitch == "true";
  document.getElementById("sounds-switch").checked = sfxSwitch == "true";
  document.getElementById("sensitivity").value = accelSlider;
}

function saveSettings(){
  musicSwitch = document.getElementById("music-switch").checked;
  sfxSwitch = document.getElementById("sounds-switch").checked;
  accelSlider = document.getElementById("sensitivity").value;
  window.localStorage.music = musicSwitch;
  window.localStorage.sfx = sfxSwitch;
  window.localStorage.accel = accelSlider;
}

function quitApp(){
  navigator.app.exitApp();
}

function pauseOnSuspend(){
  pauseAudio();
  stop = true;
  if($('#menu').is(':hidden')){
    $('#container').show();
  }
}

  function mainMenu() {
    initOptions();
    document.addEventListener("pause", pauseOnSuspend, false);
    $('#progress').hide();
    $('#main').show();
    $('#menu').addClass('main');
    $('#highscore').hide();
  }

  /**
   * Click handlers for the different menu screens
   */
  $('.play').click(function() {
    $('#menu').hide();
    $('#pause').show();
    $('#canvas').show();
    gameInit();
  });

  $('.exit').click(function() {
    releaseAudio();
    quitApp();  
  });
  

  $('#pause').click(function() {
    pauseAudio();
    var $this = $(this);
    stop = true;

    if ($this.hasClass('pause-off')) {
      $('#container').show();
    } 
  });

  $('.resume').click(function() {
    playMusic();
    stop = false;
    gameLoop();
    $('#container').hide();
  });

  $('.quit').click(function() {
    stopAudio();
    $('#container').hide();
    $('#go-container').hide();
    $('#highscore').hide();
    $('#pause').hide();
    stop = false;
    $('#canvas').hide();
    $('#menu').show();
  });

  $('.restart').click(function() {
    stopAudio();
    $('#go-container').hide();
    $('#highscore').hide();
    gameInit();
  });

  $('.option').click(function() {
    $('#main').hide();
    $('#options-container').show('slow');
    $('#menu').addClass('options stretchRight');
  });

  $('.help').click(function() {
    $('#main').hide();
    $('#help-container').show('slow');
    $('#menu').addClass('help stretchRight');
  });

  $('.back').click(function() {
    saveSettings();
    $('#options-container, #help-container').hide();
    $('#main').show();
    $('#menu').removeClass('options help stretchRight');
  });

assetLoader.downloadAll();
})(jQuery);