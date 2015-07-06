var Chomskey = {
	// Settings
	s: {
		keyboardWrap:	$('div#keyboard'),
		keyElements:	{},
		typingArea:		$('div#typing-area textarea'),
		allowDefaulting:true,							// Whether to default to a key's normal behaviour if no mapping is found
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
			Chomskey.typeKey(event);
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
	
	typeKey: function(event) {
		var keyCode		= event.which,
		keyCharacter	= this.mapKey(keyCode);
		
		if (typeof keyCharacter === 'string') {
			event.preventDefault();
			
			this.s.typingArea.val(this.s.typingArea.val() + keyCharacter);
		} else if (this.s.allowDefaulting) {
			return;
		}
		
		event.preventDefault();
	},
	
	// Maps a keycode to the HTML element for that key
	mapKeyElement: function(keyCode) {
		if (this.s.keyElements.hasOwnProperty(keyCode)) {
			return this.s.keyElements[keyCode];
		} else {
			console.log('Unable to find HTML element for JS keycode ' + keyCode);
			
			return false;
		}
	},
	
	// Maps a keycode to the correct character(s) set to display by the keyboard layout
	mapKey: function(keyCode) {
		if (this.s.keyMap.hasOwnProperty(keyCode)) {
			return this.s.keyMap[keyCode];
		} else {
			console.log('Unable to find mapping for JS keycode ' + keyCode);
			
			return false;
		}
	},
};

$(function() {
	Chomskey.init();
});