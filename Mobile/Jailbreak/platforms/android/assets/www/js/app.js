(function ($) {

var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');

var stop;
var player, score = 0;
var police = [], traps = [];
var W = canvas.width;
var H = canvas.height;

   /**
   * Asset pre-loader object. Loads all images
   */
var assetLoader = (function() {
  // images dictionary
  this.imgs        = {
    'wallsbg'       : 'img/wallsbg.png',
    'wallsimg'      : 'img/JBGameEWalls.png',
    'wiresbg'       : 'img/bgwires.png',
    'wiresimg'      : 'img/JBGameEWires.png',
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
  var wires = {};

  /*
   * Draw the backgrounds to the screen at different speeds
   */
  this.draw = function() {
    ctx.drawImage(assetLoader.imgs.wallsbg, 0, 0);

    walls.y +=  walls.speed;   
    wires.y +=  wires.speed;   
    
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

  // jumping
  player.dy        = 0;

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
    player.y -=  player.speed;   

    player.anim.draw(player.x, player.y);
    if (player.y + H <= 0) {
        player.y = 700;
    }
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

/**
 * Sprites are anything drawn to the screen (ground, enemies, etc.)
 * @param {integer} x - Starting x position of the player
 * @param {integer} y - Starting y position of the player
 * @param {string} type - Type of sprite
 */
function Sprite(x, y, type) {
  this.x      = x;
  this.y      = y;
  this.width  = 250;
  this.height = 800;
  this.type   = type;
  Vector.call(this, x, y, 0, 0);

  /**
   * Update the Sprite's position by the player's speed
   */
  this.update = function() {
    this.dy = -player.speed;
    this.advance();
  };

  /**
   * Draw the sprite at it's current position
   */
  this.draw = function() {
    ctx.save();
    //ctx.translate(0.5,0.5);
    ctx.drawImage(assetLoader.imgs.police, this.x, this.y);
    ctx.restore();
  };
}
Sprite.prototype = Object.create(Vector.prototype);

function updatePolice() {
  for (var i = 0; i < police.length; i++) {
    police[i].update();
    police[i].draw();

    if (player.minDist(police[i]) <= player.height) {
      gameOver();
    }
  }

  if (police[0] && police[0].x < 0) {
    police.splice(0, 1);
  }
}

/**
 * Update the players position and draw
 */
function updatePlayer() {
  player.update();
  player.draw();

  // game over
  if (player.y + player.height >= canvas.height) {
    gameOver();
  }
}

/**
 * Spawn new sprites off screen
 */
function spawnSprites() {
  // increase score
  score++;

 
    // add random enemies
    spawnPoliceSprites();
  
}


/**
 * Spawn new police sprites off screen
 */
function spawnPoliceSprites() {
    police.push(new Sprite(canvas.width + 250 % player.speed, 60, police));
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


    updatePlayer();
    updatePolice();
    //police.update();
    //police.draw();

    spawnSprites();



  };

}


function startGame() {
  police = [];

  background.reset();
  player.reset();
  //police.reset();
  gameLoop();

}  

  /**********************************************/
  /**
   * Show the main menu after loading all assets
   */
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
    startGame();
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