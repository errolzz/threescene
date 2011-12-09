/**
 * ...
 * @author Errol Schwartz
 */

(function() {
	
	//CONSTANTS//
	
	var PLANE = 'plane';
	var CUBE = 'cube';
	var SPHERE = 'sphere';
	var POINT = 'point light';
	var GROUP = 'group';
	
	
	//MODELS//
	
	//Holdes the ui data needed to render views
	var UiModel = function() {
		var p = {};
		
		p.sceneSettings = {width:756, height:558, renderer:"canvas"};
		
		p.toolbar = {label:"&nbsp",
			icons:[
				{ id:PLANE, label:'Create Plane' },
				{ id:CUBE, label:'Create Cube' }, 
				{ id:SPHERE, label:'Create Sphere' }, 
				{ id:POINT, label:'Create Point Light' }
			]
		}
		
		p.inspector = {label:"Inspector"};
		p.library = {label:"Library"};
		
		return p;
	};
	
	//Created for each new scene object
	//Used to store that objects data, and also to render relevent ui views
	var SceneObject = function(objectData) {
		var p = {};
		
		p.id = objectData.id;
		p.type = objectData.type;
		p.three = undefined;
		p.selected = false;
		
		return p;
	};
	
	
	//APPLICATION//
	
	$(document).ready(function() {
		var ui = new UiModel();
		
		var scene = new Scene( $('#scene'), ui.sceneSettings );
		var toolbar = new Toolbar( $('#toolbar'), ui.toolbar );
		var library = new Library( $('#library'), ui.library );
		var inspector = new Inspector( $('#inspector'), ui.inspector );
		var code = new Code();
		
		var appMediator = new AppMediator(scene, library, inspector, code);
	});
	
	//Listens at the top level to events from all the main interface pieces
	//Toolbar, Inspector, and Library
	var AppMediator = function(scene, library, inspector, code) {
		
		(function() {
			$('#toolbar').bind( 'iconClicked', toolIconClicked );
			$('#inspector').bind( 'updateObject', updateObject );
			$('#library').bind( 'selectObject', selectObject );
			$('#library').bind( 'objectCreated', createObject );
			$('#library').bind( 'objectRemoved', removeObject );
			$('#library').bind( 'visibilityToggled', visibleToggle );
			$('#scene').bind( 'updateInspector', updateInspector );
			$('#show_js').bind( 'click', showJsClicked );
			
			$(document).bind( 'keyup', keyPress );
		})();
		
		//Key bindings
		function keyPress(e) {
			if(e.keyCode == 27) { //escape
				selectObject( null, {id:undefined, type:undefined} );
			} else if(e.keyCode == 46) { //delete
				library.removeCurrentItem();
			}
		}
		
		//Toggles the code view
		function showJsClicked(e) {
			code.showCode(scene.getScene());
			if(code.visible) {
				scene.disableDrag();
				selectObject( null, {id:undefined, type:undefined} );
				$('#show_js').text('hide js');
			} else {
				scene.enableDrag();
				$('#show_js').text('show js');
			}
		}
		
		//Handles toolbar clicks
		function toolIconClicked(e, iconData) {
			library.addItem(iconData.id);
		}
		
		//Adds an item to the scene and selects it
		function createObject(e, objectData) {
			scene.createObject(objectData);
			selectObject(null, objectData);
		}
		
		//Updates the inspector field values
		function updateInspector(e, sceneObject) {
			inspector.update(sceneObject);
		}
		
		//Selects and item in the scene
		//Updates all panels views
		function selectObject(e, objectData) {
			inspector.setItem(objectData);
			library.selectItem(objectData.id);
			scene.selectItem(objectData.id);
		}
		
		//Handles changes made to scene objects via the inspector window
		function updateObject(e, objectData) {
			scene.updateObject(objectData);
		}
		
		//Removes an object from the scene
		//Clears inspector view
		function removeObject(e, objectId) {
			scene.removeObject(objectId);
			inspector.setItem({id:undefined, type:undefined});
		}
		
		//Toggles the visibility of a scene object
		function visibleToggle(e, objectData) {
			scene.toggleVisibility(objectData);
		}
	};
	
	
	
	//COMPONENTS//
	
	//The overlay window that shows the generated code of the scene
	var Code = function(scene) {
		var p, holder, label, codeBox, codePar, code;
		p = {};
		p.visible = false;
		holder = $('<div id="code_holder"></div>');
		codeBox = $('<div id="code_box"></div>');
		codePar = $('<p id="code_par" class="black_text"></p>');
		label = $('<p class="panel_label"></p>');
		label.append('<p>generated javascript</p>');
		codeBox.append(codePar);
		holder.append(label);
		holder.append(codeBox);
		
		function generate(scene) {
			codePar.empty();
			code = "";
			//Main scene
			add("var size, renderer, scene, camera, light, objectHolder, geom, geomMaterial;");
			add("size = {x:756, y:558};");
			add("");
			add("//Main scene");
			add("renderer = new THREE.CanvasRenderer();");
			add("renderer.setSize(size.x, size.y);");
			add("scene = new THREE.Scene();");
			add("camera = new THREE.Camera( 45, size.x/size.y, 0.1, 10000 );");
			add("camera.position.y = 150;");
			add("camera.position.z = 500;");
			add("document.body.appendChild(renderer.domElement);");
			add("");
			add("objectHolder = new THREE.Object3D();");
			addProperties(scene.holder, "objectHolder");
			add("scene.addObject(objectHolder);");
			add("");
			add("geomMaterial = new THREE.MeshLambertMaterial( { color: 0xdfdfdf, shading: THREE.FlatShading } );");
			add("");
			add("//Default lights");
			add("var ambientLight = new THREE.AmbientLight( 0xbcbcbc );");
			add("scene.addLight( ambientLight );");
			add("");
			add("var directionalLight = new THREE.DirectionalLight( 0xaaaaaa );");
			add("directionalLight.position.y = .3;");
			add("scene.addLight( directionalLight );");
			add("");
			add("directionalLight = new THREE.DirectionalLight( 0xaaaaaa );");
			add("directionalLight.position.y = -.3;");
			add("scene.addLight( directionalLight );");
			add("");
			
			//Scene objects
			add("//Scene objects");
			add("//Radians used, degrees commented");
			add("//Scaling used, multiply scale by hard coded object size to get actual size");
			for( var i = 0; i < scene.items.length; i++) {
				switch(scene.items[i].type) {
					case PLANE:
						add("geom = new THREE.Mesh( new THREE.PlaneGeometry( 100, 150, 1, 1 ), geomMaterial );");
						add("geom.doubleSided = true;");
						break;
					case CUBE:
						add("geom = new THREE.Mesh( new THREE.CubeGeometry( 100, 100, 100 ), geomMaterial );");
						break;
					case SPHERE:
						add("geom = new THREE.Mesh( new THREE.SphereGeometry( 50, 20, 20 ), geomMaterial );");
						break;
					case POINT:
						add("geom = new THREE.PointLight( 0xffffff, 1 );");
						break;
				}
				
				addProperties(scene.items[i].three, "geom");
				
				add("objectHolder.addChild(geom);");
				add("");
			}
			
			add("renderer.render(scene, camera);");
			add("");
			codePar.append(code);
		}
		
		function addProperties(three, name) {
			if(three.position.x != 0) add(name + ".position.x = " + three.position.x.toFixed(2) + ";");
			if(three.position.y != 0) add(name + ".position.y = " + three.position.y.toFixed(2) + ";");
			if(three.position.z != 0) add(name + ".position.z = " + three.position.z.toFixed(2) + ";");
			if(three.rotation.x != 0) add(name + ".rotation.x = " + three.rotation.x.toFixed(2) + "; //" + Number(three.rotation.x * (180 / Math.PI)).toFixed(2) + " degrees");
			if(three.rotation.y != 0) add(name + ".rotation.y = " + three.rotation.y.toFixed(2) + "; //" + Number(three.rotation.y * (180 / Math.PI)).toFixed(2) + " degrees");
			if(three.rotation.z != 0) add(name + ".rotation.z = " + three.rotation.z.toFixed(2) + "; //" + Number(three.rotation.z * (180 / Math.PI)).toFixed(2) + " degrees");
			if(three.scale.x != 1) add(name + ".scale.x = " + three.scale.x.toFixed(2) + ";");
			if(three.scale.y != 1) add(name + ".scale.y = " + three.scale.y.toFixed(2) + ";");
			if(three.scale.z != 1) add(name + ".scale.z = " + three.scale.z.toFixed(2) + ";");
			if(three.intensity && three.intensity != 1) add(name + ".intensity = " + three.intensity.toFixed(2) + ";");
		}
		
		function add(line) {
			code += (line + "<br/>");
		}
		
		p.showCode = function(scene) {
			p.visible = !p.visible
			if(p.visible) {
				$('#scene').append(holder);
				generate(scene);
			} else {
				holder.remove();
				p.visible = false;
			}
		}
		
		return p;
	};
	
	//Panel that shows all an items properties
	//Allows for adjustment all object properties
	var Inspector = function(holder, data) {
		var p, label, item, position, rotation, scale;
		p = {};
		
		label = $('<p class="panel_label"></p>');
		label.append('<p>' + data.label + '</p>');
		holder.append(label);
		
		position = new InspectorPanel('position', "normal");
		rotation = new InspectorPanel('rotation', "normal");
		scale = new InspectorPanel('scale', "normal");
		light = new InspectorPanel('light', "light");
		holder.append( position.holder, rotation.holder, scale.holder, light.holder );
		
		//Sets the scene object to be edited
		//Changes the view based on the item type
		p.setItem = function(objectData) {
			
			if(objectData.type === undefined) {
				position.disable();
				rotation.disable();
				scale.disable();
				light.disable();
			} else {
				setNormalView();
				
				switch(objectData.type) {
					case PLANE:
						scale.z.disable();
						scale.z.holder.addClass('hidden');
						break;
					case CUBE:
						break;
					case SPHERE:
						break;
					case POINT:
						scale.disable();
						rotation.disable();
						light.enable();
						break;
					case GROUP:
						scale.disable();
						break;
				}
			}
		}
		
		p.update = function(sceneObject) {
			var o = sceneObject.three;
			//updates everything, showing, valid, or not
			position.x.setValue(o.position.x);
			position.y.setValue(o.position.y);
			position.z.setValue(o.position.z);
			
			rotation.x.setValue(o.rotation.x);
			rotation.y.setValue(o.rotation.y);
			rotation.z.setValue(o.rotation.z);
			
			scale.x.setValue(o.scale.x);
			scale.y.setValue(o.scale.y);
			scale.z.setValue(o.scale.z);
			
			if(sceneObject.type == POINT) light.intensity.setValue(o.intensity);
		}
		
		function setNormalView() {
			position.enable();
			rotation.enable();
			scale.enable();
			light.disable();
		}
		
		return p;
	};
	
	//A single panel for the Inspector window
	//For example the position of an scene object
	var InspectorPanel = function(label, type) {
		var p, all;
		p = {};
		p.holder = $('<div class="inspector_panel"></div>');
		all = [];
		text = $('<p class="medium_title"></p>');
		text.append(label);
		p.holder.append(text);
		
		//Sets which InspectorAdjusters to show based on the panel type
		if(type == 'normal') {
			p.x = new InspectorAdjuster(label, "x");
			p.y = new InspectorAdjuster(label, "y");
			p.z = new InspectorAdjuster(label, "z");
			p.holder.append(p.x.holder, p.y.holder, p.z.holder);
			all = [p.x, p.y, p.z];
		} else if(type == 'light') {
			p.intensity = new InspectorAdjuster(label, "intensity");
			p.holder.append(p.intensity.holder);
			all = [p.intensity];
		} else {
			alert("Error: Invalid InspectorPanel type.");
		}
		
		p.enable = function() {
			for (var i = 0; i < all.length; i++) {
				all[i].enable();
			}
			p.holder.removeClass('hidden');
		}
		
		p.disable = function() {
			for (var i = 0; i < all.length; i++) {
				all[i].disable();
			}
			p.holder.addClass('hidden');
		}
		
		p.disable();
		
		return p;
	};
	
	//A single propery adjuster item for the InspectorPanel
	//For example the x position of the rotation panel
	var InspectorAdjuster = function(set, prop) {
		var p, label, slider, form, field, startx, justDown;
		p = {};
		p.prop = prop;
		
		label = $('<p class="ui_label"></p>');
		field = $('<input type="text" class="inspector_input"></input>');
		form = $('<div class="inspector_form"></div>');
		
		label.append(prop);
		form.append(field);
		
		p.holder = $('<div class="inspector_adjustor"></div>');
		p.holder.append(label);
		p.holder.append(form);
		
		p.setValue = function(value) {
			if(set == "rotation") value = value * (180 / Math.PI);
			if(field.val() != "-" && field.val() != "." && field.val() != "-.") 
			{
				field.val(Number(value.toFixed(2)));
			}
		}
		
		p.enable = function() {
			p.holder.removeClass('hidden');
			field.bind('mousedown', fieldDown);
			field.bind('focus', fieldSelected);
		}
		
		p.disable = function() {
			$(window).unbind('mouseup', mouseUp);
			$(window).unbind('mousemove', mouseMove);
			field.unbind('mouseup', fieldUp);
			field.unbind('keyup', valueTyped);
			field.unbind('focus', fieldSelected);
			field.unbind('blur', fieldDeselected);
		}
		
		function fieldDown(e) {
			startx = e.pageX;
			justDown = true;
			field.unbind('mousedown', fieldDown);
			$(window).bind('mousemove', mouseMove);
			field.bind('mouseout', mouseOut);
			field.bind('mouseup', fieldUp);
			e.preventDefault();
		}
		
		function mouseOut(e) {
			field.unbind('mouseout', mouseOut);
			$(window).bind('mouseup', mouseUp);
		}
		
		function fieldUp(e) {
			$(window).unbind('mousemove', mouseMove);
			field.unbind('mouseup', fieldUp);
			field.select();
		}
		
		function fieldSelected(e) {
			field.unbind('keyup', valueTyped);
			field.unbind('blur', fieldDeselected);
			field.bind('keyup', valueTyped);
			field.bind('blur', fieldDeselected);
		}
		
		function fieldDeselected(e) {
			$(window).unbind('mousemove', mouseMove);
			field.unbind('blur', fieldDeselected);
			field.unbind('keyup', valueTyped);
			field.unbind('mouseup', fieldUp);
			field.unbind('mouseout', mouseOut);
			field.bind('mousedown', fieldDown);
		}
		
		function mouseUp(e) {
			$(window).unbind('mousemove', mouseMove);
			$(window).unbind('mouseup', mouseUp);
			field.unbind('mouseup', fieldUp);
			field.blur();
		}
		
		function mouseMove(e) {
			var o = e.pageX - startx;
			p.holder.trigger( 'updateObject', { set:set, prop:prop, offset:o, justDown:justDown } );
			justDown = false;
		}
		
		function valueTyped(e) {
			var v = field.val();
			if(e.keyCode > 95 && e.keyCode < 106 || e.keyCode > 47 && e.keyCode < 58 || e.keyCode == 110 || (e.keyCode == 109 && v.length == 1) || e.keyCode == 8) {
				if(field.val().length == 0 || field.val() == "-") v = 0;
				if(set == "rotation") v = v * (Math.PI / 180);
				p.holder.trigger( 'updateObject', { set:set, prop:prop, value:v, justDown:true } );
			} else {
				field.select();
			}
		}
		
		return p;
	};
	
	//A list of all objects in the scene
	var Library = function(holder, data) {
		var p, items, scrollerHolder, label, currentId, toolbar;
		p = {};
		items = [];
		currentId = -1;
		
		label = $('<div class="panel_label"></div>');
		label.append('<p>' + data.label + '</p>');
		holder.append(label);
		
		scrollerHolder = $('<div id="library_scroller_holder"></div>');
		scroller = $('<div id="library_scroller"></div>')
		scrollerHolder.append(scroller);
		holder.append(scrollerHolder);
		
		toolbar = new LibraryToolbar();
		toolbar.holder.bind('removeItem', removeItem);
		toolbar.holder.bind('duplicateItem', duplicateItem);
		holder.append(toolbar.holder);
		
		function removeItem(e) {
			p.removeCurrentItem();
		}
		
		function duplicateItem(e) {
			for( var i = 0; i < items.length; i++) {
				if(items[i].selected == true) {
					p.addItem(items[i].type, true);
					break;
				}
			}
		}
		
		p.addItem = function(itemType, dupe) {
			dupe = (dupe === true) ? true : false;
			currentId++;
			var i = new LibraryItem(currentId, itemType);
			scroller.append(i.holder);
			items.push(i);
			holder.trigger('objectCreated', { id:currentId, type:itemType, duplicate:dupe } );
		}
		
		p.removeCurrentItem = function() {
			for( var i = 0; i < items.length; i++) {
				if(items[i].selected == true) {
					items[i].holder.remove();
					holder.trigger('objectRemoved', items[i].id );
					items.splice(i,1);
				}
			}
		}
		
		p.selectItem = function(itemId) {
			for( var i = 0; i < items.length; i++) {
				if(items[i].id != itemId) {
					items[i].deselect();
					selected = undefined;
				} else {
					items[i].select();
					selected = items[i];
				}
			}
		}
		
		return p;
	};
	
	//A single item in the library panel
	var LibraryItem = function(id, itemType) {
		var p, i, icon, visButton, visible, label, bgp, types;
		p = {};
		p.id = id;
		p.type = itemType;
		p.selected = false;
		visible = true;
		
		types = [PLANE, CUBE, SPHERE, POINT, GROUP];
		
		icon = $('<div class="library_item_icon ui_img_bg"></div>');
		for(i = 0; i < types.length; i++) {
			if(itemType == types[i]) {
				bgp = '-2px ' + (-i * 30 - 2) + 'px'
				icon.css('backgroundPosition', bgp);
			}
		}
		
		label = $('<p class="library_label"></p>');
		label.append(id + " " + itemType);
		
		visButton = $('<div class="visible_eye ui_img_bg"></div>');
		visButton.bind('click', visClick);
		visButton.css('backgroundPosition', '-50px 0px');
		
		p.holder = $('<div class="library_item bg_hover"></div>');
		p.holder.bind('click', itemClick);
		p.holder.append(icon);
		p.holder.append(visButton);
		p.holder.append(label);
		
		p.deselect = function() {
			p.selected = false;
			p.holder.css('backgroundColor', '');
			p.holder.addClass('bg_hover');
		}
		
		p.select = function() {
			p.selected = true;
			p.holder.removeClass('bg_hover');
			p.holder.css('backgroundColor', '#eeeeee');
		}
		
		function itemClick(e) {
			p.holder.trigger( 'selectObject', {id:id, type:itemType} );
		}
		
		function visClick(e) {
			visible = !visible;
			bgp = (visible) ? '-50px 0px' : '-50px -26px';
			visButton.css('backgroundPosition', bgp);
			visButton.trigger('visibilityToggled', { id:id, visible:visible } );
		}
		
		return p;
	};
	
	//The bottom toolbar of the library panel
	var LibraryToolbar = function() {
		var p, removeIcon, duplicateIcon;
		p = {};
		p.holder = $('<div class="library_toolbar"></div>');
		
		duplicateIcon = new LibraryToolbarIcon('duplicate', 'Duplicate');
		duplicateIcon.icon.bind('click', duplicateClick);
		duplicateIcon.icon.css('backgroundPosition', '-30px 0px');
		p.holder.append(duplicateIcon.icon);
		
		removeIcon = new LibraryToolbarIcon('remove', 'Remove');
		removeIcon.icon.bind('click', removeClick);
		removeIcon.icon.css('backgroundPosition', '-30px -20px');
		p.holder.append(removeIcon.icon);
		
		function duplicateClick(e) {
			p.holder.trigger('duplicateItem');
		}
		
		function removeClick(e) {
			p.holder.trigger('removeItem');
		}
		
		return p;
	};
	
	//Icon for the library toolbar
	var LibraryToolbarIcon = function(id, label) {
		var p;
		p = {};
		p.icon = $('<div class="library_toolbar_icon ui_img_bg bg_hover"></div>');
		p.id = id;
		
		return p;
	};
	
	//The actual Three.js scene
	var Scene = function(holder, data) {
		var p, light, objectHolder, items, geom, geomMaterial, selectMaterial, selected, dragStart, toUpdate;
		p = {};
		items = [];
		p.renderer = (data.renderer == "canvas") ? new THREE.CanvasRenderer() : new THREE.WebGLRenderer();
		p.renderer.setSize(data.width, data.height);
		p.scene = new THREE.Scene();
		p.camera = new THREE.Camera( 45, data.width/data.height, 0.1, 10000 );
		p.camera.position.y = 150;
		p.camera.position.z = 500;
		holder.append(p.renderer.domElement);
		
		objectHolder = new THREE.Object3D();
		p.scene.addObject(objectHolder);
		
		geomMaterial = new THREE.MeshLambertMaterial( { color: 0xdfdfdf, shading: THREE.FlatShading } );
		selectMaterial = new THREE.MeshLambertMaterial( { color: 0xffb119, shading: THREE.FlatShading } );
		
		//Adds the lights
		(function() {
			var ambientLight = new THREE.AmbientLight( 0xbcbcbc );
			p.scene.addLight( ambientLight );

			var directionalLight = new THREE.DirectionalLight( 0xaaaaaa );
			directionalLight.position.y = .3;
			p.scene.addLight( directionalLight );
			
			directionalLight = new THREE.DirectionalLight( 0xaaaaaa );
			directionalLight.position.y = -.3;
			p.scene.addLight( directionalLight );
		})();
		
		//Draws the scene grid
		(function() {
			var geometry = new THREE.Geometry();
			geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( - 1000, 0, 0 ) ) );
			geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( 1000, 0, 0 ) ) );

			var material = new THREE.LineBasicMaterial( { color: 0x666666, opacity: 0.4 } );

			for ( var i = 0; i <= 10; i ++ ) {

				var line = new THREE.Line( geometry, material );
				line.position.y = - 80;
				line.position.z = ( i * 200 ) - 1000;
				objectHolder.addChild( line );

				var line = new THREE.Line( geometry, material );
				line.position.x = ( i * 200 ) - 1000;
				line.position.y = - 80;
				line.rotation.y = 90 * Math.PI / 180;
				objectHolder.addChild( line );
			}
			render();
		})();
		
		//Scene rotation
		holder.bind('mousedown', mouseDown);
		function mouseDown(e) {
			holder.unbind('mousedown', mouseDown);
			holder.bind('mousemove', mouseMove);
			$(window).bind('mouseup', mouseup);
			toUpdate = (selected && selected.type != POINT) ? selected.three : objectHolder;
			dragStart = { x:e.pageX, y:e.pageY, rx:toUpdate.rotation.x, ry:toUpdate.rotation.y };
			e.preventDefault();
		}
		function mouseMove(e) {
			var offx, offy;
			offx = e.pageX - dragStart.x;
			offy = e.pageY - dragStart.y;
			
			toUpdate.rotation.y = dragStart.ry + (offx * .005);
			toUpdate.rotation.x = dragStart.rx + (offy * .005);
			render();
		}
		function mouseup(e) {
			$(window).unbind('mouseup', mouseup);
			holder.unbind('mousemove', mouseMove);
			holder.bind('mousedown', mouseDown);
		}
		
		function getObject(id) {
			for(var i = 0; i < items.length; i++) {
				if(items[i].id == id) {
					return items[i];
				}
			}
			return false;
		}
		
		function render() {
			p.renderer.render(p.scene, p.camera);
			if(selected) {
				holder.trigger("updateInspector", selected);
			}
		}
		
		p.enableDrag = function() {
			holder.unbind('mousedown', mouseDown);
			holder.bind('mousedown', mouseDown);
		}
		
		p.disableDrag = function() {
			holder.unbind('mousedown', mouseDown);
		}
		
		p.getScene = function() {
			return {items:items, holder:objectHolder}; 
		}
		
		p.createObject = function(objectData) {
			
			var newItem = new SceneObject(objectData);
			
			switch(objectData.type) {
				case PLANE:
					geom = new THREE.Mesh( new THREE.PlaneGeometry( 100, 150, 1, 1 ), geomMaterial );
					geom.doubleSided = true;
					break;
				case CUBE:
					geom = new THREE.Mesh( new THREE.CubeGeometry( 100, 100, 100 ), geomMaterial );
					break;
				case SPHERE:
					geom = new THREE.Mesh( new THREE.SphereGeometry( 50, 16, 16 ), geomMaterial );
					break;
				case POINT:
					geom = new THREE.PointLight( 0xffffff, 1 );
					break;
			}
			
			if(objectData.duplicate) {
				geom.position.x = selected.three.position.x,
				geom.position.y = selected.three.position.y,
				geom.position.z = selected.three.position.z,
				geom.rotation.x = selected.three.rotation.x,
				geom.rotation.y = selected.three.rotation.y,
				geom.rotation.z = selected.three.rotation.z,
				geom.scale.x = selected.three.scale.x,
				geom.scale.y = selected.three.scale.y,
				geom.scale.z = selected.three.scale.z,
				geom.intensity = selected.three.intensity
			}
			
			items.push(newItem);
			newItem.three = geom;
			objectHolder.addChild(geom);
			render();
		}
		
		p.selectItem = function(itemId) {
			selected = undefined;
			for(var i = 0; i < items.length; i++) {
				if(items[i].id == itemId) {
					if(items[i].three.materials) items[i].three.materials[0] = selectMaterial;
					items[i].selected = true;
					selected = items[i];
				} else {
					if(items[i].three.materials) items[i].three.materials[0] = geomMaterial;
					items[i].selected = false;
				}
			}
			render();
		}
		
		p.updateObject = function(objectData) {
			var amt, val;
			if(selected) {
				if(objectData.justDown) {
					//saves a copy of the current scene object data
					//allows for more accurate positioning 
					startDrag = {
						px:selected.three.position.x,
						py:selected.three.position.y,
						pz:selected.three.position.z,
						rx:selected.three.rotation.x,
						ry:selected.three.rotation.y,
						rz:selected.three.rotation.z,
						sx:selected.three.scale.x,
						sy:selected.three.scale.y,
						sz:selected.three.scale.z,
						li:selected.three.intensity
					}
				}
				if(objectData.value || objectData.value == 0) val = objectData.value;
				if(val && isNaN(val)) {
					return;
				} else {
					val = Number(val);
				}
				switch(objectData.set) {
					case "position":
						amt = objectData.offset * .5;
						switch(objectData.prop) {
							case "x":
								selected.three.position.x = (val || val == 0) ? val : startDrag.px + amt;
								break;
							case "y":
								selected.three.position.y = (val || val == 0) ? val : startDrag.py + amt;
								break;
							case "z":
								selected.three.position.z = (val || val == 0) ? val : startDrag.pz + amt;
								break;
						}
						break;
					case "rotation":
						amt = objectData.offset * .005;
						switch(objectData.prop) {
							case "x":
								selected.three.rotation.x = (val || val == 0) ? val : startDrag.rx + amt;
								break;
							case "y":
								selected.three.rotation.y = (val || val == 0) ? val : startDrag.ry + amt;
								break;
							case "z":
								selected.three.rotation.z = (val || val == 0) ? val : startDrag.rz + amt;
								break;
						}
						break;
					case "scale":
						amt = objectData.offset * .005;
						switch(objectData.prop) {
							case "x":
								selected.three.scale.x = (val || val == 0) ? val : startDrag.sx + amt;
								break;
							case "y":
								selected.three.scale.y = (val || val == 0) ? val : startDrag.sy + amt;
								break;
							case "z":
								selected.three.scale.z = (val || val == 0) ? val : startDrag.sz + amt;
								break;
						}
						break;
					case "light":
						amt = objectData.offset * .005;
						selected.three.intensity = (val || val == 0) ? val : startDrag.li + amt;
						break;
				}
			}
			render();
		}
		
		p.removeObject = function(itemId) {
			var item = getObject(itemId);
			if(item) {
				objectHolder.removeChild(item.three);
				for(var i = 0; i < items.length; i++) {
					if(items[i].id == itemId) {
						items.splice(i,1);
						selected = undefined;
						break;
					}
				}
				render();
			}
		}
		
		p.toggleVisibility = function(objectData) {
			var item = getObject(objectData.id);
			if(item) {
				(objectData.visible == false) ? objectHolder.removeChild(item.three) : objectHolder.addChild(item.three);
				render();
			}
		}
		
		return p;
	};
	
	//The toolbar for creating Three.js objects
	var Toolbar = function(holder, data) {
		var i, ti, bgp, label;
		
		for ( i = 0; i < data.icons.length; i++) {
			ti = new ToolIcon(data.icons[i].id, data.icons[i].label);
			bgp = '0px ' + (-i * 30) + 'px';
			ti.icon.css('backgroundPosition', bgp);
			holder.append(ti.icon);
		}
	};
	
	//Icons in the Toolbar
	//One for each creatable object
	var ToolIcon = function(id, label) {
		var p;
		p = {};
		p.icon = $( '<div class="toolbar_icon ui_img_bg bg_hover"></div>' );
		p.icon.bind('click', iconClick);
		p.id = id;
		
		function iconClick(e) {
			p.icon.trigger( 'iconClicked',  { id:id } );
		}
		
		return p;
	};
	
	
	
	//UTILITIES//
	
	function setAsTipItem(thing, tip) {
		thing.bind('mouseover', function(e) {
			
		});
	};
	
})();
