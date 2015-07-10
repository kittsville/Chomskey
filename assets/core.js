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
		keyCharacter	= Layout.mapKey(keyCode);
		
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
	
	getKeyCode: function(keyElement) {
		if (keyElement instanceof $) {
			return keyElement.prop('key');
		} else {
			return keyElement.getAttribute('key');
		}
	},
	
	updateKey: function(keyCode, value, label) {
		if (value) {
			Layout.s.currentLayout.map[keyCode] = value;
		} else if (Layout.s.currentLayout.map.hasOwnProperty(keyCode)) {
			delete Layout.s.currentLayout.map[keyCode];
		}
		
		Layout.s.currentLayout.labels[keyCode] = label;
		
		var keyElement = Chomskey.mapKeyElement(keyCode);
		
		if (keyElement) {
			keyElement.text(label);
		}
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
		formInputs:		$('form input[type="text"]'),
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
		var keyValue, keyCode = Chomskey.getKeyCode(keyElement);
		
		if (!keyCode) {
			return;
		}
		
		EditKey.s.keyCode = keyCode;
		
		keyValue = Layout.mapKey(keyCode);
		
		if (typeof keyValue !== 'string') {
			keyValue = '';
		}
		
		EditKey.s.keyNumDisplay.text(keyCode);
		EditKey.s.keyIDDisplay.text(keyElement.id);
		EditKey.s.labelInput.val(keyElement.text);
		EditKey.s.valueInput.val(keyValue);
		
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
		Chomskey.updateKey(EditKey.s.keyCode, EditKey.s.valueInput.val(), EditKey.s.labelInput.val());
		
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
		selector:		$('select#layout-selector'),
		downloadButton:	$('a#download-layout'),
		uploadButton:	$('a#upload-layout'),
		uploadField:	$('input#real-upload'),
		layouts:		{'default':{'name':'Default','v':0.1,'alt':'Your current keyboard layout','slug':'default','map':{},'sMap':{},'altMap':{},'labels':{},'sLabels':{},'altLabels':{}}},
		currentLayout:	{},
	},
	
	init: function() {
		this.setCurrentLayout('default');
		this.bindUIActions();
	},
	
	bindUIActions: function() {
		this.s.selector.on('change',		Layout.updateSelected);
		this.s.downloadButton.on('click',	Layout.download);
		this.s.uploadButton.on('click',		Layout.emulateUploadField);
		this.s.uploadField.on('change',		Layout.processUpload);
	},
	
	emulateUploadField: function() {
		Layout.s.uploadField.click();
	},
	
	updateSelected: function(e) {
		Layout.s.currentLayout = Layout.s.layouts[Layout.s.selector.val()];
	},
	
	download: function() {
		var filename	= Layout.s.currentLayout.slug + '.zardoz',
		url				= URL.createObjectURL(new Blob([JSON.stringify(Layout.s.currentLayout)], {type: "application/chomskey"}));
		
		Layout.s.downloadButton.attr('download', filename);
		Layout.s.downloadButton.attr('href', url);
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
		
		Layout.addLayout(newLayout);
		Layout.setCurrentLayout(newLayout.slug);
	},
	
	addLayout: function(newLayout) {
		Layout.s.layouts[newLayout.slug] = newLayout;
		Layout.updateSelector();
	},
	
	setCurrentLayout: function(layoutSlug) {
		Layout.s.currentLayout = Layout.s.layouts[layoutSlug];
		
		Layout.s.selector.val(layoutSlug);
	},
	
	mapKey: function(keyCode) {
		if (Layout.s.currentLayout.map.hasOwnProperty(keyCode)) {
			return Layout.s.currentLayout.map[keyCode];
		} else {
			console.log('Unable to find mapping for JS keycode ' + keyCode);
			
			return false;
		}
	},
	
	updateSelector: function() {
		Layout.s.selector.empty();
		
		var newLayouts = [];
		
		$.each(Layout.s.layouts, function(i, layout) {
			newLayouts.push($('<option/>', {
				value:	layout.slug,
				html:	layout.name,
				title:	layout.alt,
			}));
		});
		
		Layout.s.selector.append(newLayouts);
	},
}

$(function() {
	if (window.FileReader && window.File) {
		Chomskey.init();
		EditKey.init();
		Layout.init();
	} else {
		document.body.innerHTML = 'Your browser is out of date or sucks so this website won\'t work. If you\'re using IE then your browser is out of date AND sucks!';
	}
});