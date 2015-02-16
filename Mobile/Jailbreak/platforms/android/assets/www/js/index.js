var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
 
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
		  app.receivedEvent('deviceready');
    },
	
    receivedEvent: function(id) {
		  navigator.splashscreen.hide();
	  }

};