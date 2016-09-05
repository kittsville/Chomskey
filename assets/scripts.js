if (typeof $ === 'undefined') {
	document.body.innerHTML = '<p>Failed to load jQuery. Nothing will work. Please <a href="mailto:kittsville@gmail.com">shout at developer</a> or check for network issues.</p>';
	
	// Warns people about not using a web stack
	if (window.location.protocol !== 'https:' && window.location.protocol !== 'http:') {
		document.body.innerHTML += '<p>Try running Chomskey from a proper web stack. Opening index.html in your browser is not the same.</p>';
	}
}

/**
 * Holds general application settings
 */
var Chomskey = {
	// Settings
	s: {
		version: '0.1',
	},
	
	// Handles necessary components not existing (jQuery, File API, etc.)
	init: function() {
		Keyboard.init();
		EditKey.init();
		Layout.init();
		
		if (typeof Blob === 'undefined') {
			Layout.disableDownload();
			Layout.disableUpload();
		} else if (typeof FileReader === 'undefined') {
			Layout.disableUpload();
		}
	},
};

/**
 * Keyboard
 * Handles keypresses and interactions with the virtual keyboard
 */
var Keyboard = {
	// Settings
	s: {
		keyboardWrap:   $('div#keyboard'),
		typingArea:     $('div#typing-area textarea'),
		keyElements:    {},
		shift:          false,
		alt:            false,
	},
	
	init: function() {
		this.s.keyboardWrap.find('a').each(function(i, key) {
			var keyCode = Keyboard.getKeyCode(key);
			
			if (keyCode) {
				Keyboard.s.keyElements[keyCode] = $(key);
			}
		});
		
		this.bindUIActions();
	},
	
	bindUIActions: function() {
		this.s.typingArea.keydown(function(event) {
			Keyboard.highlightKey(event.which);
			Keyboard.typeKey(event);
			Keyboard.updateLabels(event);
		});
		
		this.s.typingArea.keyup(function(event) {
			Keyboard.unhighlightKey(event.which);
			Keyboard.updateLabels(event);
		});
		
		this.s.keyboardWrap.on('click', 'a', function(event) {
			EditKey.openWindow(event.currentTarget);
		});
	},
	
	highlightKey: function(keyCode) {
		var keyElement = Keyboard.mapKeyToElement(keyCode);

		if (keyElement) {
			keyElement.addClass('pressed');
		}
	},
	
	unhighlightKey: function(keyCode) {
		var keyElement = Keyboard.mapKeyToElement(keyCode);

		if (keyElement) {
			keyElement.removeClass('pressed');
		}
	},
	
	changeCurrentLabels: function(labelMapper) {
		$.each(Keyboard.s.keyElements, function(i, keyElement) {
			keyElement.text(labelMapper(keyElement.attr('key')));
		});
	},
	
	updateLabels: function(event) {
		switch (event.type) {
			case 'keydown':
				if (event.which === 16 && Keyboard.s.shift === false) {
					Keyboard.s.shift = true;
					
					Keyboard.changeCurrentLabels(Layout.mapKeyToShiftLabel);
				} else if (event.which === 18 && event.ctrlKey && Keyboard.s.alt === false ) {
					Keyboard.s.alt = true;
					
					Keyboard.changeCurrentLabels(Layout.mapKeyToAltLabel);
				}
			break;
			
			case 'keyup':
				if ((event.which === 16 && Keyboard.s.shift === true) || (event.which === 18 && Keyboard.s.alt === true)) {
					Keyboard.s.shift    = false;
					Keyboard.s.alt      = false;
					
					Keyboard.changeCurrentLabels(Layout.mapKeyToLabel);
				}
			break;
		}
	},
	
	typeKey: function(event) {
		if (event.ctrlKey && !event.altKey) {
			return;
		}
		
		var keyCharacter, keyCode = event.which;
		
		if (Keyboard.s.shift) {
			keyCharacter = Layout.mapKeyToShiftChar(keyCode);
		} else if (Keyboard.s.alt) {
			keyCharacter = Layout.mapKeyToAltChar(keyCode);
		} else {
			keyCharacter = Layout.mapKeyToChar(keyCode);
		}
		
		if (keyCharacter === '') {
			return;
		}
		
		event.preventDefault();
		
		this.s.typingArea.insertAtCaret(keyCharacter);
	},
	
	// Maps a keycode to the HTML element for that key
	mapKeyToElement: function(keyCode) {
		if (this.s.keyElements.hasOwnProperty(keyCode)) {
			return this.s.keyElements[keyCode];
		} else {
			console.log('Unable to find HTML element for JS keycode ' + keyCode);
			
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
	
	// Updates the current label of a single key
	updateKeyLabel: function(keyCode) {
		Keyboard.mapKeyToElement(keyCode).text(Layout.mapKeyToLabel(keyCode));
	}
};

/**
 * EditKey
 * Handles interactions with the Key editing window and tells Keyboard to update the key
 */
var EditKey = {
	// Settings
	s: {
		overlay:         $('div#edit-key-overlay'),
		window:          $('div#edit-key-window'),
		formInputs:      $('form input[type="text"]'),
		closeButton:     $('div#close-edit-key'),
		cancelButton:    $('a#cancel-edit'),
		updateButton:    $('a#update-key'),
		labelInput:      $('input#key-label'),
		valueInput:      $('input#key-value'),
		shiftLabelInput: $('input#key-shift-label'),
		shiftValueInput: $('input#key-shift-value'),
		altLabelInput:   $('input#key-alt-label'),
		altValueInput:   $('input#key-alt-value'),
		keyNumDisplay:   $('h2#key-number'),
		keyIDDisplay:    $('h4#key-id'),
		keyCode:         0,
	},
	
	init: function() {
		this.bindUIActions();
	},
	
	bindUIActions: function() {
		this.s.updateButton.click(EditKey.saveKey);
		this.s.formInputs.keypress(EditKey.submitOnEnter);
		
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
		var keyValue, keyShiftValue, keyAltValue, keyCode = Keyboard.getKeyCode(keyElement);
		
		if (!keyCode) {
			return;
		}
		
		EditKey.s.keyCode = keyCode;
		
		EditKey.s.keyNumDisplay.text(keyCode);
		EditKey.s.keyIDDisplay.text(keyElement.id);
		
		EditKey.s.labelInput.val(Layout.searchCurrentLayout(keyCode, 'labels'));
		EditKey.s.valueInput.val(Layout.searchCurrentLayout(keyCode, 'map'));
		
		EditKey.s.shiftLabelInput.val(Layout.searchCurrentLayout(keyCode, 'sLabels'));
		EditKey.s.shiftValueInput.val(Layout.searchCurrentLayout(keyCode, 'sMap'));
		
		EditKey.s.altLabelInput.val(Layout.searchCurrentLayout(keyCode, 'altLabels'));
		EditKey.s.altValueInput.val(Layout.searchCurrentLayout(keyCode, 'altMap'));
		
		EditKey.s.window.fadeIn(100);
		EditKey.s.overlay.fadeIn(100);
		
		EditKey.s.labelInput.focus();
	},
	
	submitOnEnter: function(e) {
		if (e.which === 13) {
			EditKey.s.updateButton.click();
		}
	},
	
	saveKey: function() {
		Layout.updateKey(EditKey.s.keyCode,
		EditKey.s.labelInput.val(),     EditKey.s.valueInput.val(),
		EditKey.s.shiftLabelInput.val(),EditKey.s.shiftValueInput.val(),
		EditKey.s.altLabelInput.val(),  EditKey.s.altValueInput.val()
		);
		
		EditKey.closeWindow();
	},
};

/**
 * Layout
 * Allows the user to manage the current keyboard layout
 */
var Layout = {
	// Settings
	s: {
		selector:           $('select#layout-selector'),
		downloadButton:     $('a#download-layout'),
		uploadButton:       $('a#upload-layout'),
		uploadField:        $('input#real-upload'),
		layouts:            {'default':{'name':'Default','v':0.1,'alt':'Your current keyboard layout','slug':'default','map':{},'sMap':{},'altMap':{},'labels':{},'sLabels':{},'altLabels':{}}},
		currentLayout:      {},
		defaultLabels:      {"8":"Backspace","9":"Tab","13":"Enter","16":"Shift","17":"Ctrl","18":"Alt","20":"Caps","27":"Esc","32":"Space","48":"0","49":"1","50":"2","51":"3","52":"4","53":"5","54":"6","55":"7","56":"8","57":"9","59":";","61":"=","65":"a","66":"b","67":"c","68":"d","69":"e","70":"f","71":"g","72":"h","73":"i","74":"j","75":"k","76":"l","77":"m","78":"n","79":"o","80":"p","81":"q","82":"r","83":"s","84":"t","85":"u","86":"v","87":"w","88":"x","89":"y","90":"z","91":"Start","93":"Select","112":"F1","113":"F2","114":"F3","115":"F4","116":"F5","117":"F6","118":"F7","119":"F8","120":"F9","121":"F10","122":"F11","123":"F12","163":"#","173":"-","188":",","190":".","191":"/","192":"`","219":"[","220":"\\","221":"]","222":"'"},
		defaultShiftLabels: {"48":")","49":"!","50":"\"","51":"£","52":"$","53":"%","54":"^","55":"&","56":"*","57":"(","59":":","61":"+","65":"A","66":"B","67":"C","68":"D","69":"E","70":"F","71":"G","72":"H","73":"I","74":"J","75":"K","76":"L","77":"M","78":"N","79":"O","80":"P","81":"Q","82":"R","83":"S","84":"T","85":"U","86":"V","87":"W","88":"X","89":"Y","90":"Z","163":"~","173":"_","188":"<","190":">","191":"?","192":"¬","219":"{","220":"|","221":"}","222":"@"},
		defaultAltLabels:   {"52":"€","192":"¦"},
	},
	
	init: function() {
		this.setCurrentLayout('default');
		this.bindUIActions();
		this.loadLocalLayout('ucl-ipa');
	},
	
	bindUIActions: function() {
		this.s.selector.on('change',      Layout.updateSelected);
		this.s.downloadButton.on('click', Layout.download);
		this.s.uploadButton.on('click',   Layout.emulateUploadField);
		this.s.uploadField.on('change',   Layout.processUpload);
	},
	
	// Finds the highest priority label/value for a keyCode
	searchStack: function(keyCode, stack) {
		for (var i = 0; i < stack.length; i++) {
			if (stack[i].hasOwnProperty(keyCode)) {
				return stack[i][keyCode];
			}
		}
		
		return '';
	},
	
	searchCurrentLayout: function(keyCode, property) {
		if (Layout.s.currentLayout[property].hasOwnProperty(keyCode)) {
			return Layout.s.currentLayout[property][keyCode];
		} else {
			return '';
		}
	},
	
	mapKeyToLabel: function(keyCode) {
		return Layout.searchStack(keyCode, [Layout.s.currentLayout.labels, Layout.s.defaultLabels]);
	},
	
	mapKeyToShiftLabel: function(keyCode) {
		return Layout.searchStack(keyCode, [Layout.s.currentLayout.sLabels, Layout.s.defaultShiftLabels, Layout.s.currentLayout.labels, Layout.s.defaultLabels]);
	},
	
	mapKeyToAltLabel: function(keyCode) {
		return Layout.searchStack(keyCode, [Layout.s.currentLayout.altLabels, Layout.s.defaultAltLabels, Layout.s.currentLayout.labels, Layout.s.defaultLabels]);
	},
	
	mapKeyToChar: function(keyCode) {
		return Layout.searchStack(keyCode, [Layout.s.currentLayout.map]);
	},
	
	mapKeyToShiftChar: function(keyCode) {
		return Layout.searchStack(keyCode, [Layout.s.currentLayout.sMap]);
	},
	
	mapKeyToAltChar: function(keyCode) {
		return Layout.searchStack(keyCode, [Layout.s.currentLayout.altMap]);
	},
	
	emulateUploadField: function() {
		Layout.s.uploadField.click();
	},
	
	updateSelected: function(e) {
		Layout.s.currentLayout = Layout.s.layouts[Layout.s.selector.val()];
		
		Keyboard.changeCurrentLabels(Layout.mapKeyToLabel);
	},
	
	download: function() {
		var filename = Layout.s.currentLayout.slug + '.zardoz',
		url          = URL.createObjectURL(new Blob([JSON.stringify(Layout.s.currentLayout)], {type: "application/Keyboard"}));
		
		Layout.s.downloadButton.attr('download', filename);
		Layout.s.downloadButton.attr('href',     url);
	},
	
	processUpload: function(e) {
		var file, files = e.target.files;
		
		for (var i = 0; i < files.length; i++) {
			file = files[i];
			
			if (file.name.indexOf('.zardoz', file.name.length - 7) === -1) {
				alert('Skipped ' + file.name + '. Zardoz files only!');
				continue;
			}
			
			var reader = new FileReader();

			reader.onload = function(e) {
				try {
					var parsedJSON = JSON.parse(e.target.result);
				} catch (error) {
					alert('Failed to parsed an uploaded file');
					console.log(error);
					return;
				}
				
				Layout.processLayout(parsedJSON);
			};

			reader.readAsText(file);
		}
	},
	
	processLayout: function(newLayout) {
		if (!['name', 'v', 'alt', 'slug', 'map', 'sMap', 'altMap', 'labels', 'sLabels', 'altLabels'].every(function(x) {return x in newLayout;})) {
			var name = '';
			
			if (newLayout.hasOwnProperty('name')) {
				name = newLayout.name;
			} else {
				name = 'a new layout';
			}
			
			alert('Failed to add ' + name + ' because of missing layout information');
		}
		
		if (Chomskey.s.version != newLayout.v) {
			alert('Layout ' +   newLayout.name + ' (version ' + newLayout.v + ') incompatible with Chomskey (version ' + Chomskey.s.version + ')');
			return;
		}
		
		Layout.addLayout(newLayout);
		Layout.setCurrentLayout(newLayout.slug);
	},
	
	addLayout: function(newLayout) {
		Layout.s.layouts[newLayout.slug] = newLayout;
		Layout.updateSelector();
	},
	
	setCurrentLayout: function(layoutSlug) {
		Layout.s.selector.val(layoutSlug);
		Layout.s.selector.trigger('change');
	},
	
	loadLocalLayout: function(layoutName) {
		$.ajax({
			url:      'layouts/' + layoutName + '.zardoz',
			cache:    true,
			dataType: 'json',
		}).success(function(newLayout) {
			Layout.addLayout(newLayout);
			
			if (window.location.hash) {
				if (newLayout.slug === window.location.hash.slice(1)) {
					Layout.setCurrentLayout(newLayout.slug);
				}
			}
		});
	},
	
	updateKey: function(keyCode, label, value, shiftLabel, shiftValue, altLabel, altValue) {
		$.each({
			'map':       value,
			'labels':    label,
			'sMap':      shiftValue,
			'sLabels':   shiftLabel,
			'altMap':    altValue,
			'altLabels': altLabel,
		}, function(layoutKey, layoutValue) {
			delete Layout.s.currentLayout[layoutKey][keyCode];
			
			if (layoutValue !== '') {
				Layout.s.currentLayout[layoutKey][keyCode] = layoutValue;
			}
		});
		
		Keyboard.updateKeyLabel(keyCode);
	},
	
	updateSelector: function() {
		Layout.s.selector.empty();
		
		var newLayouts = [];
		
		$.each(Layout.s.layouts, function(i, layout) {
			newLayouts.push($('<option/>', {
				value: layout.slug,
				html:  layout.name,
				title: layout.alt,
			}));
		});
		
		Layout.s.selector.append(newLayouts);
	},
	
	disableUpload: function() {
		Layout.s.uploadButton.hide();
	},
	
	disableDownload: function() {
		Layout.s.downloadButton.hide();
	},
}

$(function() {
	Chomskey.init();
});
