(function ($) {

var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');

var stop;
var player, score;
var police = {width: 112, height: 95, speed: 4, sheet: new SpriteSheet('img/spritepolice.png', 112, 95)};
var pmen = [];
var W = canvas.width;
var H = canvas.height;
var gameWidth = 225;
var gameHeight = 850;

var watchID;
var retAcceleration = {};
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
  player.speed     = 0;

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

    if(watchID){
      player.x += (retAcceleration.x * 10);
      //alert(retAcceleration.x)
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
    player.x = 305;
    player.y = 700;
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
  for (var i = 0; i < pmen.length; i++) {
   // console.log('drawing...')
      pmen[i].update();
      pmen[i].draw();
     
    //console.log(player.x +" "+ player.width);
    //console.log(pmen[i].x +" "+ pmen[i].width);
    //console.log((player.y +" "+ pmen[i].y +" "+ pmen[i].height));



    if(player.x < pmen[i].x){
      console.log(1);
      if((player.x + player.width >= pmen[i].x) && (player.y <= pmen[i].y + pmen[i].height)){
        console.log(11);

        gameOver();
      }
    }else if(player.x > pmen[i].x){
      console.log(2);
      if((player.x <= pmen[i].x + pmen[i].width) && (player.y <= pmen[i].y + (pmen[i].height - 25))){
        console.log(21);

        gameOver();
      }
    }else{
      console.log(3);
      if((player.y <= pmen[i].y + pmen[i].height)){
        console.log(31);

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
  if (Math.random() > 0.96 && pmen.length < 3 && (pmen.length ? H - pmen[pmen.length-1].y >= gameHeight: true))
    pmen.push(new PoliceMen({width: 112, height: 95, speed: 4, x: Math.floor((Math.random() * 305) + 1) , y: -100, sheet: new SpriteSheet('img/spritepolice.png', 112, 95)}));
    //console.log(pmen.length);
  
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

     // draw the score
    ctx.font = "20pt Calibri";
    ctx.fillStyle = 'white';
    ctx.fillText('SCORE: ' + score + ' m', canvas.width - 180, 40);

    spawnPoliceSprites();
    updatePolice();
    updatePlayer();


  };

}


function startGame() {
  pmen = [];
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
  //$('#score').html(score);
  $('#go-container').show();
}

  /**********************************************/

function onSuccess(acceleration) {
   retAcceleration.x = acceleration.x;
   retAcceleration.y = acceleration.y;
   retAcceleration.z = acceleration.z;
};


function onError() {
    alert('onError!');
};
/*8
   * Show the main menu after loading all assets
   */
function gameInit(){
  startGame();
  var options = { frequency: 3000 };  // Update every 3 seconds
  watchID = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);
}
  function mainMenu() {
    $('#progress').hide();
    $('#main').show();
    $('#menu').addClass('main');
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


  $('#pause').click(function() {
    var $this = $(this);
    stop = true;

    if ($this.hasClass('pause-off')) {
      $('#container').show();
    } 
  });

  $('.resume').click(function() {
    stop = false;
    gameLoop();
    $('#container').hide();
  });

  $('.quit').click(function() {
    $('#container').hide();
    $('#pause').hide();
    stop = false;
    $('#canvas').hide();
    $('#menu').show();
  });

  $('.restart').click(function() {
    $('#go-container').hide();
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
    $('#options-container, #help-container').hide();
    $('#main').show();
    $('#menu').removeClass('options help stretchRight');
  });

assetLoader.downloadAll();
})(jQuery);