(function ($) {


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
  //$('#game-over').show();
  $('#pause').show();

});

$('#pause').click(function() {
   var $this = $(this);
  if ($this.hasClass('pause-off')) {
    $('#container').show();
  } 

});

$('.resume').click(function() {
  $('#container').hide();

});

$('.quit').click(function() {
  $('#container').hide();
  $('#pause').hide();
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

//mainMenu();
})(jQuery);