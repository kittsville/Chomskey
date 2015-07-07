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
			editKey.openWindow(event.currentTarget);
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

var editKey = {
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
		this.s.updateButton.click(editKey.saveKey);
		
		this.s.closeButton.click(editKey.closeWindow);
		this.s.overlay.click(editKey.closeWindow);
		this.s.cancelButton.click(editKey.closeWindow);
		this.s.window.click(function(e) {e.stopPropagation();}); // Stops clicking the window acting like clicking the dark overlay
	},
	
	clearWindow: function() {
		editKey.s.keyNumDisplay.text('');
		editKey.s.keyIDDisplay.text('');
		editKey.s.valueInput.val('');
		editKey.s.labelInput.val('');
	},
	
	closeWindow: function() {
		editKey.s.overlay.fadeOut(100, editKey.clearWindow);
	},
	
	openWindow: function(keyElement) {
		var keyValue, keyCode = Chomskey.getKeyCode(keyElement);
		
		if (!keyCode) {
			return;
		}
		
		editKey.s.keyCode = keyCode;
		
		keyValue = Chomskey.mapKey(keyCode);
		
		if (typeof keyValue !== 'string') {
			keyValue = '';
		}
		
		editKey.s.keyNumDisplay.text(keyCode);
		editKey.s.keyIDDisplay.text(keyElement.id);
		editKey.s.labelInput.val(keyElement.text);
		editKey.s.valueInput.val(keyValue);
		
		editKey.s.window.fadeIn(100);
		editKey.s.overlay.fadeIn(100);
	},
	
	saveKey: function() {
		Chomskey.updateKey(editKey.s.keyCode, editKey.s.valueInput.val(), editKey.s.labelInput.val());
		
		editKey.closeWindow();
	},
};

$(function() {
	Chomskey.init();
	editKey.init();
});