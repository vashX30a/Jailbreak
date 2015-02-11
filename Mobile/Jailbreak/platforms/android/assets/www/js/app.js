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
  $('#options-container,#help-container').hide();
  $('#main').show();
  $('#menu').removeClass('options help stretchRight');
});

mainMenu();
})(jQuery);