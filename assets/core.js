/**
 * Chomskey
 * Handles keypresses and interactions with the virtual keyboard
 */
var Chomskey = {
	// Settings
	s: {
		keyboardWrap:	$('div#keyboard'),
		typingArea:		$('div#typing-area textarea'),
		allowDefaulting:true,							// Whether to default to a key's normal behaviour if no mapping is found
		keyMap:			{},
		keyElements:	{},
		gun:			'good',
		penis:			'evil',
	},
	
	init: function() {
		this.s.keyboardWrap.find('a').each(function(i, key) {
			var keyCode = Chomskey.getKeyCode(key);
			
			if (keyCode) {
				Chomskey.s.keyElements[keyCode] = $(key);
			}
		});
		
		this.bindUIActions();
	},
	
	bindUIActions: function() {
		this.s.typingArea.keydown(function(event) {
			Chomskey.highlightKey(event.which);
			Chomskey.typeKey(event);
		});
		
		this.s.typingArea.keyup(function(event) {
			Chomskey.unhighlightKey(event.which);
		});
		
		this.s.keyboardWrap.on('click', 'a', function(event) {
			EditKey.openWindow(event.currentTarget);
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
	
	getKeyCode: function(keyElement) {
		if (keyElement instanceof $) {
			return keyElement.prop('key');
		} else {
			return keyElement.getAttribute('key');
		}
	},
	
	updateKey: function(keyCode, value, label) {
		Chomskey.s.keyMap[keyCode] = value;
		
		Chomskey.mapKeyElement(keyCode).text(label);
	},
};

/**
 * EditKey
 * Handles interactions with the Key editing window and tells Chomskey to update the key
 */
var EditKey = {
	// Settings
	s: {
		overlay:		$('div#edit-key-overlay'),
		window:			$('div#edit-key-window'),
		closeButton:	$('div#close-edit-key'),
		cancelButton:	$('a#cancel-edit'),
		updateButton:	$('a#update-key'),
		valueInput:		$('input#key-value'),
		labelInput:		$('input#key-label'),
		keyNumDisplay:	$('h2#key-number'),
		keyIDDisplay:	$('h4#key-id'),
		keyCode:		0,
	},
	
	init: function() {
		this.bindUIActions();
	},
	
	bindUIActions: function() {
		this.s.updateButton.click(EditKey.saveKey);
		
		this.s.closeButton.click(EditKey.closeWindow);
		this.s.overlay.click(EditKey.closeWindow);
		this.s.cancelButton.click(EditKey.closeWindow);
		this.s.window.click(function(e) {e.stopPropagation();}); // Stops clicking the window acting like clicking the dark overlay
	},
	
	clearWindow: function() {
		EditKey.s.keyNumDisplay.text('');
		EditKey.s.keyIDDisplay.text('');
		EditKey.s.valueInput.val('');
		EditKey.s.labelInput.val('');
	},
	
	closeWindow: function() {
		EditKey.s.overlay.fadeOut(100, EditKey.clearWindow);
	},
	
	openWindow: function(keyElement) {
		var keyValue, keyCode = Chomskey.getKeyCode(keyElement);
		
		if (!keyCode) {
			return;
		}
		
		EditKey.s.keyCode = keyCode;
		
		keyValue = Chomskey.mapKey(keyCode);
		
		if (typeof keyValue !== 'string') {
			keyValue = '';
		}
		
		EditKey.s.keyNumDisplay.text(keyCode);
		EditKey.s.keyIDDisplay.text(keyElement.id);
		EditKey.s.labelInput.val(keyElement.text);
		EditKey.s.valueInput.val(keyValue);
		
		EditKey.s.window.fadeIn(100);
		EditKey.s.overlay.fadeIn(100);
	},
	
	saveKey: function() {
		Chomskey.updateKey(EditKey.s.keyCode, EditKey.s.valueInput.val(), EditKey.s.labelInput.val());
		
		EditKey.closeWindow();
	},
};

$(function() {
	Chomskey.init();
	EditKey.init();
});