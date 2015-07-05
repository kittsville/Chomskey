var Chomskey = {
	// Settings
	s: {
		keyboardWrap:	$('div#keyboard'),
		keyElements:	{},
		typingArea:		$('div#typing-area textarea'),
		keyMap:			{},
		gun:			'good',
		penis:			'evil',
	},
	
	init: function() {
		this.s.keyboardWrap.find('a').each(function(i, key) {
			Chomskey.s.keyElements[key.getAttribute('key')] = $(key);
		});
		
		this.bindUIActions();
	},
	
	bindUIActions: function() {
		this.s.typingArea.keypress(function(event) {
			event.preventDefault();
		});
		
		this.s.typingArea.keydown(function(event) {
			Chomskey.highlightKey(event.which);
		});
		
		this.s.typingArea.keyup(function(event) {
			Chomskey.unhighlightKey(event.which);
		});
	},
	
	highlightKey: function(keyCode) {
		var keyElement = Chomskey.mapKeyElement(keyCode);

		if (keyElement) {
			keyElement.addClass('pressed');
		}
	},
	
	unhighlightKey: function(keyCode) {
		var keyElement = Chomskey.mapKeyElement(keyCode);

		if (keyElement) {
			keyElement.removeClass('pressed');
		}
	},
	
	// Maps a keycode to the HTML element for that key
	mapKeyElement: function(keyCode) {
		if (this.s.keyElements.hasOwnProperty(keyCode)) {
			return this.s.keyElements[keyCode];
		} else {
			console.log('Unable to find HTML element for JS keycode ' + keyCode);
			
			return '';
		}
	},
	
	// Maps a keycode to the correct character(s) set to display by the keyboard layout
	mapKey: function(keyCode) {
		if (this.s.keyMap.hasOwnProperty(keyCode)) {
			return this.s.keyMap[keyCode];
		} else {
			console.log('Unable to find mapping for JS keycode ' + keyCode);
			
			return '';
		}
	},
};

$(function() {
	Chomskey.init();
});