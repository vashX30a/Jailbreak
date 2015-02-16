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
  var W = canvas.width;
  var H = canvas.height;

// We want to move/slide/scroll the background
// as the player moves or the game progresses

// Velocity X
var vy = 0;

var img = new Image();
img.src = 'img/JBGameEWalls.png';

function renderGame() {
  if (!stop) {
     window.requestAnimationFrame(renderGame);
    
    ctx.clearRect(0, 0, W, H);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 480, 400);
    
    ctx.drawImage(img, 0, vy);
    ctx.drawImage(img, 0, Math.abs(vy)-img.height);
    
    if (Math.abs(vy) > img.height) {
      vy = 0;
    }
  
    vy += 4;
  };

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
    renderGame();

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
    renderGame();
    $('#container').hide();
  });

  $('.quit').click(function() {
    $('#container').hide();
    $('#pause').hide();
    stop = false;
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