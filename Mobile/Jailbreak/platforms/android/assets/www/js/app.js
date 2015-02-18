(function ($) {
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

  var canvas = document.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var stop = false;
  var player;
  var W = canvas.width;
  var H = canvas.height;


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

/**
 * Create a parallax background
 */
var background = (function() {
  // Velocity Y
  var bg_vy;

  var img = new Image();
  img.src = 'img/JBGameEWalls.png';

  /*
   * Draw the backgrounds to the screen at different speeds
   */
  this.draw = function() {    
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 480, 400);
    
    ctx.drawImage(img, 0, bg_vy);
    ctx.drawImage(img, 0, Math.abs(bg_vy)-img.height);

    if (Math.abs(bg_vy) > img.height) {
      bg_vy = 0;
    }
  
    bg_vy += 8;
    
  };

  /**
   * Reset background to zero
   */
  this.reset = function()  {
    bg_vy = 0;
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
  player.width     = 120;
  player.height    = 110;
  player.speed     = 6;

  // jumping
  player.dy        = 0;

  // spritesheets
  player.sheet     = new SpriteSheet('img/spritecharacter2.png', player.width, player.height);
  player.walkAnim  = new Animation(player.sheet, 8, 0, 2);
  player.anim      = player.walkAnim;

  Vector.call(player, 0, 0, 0, player.dy);

  var jumpCounter = 0;  // how long the jump button can be pressed down

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
    player.anim.draw(player.x, player.y);
  };

  /**
   * Reset the player's position
   */
  player.reset = function() {
    player.x = 180;
    player.y = 650;
  };

  return player;
})(Object.create(Vector.prototype));


/**
 * Game loop
 */

function gameLoop() {
  if (!stop) {
    window.requestAnimationFrame(gameLoop);
    
    ctx.clearRect(0, 0, W, H);
    background.draw();
    player.draw();
    player.update();

  };

}


function startGame() {
  background.reset();
  player.reset();
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

  mainMenu();
})(jQuery);