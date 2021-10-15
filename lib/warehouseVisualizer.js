//Start visual class: Discussion on using classes with JavaScript: https://addyosmani.com/resources/essentialjsdesignpatterns/book/
function warehouse (overrideProperties) {

	var properties = {//Default visual layout props; attributes can be changed with attributes in ojb3dProperties
		version: 0.98,
		featureVersion: "Full",																		//Full or Activity Only version
		id: "Visual" + uuidv4(),																    //UniqueID
		scene: 	{	obj:null, 																		//https://threejs.org/docs/index.html#api/scenes/Scene
					background:"black",
					controller:{background:"color"}
				},	
																									//background: any color acceptable to THREE.Color: https://threejs.org/docs/index.html#api/math/Color				
		camera: {	obj:null,																		//https://threejs.org/docs/index.html#api/cameras/Camera
					fov:45,
					controller:{fov:{type:"number", minMaxStep: [1,179,1]}}
				},
		renderer:{ 	obj:null},																		//https://threejs.org/docs/index.html#api/renderers/WebGLRenderer
		controls: { obj:null,																		//https://threejs.org/docs/index.html#examples/controls/OrbitControls
					maxPolarAngle: 90,																//90 degrees: Don't rotate below Y = 0 plane, > 90 degrees camera can go -Y 
					zoomSpeed: 1, 																    //https://threejs.org/docs/index.html#examples/controls/OrbitControls.zoomSpeed
					panSpeed: 1, 																    //https://threejs.org/docs/index.html#examples/controls/OrbitControls.panSpeed
					controller:{maxPolarAngle: {type:"number", minMaxStep: [0,180,1]},
								zoomSpeed: {type:"number", minMaxStep: [0.1,2,.1]},	
								panSpeed: {type:"number", minMaxStep: [0.1,2,.1]}	
					           }
				  } ,	   
		mouse: new THREE.Vector2(),
		raycaster: new THREE.Raycaster(),
		boundingBox: {	obj:null,
						boundingRange: null,														//A Three.js Vector with +/- lengths along x,y,z axis relative to scene/world 0,0,0	
						visible:true,
						color:"white",
						controller:{visible:"boolean", color:"color"}
					},			
		axesHelper: {	obj:null,
						visible:false,
						controller:{visible:"boolean"}
					},	
 		gridHelper: {	obj:null,
					    gridSize:null,	
						visible:false,																//Set to true to see grid and minimum visual y for image									
						color:"green",																//Default CSS color for grid
						colorCenter:"white",														//Default CSS color for grid's centerline
						divisions:10, 																//Defuault number of divisions for GridHelper
						controller:{visible:"boolean", 
									color:"color", 
									colorCenter:"color", 
									divisions:{type:"number",minMaxStep: [2,20,1]}}
					}, 	
        stats: null, 																			    //Stats Performance display					
		datGui:null,																				//dat.gui  http://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage 
  		datGuiSettings:{},																			//API: https://github.com/dataarts/dat.gui/blob/master/API.md		
		//Made this way for possible translation to other languages
		localLanguage: "en", 																	    //English
		
		datGuiFolders:	{ 	monitor: {isLeaf:true},
							showActive: { isLeaf:true},
							showLate: { isLeaf:true},
							empID:    {isLeaf: true}, 	
							activityLegend: {isFolder:true},							
							clearActivity: { isLeaf:true},
							clearSelection: {isLeaf:true},		
							analyze: {isFolder:true,
										folders:{	
													inventory: { isFolder:true, 
																 color: { isLeaf:true},
																 scaleType: { isLeaf:true},
																 scale:  { isLeaf:true},         			 //Rendered by custom gorilla dropdown   
																 scaleLow: { isLeaf:true},
																 scaleHigh: { isLeaf:true}
															},
													activity: { isFolder:true,
																 start:   { isLeaf:true},
																 end:     { isLeaf:true},
																 interval:{ isLeaf:true},
																 period:  { isLeaf:true},
																 speed:   { isLeaf:true},		
																 run:	  { isLeaf: true},
																 workflow: { isLeaf: true},																	 
																 cumulative: { isLeaf: true},	
																 moveType: { isLeaf:true}																 			
															}											
																  
												}
										
									}, 	   									
							selection: { isFolder:true,
										folders: {	bayview: {isFolder:true},
													item: { isFolder:true},
													details: { isFolder:true},
													rendering: {isFolder:true}
												}
										},
							beyeV: 		{ isLeaf:true},
							inventoryGrid: 	{ isLeaf:true},
							activityGrid: 	{isLeaf:true},
							performance:{ isLeaf:false},						//https://github.com/mrdoob/stats.js#readme							
							visual: 	{isFolder:true,
										 folders:{
											details: {isFolder:true}, 
											properties: {isFolder:true}   //leaves filled programatically
										 }		
										},  
							help:		{isLeaf: true},
							about:		{isLeaf: true}
						},										
		container: document.body,																	//Can be overriden
		height: "500px",																			//Defualt height (px) 
		width: "100%",																				//Default width (px) or (%)	
		layoutData:  [{id:"A", sceneX:0.5, sceneY:0.5, sceneZ:0.5,recid:1,							//Simple 1 X 1 X 1 cube, centered on 0,0,0
						sceneWidth: 1, sceneDepth: 1, sceneHeight: 1, color: "white"}				//Remember: When doing WebVR with A-Frame have to take in metric unit scaling factor 
					 ], 																			//https://developer.mozilla.org/docs/Web/API/WebVR_API				   
		schema:{id:			function(obj){return obj.id},
		        sceneX: 	function(obj){return obj.sceneX},
				sceneY: 	function(obj){return obj.sceneY},
				sceneZ: 	function(obj){return obj.sceneZ},
				sceneWidth: function(obj){return obj.sceneWidth},
				sceneDepth: function(obj){return obj.sceneDepth},
				sceneHeight:function(obj){return obj.sceneHeight},		
				color:		function(obj){return obj.color}
				},
		inventoryData: [{LOCATION:"A",STATUS:"Empty" }],												//Data for an individual slot
		inventoryDataTypes: {},																			//Data Types calculated in fnPreProcess	
        activityDataTypes:{},
		datGuiMoveTypesAndColor:{},																		//Object hold ativities and their colors
		datGuiEmployees:[],																				//Array of employees from both completed and active activity files
		selectionLinks:[],																				//Array of selection links
		warehouseGroup: null,																			//All the objects displayed in the scene.  It's a child of sceneGroup
		sceneGroup: null,																				//Collection of of sub objects for easy transformation
		fnBuildWarehouse: fnBuildWarehouse,																//Method to build the group displayed in the scene
		fnBuildInventoryGrid: fnBuildInventoryGrid,														//Method to layout data grid from properties.layoutData
		inventoryGrid: {data: null, obj:null},															//w2ui data grid used for filtering
        animationFrame: null,																			//Animation Frame used for rendering //https://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
		display: display,																				//Invoked to render thes scene
		setColumn: setColumn,																			//Programatically pre-set the column to be displayed: columnName,scale																						// optional scale: array: [scale], [scaleHL] or [colorLow,colorHigh]				
        setLayoutData: setLayoutData,
		setActivityCompletedData: setActivityCompletedData,
		setActivityActiveData: setActivityActiveData,
		setInventoryData: setInventoryData,
		setCallBackReload: setCallBackReload,
		addSelectionLink: addSelectionLink,
		callBackLayoutData: function(){ },																//Load Layout data
		callBackActivityCompletedData: function(){},													//Load Activity data																							
		callBackActivityActiveData: function(){},														//Load Activity data																							
		callBackInventoryData: function(){},															//Load Slot data		
		callBackReload: null,
		refreshTime: 5,																					//
		destroy: fnSetEnvironment																		//Used if loading different files by interface to destroy the current visualization
		
	} //properties


	// SET SCENE PROPERTIES
	if (overrideProperties) 
		fnSetSceneProperties(overrideProperties);													//Use Override properties if they were set
	

	return properties;																				//Return the complete properties object to caller

	/////////////////////////////////////////////////////////////////M E T H O D S ////////////////////////////////////////////////////////////////////////////////////

	function translate(prop){
		return properties.translations[properties.localLanguage][prop];			
	} //translate		
	
	function setLayoutData(layoutData){
		properties.callBackLayoutData(properties,layoutData);			
	} // setLayoutData
	
	function addSelectionLink(link) {
			properties.selectionLinks.push(link);
	} //addSelectionLink
	
	function setActivityCompletedData(activityCompletedData){
		
		properties.activtyLoading = true;
		
		properties.callBackActivityCompletedData(properties,activityCompletedData);

		if (properties.activityCompletedData){
			
			//properties.datGuiMoveTypesAndColor = {}; //Activities (with assigned Colors) filtered on in dat.Gui   
			
			//Detrmine DataTypes 
			for (var i=0; i < properties.activityCompletedData.length; i++){
					
				//DETERMINE DATATYPES (properties.activityDataTypes)
				// CALCULATE DATATYPES by inspecting each column of each row...only if it hasn't been done already
				if (Object.keys(properties.activityDataTypes).length == 0) {
					var mergedRow = i == 0 ? {} : mergedRow;
					Object.assign(mergedRow,properties.activityCompletedData[i]);
					var aKeys = Object.keys(mergedRow);
					aKeys.forEach(function(key) { 
						if (properties.activityDataTypes[key]) {
							properties.activityDataTypes[key] = properties.activityDataTypes[key] == "text" ? "text"  :  isNaN(Number(mergedRow[key])) ? "text" : "float";
						} //if
						else {
							properties.activityDataTypes[key] =  isNaN(Number(mergedRow[key])) ? "text" : "float";
						} //else
					}); //aKeys.forEach
				} //if	
				
				//New activities specfic to load...may grow with subsequent data loads
				if (!properties.datGuiMoveTypesAndColor.hasOwnProperty(properties.activityCompletedData[i].MOVE_TYPE)) {   //Only include unqiue activities. 
					properties.datGuiMoveTypesAndColor[properties.activityCompletedData[i].MOVE_TYPE] =  "";				//Color to be assigned later
				} //if
				
				if (properties.datGuiEmployees.indexOf(properties.activityCompletedData[i].EMP_ID) == -1 ){
					properties.datGuiEmployees.push(properties.activityCompletedData[i].EMP_ID);
				}//if
		
			} //for
			
			properties.datGuiEmployees.sort();
			
			var aActivityTypes = Object.keys(properties.datGuiMoveTypesAndColor).sort();
			aActivityTypes.forEach(function(activity,i) {
										properties.datGuiMoveTypesAndColor[activity] = d3.schemeCategory10[i]  }             //Color assignment
										);//https://github.com/d3/d3-scale-chromatic


				
			if (!properties.mapBayActivityLocation) properties.mapBayActivityLocation  = new HashMap();	//Only have to build activity locations once for the layoutData	
			
			// Activity visualzation located/centered at aAislesActivityLocation[properties.activityCompletedData[i].aisleIndex].center		
			if (properties.mapBayActivityLocation.size == 0) {
	
				var bayStats = d3.nest()
					.key(function (d) {return d.AISLE } )   //Use two keys...easier when creating properties.mapBayActivityLocation
					.key(function (d) {return d.BAY} )
					.rollup(function (leaves){
								var bounds =[];
								//Calcuate Bounds for each slot within a bay
								for (var i = 0; i < leaves.length; i++){
									var coordinate = leaves[i].CENTERAXIS == "X" ? 	parseFloat(leaves[i].Y) : 	parseFloat(leaves[i].X);
									var dimension = leaves[i].CENTERAXIS == "X" ? 	parseFloat(leaves[i].DEPTH) : 	parseFloat(leaves[i].WIDTH);
									bounds[i] = {  min: coordinate - (dimension/2), max: coordinate + (dimension/2) };							
								}//for
					
								var min = d3.min(bounds, function (bound){ return bound.min });
								var max = d3.max(bounds, function (bound){ return bound.max });
								var middle = min + ((max - min) / 2);
								var aisleSideFactor = leaves[0].AISLESIDE == "R" ?  //subtract for right, add for left when centered on X, the opposite when cenered on Y
																		leaves[0].CENTERAXIS == "X" ? 
																					-1 : 1  	 	: 
																		leaves[0].CENTERAXIS == "X" ? 
																					1 : -1;      
								var coordinate = leaves[0].CENTERAXIS == "X" ? 
													parseFloat(leaves[0].X) + (properties.aisleWidthEdgeToEdge/4 * aisleSideFactor) : 		
													parseFloat(leaves[0].Y) + (properties.aisleWidthEdgeToEdge/4 * aisleSideFactor); 
								var x = leaves[0].CENTERAXIS == "X" ? coordinate : middle;
								var y = leaves[0].CENTERAXIS == "Y" ? coordinate : middle;								
								return {min			: min, 
										max			: max,
										centerLine	: leaves[0].CENTERAXIS,
										center		: {x: x, y:y}  									
													
										};
							})
					.entries(properties.layoutData);	
				
				for (var i = 0; i < bayStats.length; i++){
					for (var j=0; j < bayStats[i].values.length; j++){
						var location =
							{aisle		: bayStats[i].key,
							 bay		: bayStats[i].values[j].key,	
							 min		: bayStats[i].values[j].value.min,
							 max		: bayStats[i].values[j].value.max,
							 centerLine	: bayStats[i].values[j].value.centerLine,
							 center		: bayStats[i].values[j].value.center
							};

						properties.mapBayActivityLocation.set(bayStats[i].key + "_" + bayStats[i].values[j].key, location);  //Using  unique key of aisle + "_" + bay	
					} //for
				} //for

				
			} //if
			else {	//Make all existing risers previously built/assigned in fnBuildScene invisibile
				
				properties.mapBayActivityLocation.forEach(function(location,key){location.activityObj.activityRiser.visible = false; } );
				
			} //else
			
			//Rebuild Activity dat.gui section
			if (properties.guiActivityFolder) {
						properties.ActivityFolderClosed = properties.guiActivityFolder.closed;
						properties.guiAnalyzeFolder.removeFolder(properties.guiActivityFolder);
						properties.guiActivityFolder = properties.guiAnalyzeFolder.addFolder(translate("datGuiFolders.analyze.folders.activity"))
						fnBuildActivityFolderContent();      								//If dat Gui was already built, rebuild activity folder for new data
						if (!properties.ActivityFolderClosed){	
							properties.guiAnalyzeFolder.open();
							properties.guiActivityFolder.open();
						} //if
						else {
							fnResetActivityRisers();			//Clear any historical activity being displayed	
						} //else	
			} //if

			
		} //if 
		
		properties.activtyLoading = false;
		
	} //setActivityCompletedData	
	
	
	function setActivityActiveData(activityActiveData){	
	
		properties.callBackActivityActiveData(properties,activityActiveData);	
		
		if (properties.activityActiveData){
		
			//Handle Employees that may be unique to active activities
			for (var i=0; i < properties.activityActiveData.length; i++){
				
				//New activities specfic to load...may grow with subsequent data loads
				if (!properties.datGuiMoveTypesAndColor.hasOwnProperty(properties.activityActiveData[i].MOVE_TYPE)) {   //Only include unqiue activities. 
					properties.datGuiMoveTypesAndColor[properties.activityActiveData[i].MOVE_TYPE] =  "";				//Color to be assigned later
				} //if
				
				if (properties.datGuiEmployees.indexOf(properties.activityActiveData[i].EMP_ID) == -1 ){
					properties.datGuiEmployees.push(properties.activityActiveData[i].EMP_ID);
				}//if
		
			} //for
			
			properties.datGuiEmployees.sort();
			
			var aActivityTypes = Object.keys(properties.datGuiMoveTypesAndColor).sort();
			aActivityTypes.forEach(function(activity,i) {
										properties.datGuiMoveTypesAndColor[activity] = d3.schemeCategory10[i]  }             //Color assignment
										);//https://github.com/d3/d3-scale-chromatic			
			
			
			if (properties.showLateController) {
				//Rebuild Active Activity display if it was enabled
				var showLate = properties.showLateController.getValue();
				if (properties.showActiveController.getValue()) {
					properties.showActiveController.setValue(false);
					properties.showActiveController.setValue(true);
					properties.showLateController.setValue(showLate);
				} //if			
			} //if
			

		} //if
		
	
	} //setActivityCompletedData	
	
	
	function setInventoryData(inventoryData){
		properties.callBackInventoryData(properties,inventoryData);	
		
		if (properties.inventoryData) {
			
			properties.inventoryDataTypes = [];
			properties.inventoryGrid = {data: null, obj:null};
			
			//CREATE recid for datagrid
			//DETERMINE DATATYPES (properties.inventoryDataTypes)
			for (var i = 0; i < properties.inventoryData.length; i++ ){
										
				properties.inventoryData[i].recid = i + 1;  //For the dataGrid

				// CALCULATE DATATYPES by inspecting each column of each row
					var mergedRow = i == 0 ? {} : mergedRow;
					Object.assign(mergedRow,properties.inventoryData[i]);
					var aKeys = Object.keys(mergedRow);
					aKeys.forEach(function(key) { 
						if (properties.inventoryDataTypes[key]) {
							properties.inventoryDataTypes[key] = properties.inventoryDataTypes[key] == "text" ? "text"  :  isNaN(Number(mergedRow[key])) ? "text" : "float";
						} //if
						else {
							properties.inventoryDataTypes[key] =  isNaN(Number(mergedRow[key])) ? "text" : "float";
						} //else
					}); //aKeys.forEach
				
															
			} //for 	

			
			if (properties.warehouseGroup)
				fnAddPallets();	 //Add pallets to slots.  Must be done here, because inventory can change on every reload
	
		} //if
		
		
		
		if (properties.guiActivityFolder) {
			//Re-render the warehouse with whatever analysis properties the user may have set manually
			fnVisualizeInventory(fnGetColumnAttributes(properties.inventoryColor.getValue()), true);	
		} //if			

		
	} //setInventoryData	


	function fnMonitorActivity(action){
		
		switch(action) {
			case "toggle":
				//var datGuiMonitorSpanText = $(properties.datGui.__controllers.find(function(controller){return controller.property == "datGuiFolders.monitor"}).domElement.parentNode).find("span").text();
				var datGuiMonitorSpanText = $(properties.monitorController.domElement.parentNode).find("span").text();
				switch (datGuiMonitorSpanText){
					case translate("datGuiFolders.monitor"):
						fnMonitorActivity("start");
						break;
					default:	
						fnMonitorActivity("stop");	
				} //switch
				break;
			case "start":           
				fnReloadTimer();
				break;
			case "stop":
				window.clearInterval(properties.callBackReload);
				properties.monitorController.name(translate("datGuiFolders.monitor"));  //Change display text in dat.gui
				break;
		} //switch
		
	} //fnMonitorActivity
	

	function setCallBackReload(fnReload){
		properties.fnReload = fnReload;
	} //setCallBackReload	
	
	//Countdown timer from: https://www.w3schools.com/howto/howto_js_countdown.asp
	function fnReloadTimer() {
		properties.monitorController.name(translate("datGuiLoadingMsg"));
		properties.fnReload();
		properties.nextRefresh = new Date();
		properties.nextRefresh.setMinutes(properties.nextRefresh.getMinutes() + properties.refreshTime );

		properties.callBackReload = 
			window.setInterval(	function() {

									  // Find the timeDiff between now an the count down date
									  var timeDiff = properties.nextRefresh - new Date().getTime()
									
									  // Time calculations for days, hours, minutes and seconds
									 // var days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
									 // var hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
									  var minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
									  var seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

									  if (timeDiff > 0) properties.monitorController.name(translate("datGuiStopMonitorMsg") + " " + minutes + "m " + seconds + "s ");


									  // If the count down is finished, call function reload
									  if (timeDiff < 0) {
											properties.monitorController.name(translate("datGuiLoadingMsg"));
											properties.datGuiEmployees = []; 		 //Employees Id filtered on in dat.Gui; cleared here because both completed and active activities must update
											properties.fnReload();	
											var nowPlus5 = new Date();
											nowPlus5 = nowPlus5.setMinutes(nowPlus5.getMinutes() + properties.refreshTime);
											properties.nextRefresh = nowPlus5;
									  }
								}, 1000 //Every Second
							);  		
		
		
		
	} //fnReloadTimer
		
	
	// DISPLAY
	function display() {
	
			//properties.fnSetSlotData(properties);																//Call data pre-processing
	
			fnSetEnvironment();
			
			fnBuildScene();																						//Build the scene; calls properties.fnBuildWarehouse
			
			fnSetBirdsEyeView();	
						
			
			//So that properties.sceneGroup.obj.matrixWorld get updated;
			properties.renderer.obj.render( properties.scene.obj, properties.camera.obj );
		
			fnSetStaticGuiControllers();																		//Sets dat.gui with properties.'obj'.controller settings	
			
			if (properties.activityCompletedData) {
				fnBuildActivityFolderContent();     //Build Analyze/Activity Folder
				fnResetActivityRisers();			//Clear any historical activity being displayed
			}	
	
			// COLOR THE OBJECTS AND OCUPPIED/EMPTY MESH TYPE BASED ON VALUE DISPLAYED TO USER IN dat.GUI
			
			if 	(properties.featureVersion == "Full") {
				fnVisualizeInventory(fnGetColumnAttributes(properties.inventoryColor.getValue()), true);	
			} //if
			else {
				properties.inventoryColor.setValue(translate("datGuiInversion"));
				fnVisualizeInventory(fnGetColumnAttributes(properties.inventoryColor.getValue()), true);			
			} //else
			
			
			properties.showActiveController.setValue(false); //Don't Show Active Activities	
			properties.guiActivityLegendFolder.close();  //Show the activity legend

			fnShowFeatureVersion();	

			fnSetBirdsEyeView();	
						
			animate();
			
	
	} //display
	
	

	
	
	function fnShowFeatureVersion(){
				
		if 	(properties.featureVersion == "Activity") {

			//Hide to Monitor controller
			//$(properties.monitorController.domElement.parentElement.parentElement).hide();		
			
			//Hide Clear Completed Activity controller
			$(properties.clearCompletedActivityController.domElement.parentElement.parentElement).hide();	

			
			//Hide Clear Selection(s) and Search controller
			//$(properties.clearSelectionsController.domElement.parentElement.parentElement).hide();	

			//Hide Inventory Grid Controller 
			$(properties.inventoryGridController.domElement.parentElement.parentElement).hide();				
					
			//Hide Activity Grid Controller 
			$(properties.activityGridController.domElement.parentElement.parentElement).hide();		

			//Hide Analyze Folder
			$(properties.guiAnalyzeFolder.domElement).hide();	
			
			//Hide Selection Bay View Folder
			$(properties.guiSelectionBayViewFolder.domElement).hide();	
			
			//Hide Selection Details Link Folder
			$(properties.guiSelectionLinksFolder.domElement).hide();	

			//Hide Item Details Folder
			//$(properties.guiSelectionItemFolder.domElement).hide(); 
			
			//Hide Selection Rendering Info Folder
			//$(properties.guiRenderingInfoFolder.domElement).hide();				
			

			
			
		} //if	
		
	}	//fnShowFeatureVersion		
	
	
	
	// SET COLUMN
	function setColumn(column, scale){
		
		if (column == translate("datGuiNoColor") || column == translate("datGuiRandom") || column == translate("datGuiInversion")  ) {
			properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.color"] = column;
			if (properties.datGui) properties.datGui.updateDisplay();
			return;
		} //if
	
		properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.color"] = scale ? column + " (S)" : column + " (C)" ;
		if (scale) {
			splitScale = scale.split(",");
			switch (splitScale.length) {
				case 1:
					properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scale"] = fnGetD3ScalesIndex(scale);
					properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleType"] = translate("datGuiScalePredfined");		
					break;
				case 2:
					properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleLow"] =  splitScale[0];
					properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleHigh"] = splitScale[1];
					properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleType"] = translate("datGuiScaleCustom");					
					break;
				default:	
			} //switch
		}

		if (properties.datGui) properties.datGui.updateDisplay();
	} //setColumn
	

	// SET THE ENVIRONMENT
	function fnSetEnvironment() {
		
		
			properties.height = $(properties.container).height() == 0 ? properties.container.parentElement.clientHeight :  $(properties.container).height();
			properties.width  = $(properties.container).width() == 0 ? properties.container.parentElement.clientWidth :  $(properties.container).width();
	
			// CLEAR (see https://github.com/mrdoob/three.js/issues/385 )
			THREE.Object3D.prototype.clear = function(){
			var children = this.children;
				for(var i = children.length-1;i>=0;i--){
					var child = children[i];
					child.clear();
					this.remove(child);
				};
			};
	
	
			if (properties.animationFrame) window.cancelAnimationFrame(properties.animationFrame);
			if (properties.scene.obj) {
				properties.scene.obj.clear(); 
				doDispose(properties.scene.obj);
			}
			if (properties.renderer.obj) {
				properties.container.removeChild(properties.renderer.obj.domElement);
				properties.renderer.obj.dispose();
				properties.renderer.obj.forceContextLoss();     //https://threejs.org/docs/index.html#api/renderers/WebGLRenderer.forceContextLoss
				properties.renderer.obj.context=undefined;
				properties.renderer.obj.domElement=undefined;
			}	

			//ADD NEW CSS RULE so that dat.GUI CSS to handle custom additions
			properties.bayViewHeight = 250;
			for (var i = document.styleSheets.length -1 ; i >= 0; i-- ){
				if (document.styleSheets[i].constructor.name == "CSSStyleSheet") {
					if (document.styleSheets[i].cssRules[0].selectorText.indexOf(".dg") != -1) {
						if  (document.styleSheets[i].cssRules[0].selectorText.indexOf(".dg li.gui-legend") == -1 ) {   //Don't re-add if already exists
							document.styleSheets[i].insertRule(".dg li.gui-bayView:not(.folder) { height:" + properties.bayViewHeight +"px; width:100%; }");
							document.styleSheets[i].insertRule(".dg li.gui-scalelist:not(.folder) { height: auto; }");
							document.styleSheets[i].insertRule(".dg li.gui-stats:not(.folder) { height: auto; }");
							document.styleSheets[i].insertRule(".dg li.gui-activity:not(.folder) { height: 100px; }");
							document.styleSheets[i].insertRule(".dg li.gui-legend:not(.folder) {  height:100px; }");
						}
						break;
					} //if	
				} //if	
			} //for	
			
			//NULL-OUT any .obj PROPERTY
			for (var prop in properties){
				if (properties[prop] && properties[prop].hasOwnProperty("obj")) properties[prop].obj = null;
			} //for
				
		
		//Clear any timers
		if (properties.callBackReload) window.clearInterval(properties.callBackReload);
		if (properties.timerInactiveActivity) window.clearInterval(properties.timerInactiveActivity);
	
		//Remove window event listeners that reference fnfnHandleKeyMouse so reference to 'propeties' is freed-up
		if (typeof properties.fnHandleKeyMouse != "undefined") {
			document.removeEventListener( 'keydown', properties.fnHandleKeyMouse );								
			document.removeEventListener( 'mousedown', properties.fnHandleKeyMouse);	
			document.removeEventListener( 'mouseup', properties.fnHandleKeyMouse);
			document.removeEventListener( 'dblclick', properties.fnHandleKeyMouse);
		} //if	
	
	
		fnBayViewDestroy();
	
	
	} //fnSetEnvironment
	
	
	
	//https://stackoverflow.com/questions/22565737/cleanup-threejs-scene-leak
	function doDispose (obj){
        if (obj !== null){
            for (var i = 0; i < obj.children.length; i++){
                doDispose(obj.children[i]);
            } //for
            if (obj.geometry){
                obj.geometry.dispose();
                obj.geometry = undefined;
            }
            if (obj.material){
                if (obj.material.map){
                    obj.material.map.dispose();
                    obj.material.map = undefined;
                }
                obj.material.dispose();
                obj.material = undefined;
            }
        }
        obj = undefined;
    } //doDispose
	
	
	//Destroy previous version of bay view...if it exists
	function fnBayViewDestroy() {
								
		if (properties.bayRenderer) {   //remove previous references
		
			$(properties.detailSpan).off( 'dblclick');	
			$(properties.detailSpan).off( 'click');				
			properties.bayAnimationFrame = null;
			properties.detailSpan.removeChild(properties.bayRenderer.domElement);
			properties.bayRenderer.dispose();
			properties.bayRenderer.forceContextLoss();     //https://threejs.org/docs/index.html#api/renderers/WebGLRenderer.forceContextLoss
			properties.bayRenderer.context=undefined;
			properties.bayRenderer.domElement=undefined;
			$(properties.bayViewLI).empty(); //remove all child elements of bayViewLi
		}							
	
	} //fnBayViewDestroy	

	
	// SET SCENE PROPERTIES
	function fnSetSceneProperties(overrideProperties) {
		
		properties.layoutData = overrideProperties.layoutData ? overrideProperties.layoutData : properties.layoutData;					//Use override data/schema if they exists.
		properties.schema = overrideProperties.schema ? overrideProperties.schema : properties.schema;
		properties.inventoryData = overrideProperties.inventoryData ? overrideProperties.inventoryData : properties.inventoryData;
				
		$.extend(true,properties,overrideProperties);														//Deep extend: http://api.jquery.com/jQuery.extend/
				
		
	} //fnSetSceneProperties	
	
	//Display pop-up Window
	function fnPopUp(title,html,wf,hf){ 
		w2popup.open({	title: title,
						body: html,
						buttons   : '<button onclick="w2popup.close();">' + translate("popUpClose") + '</button>',	
						showMax: false,
						showClose: true,
						width: properties.width/wf,
						height: properties.height/hf,
						modal: false
					 });
	} // fnPopUp	

	
	// SET dat.Gui CONTROLLERS	
	function fnSetStaticGuiControllers(){	

	
		// if (properties.datGui) properties.datGui.destroy();
		
		if (!properties.datGui) {
			//properties.datGui = new dat.GUI({closeOnTop: true, width:325, autoPlace:false});
			properties.datGui = new dat.GUI({closeOnTop: true, width:450});
			//properties.datGui.useLocalStorage = true;
		}	
		
		properties.container.appendChild(properties.datGui.domElement);
		
		//Keep dat.GUI from sending events to visualization
		properties.datGui.domElement.addEventListener( 'mousedown', function (event){event.stopPropagation(); }, false );
		properties.datGui.domElement.addEventListener( 'keydown', function (event){event.stopPropagation(); } , false );								
		properties.datGui.domElement.addEventListener( 'dblclick', function (event){event.stopPropagation(); }, false );		
		
		//Set the zIndex as a function of the container..if it exists
		var zIndex = parseFloat($(properties.container).css("z-index")) ?  parseFloat($(properties.container).css("z-index"))  : 0;
		
		d3.select(".dg.main")
			.style("position","absolute")
			.style("top",0)
			.style("right",0)
			.style("z-index",zIndex - 1);
				
		
		var WFHelp1 = (properties.WebFOCUS) ? translate("WFHelp1") : "";
		var WFHelp2 = (properties.WebFOCUS) ? translate("WFHelp2") : translate("NoWFHelp1");
 	
		var helpText = translate("helpText1") +  WFHelp1 + translate("helpText2")  + WFHelp2 + translate("helpText3");
					  
		properties.datGuiSettings["datGuiFolders.help"] = function (){fnPopUp(translate("datGuiFolders.help"),helpText,3,2.5);};
		
		properties.datGuiSettings["datGuiFolders.beyeV"] = fnShowBirdsEyeView;
		properties.datGuiSettings["datGuiFolders.monitor"] = function(){fnMonitorActivity("toggle")};  //Will be added to datGui with fnBuildFoldersandLeaves
		properties.datGuiSettings["datGuiFolders.showActive"] = false; //Will be added to datGui with fnBuildFoldersandLeaves
		properties.datGuiSettings["datGuiFolders.showLate"] = false; //Will be added to datGui with fnBuildFoldersandLeaves
		properties.datGuiSettings["datGuiFolders.empID"] = properties.datGuiEmployees[0] ? properties.datGuiEmployees[0] : "" ;  //Dummy assignment since multi-select is not supported by dat.gui		
		
		properties.datGuiSettings["datGuiFolders.inventoryGrid"] = fnShowInventoryGrid;
		properties.datGuiSettings["datGuiFolders.activityGrid"] = function (){fnShowActivityGrid(properties.activityCompletedData)};
		properties.datGuiSettings["datGuiFolders.clearSelection"] = fnClearSelectionAndSearch;
		properties.datGuiSettings["datGuiFolders.clearActivity"] = function () { properties.guiActivityFolder.close(); fnResetActivityRisers()};
																						
				  
		properties.datGuiSettings["datGuiFolders.about"] = function (){fnPopUp(translate("appTitle") + " (" + properties.version +")",translate("aboutText"),3,5);};
				
		//BUILD FOLDERS AND LEAVES
		fnBuildFoldersAndLeaves(properties.datGui,properties.datGuiFolders,"datGuiFolders"); //recursive logic
		
		//Reference to Monitor controller
		properties.monitorController = 	properties.datGui.__controllers.find(function(controller){return controller.property == "datGuiFolders.monitor"});
		
		//Reference to Clear Completed Activity controller
		properties.clearCompletedActivityController = 	properties.datGui.__controllers.find(function(controller){return controller.property == "datGuiFolders.clearActivity"});
		
		//Reference to Clear Selection(s) and Search controller
		properties.clearSelectionsController = 	properties.datGui.__controllers.find(function(controller){return controller.property == "datGuiFolders.clearSelection"});
		properties.clearSelectionsController.name(properties.featureVersion == "Full" ? translate("datGuiFolders.clearSelection") : translate("datGuiFolders.clearSelectionActivity") )	


		//Reference to Inventory Grid Controller 
		properties.inventoryGridController = 	properties.datGui.__controllers.find(function(controller){return controller.property == "datGuiFolders.inventoryGrid"});		
				
		//Reference to Activity Grid Controller 
		properties.activityGridController = 	properties.datGui.__controllers.find(function(controller){return controller.property == "datGuiFolders.activityGrid"});		
		
		
		
		//Reference to Show Active Controller and add event handlder to fnShowActive
		properties.showActiveController = 	properties.datGui.__controllers.find(function(controller){return controller.property == "datGuiFolders.showActive"});	
		properties.showActiveController
			.name(translate("datGuiFolders.showActive") + (properties.activityActiveData ?  " (" + d3.format(',')(properties.activityActiveData.length) + ")" : "(0)") )
			.onChange(function (showActive) {
				
								if (showActive) {
									$(properties.showLateController.domElement.parentElement.parentElement).css("display","list-item");	
									properties.guiActivityLegendFolder.open();	
								}//if
								else {
									$(properties.showLateController.domElement.parentElement.parentElement).hide();
									properties.guiActivityLegendFolder.close();	
								}//else
									
								fnShowActive(showActive,"all") 
								
								});
		
		//Reference to Show Late Controller and add event handlder to fnShowActive	
		properties.showLateController = properties.datGui.__controllers.find(function(controller){return controller.property == "datGuiFolders.showLate"});
		$(properties.showLateController.domElement.parentElement.parentElement).hide();
		properties.showLateController
			.onChange(function (showActive) { fnShowActive(showActive,"late") });		


		//Add Employees

		//USING dat.GUI to build UI entry, will be overriden with a multi-select
		properties.empIDController = properties.datGui.__controllers.find(function(controller){return controller.property == "datGuiFolders.empID"});	

		//Custom Multi-select dropdown logic
		$(properties.empIDController.domElement.parentElement.parentElement).attr("class","gui-activity");   //Replace the class with gui-activity class
		properties.empID = $(properties.empIDController.domElement).find("select").attr("multiple",true).attr("size",5);  //jQuery selector
				
		properties.empID.children("option").prop("selected",true);   //Select all EmpIds initially
		
		properties.empID.change(function(){
					if (!properties.guiActivityFolder.closed && properties.activityCompletedData) { //Only if Activity folder is open and completed activity data was loaded
						fnUpdateAisleActivity(properties.periodController.getValue(), properties); 
					} //if	
					
					if (properties.showActiveController.getValue()){
						fnShowActive(false,"all");  //De-activate Show Activity 
						fnShowActive(true,properties.showLateController.getValue() ? "late": "all") //Reactivate it (either all or late) so employee filter will apply
					}
					
				});  //Update visualization when user changes activities			
		
	
		properties.empID.focus(); 
		
		

		//Reference to help controller		
		properties.helpController = 	properties.datGui.__controllers.find(function(controller){return controller.property == "datGuiFolders.help"});

		// FOLDER References
		properties.guiActivityLegendFolder = properties.datGui.__folders[translate("datGuiFolders.activityLegend")];
		properties.guiAnalyzeFolder = properties.datGui.__folders[translate("datGuiFolders.analyze")];
		properties.guiVisualFolder = properties.datGui.__folders[translate("datGuiFolders.visual")]
		properties.guiVisualLinksFolder = 	properties.guiVisualFolder.__folders[translate("datGuiFolders.visual.folders.details")];	
		properties.guiVisualPropertiesFolder = properties.guiVisualFolder.__folders[translate("datGuiFolders.visual.folders.properties")];
		properties.guiAnalyzeInventoryFolder = properties.guiAnalyzeFolder.__folders[translate("datGuiFolders.analyze.folders.inventory")];
		properties.guiActivityFolder = properties.guiAnalyzeFolder.__folders[translate("datGuiFolders.analyze.folders.activity")];		
		properties.guiPerformanceFolder = properties.datGui.__folders[translate("datGuiFolders.performance")];
		properties.guiSelectionFolder = properties.datGui.__folders[translate("datGuiFolders.selection")];
		properties.guiSelectionItemFolder = properties.guiSelectionFolder.__folders[translate("datGuiFolders.selection.folders.item")];
		properties.guiSelectionBayViewFolder = properties.guiSelectionFolder.__folders[translate("datGuiFolders.selection.folders.bayview")];
		properties.guiSelectionLinksFolder = properties.guiSelectionFolder.__folders[translate("datGuiFolders.selection.folders.details")];		
		properties.guiRenderingInfoFolder = properties.guiSelectionFolder.__folders[translate("datGuiFolders.selection.folders.rendering")];			
			
			
			
		//Add Activity Legend
		var arrActivities = Object.keys(properties.datGuiMoveTypesAndColor).sort();	

		arrActivities.forEach(function(activity) { 
								properties.datGuiSettings[activity + "legendColor"] = properties.datGuiMoveTypesAndColor[activity];  //d3 Color assigned
								properties.guiActivityLegendFolder.addColor(properties.datGuiSettings , activity + "legendColor")
								.name(activity)
								.onFinishChange(function(value){
									properties.datGuiMoveTypesAndColor[activity] = value;
									//Reference to Activity Color Controller 
									var activityColorController = 	properties.guiActivityFolder.__controllers.find(function(controller){return controller.property == activity + "Color"});										
									activityColorController.setValue(value); //Sync and trigger change logic for activity color
									});					
							});	
		
			
		//Performance statistics Folder	
		fnBuildPerformanceStats(properties);
		
		//Container for Bay View	
		properties.bayViewLI = document.createElement("li");
		properties.bayViewLI.classList.add("gui-bayView");		
		properties.guiSelectionBayViewFolder.__ul.appendChild(properties.bayViewLI);			
		
		var newGuiProp;    //Leave this here; referenced multiple times below;
				
		//SET GLOBAL DEMONSTRATION LINKS
		properties.datGuiSettings["webgl"] = function (){window.open("https://en.wikipedia.org/wiki/WebGL","_blank"); };
		properties.datGuiSettings["threejs"] = function (){window.open("https://threejs.org/","_blank"); };
		properties.datGuiSettings["d3"] = function (){window.open("https://d3js.org/","_blank"); };
		
		properties.guiVisualLinksFolder.add(properties.datGuiSettings , "webgl").name("WebGL");
		properties.guiVisualLinksFolder.add(properties.datGuiSettings , "threejs").name("three.js");
		properties.guiVisualLinksFolder.add(properties.datGuiSettings , "d3").name("d3.js");
		
		
		//SET INVENTORY COLORS
		var colors = fnGetPreOrScaleColorColumns(properties);
		
		if (!properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.color"])  //If not pre-set by application driving visual (example WebFOCUS)
			properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.color"] =  colors.predefinedColors[0] ? colors.predefinedColors[0] : translate("datGuiNoColor");
		

		properties.inventoryColor = properties.guiAnalyzeInventoryFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.inventory.color")
			.options([translate("datGuiNoColor"),translate("datGuiInversion"),translate("datGuiRandom")].concat(colors.predefinedColors,colors.scalingColumns))
			.name(translate("datGuiFolders.analyze.folders.inventory.color"))
			.onFinishChange(function (column){
							properties.guiActivityFolder.close(); 
							fnVisualizeInventory(fnGetColumnAttributes(column), true)   //Either None, (C) or (S) type column selected
						});	
										
		
		//USE THRESHOLD LOGIC CHECKBOX
		properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.useThresholds"] = false;
		
		properties.useThresholds = properties.guiAnalyzeInventoryFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.inventory.useThresholds")
			.name(translate("datGuiFolders.analyze.folders.inventory.useThresholds"))
			//.name("Use Thresholds")
			.onFinishChange(function (useThresholds){
				
								if (useThresholds) {
									$(properties.minThreshold.domElement.parentElement.parentElement).css("display","list-item");			
									$(properties.maxThreshold.domElement.parentElement.parentElement).css("display","list-item");			
									$(properties.thresholdIntervals.domElement.parentElement.parentElement).css("display","list-item");			
								}//if
								else {
									$(properties.minThreshold.domElement.parentElement.parentElement).hide();
									$(properties.maxThreshold.domElement.parentElement.parentElement).hide();
									$(properties.thresholdIntervals.domElement.parentElement.parentElement).hide();
								}//else
				
							fnVisualizeInventory(fnGetColumnAttributes(properties.inventoryColor.getValue()), false);
						});			
			

		//MINIMUM THRESHOLD
		properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.minThreshold"] = 0;
		
		properties.minThreshold = properties.guiAnalyzeInventoryFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.inventory.minThreshold", [0] ) 
			.name(translate("datGuiFolders.analyze.folders.inventory.minThreshold"))
			.onFinishChange(function (minVal){ 
							if (properties.useThresholds.getValue()) { 
								properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.maxThreshold"] =
									Math.max(parseFloat(minVal) + 1, properties.maxThreshold.getValue());
								fnVisualizeInventory(fnGetColumnAttributes(properties.inventoryColor.getValue()), false);
							}	
						});	


		//MAXIMUM THRESHOLD
		properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.maxThreshold"] = 100;
		
		properties.maxThreshold = properties.guiAnalyzeInventoryFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.inventory.maxThreshold",[100]) 
			.name(translate("datGuiFolders.analyze.folders.inventory.maxThreshold"))
			.onFinishChange(function (maxVal){ 
							if (properties.useThresholds.getValue()) { 
								properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.minThreshold"] =
									Math.min(parseFloat(maxVal) - 1, properties.minThreshold.getValue());							
								fnVisualizeInventory(fnGetColumnAttributes(properties.inventoryColor.getValue()), false);
							}	
						});	

		//THRESHOLD INTERVALS  https://github.com/d3/d3-array/blob/master/README.md#range
		properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.thresholdIntervals"] = 3;
		
		properties.thresholdIntervals = properties.guiAnalyzeInventoryFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.inventory.thresholdIntervals",d3.range(3,11)) 
			.name(translate("datGuiFolders.analyze.folders.inventory.thresholdIntervals"))
			//.name("Threshold Intervals")
			.onFinishChange(function (){ 
							if (properties.useThresholds.getValue()) { 
								fnVisualizeInventory(fnGetColumnAttributes(properties.inventoryColor.getValue()), false);
							}	
						});	
				
						

		//SCALE TYPE DROPDOWN CONTROLLER
		properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleType"] = 
			(!properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleType"]) ? 
			translate("datGuiScalePredfined") : 
			properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleType"]; //true: predefined, false: custom
						
		properties.scaleType =  properties.guiAnalyzeInventoryFolder.add(properties.datGuiSettings, "datGuiFolders.analyze.folders.inventory.scaleType",    
								   [translate("datGuiScalePredfined"), translate("datGuiScaleCustom")])  //Predefined, Custom
			.name(translate("datGuiFolders.analyze.folders.inventory.scaleType"))					 //'Scale Type' label
			.onFinishChange(function(scaleType) {
					fnRenderByScaling(scaleType, fnGetColumnAttributes(properties.inventoryColor.getValue()), false);

			});
		

		//SCALE INDEX
		properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scale"] = 
			(!properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scale"]) ? 0 
			: properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scale"];  //Will not be maintained by dat.gui, but by gorilla dropdown		
						
		//CREATE NEW LI ELEMENT FOR SCALE SELECTOR IN COLORS FOLDER
		newLi = document.createElement("li");
		newLi.classList.add("gui-scalelist");
		properties.guiAnalyzeInventoryFolder.__ul.appendChild(newLi);		
			
		//BUILD PREDEFINED DROPDOWN
		fnBuildPredfinedScales(newLi);	
				
		//SCALE LOW COLOR
		properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleLow"] = 
			(!properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleLow"]) ? "#00FF00" 
			: properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleLow"];
		
		//SCALE HIGH COLOR
		properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleHigh"] = 
		(!properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleHigh"]) ? "#FF0000" : 
		properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleHigh"];
				
		//BUILD CUSTOM COLOR SELECTORS
		fnBuildScalesLowHighAndHide()	
		
		//CREATE NEW LI ELEMENT FOR LEGEND IN COLORS FOLDER
		newLi = document.createElement("li");
		newLi.setAttribute("id",properties.id + "_legend");
		newLi.classList.add("gui-legend");
		properties.guiAnalyzeInventoryFolder.__ul.appendChild(newLi);	
		
		//properties.datGui.remember(properties.datGuiSettings);					
								
		//INVENTORY FOLDER CLICK EVENT				`
		d3.select(properties.guiAnalyzeInventoryFolder.domElement).on("click",function(){ 
		
																properties.guiActivityFolder.close();    //Can't animate and color select at the same time
																if (!d3.select(d3.event.target).classed("title")) return;   			//Don't process child element events

																//if (!d3.select(this).select("ul").classed("closed")) {						//If ul child is in closed state 
																if (!properties.guiAnalyzeInventoryFolder.closed){  // If folder was just opened 	
																	// COLOR THE OBJECTS BASED ON VALUE DISPLAYED TO USER IN dat.GUI
																	fnVisualizeInventory(fnGetColumnAttributes(properties.inventoryColor.getValue()), false);																		
																} //if
				
															  });  //on click
		
		
		
		// SET VISUAL PROPERTIES DYNAMICALLY FROM PROPERTIES OBJECT THAT HAVE dat.GUI CONTROLLERS
		for(var prop in properties){
			if (properties[prop] && properties[prop].hasOwnProperty("controller")){
				var propFolder = properties.guiVisualPropertiesFolder.addFolder(prop);
					for (setting in properties[prop].controller) { 
						switch (properties[prop].controller[setting]) {
							case "boolean":
								properties.datGuiSettings[prop + "_" + setting] = properties[prop][setting];
								
								//properties.datGui.remember(properties.datGuiSettings);
								
								propFolder.add(properties.datGuiSettings, prop + "_" + setting)
									.name(setting)								
									.onFinishChange(fnToggleProperty);
								break;
							case "color":
								var color = new THREE.Color(properties[prop][setting]);
								color = color.getHexString ();
								properties.datGuiSettings[prop + "_" + setting] = "#" + color;
								
								//properties.datGui.remember(properties.datGuiSettings);
								
								propFolder.addColor(properties.datGuiSettings, prop + "_" + setting)
									.name(setting)
									.onFinishChange(fnSetPropertyColor);	
								break;	
							default:
								//	Example: controller:{fov:{type:"number", minMaxStep: [25,90,1]}}
								if (typeof properties[prop].controller[setting] == "object") {
									switch (properties[prop].controller[setting].type) {
										case "number":
												properties.datGuiSettings[prop + "_" + setting] = properties[prop][setting];
												
												//properties.datGui.remember(properties.datGuiSettings);
												
												var MMS = properties[prop].controller[setting].minMaxStep;
												newGuiProp = propFolder.add(properties.datGuiSettings, prop + "_" + setting)
													.name(setting)
													.min(MMS[0])
													.max(MMS[1])
													.step(MMS[2])	
													.onFinishChange(fnSetNumber);	
											break;
										default:
									} //switch	
								}
					    } //switch
					} //for
			} //if
		}	
		
		
		//properties.guiAnalyzeFolder.open();
		//properties.guiAnalyzeInventoryFolder.open();
		
		properties.WebFOCUS ? properties.datGui.close()	: properties.datGui.open();
			
		//properties.datGui.updateDisplay();  //Not needed...was selecting first employee
					
		//RETURN
		return;
		
		//PRIVATE METHODS
		
		function fnShowActive(showActive, activtyType){
			
			if(activtyType == "late") {
				if (properties.timerInactiveActivity) {
					window.clearInterval(properties.timerInactiveActivity);
					properties.timerInactiveActivity = null;	
				} //if
				fnClearActivityWorkFlow("activityActive");	
				if (!showActive){
					fnShowActive(true, "all");
					return;
				} //if
				
			} //if
			
			
			if (properties.activityActiveData && showActive) {
				

				activityActiveWorkFlowObjects = fnActiveActivityVisualObjects();
				
				activityActiveWorkFlowObjects.forEach(function (obj) { obj.fromToBezier.visible = false; obj.pushPin.visible = false;});  //Initialize to invisible

					properties.timerInactiveActivity = 
						window.setInterval(	function() {

												for (var i =0; i < properties.activityActiveData.length; i++) {
													
													var activityFilter = 	activtyType == "all" ? 
																						true :
																						properties.activityActiveData[i].goal < new Date();							
													
													var selectedEmployees =  properties.empID.val();
												
													var employeeFilter = selectedEmployees.length == properties.datGuiEmployees.length; //true (all selected) /false

													if (!employeeFilter) {
														selectedEmployees.forEach(function(empId){ 
																			employeeFilter = employeeFilter ? employeeFilter : properties.activityActiveData[i].EMP_ID == empId; 
																		 });
													} //if
													
													
													if (activityFilter && employeeFilter) {  //make visible and blink if pass activityTes
														
														//Color may have changed via Analyze/Activity, so always keep it current. fromToBezier and pushpin have same color  
														var color = properties.datGuiMoveTypesAndColor[activityActiveWorkFlowObjects[i].fromToBezier.userData.MOVE_TYPE]
														
														//Workflow Curve
														activityActiveWorkFlowObjects[i].fromToBezier.visible  = 
																						properties.activityActiveData[i].goal >= new Date() ?      //Still possible to meet goal ?
																						true :													   //Solid Line
																						!activityActiveWorkFlowObjects[i].fromToBezier.visible;    //Else,failed goal: blink	
														activityActiveWorkFlowObjects[i].fromToBezier.material.color.set(color)	
														
														//Push Pin has a head and stem child components, but the complete group is made visible
														activityActiveWorkFlowObjects[i].pushPin.children.forEach(function(component) { component.material.color.set(color)});
														activityActiveWorkFlowObjects[i].pushPin.visible  = true;	
														
														
													} //if													
													
												} //for
											}, 1000 //Every Second
										  ); 					
					

				
				function fnActiveActivityVisualObjects() {
					var activityActiveWorkFlowObjects= [];	
					for (var i = 0; i < properties.activityActiveData.length; i++) {

						var activity = properties.activityActiveData[i];

								var fromLayoutRecord = properties.layoutData[properties.layoutDataMap.get(activity.FROM_LOCATION )];
								var fromObj = properties.warehouseGroup.getObjectByName(properties.schema.id(fromLayoutRecord));						
								
								var toLayoutRecord = properties.layoutData[properties.layoutDataMap.get(activity.TO_LOCATION )];
								var toObj = properties.warehouseGroup.getObjectByName(properties.schema.id(toLayoutRecord));	
									
								activityActiveWorkFlowObjects.push(fnBuildActivityFlow(fromObj,toObj,activity, "activityActive"));

					} //for	 
				
					return activityActiveWorkFlowObjects;
					
				} //fnActiveActivityVisualObjects
				
					
			} //if
			else {
				if (properties.timerInactiveActivity) {
					window.clearInterval(properties.timerInactiveActivity);
					properties.timerInactiveActivity = null;	
				} //if
				fnClearActivityWorkFlow("activityActive");
				
			} //else


		
		} // fnShowActive				
		
		// BUILD GUI FOLDERS AND LEAVES AT ROOT LEVEL
		function fnBuildFoldersAndLeaves(gui,folders,folderName){	
			
			for(var prop in folders) {
					if (folders[prop].isLeaf) {
						var text = translate(folderName + "." + prop);
						if (properties.inventoryData && prop == "inventoryGrid"){
							text = translate(folderName + "." + prop) + " (" + d3.format(',')(properties.inventoryData.length) + ")";
						}	
						if (properties.activityCompletedData && prop == "activityGrid") {  
							text = translate(folderName + "." + prop) + " (" + d3.format(',')(properties.activityCompletedData.length) + ")";
						} //if	
						if (prop == "empID" ) { //handle empID select...must be built here because of datGUI bug with adding .options after control is built
							gui.add(properties.datGuiSettings, folderName + "." + prop)
								.options(properties.datGuiEmployees)
								.name(text);
						} //if
						else {
							gui.add(properties.datGuiSettings, folderName + "." + prop).name(text);
						} //else	
					} // if	
					else {
						var newFolder = gui.addFolder(translate(folderName + "." + prop)); 
						if (folders[prop].hasOwnProperty("folders")) fnBuildFoldersAndLeaves(newFolder, folders[prop].folders, folderName + "." + prop + ".folders" );
					} //else
			} //for		
		
				
		} //fnBuildFoldersAndLeaves		
		
		function fnBuildPerformanceStats(properties){
				
			//PERFORMANCE https://www.reddit.com/r/threejs/comments/7g15ff/datgui_how_did_they_get_the_fps_chart_in_the_gui/
			properties.stats = new Stats();
			//ALREADY 3 STATS, DISPLAY THEM ALL
			for (var i = 0; i < properties.stats.domElement.children.length; i++) { properties.stats.domElement.children[i].style.display = ""; }
			
			
			//CREATE NEW LI ELEMENT AND APPEND STATS TO PERFORMANCE FOLDER
			var newLi = document.createElement("li");	
			properties.stats.domElement.style.position = "static";
			properties.stats.domElement.style.cursor = "auto";
			newLi.appendChild(properties.stats.domElement);
			newLi.classList.add("gui-stats");
			properties.guiPerformanceFolder.__ul.appendChild(newLi);
		} //fnBuildPerformanceStats				
		
		//START dat.Gui VALUE SET HANDLERS
		
		//TOGGLE PROPERTY
		function fnToggleProperty(value){
								var strProperty = this.property.substring(0, this.property.indexOf("_"));
								var strObjProperty =  this.property.substring(this.property.indexOf("_") + 1);
								var propertiesObj = properties[strProperty];
								propertiesObj.obj[strObjProperty] = value;
		} //fnToggleProperty
		
		// SET PROPERTY COLOR	
		function fnSetPropertyColor (value) {
								var strProperty = this.property.substring(0, this.property.indexOf("_"));
								var propertiesObj = properties[strProperty];
								switch (strProperty) {
									case "scene":
										propertiesObj.obj.background.set(value);
										//RE-COLOR IF 'None' Color selected
										if (properties.inventoryColor.getValue() == translate("datGuiNoColor") 	|| //Re-display visual with no colors if that's initial setting
										    properties.inventoryColor.getValue() == translate("datGuiRandom") 	||
										    properties.inventoryColor.getValue() == translate("datGuiInversion")   )
												fnVisualizeInventory(fnGetColumnAttributes(properties.inventoryColor.getValue()), false);  //But it will be contrasted with background color
												
										break;
									case "gridHelper":
										fnRebuilGridHelper(properties);								
										break;
									default:
										propertiesObj.obj.material.color.set(value) ;
								} //switch
		} //fnSetPropertyColor	
		
		// SET NUMBER
		function fnSetNumber(value) {
								var strProperty = this.property.substring(0, this.property.indexOf("_"));
								var strObjProperty =  this.property.substring(this.property.indexOf("_") + 1);
								var propertiesObj = properties[strProperty];
								switch (strProperty) {
									case "camera":
										propertiesObj.obj.fov =  value;
										propertiesObj.obj.updateProjectionMatrix();
										break;
									case "gridHelper":										
										fnRebuilGridHelper(properties);
										break;
									case "controls":
										switch  (strObjProperty){
											case "maxPolarAngle":
												properties.controls.obj.maxPolarAngle = value * (Math.PI / 180); 
												break;
											case "zoomSpeed" :
											case "panSpeed" :
												properties.controls.obj[strObjProperty] = value;
												break;
											default:
										} //switch	
									default:
								} //switch		
		} // fnSetNumber
	
		// REBUILD GRIDHELPER BASED ON  dat.GUI SETTINGS
		function fnRebuilGridHelper(properties) {

			var settings = {x: 				properties.gridHelper.obj.position.x,										
							y: 				properties.gridHelper.obj.position.y, 
							z: 				properties.gridHelper.obj.position.z, 
							size: 			properties.gridHelper.gridSize,
							divisions: 		properties.datGuiSettings.gridHelper_divisions, 
							colorCenter: 	properties.datGuiSettings.gridHelper_colorCenter,
							color:			properties.datGuiSettings.gridHelper_color, 
							visible:  		properties.datGuiSettings.gridHelper_visible 
							};
			fnBuildGridHelper(properties,settings);			
		
		} //fnRebuilGridHelper	

		//BUILD THE PREDEFINED SCALE LIST
		function fnBuildPredfinedScales(container){
			
			var predefinedColorContainer = d3.select(container);		
			
			var predefinedColorList = 
				predefinedColorContainer.append("div")
					.attr("id","predefinedColorList_" + properties.id)
					.style("height","50px")
					.style("width",$(predefinedColorContainer.node()).width() + "px");   //Using jQuery with method https://www.w3schools.com/jquery/css_width.asp
			
			//WIDTH AND HEIGHT FOR THE DYNAMICALLY GENERATED CANVASES THAT WILL BE DISPLAYED FOR SCALES LOW-COLOR TO HIGH-COLOR SELECTION
			var width = $(predefinedColorList.node()).width() - 70;				
			var height = 15;  //pixels

			
			var aScale = fnGetD3Scales();
			
			var canvases = predefinedColorList
					.append("span")
					.attr("hidden",true)
					.attr("id","canvases_" + properties.id );	
			

			canvases.selectAll("canvas")
				.data(aScale)
				.enter()
				.append("canvas")
				.attr("width",width)
				.attr("height",height)
				.each(function (scale,i) {				
								var context = this.getContext("2d");
								var gradient = context.createLinearGradient(0,0,width,0);
								var aMinMax=[0,width];
								var fnColor = d3.scaleSequential(d3[scale]).domain([aMinMax[i%2],aMinMax[Math.abs(1-(i%2))]]); //Every other scale is reversed
								
								for(var j = 0; j <= width; j++) {
									gradient.addColorStop(j/width,fnColor(j) );	
								} //for
								
								context.fillStyle = gradient;
								context.fillRect(0,0,width,height)
								
								})	;		
					

			var colorSelect = 	predefinedColorList.append("select").attr("id","colorSelect_" + properties.id );
			
			colorSelect.selectAll("option")
							.data(aScale)
							.enter() 
							.append("option")
							.attr("value",function(d,i) {return i;})
							.attr("data-imgsrc",function(d,i) { return d3.select(canvases.node()).selectAll("canvas").nodes()[i].toDataURL(); });	
				
			//USE GORILLA DROPDOWN TO BUILD CANVAS IMAGES DROPDOWN 
			//https://www.jqueryscript.net/form/Custom-HTML-Select-Element-jQuery-Gorilla-Dropdown.html
			$(colorSelect.node()).gorillaDropdown({width: $(predefinedColorList.node()).width() -20 , 
											  dropdownHeight: height * 2.5 ,	//2.5 * height of canvas image  	 	 	 	 
											  select: properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scale"], 
											  onSelect: function(selection){
															properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scale"] = parseFloat($("#colorSelect_" + properties.id ).gorillaDropdown("selected").value);								
															fnRenderScalePredinedOrCustom(
															    fnGetColumnAttributes(properties.inventoryColor.getValue()) ,
																{ scale: aScale[properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scale"]], 
																  min: properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scale"] % 2, 
																  max:  Math.abs(1 - (properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scale"] % 2))
																} 
															)																	
														} //function   
											 }); //gorillaDropdown
			
			
			//Through testing, determined scroll-bar click moves about 40px for chrome, but logic below should work for any ddItemHeight
			//Adjust height of displayed image so that each up/down navigation click show just 1 image in selection area	
			var ddItemHeight =  40;
			predefinedColorList.selectAll(".ddlist .dditem").style("height",ddItemHeight+"px")
			
			//Need the following for browser independence
			var lastScrollTop = 0, delta = 5, toggle=false;
			$(predefinedColorList.select(".ddlist").node()).scroll(function(){
																   var st = $(this).scrollTop();
																   
																   toggle = !toggle;
																   if(Math.abs(lastScrollTop - st) <= delta || !toggle )
																	  return;
																   
																   if (st > lastScrollTop){
																	   // downscroll code
																	   this.scrollTop = lastScrollTop + ddItemHeight;
																   } else {
																	  // upscroll code
																	  this.scrollTop = lastScrollTop - ddItemHeight;
																   }
																   lastScrollTop = this.scrollTop;											
											
																});
			 
			
											 
			return;
											 
		
		} // fnBuildPredfinedScales				
		
		
		//BUILD LOW/HIGH SCALE COLOR SELECTORS
		function fnBuildScalesLowHighAndHide() {

			//LOW SCALE COLOR CONTROL
			properties.scaleLow = properties.guiAnalyzeInventoryFolder.addColor(properties.datGuiSettings,
										 "datGuiFolders.analyze.folders.inventory.scaleLow",
										 properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleLow"]  )
				.name(translate("datGuiFolders.analyze.folders.inventory.scaleLow"))
				.onChange(fnGetScaleLowHigh); 
			
			
			//HIGH SCALE COLOR CONTROL
			properties.scaleHigh = properties.guiAnalyzeInventoryFolder.addColor(properties.datGuiSettings, 
											"datGuiFolders.analyze.folders.inventory.scaleHigh",
											properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scaleHigh"]  )
				.name(translate("datGuiFolders.analyze.folders.inventory.scaleHigh"))
				.onChange(fnGetScaleLowHigh); 	
			
			// GET SCALE LOW/HIGH
			function fnGetScaleLowHigh(){
				fnRenderScalePredinedOrCustom(fnGetColumnAttributes(properties.inventoryColor.getValue()),
											{low:  properties.scaleLow.getValue(), 
											 high: properties.scaleHigh.getValue() });						
			} //fnGetScaleLowHigh
		
		}// fnBuildScalesLowHigh			
		
		
		
		/////End dat.Gui value set handlers
		
	}// fnSetStaticGuiControllers
	
	
	//CLEAR ALL ACTIVTIY RISERS
	function fnResetActivityRisers() {
		
		if (properties.activityCompletedData) {  //Only if Completed data exists
			
			fnClearActivityWorkFlow("activityCompleted");
			
			var objActivities =  {};
			var aActivities = Object.keys(properties.datGuiMoveTypesAndColor);

			for (var i=0; i < aActivities.length; i++){   //Set All activity levels to zero
				objActivities[aActivities[i]] = 0;
			} //for
			properties.mapBayActivityLocation.forEach(function(location,key){location.activityObj.set(objActivities); } );
		} //if
		
	} //fnResetActivityRisers	
	
	function fnRoundDown (date,minInterval) {
							roundDate =  new Date(date.getTime());
							roundDate.setMinutes(date.getMinutes() - (date.getMinutes() % minInterval) );  //Modulus of interval determines subtraction factor
							roundDate.setSeconds(0);
							return  new Date(roundDate.setMilliseconds(0));  
	} //fnRoundDown
	
	function fnRoundUp (date,minInterval) { 
						var coeff = minInterval * 60 * 1000;
						//modulusMinInterval = (date.getMilliseconds() % coeff);
						roundDate =  new Date(date.getTime());
						modulusMinInterval = (roundDate % coeff);
						if (modulusMinInterval == 0) {
							return roundDate;
						}
						else {
							roundDate.setMinutes(date.getMinutes() - (date.getMinutes()%minInterval) + minInterval );
							roundDate.setSeconds(0);
							return new Date (roundDate.setMilliseconds(0));
						}	
	} //fnRoundUp	
	
	//BUILD LOGIC FOR ACTIVITY ANIMATION
	function fnBuildActivityFolderContent() {
		
	
		var timeMin = new Date(d3.min(properties.activityCompletedData, function(d) {return d.endTime.getTime() }));
		var timeMax = new Date(d3.max(properties.activityCompletedData, function(d) {return d.endTime.getTime() }));
			
		properties.activityStatsMap = fnActivityStatsMap(Object.keys(properties.datGuiMoveTypesAndColor), properties.activityCompletedData);
		
		properties.activityPeriods = {min: fnRoundDown(timeMin,5), max: fnRoundUp(timeMax,5)};
		
		fnCalcPeriods(properties);
			
		
		//CLICK EVENT HANDLER FOR THE ANIMATE FOLDER
		d3.select(properties.guiActivityFolder.domElement).on("click",function(){ 
															if (!d3.select(d3.event.target).classed("title")) return;   		//Don't process child element events
															
															properties.guiAnalyzeInventoryFolder.close();    										//Can't color and animate at the same time
															properties.guiActivityLegendFolder.close();    										//Close Activity Legend Folder to minimize confusion
																										
															if (!properties.guiActivityFolder.closed && (properties.warehouseGroup)) {	//If folder was opened and warehouse is built, show data filtered on animation	
																fnUpdateAisleActivity(properties.datGuiSettings["datGuiFolders.analyze.folders.activity.period"], properties);	
																properties.selectMoveType.focus();	//Activate the MoveType dropdown	
																properties.renderer.obj.render( properties.scene.obj, properties.camera.obj );	
															}	
															
														  });		
	
	
		
		// TIMER USED BY ANIMATION
		var timer;
		

		//Create property entries
		var dateTimeFormat = d3.timeFormat("%Y/%m/%d %H:%M");  //https://github.com/d3/d3-3.x-api-reference/blob/master/Time-Formatting.md
		//var timeFormat = d3.timeFormat("%H:%M");
		

		//properties.datGuiSettings["datGuiFolders.analyze.folders.activity.start"] = dateTimeFormat(fiveMinutesAgo);
		properties.datGuiSettings["datGuiFolders.analyze.folders.activity.start"] = dateTimeFormat(properties.activityPeriods.min);
		properties.datGuiSettings["datGuiFolders.analyze.folders.activity.end"] = dateTimeFormat(properties.activityPeriods.max);
	

		//Add start/stop to Animation folder.  properties.guiActivityStartController.setvalue(),properties.guiActivityEndController.setValue() used for monitoring as well
		properties.guiActivityStartController =
			properties.guiActivityFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.activity.start")
				.name(translate("datGuiFolders.analyze.folders.activity.start"))
				.onChange(function () {
								fnSetIntervals(); 
								fnSetPeriods();
								properties.periodController.setValue(dateTimeFormat(new Date(properties.guiActivityEndController.getValue()) ) );
								} );
		properties.guiActivityEndController =	
			properties.guiActivityFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.activity.end")
				.name(translate("datGuiFolders.analyze.folders.activity.end"))
				.onChange(function () {
								fnSetIntervals(); 
								fnSetPeriods();
								properties.periodController.setValue(dateTimeFormat(new Date(properties.guiActivityEndController.getValue()) ) );
								} );
							

		var fiveMinMS = (5 * 60 * 1000);
		
		// jQuery input references
		var startDate = $(properties.guiActivityStartController.domElement).find("input");
		var endDate = $(properties.guiActivityEndController.domElement).find("input");
		

		
		// jQuery simple datetime picker
		endDate
			.appendDtpicker({"dateFormat": "YYYY/MM/DD hh:mm", maxDate: dateTimeFormat(properties.activityPeriods.max) , minuteInterval: 5 ,
							"closeOnSelected": true,  
							 "onShow": function (handler) { 
											fnFixDatePikckerTimeList(handler);									
										}					
							})
			.change(function() {
						var validDate = new Date(Math.max( new Date (this.value) , new Date(properties.guiActivityStartController.getValue()).getTime() + fiveMinMS )); 
						properties.guiActivityEndController.setValue(dateTimeFormat(validDate));
						endDate.blur();						
						$(startDate).appendDtpicker({
							maxDate: $(endDate).val()  // when the start time changes, update the maxDate on the end field
							});	
					});	  
		startDate
			.appendDtpicker({"dateFormat": "YYYY/MM/DD hh:mm", minDate: dateTimeFormat(properties.activityPeriods.min) , minuteInterval: 5 ,
							 "closeOnSelected": true,   		
							 "onShow": function (handler) { 
											fnFixDatePikckerTimeList(handler);									
										}
							})
			.change(function() {
						var validDate = new Date(Math.min( new Date (this.value) , new Date(properties.guiActivityEndController.getValue()).getTime() - fiveMinMS ));  
						properties.guiActivityStartController.setValue(dateTimeFormat(validDate));
						startDate.blur();					
						$(endDate).appendDtpicker({
							minDate: dateTimeFormat(new Date($(startDate).val())  + fiveMinMS )  // when the end time changes, update the maxDate on the start field
							});
					});	
		


		//Hacking a fix for datepicker_timelist height...similar to code in jquery.simple-dtpicker.js
		function fnFixDatePikckerTimeList(handler){
			var timelist = $(handler.$pickerObject).find(".datepicker_timelist");
			var calendar = $(handler.$pickerObject).find(".datepicker_calendar");	
			timelist.css("height", calendar.innerHeight() - 10 + 'px');
			
		}		

		//Add Intervals controller
		properties.datGuiSettings["datGuiFolders.analyze.folders.activity.interval"] = 5;				
		var intervalController = properties.guiActivityFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.activity.interval",[5])
			.name(translate("datGuiFolders.analyze.folders.activity.interval"))
			.onChange( fnSetPeriods );	

			
		//Add Period controller
		properties.datGuiSettings["datGuiFolders.analyze.folders.activity.period"] = dateTimeFormat(new Date(properties.guiActivityEndController.getValue()));				
		properties.periodController = properties.guiActivityFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.activity.period" , 
								[dateTimeFormat(new Date(properties.guiActivityEndController.getValue()))])                                //Select List of Periods
			.name(translate("datGuiFolders.analyze.folders.activity.period"))
			.onChange(function (value) {	
									if (properties.warehouseGroup) {    //If the visualization has been rendered (not in setup phase) 
										if (!properties.activtyLoading) fnMonitorActivity("stop");      //Stop monitoring
										fnUpdateAisleActivity(value, properties);																			
								//		properties.renderer.obj.render( properties.scene.obj, properties.camera.obj );			
									}	
							});	

		
			
		properties.datGuiSettings["datGuiFolders.analyze.folders.activity.speed"] = 1;
		properties.speedController = properties.guiActivityFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.activity.speed" ,0.1,5) 
			.name(translate("datGuiFolders.analyze.folders.activity.speed"))
			.onChange(function (value){ 
								//Start/Stop Animation to get new Animation Rate				
								var animateButton = 
									properties.guiActivityFolder.__controllers.find(
													function(controller) {
														return controller.property == "datGuiFolders.analyze.folders.activity.run" 
														});
								var buttonText = d3.select(animateButton.domElement).attr("buttonText");	

								if (buttonText == translate("datGuiAnimateButtonTextStop")) {		
									fnActivityAnimate();  //Stop so logic can get new speed..user has to manually restart
								}		
							});	

		//Logic for toggline animation on/off						
		function fnActivityAnimate() {
			fnMonitorActivity("stop");  //stop montioring as soon as any animation activity;
			
			properties.guiAnalyzeInventoryFolder.close();
			
			var animateButton = 
				properties.guiActivityFolder.__controllers.find(
								function(controller) {
									return controller.property == "datGuiFolders.analyze.folders.activity.run" 
									});
			var buttonText = d3.select(animateButton.domElement).attr("buttonText");
			switch (buttonText) {
				case translate("datGuiAnimateButtonTextRun"):
					if (new Date(properties.periodController.getValue()) >= new Date(properties.guiActivityEndController.getValue()) ) 
						properties.periodController.setValue(properties.guiActivityStartController.getValue());
					timer = setInterval(fnIncrement,properties.speedController.getValue() * 1000);
					fnToggleAnimateRunStop(translate("datGuiAnimateButtonTextStop"));
					break;
				case translate("datGuiAnimateButtonTextStop"):
					clearInterval(timer);
					fnToggleAnimateRunStop(translate("datGuiAnimateButtonTextRun"))			
					break;
				default:
			
			} //switch
															
			function fnIncrement() {
				var interval = intervalController.getValue();
				var maxTime = new Date(properties.guiActivityEndController.getValue())
				var newTime = new Date(properties.periodController.getValue());
				newTime.setMinutes(newTime.getMinutes() + parseInt(interval));
				minNewValue = Math.min( maxTime , newTime);
				properties.periodController.setValue(dateTimeFormat(new Date(minNewValue)));	//This cascades the animation 
				properties.periodController.updateDisplay();
				if (minNewValue >= maxTime) {
					clearInterval(timer); 
					fnToggleAnimateRunStop(translate("datGuiAnimateButtonTextRun"));
					}
			} //fnIncrement				
			
		} //fnActivityAnimate
							

		//ANIMATE RUN/STOP BUTTON
		properties.datGuiSettings["datGuiFolders.analyze.folders.activity.run"] = fnActivityAnimate;
		
		//ADD RUN/STOP activity BUTTON AS CHILD OF ANIMATE FOLDER
		newGuiProp= properties.guiActivityFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.activity.run")
						.name(translate("datGuiFolders.analyze.folders.activity.run"));	
		
		d3.select(newGuiProp.domElement).attr("buttonText",translate("datGuiAnimateButtonTextRun"));  //Attribute tracks whether or not animation is in run/stop mode								
							
		//PERIOD WORKFLOW
		properties.datGuiSettings["datGuiFolders.analyze.folders.activity.workflow"] = true;  //Check box to show workflow within the period
		properties.guiActivityWorkflowController = 
			properties.guiActivityFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.activity.workflow")
				.onChange(function () {	
										fnUpdateAisleActivity(properties.periodController.getValue(), properties);																			
								})			
				.name(translate("datGuiFolders.analyze.folders.activity.workflow"));								
							
		//CUMULATIVE CHECK BOX
		properties.datGuiSettings["datGuiFolders.analyze.folders.activity.cumulative"] = false;  //Check box to accumulate all activity upto selecte period
		properties.guiActivityCumalitiveController = 
			properties.guiActivityFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.activity.cumulative")
				.onChange(function () {	
										fnUpdateAisleActivity(properties.periodController.getValue(), properties);																			
								})			
				.name(translate("datGuiFolders.analyze.folders.activity.cumulative"));
																				
		//ADD ACTIVITY TYPES
		var arrActivities = Object.keys(properties.datGuiMoveTypesAndColor).sort();	
		properties.datGuiSettings["datGuiFolders.analyze.folders.activity.moveType"] = arrActivities[0];  //Dummy assignment since multi-select is not supported by dat.gui
		
		//USING dat.GUI to build UI entry, will be overriden with a multi-select
		var controller =
			properties.guiActivityFolder.add(properties.datGuiSettings , "datGuiFolders.analyze.folders.activity.moveType", arrActivities)		
				.name(translate("datGuiFolders.analyze.folders.activity.moveType"));	

		//Custom Multi-select dropdown logic
		$(controller.domElement.parentElement.parentElement).attr("class","gui-activity");   //Replace the class with gui-activity class
		properties.selectMoveType = $(controller.domElement).find("select").attr("multiple",true).attr("size",5);  //jQuery selector
				
		properties.selectMoveType.children("option").prop("selected",true);   //Select all activities initially
		
		properties.selectMoveType.change(function(){fnUpdateAisleActivity(properties.periodController.getValue(), properties); });  //Update visualization when user changes activities
	

		//Activity Colors
		arrActivities.forEach(function(activity) { 
								properties.datGuiSettings[activity + "Color"] = properties.datGuiMoveTypesAndColor[activity];  //d3 Color assigned
								
								properties.guiActivityFolder.addColor(properties.datGuiSettings , activity + "Color")
								.name(activity)
								.onChange(function(value){
									properties.datGuiMoveTypesAndColor[activity] = value;
									properties.datGuiSettings[activity + "legendColor"] = value;   //Synch with Color Legend
									var activityLegendColorController = 	properties.guiActivityLegendFolder.__controllers.find(function(controller){return controller.property == activity + "legendColor"});										
									activityLegendColorController.setValue(value); //Sync, won't trigger event for onFinishChange									
									
									var activityCount = 0;
									properties.mapBayActivityLocation.forEach(function(location,key){
																				var activitiesObj = location.activityObj.activtyCount();
																				for (var activity in activitiesObj ) {
																					activityCount += activitiesObj[activity];
																				} //for
																			} );
									
									
									if (activityCount != 0) fnUpdateAisleActivity(properties.periodController.getValue(), properties); 
									});					
							});
		
		//Stats	
		var controller;	
		properties.statControllersMap = new HashMap();
		arrActivities.forEach(function(activity) { 											
						properties.datGuiSettings[activity + "stat"] = d3.format(',')(properties.activityStatsMap.get(activity));  
						controller = properties.guiActivityFolder.add(properties.datGuiSettings,activity + "stat")
							.name(activity);
						d3.select(controller.domElement).select("input").attr("readonly",true);
						properties.statControllersMap.set(activity,controller);	
					});
												
		properties.datGuiSettings["totalstat"] = d3.format(',')(properties.activityStatsMap.get("total"));  
		controller = properties.guiActivityFolder.add(properties.datGuiSettings,"totalstat")
			.name("Total");	
		d3.select(controller.domElement).select("input").attr("readonly",true);	
		properties.statControllersMap.set("total",controller);			
		
		//CALCULATE THE INTERVALS
		fnSetIntervals();	//Will cascade to setting period as well 	 		
		
		
		//Invoke the change triggers to initialize start/end date	
		$(endDate).trigger('change');
		$(startDate).trigger('change');	
		properties.periodController.setValue(dateTimeFormat(new Date(properties.guiActivityEndController.getValue()) ) );	
								
		
		//RETURN
		return;
		
		//SUB METHODS
		
		
		//Calcualte the 5 minute period the endTime is in 
		function fnCalcPeriods(properties){
			
			var milliSecondRange =  new Date(properties.activityPeriods.max).getTime() - properties.activityPeriods.min.getTime();
			for (var i = 0; i < properties.activityCompletedData.length; i++) {
				roundDownTime =  fnRoundDown(properties.activityCompletedData[i].endTime,5);
				roundUpTime = 	fnRoundUp(properties.activityCompletedData[i].endTime,5);
				//properties.activityCompletedData[i].period = ( ( roundDownTime.getTime() - properties.activityPeriods.min.getTime() ) % milliSecondRange ) / (5 * 60 * 1000) + 1; 
				properties.activityCompletedData[i].periodTime = roundUpTime;
			}
						
		} //fnCalcPeriods		
		
		//FUNCTION TO CALCLATE INTERVAL
		function fnSetIntervals() {
			var startTime =  new Date(properties.guiActivityStartController.getValue());
			var endTime =    new Date(properties.guiActivityEndController.getValue());					
			var aIntervals = [];
			//for (var i = 5; i <= Math.min( 60, (endTime - startTime) / (60 * 1000) )  ; i = i + 5) {	
			for (var i = Math.min( 60, (endTime - startTime) / (60 * 1000) ); i >= 5   ; i = i - 5) {	
				aIntervals.push(i);		
			}
			//intervalController.options(aIntervals);	
			//https://stackoverflow.com/questions/18260307/dat-gui-update-the-dropdown-list-values-for-a-controller
			fnSetNewOptions(intervalController,aIntervals);
				
		} //fnSetIntervals
			
		
		// fnSetPeriods(); //Will be called initally by setInterval
		//Calculate Array of displayed periods
		function fnSetPeriods() {
			
			var startTime =  new Date(properties.guiActivityStartController.getValue());
			var endTime =    new Date(properties.guiActivityEndController.getValue());					
			var interval =    intervalController.getValue();
			var aPeriods = [];
			for (var i = 0; i <= (endTime - startTime)  ; i =+ interval) {	
				aPeriods.push(dateTimeFormat( Math.min(startTime.setMinutes(startTime.getMinutes() + i), endTime ) ));	
			}
			//properties.periodController.options(aPeriods); //doesn't work		
			//https://stackoverflow.com/questions/18260307/dat-gui-update-the-dropdown-list-values-for-a-controller
			fnSetNewOptions(properties.periodController,aPeriods);		

		
		} //fnSetPeriods
		
		//https://stackoverflow.com/questions/18260307/dat-gui-update-the-dropdown-list-values-for-a-controller
		function fnSetNewOptions(controller, aOptions){
			
			var oSelect = d3.select(controller.domElement).select("select");
				oSelect.selectAll("option").remove();
				oSelect.selectAll("option").data(aOptions).enter()
					.append("option")
						.attr("value", function(d) {return d;})
						.text(function(d) {return d; });	
			controller.setValue(aOptions[0]);			
			
		} //fnSetNewOptions			
		
		// Toggle Run/Stop button text
		function fnToggleAnimateRunStop(newText){
			
			var animateButton = 
				properties.guiActivityFolder.__controllers.find(function(controller) 
																	{return controller.property == "datGuiFolders.analyze.folders.activity.run"
																	});
			animateButton.name(newText)
			d3.select(animateButton.domElement).attr("buttonText",newText);
			return animateButton;
		} //fnToggleAnimateRunStop
		
		
	} // fnBuildActivityFolderContent	
	
	
	
	//Return a map of activity Stats
	function fnActivityStatsMap(selectedMoveTypes, aActivities) {
		
		var map = new HashMap();
		map.set("total",aActivities.length);
		
		selectedMoveTypes.forEach(function(type){ 
				map.set(type, d3.sum(aActivities, function(d){ return d.MOVE_TYPE == type ? 1 : 0}) );
			 });
			

		activityBayStats = 
			d3.nest()
				.key(function(d){return d.aisle + "_" +d.bay})  //aisle + bay are unique
				.rollup(function (leaves){
							var statObj = {};
							statObj.totalActivity = leaves.length;
							selectedMoveTypes.forEach(function(type){ 
								statObj[type] = d3.sum(leaves,function(d){ return d.MOVE_TYPE == type ? 1 : 0});
							 });
							return statObj;
						})
				.entries(aActivities);		
		
		//Maximum Activity across all filtered aisles-bay locations
		map.set("maxTotal",d3.max(activityBayStats, function(d) {return d.value.totalActivity}));
		
		selectedMoveTypes.forEach(function(type){ 
				map.set("maxBay" + type, d3.max(activityBayStats, function(d){return d.value[type];} ));
		});
			
		return map;		
		
	} //fnActivityStatsMap	
		
	// UPDATE THE VISUALIZATION WITH ACTIVITY ANIMATION
	function fnUpdateAisleActivity(value, properties) {
		
		//Set start/end properties in monitoring mode (last 5 minutes)
		//These values are set for both monitoring and analysis
		var valueLess5Min = new Date(value);
		valueLess5Min.setSeconds(valueLess5Min.getSeconds() - 1 );
		valueLess5Min= fnRoundDown(valueLess5Min,5);   //Logic will round down to last 5 minutes			

		var filterEndTime = new Date(value);
		var showCumalative = properties.guiActivityCumalitiveController.getValue();
		var showWorkflow = properties.guiActivityWorkflowController.getValue();
		var filterStartTime = showCumalative ? 
									new Date(properties.guiActivityStartController.getValue()) : 
									valueLess5Min;
		
		var arrActivities = Object.keys(properties.datGuiMoveTypesAndColor);	
		var selectedMoveTypes = properties.selectMoveType.val(); //https://stackoverflow.com/questions/2543322/get-value-of-multiselect-box-using-jquery-or-pure-js
		//Eg: ["MOVE TO DOOR", "PUTAWAY", "REPLEN", "REPLEN OVERFLOW", "RETURNS PUTAWAY"]
		
		var selectedEmployees =  properties.empID.val();
		
		properties.filteredActivity = properties.activityCompletedData.filter(function(activity){ 

																var activityFilter = selectedMoveTypes.length == arrActivities.length ;   			//true (all selected) /false
																var employeeFilter = selectedEmployees.length == properties.datGuiEmployees.length; //true (all selected) /false
																
																if (!activityFilter) {
																	selectedMoveTypes.forEach(function(type){ 
																						activityFilter = activityFilter ? activityFilter : activity.MOVE_TYPE == type; 
																					 });
																} //if	
																
																if (!employeeFilter) {
																	selectedEmployees.forEach(function(empId){ 
																						employeeFilter = employeeFilter ? employeeFilter : activity.EMP_ID == empId; 
																					 });
																} //if
																					
																return (activity.endTime >= filterStartTime
																		&& activity.endTime <= filterEndTime
																		&& activityFilter
																		&& employeeFilter); 

															} );
								
		
		//Filtered Acitivity Stats

		var filteredStats = fnActivityStatsMap(selectedMoveTypes,properties.filteredActivity )
					
		//Reset all Activity Riser to zero		
		fnResetActivityRisers();
					

		var sizeScale = d3.scaleLinear().range([0,properties.riserMaxHeight]);
		
		var aActivities = Object.keys(properties.datGuiMoveTypesAndColor);
		
		if (properties.filteredActivity.length > 0) {
			
			var currentPeriod =  properties.filteredActivity[0].periodTime;
			
			//WHERE THE RUBBER HITS THE ROAD: Animate the risers
			for (var i = 0; i < properties.filteredActivity.length; i++) {
				
				var objActivities =  {};
				
				//Initialize all activities to 0 first
				for (var j=0; j < aActivities.length; j++){
					objActivities[aActivities[j]] = 0;
				} //for	j
				
				//Now set the activity for 'i' to 1
				objActivities[properties.filteredActivity[i].MOVE_TYPE] = 1;
													
				var activityObj =  properties.mapBayActivityLocation.get(properties.filteredActivity[i].aisle + "_" + properties.filteredActivity[i].bay ).activityObj;
				var activityRiser = activityObj.activityRiser;
				activityObj.add(objActivities);	 //Add just the activity on the transaction record...all other activities are set to 0
				
				var riserActivityCount =  activityObj.activtyCount();
				var totalRiserActivity = activityRiser.userData.riserProperties.Total;
				
				var activityAccumulator = 0;
				var maxActivityAccumlator = 0;
				selectedMoveTypes.forEach(function(type){
						activityAccumulator += riserActivityCount[type];   //numerator: accumulation of all current activities on the riser
						maxActivityAccumlator += riserActivityCount[type] > 0 ? filteredStats.get("maxBay" + type) : 0;  //divisor: accumulation of maximum possible  activity types across all bays
				});
				sizeScale.domain([0,maxActivityAccumlator]);   //the domain for this riser is upto the maximum activity any individual bay has had during this period
				activityRiser.scale.y = sizeScale(activityAccumulator / maxActivityAccumlator);  //Scale is Normalized as a funciton of the total activity for the riser
				
				//Only show risers for current Period
				var isPeriod = properties.filteredActivity[i].periodTime.getTime() == new Date(properties.periodController.getValue()).getTime();
				if (showWorkflow && showCumalative && isPeriod ) {
					fnShowActivityArrows(activityRiser,isPeriod);
				} //if
				else if (!showCumalative && showWorkflow) {
					fnShowActivityArrows(activityRiser,isPeriod);
					if (properties.filteredActivity[i].periodTime.getTime() != currentPeriod.getTime()) {
						fnClearSelectionFolder();
						fnClearIsolateSelections("clear");  
						//Don't clear Inventory Search	
						currentPeriod = properties.filteredActivity[i].periodTime;				
					} //if							
				} //else if
				
				//Don't erase...possible new feature				
				//If Acitity data colors the slot with activity, change its color
				//if (properties.filteredActivity[i].slotColor){
				//	properties.warehouseGroup..getObjectByName(properties.filteredActivity[i].id).material.color.set(properties.filteredActivity[i].slotColor);
				//	
				//} //if
			
			} //for					
		
		} //if
		
		//Display stats after filtering
		var controller;
		aActivities.forEach(function(activity){
				controller = properties.statControllersMap.get(activity);
				controller.setValue(d3.format(',')(filteredStats.get(activity) ? filteredStats.get(activity) : 0 ) + "/" + d3.format(',')(properties.activityStatsMap.get(activity)) )
						  .updateDisplay(); 	
		});
		
		controller = properties.statControllersMap.get("total");
		controller.setValue(d3.format(',')(filteredStats.get("total")) + "/" + d3.format(',')(properties.activityStatsMap.get("total")) )
				  .updateDisplay(); 
					
			
	} //fnUpdateAisleActivity
	
	
	
	//RENDER BY SCALING USING SCALETYPE
	function fnRenderByScaling(scaleType, objColumnAttributes, resetThresholds) {
		
		if (objColumnAttributes.dataType == "float") {
			
			//SHOW USE THRESHOLD CHECKBOX
			if (resetThresholds) {
				properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.useThresholds"] = false;
			} //if	
			$(properties.useThresholds.domElement.parentElement.parentElement).css("display","list-item");
			
			
			
			//SHOW MINIMUM THRESHOLD
			if (resetThresholds) {
				$(properties.minThreshold.domElement.parentElement.parentElement).hide();
				//https://github.com/d3/d3-array/blob/master/README.md#range	
				fnSetMinMaxOption(properties.minThreshold, [objColumnAttributes.minScale, objColumnAttributes.maxScale - 1 ]);	
				properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.minThreshold"] =  objColumnAttributes.minScale; //Don't use setValue...it triggers change event				
			} //if
			else {
				if (properties.useThresholds.getValue()) $(properties.minThreshold.domElement.parentElement.parentElement).css("display","list-item");	
			}//else


			//SHOW MAXIMUM THRESHOLD
			if (resetThresholds) {
				$(properties.maxThreshold.domElement.parentElement.parentElement).hide();	
				//https://github.com/d3/d3-array/blob/master/README.md#range	
				fnSetMinMaxOption(properties.maxThreshold, [objColumnAttributes.minScale + 1, objColumnAttributes.maxScale  ]); 	
				properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.maxThreshold"] =  objColumnAttributes.maxScale; //Don't use setValue...it triggers change event				
			} //if
			else {
				if (properties.useThresholds.getValue()) $(properties.maxThreshold.domElement.parentElement.parentElement).css("display","list-item");					
			} //else	
		

			//SHOW THRESHOLD INTERVALS
			if (resetThresholds) { 
					properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.thresholdIntervals"] = 3;
					$(properties.thresholdIntervals.domElement.parentElement.parentElement).hide();	
			} //if
            else {			
				if (properties.useThresholds.getValue()) $(properties.thresholdIntervals.domElement.parentElement.parentElement).css("display","list-item");		
			} //else	

		
		} //if	
	
	
		//SHOW DROPDOW LIST
		$(properties.scaleType.domElement.parentElement.parentElement).css("display","list-item");		
			
		switch (scaleType) {
			case translate("datGuiScalePredfined"):					//PREDEFINED COLOR SCALE
				//HIDE CUSTOM SCALE		
				$(properties.scaleLow.domElement.parentElement.parentElement).hide();
				$(properties.scaleHigh.domElement.parentElement.parentElement).hide();											
				
				//SHOW PREDEFINED SCALE
				$(".gui-scalelist").css("display","list-item");
				

				var scale = properties.datGuiSettings["datGuiFolders.analyze.folders.inventory.scale"];
		
				break;
			case translate("datGuiScaleCustom"):   								//CUSTOM COLOR SCALE
				//HIDE PREDEFINED SCALE
				$(".gui-scalelist").hide();				
				
				//SHOW CUSTOM SCALE			
				$(properties.scaleLow.domElement.parentElement.parentElement).css("display","list-item");
				$(properties.scaleHigh.domElement.parentElement.parentElement).css("display","list-item");
				
				var scale = {low: properties.scaleLow.getValue() , 
							 high: properties.scaleHigh.getValue()
							}

				
				break;
			default:
		}//switch 
		
		properties.guiAnalyzeInventoryFolder.updateDisplay();
		
		//RENDER PREDEFIED OR CUSTOM: scale is dependent on type of operation
		fnRenderScalePredinedOrCustom( objColumnAttributes , scale );			
		
		//https://stackoverflow.com/questions/18260307/dat-gui-update-the-dropdown-list-values-for-a-controller
		function fnSetMinMaxOption(controller, selectRange){
			
			var increment = selectRange[1] - selectRange[0] < 1 ? .1 : 1
			var aSelectRange = d3.range(selectRange[0],selectRange[1] + increment, increment );
			var maximumSelectOptions = 5000;
			var aOptions = aSelectRange.length <= maximumSelectOptions ? 
												 aSelectRange :
												d3.range(maximumSelectOptions).map(function (selectOption){ 
																						return Math.round(d3.scaleLinear().domain([0,maximumSelectOptions - 1]).range(selectRange)(selectOption)); 
																				   });
			
			var oSelect = d3.select(controller.domElement).select("select");
				oSelect.selectAll("option").remove();
				oSelect.selectAll("option").data(aOptions).enter()
					.append("option")
						.attr("value", function(d) {return d;})
						.text(function(d) {return d; });		
			
		} //fnSetNewOptions				
		
		
		
		
		
	} // fnRenderByScaling

	
	
	//GET COLUMN NAME, TYPE, DATATYPE, MIN/MAX SCALE (if numeric)
	function fnGetColumnAttributes(strSelection){
		var type = strSelection.substring(strSelection.indexOf("("));  //'(C)' or '(S)'
		var column = strSelection.substring(0,strSelection.indexOf(" " + type));
		var dataType =  properties.inventoryDataTypes[column]; 
		
		var minScale =  dataType == "float" ? d3.min(properties.inventoryData,function (d) { return parseFloat(d[column]); }) : null;				
		var maxScale = 	dataType == "float" ? d3.max(properties.inventoryData,function (d) { return parseFloat(d[column]); }) : null;
		
		return {column:column, 
				type: type, 
				dataType: dataType, 
				minScale: minScale,
				maxScale: maxScale};
	} //fnGetColumnAttributes
		

	function fnGetBackGroundColorInvert(){
		
		var backgroundColorInvert = properties.datGuiSettings.scene_background ? 
										new THREE.Color(properties.datGuiSettings.scene_background) :
										new THREE.Color(properties.scene.background) ;
		backgroundColorInvert.setRGB(1.0 - backgroundColorInvert.r, 1.0 - backgroundColorInvert.g, 1.0 - backgroundColorInvert.b ); //https://stackoverflow.com/questions/6961725/algorithm-for-calculating-inverse-color
		return backgroundColorInvert.getHex();	
	
	} //fnGetBackGroundColorInvert
		
		
	// SET VISUAL SLOT COLORS WITH SCALE LOW/HIGH	
	function fnVisualizeInventory(objColumnAttributes, resetThresholds){
		
		if(w2ui[translate("inventoryGridTitle")])	
				w2ui[translate("inventoryGridTitle")].searchReset(false);  //Reset search (trigger search logic), but don't refresh the grid http://w2ui.com/web/docs/1.5/w2grid.searchReset
		else fnClearIsolateSelections("clear");							  //Make all non-selected slot visible again; fnClearIsolateSelections included in grid search logic
			
		fnHideThresholdScaleLegendCustomColor(); 
		
		if (objColumnAttributes.type == "(C)" || objColumnAttributes.type == "(S)" ) {  //COLOR OR SCALE
			switch (objColumnAttributes.type) {
				case "(C)":
				
					var fnCalcColor = function (slotIndex, palletIndex, column)  { 
												var aPallets = properties.inventoryDataMap.get(properties.layoutData[slotIndex].LOCATION);
												return aPallets ? properties.inventoryData[aPallets[palletIndex]]["COLOR_" + column] : undefined; //To handle being called when testing for "datGuiNoColor"
									  };
					fnColorAndFillSlot(objColumnAttributes,fnCalcColor);		
					break;
				
				case "(S)":
									
					fnRenderByScaling(properties.scaleType.getValue(), objColumnAttributes, resetThresholds);
					
					break;
					
				default:		
			} //switch
		}// if
		else {   //NO COLOR OR SCALE SELECTED  
			
			var fnCalcColor = function () { 
								switch(properties.inventoryColor.getValue()){
									
								case translate("datGuiNoColor"):
									return "datGuiNoColor";
									break;
								case translate("datGuiRandom"):
									return '#' + Math.round((0x1000000 + 0xffffff * Math.random())).toString(16).slice(1); 
									break;
								case translate("datGuiInversion"):
									return fnGetBackGroundColorInvert();
									break;
								}//switch
								return "datGuiNoColor" 
								};   //Used by fnSetColorWireFrame
								
			fnColorAndFillSlot(objColumnAttributes,fnCalcColor);
			
		}//else
					
		//REMOVE SCALE AND LEGEND CONTROlS
		function fnHideThresholdScaleLegendCustomColor(){

			//HIDE USE THRESHOLD CHECKBOX
			$(properties.useThresholds.domElement.parentElement.parentElement).hide();
			

			//HIDE MINIMUM THRESHOLD
			$(properties.minThreshold.domElement.parentElement.parentElement).hide();
			
			//HIDE MAXIMUM THRESHOLD
			$(properties.maxThreshold.domElement.parentElement.parentElement).hide();	

			//HIDE THRESHOLD INTERVALS
			$(properties.thresholdIntervals.domElement.parentElement.parentElement).hide();				
			
			//HIDE SCALE TYPE
			$(properties.scaleType.domElement.parentElement.parentElement).hide();
			
			//HIDE PREDEFINED SCALE
			$(".gui-scalelist").hide();
			
			//HIDE LEGEND
			$(".gui-legend").hide();				
		
			//HIDE CUSTOM COLORS
			$(properties.scaleLow.domElement.parentElement.parentElement).hide();
			$(properties.scaleHigh.domElement.parentElement.parentElement).hide();			

			properties.guiAnalyzeInventoryFolder.updateDisplay();
			
			
		} //fnHideThresholdScaleLegendCustomColor
		

	} //fnVisualizeInventory

	//RECOLOR THE VISUALIZATION
	//Assumes the visualization was first built off of properties.layoutData 
	function fnColorAndFillSlot(objColumnAttributes,fnCalcColor){
		
		for (var slotIndex = 0; slotIndex < properties.layoutData.length; slotIndex++){
			if (properties.warehouseGroup.children[slotIndex].userData.type == "slot") {
				if (properties.inventoryDataMap) {

					var emptySlot = isEmpty(properties.layoutData[slotIndex].LOCATION);
					if (emptySlot) {
						if (fnCalcColor(slotIndex, 0, objColumnAttributes.column) == "datGuiNoColor" ) {
							fnSetColorWireFrame(slotIndex, 0, "datGuiNoColor", true);
						}
						else {
							fnSetColorWireFrame(slotIndex, 0, fnGetBackGroundColorInvert(), true);
						}	
					} //if
					else {

						var aPallets = properties.inventoryDataMap.get(properties.layoutData[slotIndex].LOCATION);
						for (var palletIndex = 0; palletIndex < aPallets.length; palletIndex++) {
							fnSetColorWireFrame(slotIndex, palletIndex,  fnCalcColor(slotIndex, palletIndex, objColumnAttributes.column), false);	
						} //for 
						
					} //else
						 
				} //if
				else {  //No Inventory Data
				
					fnSetColorWireFrame(slotIndex, 0,  fnCalcColor(), true);
				
				} //else
			
			} //if	
		}//for	
	
	}//fnColorAndFillSlot	
	
	//Check if inventory data has an OCCUPIED column that will data drive filled slots	
	function isEmpty(location){	
	
		//If no inventoryData or location is not in inventory data map, it's empty
		return (properties.inventoryDataMap == undefined) || (properties.inventoryDataMap.get(location) == undefined); 
	
	} //isEmpty
	
	function fnSetColorWireFrame(slotIndex, palletIndex, color, bWireFrame){
		
		var edgeColor = color == "datGuiNoColor" ? fnGetBackGroundColorInvert() : properties.datGuiSettings.scene_background;  
		var edgeColor = fnGetBackGroundColorInvert();
		
		properties.warehouseGroup.children[slotIndex].children[0].material.color.set(edgeColor);   //Slot Edge inverese of background		
		properties.warehouseGroup.children[slotIndex].children[0].userData.color = edgeColor;
		
		var slot = properties.warehouseGroup.children[slotIndex];
		var numChildren = slot.children.length;
	
		var childIndex = (2 * palletIndex) + 1;
	
		if (color == "datGuiNoColor") {
			//NO! Always needed for raycasting pproperties.warehouseGroup.children[slotIndex].children[palletIndex + 1].visible = false;
			
			slot.children[childIndex].material.color.set(fnGetBackGroundColorInvert());   //[0] is the slot edge; [1,2,3 ...] are the pallets 
			slot.children[childIndex].userData.color = fnGetBackGroundColorInvert();			
			
			slot.children[childIndex].material.opacity = 0; 
			slot.children[childIndex].userData.opacity = 0; 	
		
		} //if
		else {
		
			slot.children[childIndex].material.color.set(color);   	//[0] is the slot edge; [1,2,3 ...] are the pallets 
			slot.children[childIndex].userData.color = color;

			var emptyOpacity = color ===  "datGuiNoColor" ? 0 : 0.5; ;
			slot.children[childIndex].material.opacity = bWireFrame ? emptyOpacity : 1.0; 
			slot.children[childIndex].userData.opacity = bWireFrame ? emptyOpacity : 1.0; 	//Store for use with selections 	
		
		} //else
		
		
	}	//fnSetColorWireFrame	
	


	
	// RENDER COLOR SCALE LIST
	function fnRenderScalePredinedOrCustom(objColumnAttributes,scaleNumOrObj) {
		
		var column = objColumnAttributes.column;
		
		var aScale = fnGetD3Scales();   //0 is low to high, 1 is high to low, 2 is low to high, 3 is high to low.... aScale[i%2] = low-to-high or high-to-low
	
		var scale = typeof scaleNumOrObj == "number" 
			? { scale: aScale[scaleNumOrObj], min: scaleNumOrObj % 2, max:  scaleNumOrObj % 2 == 0 ? 1 : 0  }   //Property of 'scale' along with min/max determined by ALTERNATING scales
			: scaleNumOrObj;    //can be {low: high:} for custom scale

		var dataType = properties.inventoryDataTypes[column];	

		var aUniqueCategories = fnUnique(properties.inventoryData.map(function (row) {return dataType == "float" ? parseFloat(row[column]): row[column]}) )
								.sort(function(a,b){  //https://stackoverflow.com/questions/4373018/sort-array-of-numeric-alphabetical-elements-natural-sort
									  var a1=typeof a, b1=typeof b;
									  return a1<b1 ? -1 : a1>b1 ? 1 : a<b ? -1 : a>b ? 1 : 0;
								});
		switch(dataType) {
			case "float":
				var maxDecimalPlaces = d3.max(properties.inventoryData,function (d,i) { return fnDecimaPlaces(parseFloat(d[column])); });			
				var minScale = objColumnAttributes.minScale;
				var maxScale = objColumnAttributes.maxScale;	
				break;
			case "text":				
				var minScale = 0;				
				var maxScale = Math.max(aUniqueCategories.length - 1, 1);									
				break;
			default:	
		} //switch
		
		
		//ColorScales documented here: https://github.com/d3/d3-scale-chromatic 
		//Scale Sequential requires interpolator: https://github.com/d3/d3-scale#sequential-scales
		//Interpolator: https://github.com/d3/d3-interpolate	
		

	    var colorInterpolator = Object(scale).hasOwnProperty("scale") ? d3[scale.scale] : d3.interpolateRgb(scale.low, scale.high);    //If scale is a string, use predefined scale, else interpolate colors based on low/high color range

		//THRESHOLD SCALING
		var minThreshold = parseFloat(properties.minThreshold.getValue());
		var maxThreshold = parseFloat(properties.maxThreshold.getValue());
		var numThresholds = parseFloat(properties.thresholdIntervals.getValue()); //Minimum 3; ( < minThreshold ) , ( == minThreshold ) to  ( < maxThreshold ), ( == maxThreshold ) to ( > maxThreshold )
			
		var numIntervalsRange =  d3.range(numThresholds-1); // https://github.com/d3/d3-array/blob/master/README.md#range
		var numIntervalsDomain = [numIntervalsRange[0],numIntervalsRange[numIntervalsRange.length-1]];

		//Dynamically generated thersholds as a function of the minThreshold, maxThreshold, numThreholds
		//Eg 0-10 with 3 threholds = [0,10]   4 thresholds = [0,5,10]
		var thresholds =  numIntervalsRange.map(function (d) {return d3.scaleLinear().domain(numIntervalsDomain).range([minThreshold,maxThreshold])(d)});  
		
		//Determine Scale orientation (low to high or high to low if it's predefined scale; leave alone if it's custom scale)
		var colorThresholdRange = d3.range(numThresholds);
		var aMinMaxcolorThresholdRange= [colorThresholdRange[0] , colorThresholdRange[colorThresholdRange.length-1] ];					
		var thresholdDomain = Object(scale).hasOwnProperty("scale") ? 
								[ aMinMaxcolorThresholdRange[scale.min], aMinMaxcolorThresholdRange[scale.max] ] : 
								[ aMinMaxcolorThresholdRange[0], aMinMaxcolorThresholdRange[1] ];		
		
		//Calculate numThresholds number of colors interpolated from the color scale
		var fnColorThreshold = d3.scaleSequential(colorInterpolator).domain(thresholdDomain);
		var thresholdColors =  colorThresholdRange.map(function (d) { return fnColorThreshold(d); } );  //Array of the colors that correspond to each threshold
	     
		var thresholdScale = d3.scaleThreshold() //https://github.com/d3/d3-scale#threshold-scales
				.domain(thresholds)
				.range(thresholdColors); 		
		
		//SEQUENTIAL SCALING
		var aMinMaxSequential = [minScale,Math.max(parseFloat(minScale)+1,maxScale)];
		var domain = Object(scale).hasOwnProperty("scale") ? [ aMinMaxSequential[scale.min], aMinMaxSequential[scale.max] ]   : [ aMinMaxSequential[0], aMinMaxSequential[1] ];
		var sequentialScale = d3.scaleSequential(colorInterpolator).domain(domain);

		if (dataType == "float") {		
			//Determine Threshold or Sequential Scale
			if (properties.useThresholds.getValue()){
				var colorScale = thresholdScale;
			}//if 
			else {			
				var colorScale = sequentialScale;

			} //else
					
		} //if
		else {
			var colorScale = sequentialScale;	
		}

		
		//SET SLOT COLOR AS A FUNCTION OF COLORSCALE
		for (var slotIndex = 0; slotIndex < properties.layoutData.length; slotIndex++ ) {
			if (properties.warehouseGroup.children[slotIndex].userData.type == "slot") {
				
				var emptySlot = isEmpty(properties.layoutData[slotIndex].LOCATION);
				var slot = properties.warehouseGroup.children[slotIndex];
				var numSlotPallets = slot.children.filter(function(child){ return child.userData.type == "pallet"; }).length;
				
				
				for (var palletIndex = 0; palletIndex < numSlotPallets; palletIndex++ ) { //Account for slot edge, then pallet and pallet edge
					if (minScale == maxScale ) {
						var strColorRGB = colorScale(minScale);
					} //if
					else {

						
						if (emptySlot){
							var columnValue = dataType == "float" ?  0 :  "" ;	// Zero or null for empty slots
						} //if
						else {
							var inventoryIndex = properties.inventoryDataMap.get(properties.layoutData[slotIndex].LOCATION)[palletIndex];
							var columnValue = properties.inventoryData[inventoryIndex][column];  
						} //else
						
						
						var strColorRGB = dataType == "float" ?  
											colorScale(columnValue) : 
											colorScale(aUniqueCategories.indexOf(columnValue));
					} //else	
							
					fnSetColorWireFrame(slotIndex, palletIndex , strColorRGB, emptySlot); // fnSetColorWireFrame works on zero-based pallet index
					
				} //for
			} //if	
			
		} //for		
		
		// LEGEND			
		//Legend as per http://d3-legend.susielu.com/#color-linear
		var liLegend = d3.select(".gui-legend");
		liLegend.style("display","list-item");
		
		var divLegend = liLegend.select("div:last-child");
		
		if (!divLegend.node()) {
			divLegend = liLegend.append("div")                 //last div child
				.style("background-color","white")
				.style("height","100%")
				.style("width","100%")
				.style("overflow","auto");		
		} //if
		
		divLegend.selectAll("svg").remove();
		
		
		var svgLegend = divLegend.append("svg")
							.attr("height",$(divLegend.node()).height())					
							.attr("width",$(divLegend.node()).width());						
		
		var gLegend = svgLegend							
						.append("g")
							.attr("class", (dataType == "float") ? "legendSequential" : "legendOrdinal" )
							.style("font-size","11px")					
							.style("font-family","'Lucida Grande', sans-serif")								  
							.attr("transform", "translate(20,20)");	
							
		var legend = d3.legendColor()
		    .title(column)
			.cells(Math.min(10,aUniqueCategories.length))			
			.shape("rect")
			.shapeWidth(10)
			.shapeHeight(7)
			.labelOffset(4)		
			.ascending(dataType == "text" ? false : domain[0] > domain[1])	
			.orient("vertical"); //vertical or horizontal

			
		legend.cellFilter(function(d,i) {return i < aUniqueCategories.length});	

		if (dataType == "float") {
			
			if (properties.useThresholds.getValue()){
				
				legend	
					//.labels(d3.legendHelpers.thresholdLabels)
					.labels(thresholdLegendLabels)
					.labelDelimiter(translate("legendDelimeter"))
					.ascending(false);
					
					//http://d3-legend.susielu.com/#color-threshold
					//function thresholdLegendLabels({ i, genLength, generatedLabels, labelDelimiter}) {
					function thresholdLegendLabels(obj) {
							  var i = obj.i;
							  var genLength = obj.genLength;
							  var generatedLabels = obj.generatedLabels;
							  var labelDelimiter = obj.labelDelimiter;
							  if (i === 0) {
								const values = generatedLabels[i].split(` ${labelDelimiter} `) //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
								//return `Less than ${values[1]}`
								return translate("legendLessThan")  + ` ${values[1]}`
							  } else if (i === genLength - 1) {
								const values = generatedLabels[i].split(` ${labelDelimiter} `)
								//return `${values[0]} or more`
								return `${values[0]} ` + translate("legendOrMore")
							  }
							  return generatedLabels[i]
					} //thresholdLegendLabels
					
					
			}//if 
				
			legend
				.scale(colorScale)
				.labelFormat(",." + maxDecimalPlaces +"f");
				
		} //if
		else {
			var ordinal = d3.scaleOrdinal()
				.domain(aUniqueCategories)
				.range(aUniqueCategories.map(function(cat,i) { return colorScale(i); } ) );  //sequentialScale assigned to Ordinal logic		
			legend			
				.scale(ordinal);  //Use sequentialScale assigned to ordinal logic above to create array of specific colors assigned to ordinals						
		} //else 

		gLegend.call(legend);   //Build Legend with var 'legend' properties			

		//Make scrollable if necessary.  Driven by the legend contents width/height when it's larger than its svg container
		svgLegend.attr("width",  Math.max(svgLegend.attr("width")  - 20 ,gLegend.node().getBBox().width  + 20)); 		
		svgLegend.attr("height", Math.max(svgLegend.attr("height") - 20 ,gLegend.node().getBBox().height + 20));	
		
		
		function fnUnique(arr) {    //returns only uniques in an array
			var hash = {}, result = [];
			for ( var i = 0, l = arr.length; i < l; ++i ) {
				if ( !hash.hasOwnProperty(arr[i]) ) { 
					hash[ arr[i] ] = true;
					result.push(arr[i]);
				} //id
			} //for
		return result;
		} //fnUnique			

		function fnDecimaPlaces(num) {
		  var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
		  if (!match) { return 0; }
		  return Math.max(
			   0,
			   // Number of digits right of decimal point.
			   (match[1] ? match[1].length : 0)
			   // Adjust for scientific notation.
			   - (match[2] ? +match[2] : 0));
		} //fnDecimaPlaces	


	
	} //fnVisualizeInventoryScale
	
	
	// ANIMATE
	function animate() {
			properties.animationFrame = window.requestAnimationFrame( animate );						//https://www.paulirish.com/2011/requestanimationframe-for-smart-animating/			
			properties.renderer.obj.render( properties.scene.obj, properties.camera.obj );		
			properties.controls.obj.update();
			properties.stats.update();
			calcLateActivities();
	
	}
	
	
	function calcLateActivities() {
		properties.lateActivitiesCount = 0;
		if (!properties.activityActiveData) {
			properties.showLateController
				.name(translate("datGuiFolders.showLate") +  " (" + d3.format(',')(properties.lateActivitiesCount) + ")" );			
			return;
		} //if 
		
		for (var i=0; i < properties.activityActiveData.length; i++ )
			{if (properties.activityActiveData[i].goal < new Date()) properties.lateActivitiesCount++;	
		} //for

		properties.showLateController
			.name(translate("datGuiFolders.showLate") +  " (" + d3.format(',')(properties.lateActivitiesCount) + ")" );
	} //calcLateActivities
	
	
			
	function fnClearSelectionAndSearch(){
		fnClearSelectionFolder();
		fnClearIsolateSelections("clear");
		if(w2ui[translate("inventoryGridTitle")])	w2ui[translate("inventoryGridTitle")].searchReset(false);  //http://w2ui.com/web/docs/1.5/w2grid.searchReset
	} //	
	
	// beyeV ORBITAL CONTROL
	function fnShowBirdsEyeView() {
		if (properties.camera.obj.position.y != properties.gridHelper.gridSize) {
			properties.controls.obj.reset();
			return;
		}
		else { //rotate clockwize
			properties.camera.obj.position.applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI / 2); //rotate clockwize 90 degrees
			properties.controls.obj.update();		
		}	
	} //fnShowBirdsEyeView

		
	
	// SET BIRDSEYE VIEW
	function fnSetBirdsEyeView(){
		//Discussion on Camera lookat: https://stackoverflow.com/questions/15696963/three-js-set-and-read-camera-look-vector/15697227#15697227
		properties.camera.obj.position.set(0, properties.gridHelper.gridSize, properties.gridHelper.gridSize);
		properties.camera.obj.lookAt(properties.scene.obj.position);	
        properties.controls.obj.update();		
		properties.controls.obj.saveState();
	} //fnSetBirdsEyeView
	

	
	// BUILD GRIDHELPER	
	function fnBuildGridHelper (properties,settings) {
		if (properties.gridHelper.obj) properties.sceneGroup.remove(properties.gridHelper.obj);
		properties.gridHelper.obj = new THREE.GridHelper(settings.size, 
									settings.divisions, 
									settings.colorCenter, 
									settings.color);
		properties.gridHelper.obj.position.set(settings.x,settings.y,settings.z);
		properties.gridHelper.obj.material.visible = settings.visible;						
		properties.sceneGroup.add(properties.gridHelper.obj);		
	
	} //fnBuildGridHelper		
		

	function fnClearIsolateSelections(operation){
		
		if (!properties.warehouseGroup) return;
		
		if (operation == "clear")
			fnClearSlotSelectionAttributes();
		
		for (var slotIndex = 0; slotIndex < properties.warehouseGroup.children.length ; slotIndex++){
			if (properties.warehouseGroup.children[slotIndex].userData.type == "slot") {
			
				for (var palletIndex = 1; palletIndex < properties.warehouseGroup.children[slotIndex].children.length; palletIndex++ ){
				
					var selectedClearTest = operation == "clear" ? 
															true : 
															// .selected set to true or false (via "clear" option) by visualObjSelected logic
															properties.warehouseGroup.children[slotIndex].children[palletIndex].userData.selected == false; //clear or isolate
					
					if (selectedClearTest ) {	//reset to original value or make invisible,  Not selected pallets will not be affected
						properties.warehouseGroup.children[slotIndex].children[palletIndex].material.opacity = 
																				(operation == "clear") ? 
																					properties.warehouseGroup.children[slotIndex].children[palletIndex].userData.opacity : 
																					0;
					} //if
						
					if (operation == "isolate" && properties.warehouseGroup.children[slotIndex].children[palletIndex].userData.selected == true) {
						
						properties.warehouseGroup.children[slotIndex].children[palletIndex].material.color.set(fnGetBackGroundColorInvert());
						properties.warehouseGroup.children[slotIndex].children[palletIndex].material.opacity = 1;

					} //if
				
				} //for	
			
			} //if
			
		} //for			
		

		function fnClearSlotSelectionAttributes(){
			for (var slotIndex =0; slotIndex < properties.warehouseGroup.children.length ; slotIndex++){
				if (properties.warehouseGroup.children[slotIndex].userData.type == "slot") {
					for (var palletIndex = 1; palletIndex < properties.warehouseGroup.children[slotIndex].children.length; palletIndex++ ){
						properties.warehouseGroup.children[slotIndex].children[palletIndex].userData.selected = false;
					}
				} // if
			} //for					
		} //fnClearSlotSelectionAttributes	

	
	} //fnClearIsolateSelections
	
			
	function fnClearSelectionFolder() {	
		
		fnRemoveControllers(properties.guiSelectionItemFolder);			//Assiociated with inventoryObjSelected
		fnRemoveControllers(properties.guiSelectionLinksFolder); 		//Associated with inventoryObjSelected
		fnRemoveControllers(properties.guiRenderingInfoFolder);   	//Associated with the translation provided by properties.schema		
		
		properties.guiSelectionFolder.close();
		properties.guiSelectionItemFolder.close();			
		
		// REMOVE CONTROLLERS
		function fnRemoveControllers(guiFolder){
			for (var i = guiFolder.__controllers.length -1; i >= 0; i-- ){ guiFolder.remove(guiFolder.__controllers[i])}
		}	
	
	
	} //fnClearSelectionFolder		
				
	function fnShowActivityArrows(objSelected, isPeriod){

		var activityForBaySelected = properties.filteredActivity.filter(function(activity){
						var periodTest = isPeriod ? activity.periodTime.getTime() == new Date(properties.periodController.getValue()).getTime() :
													true;		
						return activity.aisle == objSelected.userData.riserProperties.aisle &&
								activity.bay == objSelected.userData.riserProperties.bay &&
								periodTest;
								
						});			
		


		activityForBaySelected
			.forEach(function(activity){
					var fromLayoutRecord = properties.layoutData[properties.layoutDataMap.get(activity.FROM_LOCATION )];
					var fromObj = properties.warehouseGroup.getObjectByName(properties.schema.id(fromLayoutRecord));						
					var toObj = objSelected;
					var activityType = "activityCompleted"

					fnBuildActivityFlow(fromObj,toObj,activity, activityType);
					

			});
	} //fnShowActivityArrows				


	//Build the activity flow beziers for completed or active activities
	function fnBuildActivityFlow(fromObj,toObj,activity, activityType) {

		var fromVector = new THREE.Vector3(fromObj.position.x, fromObj.position.y, fromObj.position.z);
		var toVector = new THREE.Vector3(toObj.position.x, toObj.position.y, toObj.position.z);
							
		var middleVector = new THREE.Vector3().addVectors(fromVector,toVector).divideScalar(2);
		middleVector.setComponent(1,properties.riserMaxHeight * 2.5 );  //Locate Y position of center above warehouse to make an arc
		
		var activityColor = properties.datGuiMoveTypesAndColor[activity.MOVE_TYPE];
		
		var curve = new THREE.QuadraticBezierCurve3(
			fromVector.applyMatrix4(properties.sceneGroup.matrixWorld),
			middleVector.applyMatrix4(properties.sceneGroup.matrixWorld),
			toVector.applyMatrix4(properties.sceneGroup.matrixWorld)
		);		
		
		var points = curve.getPoints( 50 );
		var geometry = new THREE.BufferGeometry().setFromPoints( points );

		var material = new THREE.LineBasicMaterial( { color : activityColor } );
		//material.linewidth = 2;  //known limitation: https://threejs.org/docs/index.html#api/materials/LineBasicMaterial.linewidth

		// Create the final object to add to the scene
		var fromToBezier = new THREE.Line( geometry, material );	

		
		fromToBezier.name = "Arrow_" + uuidv4();
		fromToBezier.userData.type = activityType;
		fromToBezier.userData.MOVE_TYPE = activity.MOVE_TYPE;
		
		properties.scene.obj.add( fromToBezier ); 
		
		var pushPin = null;
		
		if (activityType == "activityActive") {				

			var radius = properties.avgSlotWidth / 2;
			var geometry =  new THREE.SphereGeometry( radius , 15, 15);
			var material = new THREE.MeshBasicMaterial( {color: activityColor} );
			var pushPinHead = new THREE.Mesh( geometry, material );
			pushPinHead.name = "pushPinHead_" + uuidv4();
	
			
	
			var material = new THREE.LineBasicMaterial( { color: activityColor } );  
						
			var geometry = new THREE.Geometry();
			geometry.vertices.push(new THREE.Vector3(pushPinHead.position.x, pushPinHead.position.y, pushPinHead.position.z) );
			geometry.vertices.push(new THREE.Vector3( pushPinHead.position.x,pushPinHead.position.y - ((properties.riserMaxHeight )  - fromObj.position.y) , pushPinHead.position.z ) );
			var pushPinStem = new THREE.Line( geometry, material );
			
			pushPin =  new THREE.Group();
			pushPin.name = "pushPin_" + uuidv4();
			pushPin.userData.type = "pushPin";
			pushPin.userData.activity = activity;
			
			pushPin.add(pushPinHead);
			pushPin.add(pushPinStem);
			
			pushPin.position.x  = fromObj.position.x;
			pushPin.position.y  = properties.riserMaxHeight;
			pushPin.position.z  = fromObj.position.z;
			//properties.scene.obj.add( pushPin ); 
			properties.warehouseGroup.add( pushPin );   //Added to warehouseGroup so that it can be raycasted on
		}
				
		
		
		return {fromToBezier: fromToBezier, pushPin: pushPin}
	
} //fnBuildActivityFlow		
	
	
	
	//SHOW DETAILS IN DAT.GUI
	function fnShowObjDetailsInGui(visualObjSelected,operation) {	
		
		
		switch (visualObjSelected.userData.type){
			
			case "pushPin":
				fnClearSelectionFolder();
				
				var activity = visualObjSelected.userData.activity;				
	
				Object.keys(activity)
				.forEach(function (key){
						var keyValue = typeof activity[key] == "object"  ? activity[key].toLocaleString() : activity[key];
						properties.datGuiSettings["selection_" + key] = keyValue;
						var controller = 
							properties.guiSelectionItemFolder.add(properties.datGuiSettings,"selection_" + key)
								.name(key);	
						d3.select(controller.domElement).select("input").attr("readonly",true);			
						});					

				 break;
			
			case "riserGroup":
			
				fnClearActivityWorkFlow("activityCompleted");  
				
				fnClearSelectionFolder();	
				fnShowActivityArrows(visualObjSelected,false);  //No period filter, show all activity for all periods	
			
				if (visualObjSelected.userData.replenish + visualObjSelected.userData.riserProperties.pick == 0 ) return;
				
				var replenish = d3.format(',')(visualObjSelected.userData.riserProperties.replenish);
				var pick = d3.format(',')(visualObjSelected.userData.riserProperties.pick);
				var total = d3.format(',')(parseInt(replenish) + parseInt(pick));
			
				//Bay Activity Details
				var mergeProps = Object.assign(properties.datGuiSettings,visualObjSelected.userData.riserProperties, visualObjSelected.userData.riserProperties.render);   //Merge visualObjSelected.userDatainto properties.datGuiSettings														
				Object.keys(visualObjSelected.userData.riserProperties).sort()
				.forEach(function (key){
											if (typeof visualObjSelected.userData.riserProperties[key] != "object") {
												mergeProps["selection_" + key] = visualObjSelected.userData.riserProperties[key]; 
												var controller = properties.guiSelectionItemFolder.add(mergeProps,"selection_" + key)
																 .name(key);
												
												if (Object.keys(properties.datGuiMoveTypesAndColor).includes(key) )
													$(controller.domElement.parentElement).find("span").css("background-color",properties.datGuiMoveTypesAndColor[key]);//.css("width","35%");
													$(controller.domElement.parentElement).find("div").css("float","right").css("width","55%");
												
											} //if
											else {
												Object.keys(visualObjSelected.userData.riserProperties[key])
												.forEach(function(objKey){
													var calcProperty = visualObjSelected.userData.riserProperties[key][objKey];
													calcProperty = typeof calcProperty == "object" ? JSON.stringify(calcProperty) : calcProperty;
													mergeProps[objKey] = calcProperty; 
													var controller = properties.guiRenderingInfoFolder.add(mergeProps,objKey);		
												})
												
											} //else		
										});	
				
				//Data Grid in Links for Activity Selected
				properties.datGuiSettings["Bay Activities"] = function (){
																var aBaySelected = properties.filteredActivity.filter(function(activity)
																				{ return activity.aisle == visualObjSelected.userData.riserProperties.aisle &&
																						activity.bay == visualObjSelected.userData.riserProperties.bay
																				});
																fnShowActivityGrid(aBaySelected) 
															 };
				properties.guiSelectionLinksFolder.add(properties.datGuiSettings , "Bay Activities" );
	
				break;
			
			case "pallet":
					
				fnClearSelectionFolder();	
							
				if (w2ui[translate("inventoryGridTitle")]) {  //if inventory grid exists
					var grid = w2ui[translate("inventoryGridTitle")];		
					
					var selectedPalletInBay = visualObjSelected.userData.selected ? visualObjSelected : fnGetSelectedPalletInBay(visualObjSelected);
					
					if(grid.last.searchIds.length <= 1){   //if there is no search or just 1 search selection in effect
					
						//if bay has selected items
						if (selectedPalletInBay){
							var visualObjSelected = selectedPalletInBay;	//Overrriding parameter sent in
						} //if
						else if(grid.last.searchIds.length == 1) {   //Only 1 item was the result of the grid search and the selected slot is not part of a bay with a selected slot in it
							w2ui[translate("inventoryGridTitle")].searchReset(false);  //http://w2ui.com/web/docs/1.5/w2grid.searchReset
						}
						
						fnClearIsolateSelections("clear"); //Clear any slot isolations					
						visualObjSelected.userData.selected = true;  //Won't be a problem if slot is search filter slot
						fnClearIsolateSelections("isolate");
					
					} //if
					
					if (grid.last.searchIds.length > 1 && !visualObjSelected.userData.selected ){  //Multiple slot as a result of search, but new slot selected is not a searched-on slot
						
						//if bay has selected items
						if (selectedPalletInBay){
							var visualObjSelected = selectedPalletInBay; //Overrriding parameter sent in
						}
						else return; //Don't show details in gui for non-search result items 
						
					} //if
					else {  //scenario when slot was selected from bayView; force opacity to original opacity
						visualObjSelected.material.opacity = visualObjSelected.userData.selected ? visualObjSelected.material.opacity  : visualObjSelected.userData.opacity;	
					} //else
					
				} //if	
				else { //Inventory Grid doesn't exist
						fnClearIsolateSelections("clear"); //Clear any slot isolations					
						visualObjSelected.userData.selected = true;
						fnClearIsolateSelections("isolate"); //	fnShowBayDetail will set selected objects opacity; this just makes not selected opaque			
				} //else	

					
				fnShowBayDetail(visualObjSelected);
			
				//Item Details
				var emptySlot = isEmpty(visualObjSelected.parent.name);
				var inventoryObjSelected = properties.inventoryDataMap ? 
												emptySlot ? 
													{} :  //else
													properties.inventoryData[properties.inventoryDataMap.get(visualObjSelected.parent.name)[parseInt(visualObjSelected.userData.palletNum)]] 
												: //else
												{};  //If no inventory data
				var layoutObjSelected = properties.layoutData[properties.layoutDataMap.get(visualObjSelected.parent.name)];
				
				
				var mergeProps = Object.assign(properties.datGuiSettings,properties.schema,inventoryObjSelected,layoutObjSelected);   //Merge properties.schema and object select into properties.datGuiSettings
				
				for (var key in inventoryObjSelected) { mergeProps[key] = inventoryObjSelected[key] ? inventoryObjSelected[key] : "" ; }   //assign "" if inventoryObjSelected[key] undefined/null			
				Object.keys(inventoryObjSelected).forEach(function (key){properties.guiSelectionItemFolder.add(mergeProps,key);})				//Create selection details folder					
				
				//Example of selection Link for a search
				//properties.datGuiSettings["detailLink1"] = function (){window.open("https://www.bing.com/search?q=" + fnVisualID("parse",visualObjSelectedName),"_blank"); };
				//folders.guiSelectionLinksFolder.add(properties.datGuiSettings,"detailLink1").name("Search on " + fnVisualID("parse",visualObjSelectedName) );
				
				//https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-web-api-v7-reference
				//https://moz.com/blog/the-ultimate-guide-to-the-google-search-parameters
				//properties.selectionLinks.push({url:"https://www.bing.com/search?"   , urlText:"Bing Search Item"  , "q":"ITEM DESCRIPTION", "count":"PACK"});
				//properties.selectionLinks.push({url:"https://www.bing.com/search?"   , urlText:"Bing Search Item"  , "q":"ITEM DESCRIPTION"});
				//properties.selectionLinks.push({url:"https://www.google.com/search?" , urlText:"Google Search Item", "q":"ITEM DESCRIPTION"});
				
				
				if (!properties.WebFOCUS ) {
				
					var linkFunctions = [];
					properties.selectionLinks.forEach(function(link,index) {
													var linkParms = [];
													
													Object.keys(link).forEach(function(parm) {
																	if (parm != "url" && parm != "urlText") 
																			linkParms.push(encodeURI(parm + "=" + (emptySlot ? "" : mergeProps[link[parm]]) ) );
															});	
													linkFunctions.push(function (){window.open(link.url + linkParms.join("&"),"_blank"); } );
													properties.datGuiSettings["detail" + index] = linkFunctions[index];
													properties.guiSelectionLinksFolder.add(properties.datGuiSettings , "detail" + index).name(link.urlText );
													});	
														  
														  
				} // (!properties.WebFOCUS)										
				
				//Create Content for Scene Details folder from layoutData transformed through the schema
				var dataLayoutSelected =  properties.layoutData.find(function(slot){return properties.schema.id(slot) == visualObjSelected.parent.name});
				Object.keys(properties.schema).forEach(function(key) {
														var calcProperty = properties.schema[key](dataLayoutSelected, properties.aisleWidthEdgeToEdge);
														calcProperty = typeof calcProperty == "object" ? JSON.stringify(calcProperty) : calcProperty;
														mergeProps[key] = calcProperty;	
														});		
				Object.keys(properties.schema).forEach(function (key){
															properties.guiRenderingInfoFolder.add(mergeProps,key);
														});	
									
														
				//Create Content for Scene Details folder just from layoutData
				Object.keys(layoutObjSelected).forEach(function(key) {
														mergeProps[key] = layoutObjSelected[key];	
														});		
				Object.keys(layoutObjSelected).forEach(function (key){
															properties.guiRenderingInfoFolder.add(mergeProps,key);
														});											
			
				break;
			
		}//switch
		
		//Make all data and Rendering detail inputs readonly
		d3.select(properties.guiSelectionItemFolder.domElement).selectAll("input").attr("readonly",true);
		d3.select(properties.guiRenderingInfoFolder.domElement).selectAll("input").attr("readonly",true);	
	
		properties.guiActivityFolder.close();
		properties.guiAnalyzeInventoryFolder.close();
		Object.keys(properties.datGui.__folders).forEach(function(key){ if (key != translate("datGuiFolders.visual")) properties.datGui.__folders[key].close() });
		properties.datGui.open();
		if (visualObjSelected.userData.type == "pushPin") properties.guiActivityLegendFolder.open();  //Show the activity legend
		properties.guiSelectionFolder.open();
		properties.guiSelectionItemFolder.open();
		if (!properties.inventoryData || emptySlot) properties.guiRenderingInfoFolder.open(); 
		
		//Update dat.GUI Display
		properties.guiSelectionFolder.updateDisplay()
		properties.guiSelectionLinksFolder.updateDisplay();
		properties.guiSelectionItemFolder.updateDisplay();
		properties.guiRenderingInfoFolder.updateDisplay();	

		//Determine if visualobject selected is part of a bay with a .selected = true slot	
		function fnGetSelectedPalletInBay(visualObjSelected){
			
			var selectedPalletInBay = null;
			
			//Find first selectedPallet in the same bay...if it exists
			for (var slotIndex = 0; slotIndex < properties.warehouseGroup.children.length; slotIndex++){
				if (properties.warehouseGroup.children[slotIndex].userData.type == "slot" && 
					properties.warehouseGroup.children[slotIndex].userData.aisle == visualObjSelected.parent.userData.aisle &&  
					properties.warehouseGroup.children[slotIndex].userData.bay == visualObjSelected.parent.userData.bay &&
					properties.warehouseGroup.children[slotIndex].userData.aisleSide == visualObjSelected.parent.userData.aisleSide) {
						for (var palletIndex=1; palletIndex < properties.warehouseGroup.children[slotIndex].children.length; palletIndex++){
							if (properties.warehouseGroup.children[slotIndex].children[palletIndex].userData.selected) {
									selectedPalletInBay = properties.warehouseGroup.children[slotIndex].children[palletIndex];
									break;
							} //if
						} // for
					if (selectedPalletInBay) break;
				} //if	
			}//for					
			
			return selectedPalletInBay;
			
		} //fnGetSelectedPalletInBay
		

		//Show Bay Detail
		function fnShowBayDetail(visualObjSelected) {   //Similar design pattern to fnBuildScene

				fnBayViewDestroy(); //Destroy previous version of bay view...if it exists

				properties.detailSpan = document.createElement("SPAN");
				
				$(properties.detailSpan).attr("id","spanBayView");
				
				properties.bayViewLI.appendChild(properties.detailSpan);	
				
				properties.fnHandleKeyMouseBayView = function (event){properties.fnHandleKeyMouse(event);};	 //Want this separate from fnHandleKeyMouse because it is remove by fnBayViewDestroy repeatedly
				
				$(properties.detailSpan).dblclick(properties.fnHandleKeyMouseBayView);	//Double click handler
				//$(properties.detailSpan).click(properties.fnHandleKeyMouseBayView);	//Sinlge click handler
				$(properties.detailSpan).mousedown(properties.fnHandleKeyMouseBayView);	//Sinlge click handler
				
	
				// Bay SCENE
				properties.bayScene = new THREE.Scene();
				properties.bayScene.background  = new THREE.Color(properties.datGuiSettings.scene_background);

				var aisle =  visualObjSelected.parent.userData.aisle;
				var bay = visualObjSelected.parent.userData.bay;
				var aisleSide = visualObjSelected.parent.userData.aisleSide;
				
				for (var slotIndex = 0; slotIndex < properties.warehouseGroup.children.length; slotIndex++){  
					if (properties.warehouseGroup.children[slotIndex].userData.type == "slot" && 
						properties.warehouseGroup.children[slotIndex].userData.aisle == aisle &&  
						properties.warehouseGroup.children[slotIndex].userData.bay == bay &&
						properties.warehouseGroup.children[slotIndex].userData.aisleSide == aisleSide) {
							
						var slotClone = properties.warehouseGroup.children[slotIndex].clone(true);	//https://github.com/mrdoob/three.js/issues/1596 Material is copied and not new!
						
						for (childIndex = 0; childIndex < slotClone.children.length; childIndex++){
						
							slotClone.children[childIndex].material = new THREE.MeshBasicMaterial( {transparent: true,  wireframe: false});
							slotClone.children[childIndex].material.opacity = properties.warehouseGroup.children[slotIndex].children[childIndex].userData.opacity ;  //Set to original opacity or 1 if Active version
							var color =  slotClone.userData.type == "edge" ? 
												properties.bayScene.background :
												properties.warehouseGroup.children[slotIndex].children[childIndex].userData.color;
							slotClone.children[childIndex].material.color.set(color);		
						
						}
						properties.bayScene.add(slotClone); 
						
						
					} //if	
				}//for							
									
				var boundingBox = new THREE.BoxHelper(properties.bayScene, 0xffffff); 					
				boundingBox.geometry.computeBoundingBox(); 
				var bBox =boundingBox.geometry.boundingBox;											
				var bSphere= boundingBox.geometry.boundingSphere;																		
				boundingBox.boundingRange = new THREE.Vector3 (											
					(bBox.max.x - bBox.min.x) / 2, 																	
					(bBox.max.y - bBox.min.y) / 2,       
					(bBox.max.z - bBox.min.z) / 2); 		
											
				var x = bSphere.center.x;
				var y = bSphere.center.y;
				var z = bSphere.center.z;
				var minY = bBox.min.y;											

				// LIGHT
				properties.bayScene.add(new THREE.AmbientLight(0xffffff,0.5))						
				
				// CAMERA
				var width = $(properties.bayViewLI).width();
				var height = properties.bayViewHeight;     //$(properties.bayViewLI).height() Doesn't work because folder is closed ;
				
				var fieldOfView =  Math.max(45, Math.atan(2 * boundingBox.boundingRange.y / properties.aisleWidthEdgeToEdge  ) * 180 / Math.PI);
				var aspectRatio = width / height;	
				var perspectiveNear = 0.1; 	
				var	perspectiveFar = Math.ceil(bSphere.radius) * 10;	
				
				properties.bayCamera = new THREE.PerspectiveCamera( fieldOfView, aspectRatio, perspectiveNear, perspectiveFar);

				//Camera positioning
				var layoutData = properties.layoutData[properties.layoutDataMap.get(visualObjSelected.parent.name)];
				var aisleSide = layoutData["AISLE SIDE"] || layoutData.AISLESIDE;
				var axisMajor = layoutData.CENTERAXIS.toLowerCase() == "x" ? "x" : "z";
				var axisMinor = axisMajor == "x" ? "z" : "x"; 
				var factor =  aisleSide == "R" ? 1 : -1; 						

				properties.bayCamera.position.y = y * 2.5;  //Look from slighly above
									
				properties.bayCamera.position[axisMajor] =  bSphere.center[axisMajor] + (factor * properties.aisleWidthEdgeToEdge * 1.5);
				properties.bayCamera.position[axisMinor] = bSphere.center[axisMinor];
				
				properties.bayCamera.lookAt(new THREE.Vector3(x, y, z )); 
			
				properties.bayScene.add(properties.bayCamera );	

				// RENDERER
				if ( Detector.webgl ) properties.bayRenderer = new THREE.WebGLRenderer( {antialias:true} );
				else properties.bayRenderer  = new THREE.CanvasRenderer(); 
				properties.bayRenderer.setSize(width, height);
					
				properties.detailSpan.appendChild( properties.bayRenderer.domElement );	
				
			

				properties.bayRenderer.render(properties.bayScene,properties.bayCamera );						
								
				// ORBIT CONTROLS
				var orbitControls = new THREE.OrbitControls( properties.bayCamera , properties.bayRenderer.domElement ); 	
				orbitControls.target.set(x, y, z );		
				orbitControls.enableKeys = true;
				orbitControls.enablePan = true;
				orbitControls.screenSpacePanning = false;		
				orbitControls.maxPolarAngle = 90 * (Math.PI / 180)  ;
			
				fnBayAnimate();

				//Bay Details Animation
				function fnBayAnimate() {
						properties.bayAnimationFrame = window.requestAnimationFrame( fnBayAnimate );								
						properties.bayRenderer.render(properties.bayScene,properties.bayCamera );		
						orbitControls.update();
				}					
				
							
		}//fnShowBayDetail
		
		
	}//fnShowObjDetailsInGui
	
	
	// REMOVE ACTIVITY WORKFLOW INDICATORS
	function fnClearActivityWorkFlow(activityType)  {
		
		//Clear arrows from Scene
		for (var i = properties.scene.obj.children.length - 1; i >= 0; --i){
			if (properties.scene.obj.children[i].userData.type == activityType) {
						properties.scene.obj.remove(properties.scene.obj.children[i]);	
			} // if
		} //for	

		if (activityType == "activityActive") {
			//Clear PushPins from warehouseGroup
			for (var i = properties.warehouseGroup.children.length - 1; i >= 0; --i){
				if (properties.warehouseGroup.children[i].userData.type == "pushPin") {
							properties.warehouseGroup.remove(properties.warehouseGroup.children[i]);	
				} // if
			} //for	
		}
		
	} //fnClearActivityWorkFlow	

	//Show Activity Grid; both complete and selected
	function fnShowActivityGrid(aActivity){
		
		if (!properties.activityCompletedData) return; //No Data, No Grid
		
		if ($('#w2ui-popup').length > 0) return; //If pop-up is already open return;

		var activityDataTypes = properties.activityDataTypes;			
		var columns = [{field:"recid", caption:"Row", sortable:true, searchable:true}]; 
		Object.keys(aActivity[0]).forEach(function(field){ if (field != "recid") columns.push({field:field, caption:field, sortable: true, searchable: true})});					
		
		var gridData = 	
			{
				name		: translate("activityGridTitle"),
				columns		: columns,		
				records		: aActivity,    
				show: 		{
								toolbar: true,
								footer: true
							},
				sortData: 	columns.map(function(row,i){ return Object.assign(row,{direction: "ASC"}) }),	
				searches: 	columns.map(function(row,i){ return Object.assign(row,{type: activityDataTypes[row.field] ? activityDataTypes[row.field] : "text" }) }),			
				multiSearch : true
			};
		
		$().w2destroy(translate("activityGridTitle"));    //Destroy the data grid, if it exists
		var gridObj =  $().w2grid(gridData);		
			

		var downLoadButton = 
			!(document.documentMode || /Edge/.test(navigator.userAgent)) ? 
				'<a id="' +  gridData.name + 'Link" onclick="$(this).data().fnDownLoad(\'' +  gridData.name + '\');" href="" download="activityDownLoad.csv"><button>' + translate("downLoadData") + '</button><a>' :		
				'';	//data download not supported by edge: 	//https://stackoverflow.com/questions/33154646/data-uri-link-a-href-data-doesnt-work-in-microsoft-edge	

				
			var popUp = w2popup.open({	title: translate("activityGridTitle"),
										buttons   : '<button onclick="w2popup.close();">' + translate("popUpClose") + '</button> ' +  downLoadButton,		
										showMax: true,
										showClose: true,
										width: properties.width/1.5,
										height: properties.height/1.5,
										modal: false,
										keyboard:true,
										onOpen: function (event) {
													event.onComplete = 	function () {
																			$("#" + gridData.name + "Link").data({fnDownLoad: fnDownLoad});
																			gridObj.box = $("#w2ui-popup .w2ui-popup-body");
																			gridObj.render();
																			//this.max();
																		};
												}												
								  }
								);	
				
			
	} //fnShowActivityGrid	
	
	// BUILD DATAGRID	
	function fnBuildInventoryGrid(data) {
					
		var inventoryDataTypes = properties.inventoryDataTypes;			
		var columns = [{field:"recid", caption:"Row", sortable:true, searchable:true}]; 
		//Object.keys(mergedRow).forEach(function(field){ if (field != "recid") columns.push({field:field, caption:field, sortable: true, searchable: true})});
		Object.keys(inventoryDataTypes).forEach(function(field){ if (field != "recid") columns.push({field:field, caption:field, sortable: true, searchable: true})});
		
		$().w2destroy(translate("inventoryGridTitle"));    //Destroy the data grid, if it exists
		
		return {
			name		: translate("inventoryGridTitle"),
			columns		: columns,		
			records		: data,    																		//Using recid in fnPreProcess
			show: 		{
							toolbar: true,
							footer: true
						},
			sortData: 	columns.map(function(row,i){ return Object.assign(row,{direction: "ASC"}) }),	
			searches: 	columns.map(function(row,i){ return Object.assign(row,{type: inventoryDataTypes[row.field] ? inventoryDataTypes[row.field] : "text" }) }),			
			multiSearch : true,
			onClick: function(event) {
				//event.preventDefault();
				w2ui[translate("inventoryGridTitle")].dblClick(event.recid, { metaKey: true });   //http://w2ui.com/web/docs/1.5/w2grid.dblClick
			},  				
			onDblClick: function(event) {
				//event.preventDefault();
				fnClearIsolateSelections("clear");
				var selectedRecord = properties.inventoryGrid.data.records[event.recid -1];	
				var selectedSlot = properties.warehouseGroup.getObjectByName(properties.schema.id(selectedRecord));
				var selectedPallet = selectedSlot.getObjectByName(selectedRecord.PALLET);
				selectedPallet.userData.selected = true; //Handled by fnClearIsolateSelections				
				fnShowObjDetailsInGui(selectedPallet);				
			},
			onSearch:  function(event){
							//https://github.com/vitmalina/w2ui/issues/1604
							event.onComplete = 	fnSearchInventory;
						}  //function
		}
		
	
	} //fnBuildInventoryGridfnBuildInventoryGrid
	
	//Search Inventory
	function fnSearchInventory(){
		
		fnClearIsolateSelections("clear");	
		
		var grid = w2ui[translate("inventoryGridTitle")];		
		if(grid.last.searchIds.length == 0) return;
		
		//for (var i=0; i < Math.min(grid.last.searchIds.length,maxArrows); i++ ){
		for (var i=0; i < grid.last.searchIds.length; i++ ){
			var searchId = grid.last.searchIds[i];
			var selectedRecord = properties.inventoryGrid.data.records[searchId];
			var selectedSlot = properties.warehouseGroup.getObjectByName(properties.schema.id(selectedRecord));
			var selectedPallet = selectedSlot.getObjectByName(selectedRecord.PALLET);
			selectedPallet.userData.selected = true; //Handled by fnClearIsolateSelections("isolate")
			
			if (grid.last.searchIds.length == 1) {
				fnShowObjDetailsInGui(selectedPallet); 
			} //if
			else {
				fnClearSelectionFolder();
			} //else	
			
		} //for			

		fnClearIsolateSelections("isolate");   //isolate all selection opacities
		
	} //fnSearchInventory
	
	

	//http://cwestblog.com/2014/10/21/javascript-creating-a-downloadable-file-in-the-browser/
	function fnDownLoad(gridName) {
	
		var data = w2ui[gridName].searchData.length > 0 ?  fnGetSearchRecords(gridName) :  w2ui[gridName].records;
		var downLoadData= "data:text/plain;charset=utf-8," + encodeURIComponent(d3.csvFormat(data)); //https://github.com/d3/d3-dsv#csvFormat
		$("#" + gridName + "Link").attr("href",downLoadData);
		
		function fnGetSearchRecords(gridName){
			var searchRecords =[];
			for (var i = 0; i < w2ui[gridName].last.searchIds.length; i++) {
				var searchId = w2ui[gridName].last.searchIds[i];
				searchRecords.push(w2ui[gridName].records[searchId])		
			} //for
			
			return searchRecords;
			
		} // fnGetSearchRecords
		
		
	};	

	
	// SHOW DATAGRID
	function fnShowInventoryGrid() {
		
	if (!properties.inventoryData) return;	//No data, No Grid
	
	if ($('#w2ui-popup').length > 0) return; //If pop-up is already open return;
	
	var gridData = (!properties.inventoryGrid.data) ? 
					properties.inventoryGrid.data = properties.fnBuildInventoryGrid(properties.inventoryData) : 
					properties.inventoryGrid.data;	
	var gridObj =  (properties.inventoryGrid.obj) ?  
					properties.inventoryGrid.obj : 
					properties.inventoryGrid.obj = $().w2grid(gridData);
	
	//data download not supported by edge: 	//https://stackoverflow.com/questions/33154646/data-uri-link-a-href-data-doesnt-work-in-microsoft-edge	
	var downLoadButton = 
		!(document.documentMode || /Edge/.test(navigator.userAgent)) ? 
			'<a id="' +  gridData.name + 'Link" onclick="$(this).data().fnDownLoad(\'' +  gridData.name + '\');" href="" download="inventoryDownLoad.csv"><button>'+  translate("downLoadData") + '</button><a>' :		
			'';	
				
	 
    var popUp = w2popup.open({
		title: translate("inventoryGridTitle"),	
		buttons   : '<button onclick="w2popup.close();">' +  translate("popUpClose") + '</button> ' + 
		             '<button id="btnClear" onclick="$(this).data().fnClearSelectionAndSearch();">' +         //Using JQuery .data() object to hold reference to fnClearSelectionAndSearch
					 ( properties.featureVersion == "Full" ? translate("datGuiFolders.clearSelection") : translate("datGuiFolders.clearSelectionActivity") ) +
					 '</button> ' + downLoadButton,	
		showMax: true,
		showClose: true,
		width: properties.width/1.5,
		height: properties.height/1.5,
		modal: false,
		keyboard:true,
		onMax     : function (event) {},
		onMin     : function (event) {},
		onKeydown : function (event) {},	
		onOpen: function (event) {      //Grid inside a popup: https://github.com/vitmalina/w2ui/issues/51
					event.onComplete = 	function () {																			
											$("#btnClear").data({fnClearSelectionAndSearch: fnClearSelectionAndSearch});			    
											$("#" + gridData.name + "Link").data({fnDownLoad: fnDownLoad});									
											gridObj.box = $("#w2ui-popup .w2ui-popup-body");
											gridObj.render();
											//this.max();
										};
				}		
		});

		
	} //fnShowInventoryGrid	


	
	
	// GET PREDEFINED COLORS and SCALING COLUMNS
	function fnGetPreOrScaleColorColumns(properties) {
	
		var predefinedColors = [];
		var scalingColumns = []
		Object.keys(properties.inventoryDataTypes).forEach(function(column) {
										column.indexOf("COLOR_") != -1 && column != "recid" ?  
											predefinedColors.push(column.substring(column.indexOf("_") + 1 ) + " (C)" )  : 
											scalingColumns.push(column + " (S)")
									 } //function
		); //forEach
		
		return {predefinedColors: predefinedColors, scalingColumns: scalingColumns}
	
	} //fnGetPreOrScaleColorColumns
	

		// 3D COLOR SCALES
	function fnGetD3Scales() {
	    //https://github.com/d3/d3-scale-chromatic
		var strScales = "interpolateRdYlGn,interpolateBrBG,interpolatePRGn,interpolatePiYG,interpolatePuOr,interpolateRdBu";
		strScales += ",interpolateRdGy,interpolateRdYlBu,interpolateSpectral";
		strScales += ",interpolateBlues,interpolateGreens,interpolateGreys,interpolateOranges";
		strScales += ",interpolatePurples,interpolateReds,interpolateBuGn,interpolateBuPu";
		strScales += ",interpolateGnBu,interpolateOrRd,interpolatePuBuGn,interpolatePuBu,interpolatePuRd";
		strScales += ",interpolateRdPu,interpolateYlGnBu,interpolateYlGn,interpolateYlOrBr,interpolateYlOrRd";
		
		var scales = strScales.replace(/\s/g,'').split(",");
		var merge = [];	
		for (var i = 0; i < scales.length; i++){
			merge.push(scales[i]);
			merge.push(scales[i]);
		}
		
		
		return merge;
	}
		
	function fnGetD3ScalesIndex(strScale_or_HL) {

		var scaleOffset = strScale_or_HL.substring(strScale_or_HL.length - 2) ==  "HL" ? 1 : 0;   //eg: "interpolateRdYlGn": regular or "interpolateRdYlGnHL": reversed High to Low
		var scale = strScale_or_HL.substring(0,strScale_or_HL.length - (2 * scaleOffset));
		var aScales = fnGetD3Scales();
		return aScales.indexOf(scale) + scaleOffset;
	}	

	
	
	
	// BUILD SCENE
	function fnBuildScene() {	
	
		// CONTAINER
		var container = properties.container;
		
		// PARENT GROUP	
		properties.sceneGroup = new THREE.Group();		
				
		// SCENE
		properties.scene.obj = new THREE.Scene();
		properties.scene.obj.background  = new THREE.Color(properties.scene.background);
		
		//*******************************************************************************************************************************
		// SCENE COMPONENTS: function referenced by properties.fnBuildWarehouse	
		// Adds objects to  properties.warehouseGroup.  The fnBuildWarehouse method is set in properties.fnBuildWarehouse and is data dependent
        // Objects are built color-less		
		properties.warehouseGroup = properties.fnBuildWarehouse();
		
		fnAddPallets();
		
		//Add newly created slots to the scene's parent group
        properties.sceneGroup.add(properties.warehouseGroup);	
		
		//Create activity risers for the activity data and add to scene.  
		//Multiple activities may point to a single riser via aisle + "_" + bay reference of properties.mapBayActivityLocation location
		
		if (properties.mapBayActivityLocation) {
			properties.mapBayActivityLocation.forEach(function(location,key){
																location.activityObj = 
																fnBuildActivityRiser({	render: {min:  location.min, 
																								 max:  location.max,
																								 centerLine: location.centerLine,
																								 center: location.center
																								 },
																						aisle:  location.aisle,
																						bay: location.bay
																				 });
																
																properties.warehouseGroup.add(location.activityObj.activityRiser);
				
														} );
		} //if	
		
		//*******************************************************************************************************************************	
		
		// BOXHELPER																						//A boundingBox for the complete group is then calculated. Its center is used to re-center the group relative to the scene's 0,0,0 coordiante. 
		properties.boundingBox.obj = 
				new THREE.BoxHelper(properties.warehouseGroup, properties.boundingBox.color); 					//Used to get the group's coordinates	
		properties.boundingBox.obj.geometry.computeBoundingBox();                         					//https://threejs.org/docs/index.html#api/core/BufferGeometry.computeBoundingBox
		properties.boundingBox.obj.visible = properties.boundingBox.visible;	
		
		var bBox = properties.boundingBox.obj.geometry.boundingBox;											//Save in properties for possbile future reference
		var bSphere= 
			properties.boundingBox.obj.geometry.boundingSphere;												//Save in properties for possible future reference
	    properties.gridHelper.gridSize = Math.ceil(bSphere.radius) * 2.25;									//The grid size is 25% larger than the diameter (r*2)
				
		properties.boundingBox.boundingRange = new THREE.Vector3 (											// +/- x,y,z length values; Divide by 2 because group is centered in scene
			(bBox.max.x - bBox.min.x) / 2, 																	//Used to set orbit controls' target, which is a function of major axis orientation
		    (bBox.max.y - bBox.min.y) / 2,       
			(bBox.max.z - bBox.min.z) / 2); 		
		
			
		var x = bSphere.center.x;
		var y = bSphere.center.y;
		var z = bSphere.center.z;
		var minY = bBox.min.y; 
													 
		properties.sceneGroup.add(properties.boundingBox.obj);	


		//Determine maximum height of the warehouse.  It will be used to scale the activity risers...multiply by a factor 'rise' above the slots													
		var maxY = 
			properties.boundingBox.obj.geometry.boundingBox.max.y - properties.boundingBox.obj.geometry.boundingBox.min.y;
		var riserMaxFactor = 3;	
		properties.riserMaxHeight = maxY * riserMaxFactor;  //Also used by from/to arrows

		
		// LIGHT
		properties.scene.obj.add(new THREE.AmbientLight(0xffffff,0.5))
		
		
		// CAMERA
		var width = properties.width;
		var height = properties.height;
		
		var fieldOfView = properties.camera.fov.number;
		var aspectRatio = width / height;
		//var perspectiveNear = 0.1, perspectiveFar = 20000;		
		var perspectiveNear = 0.1, 
		    perspectiveFar = properties.gridHelper.gridSize * 2;		
		properties.camera.obj = new THREE.PerspectiveCamera( fieldOfView, aspectRatio, perspectiveNear, perspectiveFar);
		properties.scene.obj.add(properties.camera.obj);
		

		// RENDERER
		if ( Detector.webgl )
			properties.renderer.obj = new THREE.WebGLRenderer( {antialias:true} );
		else
			properties.renderer.obj = new THREE.CanvasRenderer(); 

		properties.renderer.obj.setSize(width, height);
		
		var zIndex = parseFloat($(container).css("z-index")) ?  parseFloat($(properties.container).css("z-index"))  : 0;
		
		$(properties.renderer.obj.domElement).css({"z-index": zIndex - 2, "position": "absolute", "top": 0, "left": 0} );		
		
		container.appendChild( properties.renderer.obj.domElement );
			
		// ORBIT CONTROLS
		properties.controls.obj = new THREE.OrbitControls( properties.camera.obj, properties.renderer.obj.domElement ); 			
		properties.controls.obj.enableKeys = true;
		properties.controls.obj.enablePan = true;
		properties.controls.obj.screenSpacePanning = false;	
		properties.controls.obj.panSpeed = properties.controls.panSpeed;	
		properties.controls.obj.zoomSpeed = properties.controls.zoomSpeed;	
		properties.controls.obj.maxPolarAngle = properties.controls.maxPolarAngle * (Math.PI / 180)  ;											
		

		// GRIDHELPER
		fnBuildGridHelper(properties,{x: x, y: minY, z: z, size: properties.gridHelper.gridSize, 
									   divisions: properties.gridHelper.divisions, colorCenter: properties.gridHelper.colorCenter,
									   color:properties.gridHelper.color, visible:  properties.gridHelper.visible  });
		
	
		// AXESHELPER														
		properties.axesHelper.obj = new THREE.AxesHelper( properties.gridHelper.gridSize );			//Add x,y,z axis helper at scenes 0,0,0
		properties.axesHelper.obj.position.set(-properties.boundingBox.boundingRange.x, -properties.boundingBox.boundingRange.y, -properties.boundingBox.boundingRange.z )
		properties.axesHelper.obj.visible = properties.axesHelper.visible;
		properties.scene.obj.add( properties.axesHelper.obj );
			
	
		properties.sceneGroup.position.x = -x; 														    //Center image relative to scene's x:0,y:0,z:0 
		properties.sceneGroup.position.y = -y;																
		properties.sceneGroup.position.z = -z;
		
	
		properties.scene.obj.add(properties.sceneGroup);
		
		properties.controls.obj.maxDistance = properties.gridHelper.gridSize * 1.5;						//Don't allow orbital control to go out beyond the 150% of gridSize		
				
			
		
		// KEY AND MOUSE Click HANDLER
		properties.fnHandleKeyMouse = function (event){
			

		
			event = event || window.event;
			
			var eventSource = "main";  //default
			if (event.delegateTarget) { //jQuery event from bayView
				eventSource = "bayView";
			}			
			
			
			properties.clientX =  eventSource == "main" ? event.clientX : event.offsetX;
			properties.clientY =  eventSource == "main" ? event.clientY : event.offsetY;
			
			if (w2popup.status == "open") 
				return;	

			if (properties.WebFOCUS) {  //WebFOCUS Extension support

				var content = properties.renderConfig.moonbeamInstance.getSeries(0).tooltip;    //Base Content																				

				// tooltip style is an object full of CSS properties and values
				var tooltip_style = {
					background: 'lightgrey',
					borderWidth: '5px',
					borderStyle: 'solid',
					borderColor: 'grey',
					borderRadius: '5px'
				};

				var tooltip_properties = {
							 fill: 'lightgrey',
							 border: {},
							 cascadeMenuStyle: {
							 hover: { labelColor: '#000000', fill: '#D8BFD8'}
							 }
				};	


				properties.tooltip = tdgchart.createExternalToolTip(container, "vwTooltip"); 
				properties.tooltip
					.style(tooltip_style)
					.properties(tooltip_properties)
					.autoHide(true);											
															

			}
			

			switch(event.type){
				case "keydown":
				   	if (!event.ctrlKey) {
						//http://www.asciitable.com/
						switch(event.keyCode) {
							case 65: 
								fnShowActivityGrid(properties.activityCompletedData);
								break;
							case 66: 				//key = 'b'
								fnShowBirdsEyeView();
								break;	
							case 67:				//key = 'c'
								fnClearSelectionAndSearch();	
								break;
							case 73:				//key = 'i'
								fnShowInventoryGrid();	
								break;	
							case 84: 				//key = 't'
								fnResetActivityRisers();
								break;;	
						} //switch
					}// if
					break;
				case "mousedown":				
					var visualObjectSelected = fnGetSelectedObj(properties,eventSource);
					if (visualObjectSelected) 	{			
						if (event.ctrlKey) {
							fnShowObjDetailsInGui(visualObjectSelected);
						} //if
						else {
							if (properties.WebFOCUS && visualObjectSelected.userData.type == "slot") {  //WebFOCUS..show tooltip
								if (eventSource == "main") { 
									fnClearSelectionFolder();  //Only close Selection Folder if it's not the bayView
									fnShowObjDetailsInGui(visualObjectSelected);  //Isolate the selected slot
								} //if	
								var offset = properties.inventoryDataMap.get(visualObjectSelected.name);
								var ids = {series: 0, group: offset};	
								var data = properties.renderConfig.data;	
								properties.tooltip
									.content(content, data[offset], data, ids)	
									.position(event.clientX , event.clientY)   //Takes into account main or bayView
									.show();												
							} //if					
						}
					} // if
					break;							
				case "mouseup":
					break;
				case "dblclick":
							var visualObjectSelected = fnGetSelectedObj(properties, eventSource);
							if (visualObjectSelected) {
								if (properties.WebFOCUS && visualObjectSelected.userData.type == "slot") {  //WebFOCUS Drilldown
										if (eventSource == "main") { 
											fnClearSelectionFolder();  //Only close Selection Folder if it's not the bayView
											fnShowObjDetailsInGui(visualObjectSelected);  //Isolate the selected slot
										} //if	
										var offset = properties.inventoryDataMap.get(visualObjectSelected.name );
										var chart = properties.renderConfig.moonbeamInstance;
										
										
										var ids = {series: 0, group: offset};	
										var data = properties.renderConfig.data;
										var ddType = (chart.eventDispatcher.events.length != 0) ? "single" : "multi";
										
										switch (ddType) {
										
											case "single":
												var dispatcher = chart.eventDispatcher.events.find(function (obj) { return obj.series == 0});
												var localURL = chart.parseTemplate(dispatcher.url, data[offset], data, ids);
												if (dispatcher.target) {
																window.open(localURL, dispatcher.target);
												} //if
												else {
																document.location = localURL;
												} //else										
											
												break;
											
											case "multi":
												//New WebFOCUS Extension logic for showing tooltip		

												properties.tooltip
													.content(content, data[offset], data, ids)	
													//.content([" offset: " + offset])   //for debugging
													//.position(properties.clientX , properties.clientY)
													.position(event.clientX , event.clientY)   //Takes into account main or bayView
													.show();
												break;
											default:
										
										} //switch
								} //if
								
								else {
								
									fnShowObjDetailsInGui(visualObjectSelected);						
								
								} //else
							} //if
			
				default:	
			} //switch
			
		}//properties.fnHandleKeyMouse
		
		
		// EVENTS
		THREEx.WindowResize(properties.renderer.obj, properties.camera.obj);
		document.addEventListener( 'keydown', properties.fnHandleKeyMouse , false );								//https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
		document.addEventListener( 'mousedown', properties.fnHandleKeyMouse, false );	
		document.addEventListener( 'mouseup', properties.fnHandleKeyMouse, false );
		document.addEventListener( 'dblclick', properties.fnHandleKeyMouse, false );		
		
		
		
		//RETURN
		return;
		
		
			
		//USE RAYCASTING TO DETERMINE SELECT OBJECT
		function fnGetSelectedObj(properties, eventSource){

		
					// the following line would stop any other event handler from firing
					// (such as the mouse's TrackballControls)
					// event.preventDefault();
					//properties.mouse is a THREEjx object
					
					var renderer = eventSource == "main" ? properties.renderer.obj : properties.bayRenderer;
					var camera = eventSource == "main" ? properties.camera.obj : properties.bayCamera;
					var grouping = eventSource == "main" ? properties.warehouseGroup : properties.bayScene;
					
					properties.mouse.x = ( properties.clientX / renderer.domElement.clientWidth ) * 2 - 1;
					properties.mouse.y = - ( properties.clientY / renderer.domElement.clientHeight ) * 2 + 1;
					properties.raycaster.setFromCamera( properties.mouse, camera );
					
					var intersects = properties.raycaster.intersectObjects( grouping.children,true );
					if (intersects.length > 0 ) {
						//Bayview object is not the same as the main screen object...so it has to be located within the warehouseGroup

						var objSelected = intersects[0].object;

						if (eventSource == "main") {

							var parentObj = objSelected.parent ;		
							
							if (objSelected.userData.type == "edge") {  //If the slot edge is selected
								var palletObj = parentObj.children[1]; 	//return the first pallet in the slot
								return palletObj;
							} //if
							
							if (objSelected.userData.type == "pallet" ) {
								return objSelected;
							} //if
							
							return parentObj;  //Otherwise return parent object...could be riser, pushpin, etc.
						}	
						else {  //Bay View
						
							if (objSelected.userData.type == "edge") {  //If the slot edge is selected
								var pallet =  properties.warehouseGroup.getObjectByName(objSelected.parent.name).children.filter(function(child){ 
																															return (child.userData.type == "pallet" &&
																																	child.userData.palletNum == objSelected.userData.palletNum
																																	);})[0];
								pallet.userData.selected = true;
								return pallet; //return the first pallet in the slot in wareshouse group
							} //if
							
							if (objSelected.userData.type == "pallet" )  {
								var pallet = properties.warehouseGroup.getObjectByName(objSelected.parent.name).getObjectByName(objSelected.name);
								pallet.userData.selected = true;
								return pallet; //return the pallet in the slot in wareshouse group
							} //if							
						
						}


						
					}	

					
					return null;
		
				
		} // fnGetSelectedObj
		
		
		
				// BUILD ACTIVITY RISERS: 
		function fnBuildActivityRiser(riserProperties){
			
			switch (riserProperties.render.centerLine ){
				case "X":
					  //x dimension relative to scene...corresponds to width of box; x scene coordant
					  //z dimension relative to scene...corresponds to depth of box; z scene coordinate
					  var w = properties.aisleWidthEdgeToEdge / 2  ;      //Half of aisle
					  var minYdim = Math.min(-2 * (riserProperties.render.min - riserProperties.render.center.y), properties.aisleWidthEdgeToEdge);
					  var maxYdim = Math.min( 2 * (riserProperties.render.max - riserProperties.render.center.y), properties.aisleWidthEdgeToEdge);
					  var d = Math.min(minYdim,maxYdim);
					break;
				case "Y":
					  var d = properties.aisleWidthEdgeToEdge / 2 ;       //Half of aisle
					  var minXdim = Math.min(-2 * (riserProperties.render.min - riserProperties.render.center.x), properties.aisleWidthEdgeToEdge);
					  var maxXdim = Math.min( 2 * (riserProperties.render.max - riserProperties.render.center.x), properties.aisleWidthEdgeToEdge);
					  var w = Math.min(minXdim,maxXdim);				  
					break;
			}			
			
			var activityRiser = new THREE.Group();
				activityRiser.position.x = riserProperties.render.center.x ; 
				activityRiser.position.z =  riserProperties.render.center.y ; 
				activityRiser.name = riserProperties.aisle + "_" + riserProperties.bay + "_" + riserProperties.render.center.x + "_" + riserProperties.render.center.y;
				activityRiser.userData.riserProperties = riserProperties;
				activityRiser.userData.type = "riserGroup";
			
			
			
			var riserMap = new HashMap();
			var activitiesObj =  {};
			var aActivities = Object.keys(properties.datGuiMoveTypesAndColor);

			for (var i=0; i < aActivities.length; i++){

				var color = properties.datGuiMoveTypesAndColor[aActivities[i]]; 
				
				var cubeMaterial = 	new THREE.MeshBasicMaterial({color: color, wireframe: false, transparent: true, opacity: 0.9} );	
				var geometry = new THREE.BoxGeometry( 1, 1, 1  ); // https://threejs.org/docs/index.html#api/geometries/BoxGeometry
				var cube = new THREE.Mesh( geometry, cubeMaterial );
				cube.name = aActivities[i];
				cube.userData.type = "riser";
				activityRiser.add(cube);
				riserMap.set(aActivities[i],cube);
				activitiesObj[aActivities[i]] = 0;
			
			} //for

			var activityCount = {};
						
			set(activitiesObj);

			var obj =	{
				set: set,
				add: add,
				activityRiser: activityRiser,
				activtyCount: function () {return activityCount}
			}
		
			return obj;	
			
			
			function set(activitiesObj){
				
				
				var aActivities = Object.keys(activitiesObj);
				var totActivity = 0;
				for (var i=0; i < aActivities.length; i++){
					
					var cube = riserMap.get(aActivities[i]);
					cube.scale.set( w, Math.max(.00001,activitiesObj[aActivities[i]]), d );
					cube.material.opacity = activitiesObj[aActivities[i]] == 0 ? 0 : 0.9;
					cube.material.color.set(properties.datGuiMoveTypesAndColor[aActivities[i]]);
					
					//https://stackoverflow.com/questions/33454919/scaling-a-three-js-geometry-only-up
					cube.position.y = totActivity + (activitiesObj[aActivities[i]] / 2)	;  
					totActivity = totActivity + parseInt(activitiesObj[aActivities[i]]);
					activityRiser.userData.riserProperties[aActivities[i]] = activitiesObj[aActivities[i]];
				} //for
			
				activityCount = activitiesObj;		
				activityRiser.userData.riserProperties.Total = totActivity;
				
				activityRiser.visible = totActivity > 0;			
				
			} //set
			
			
			// Risers should be set before adding
			function add(activitiesObj){
			
				var addObj = {};
				
				var aActivities = Object.keys(activitiesObj);

				for (var i=0; i < aActivities.length; i++){
					
					var cube = riserMap.get(aActivities[i]);
					var scale = Math.floor(cube.scale.y);
					
					addObj[aActivities[i]] = parseInt(activitiesObj[aActivities[i]]) + scale;   //scale of the cube is also the previous size and activity count
					
				} //for				
				
				set(addObj);
				
				//Overrides assignment in set
				activityCount = addObj;	
					
			} //add
			

		
		}//fnBuildActivityRiser
		
			
	} //fnBuildScene()
	
	//Build a Three.js group of warehouse slots. 
    //Discussion on Model, View and Projection matrices: http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/#the-model-view-and-projection-matrices	
	//The slot geomemtry verticies are built using provided x,y,z,width,depth,height,color and meshType (wire/flat) attributes into the properties' 'group';
	function fnBuildWarehouse() {
	
		var warehouse = new THREE.Group();  															//Containing the whole image allows for possible complete transforms later
		warehouse.name = "warehouse";
																										//In Threejs space, image is laid out relative to 0,0,0		
		var	layoutData = properties.layoutData;
		var sceneId = properties.id;

		var uniqueMaterial = [];																		//arrays to optimize/reuse material and geometry
		var uniqueGeometry = [];
		
		var geometriesMap = new HashMap();
		var edgeColor = fnGetBackGroundColorInvert(); 

		var edgeMaterial = new THREE.LineBasicMaterial( { color: edgeColor, transparent: true, opacity: 0.2} ); // 0xffffff Can't control linewidth: https://threejs.org/docs/index.html#api/materials/LineBasicMaterial.linewidth				
	
		for (var i = 0; i < layoutData.length; i++) {
				
				
				/* https://threejs.org/docs/#api/geometries/BoxGeometry
				BoxGeometry(width : Float, height : Float, depth : Float, widthSegments : Integer, heightSegments : Integer, depthSegments : Integer)

					width — Width of the sides on the X axis. Default is 1.
					height — Height of the sides on the Y axis. Default is 1.
					depth — Depth of the sides on the Z axis. Default is 1.
					widthSegments — Optional. Number of segmented faces along the width of the sides. Default is 1.
					heightSegments — Optional. Number of segmented faces along the height of the sides. Default is 1.
					depthSegments — Optional. Number of segmented faces along the depth of the sides. Default is 1. 
				
				*/		

				var geometryKey = "W" +  properties.schema.sceneWidth(layoutData[i]) + "H" + properties.schema.sceneHeight(layoutData[i]) + "D" + properties.schema.sceneDepth(layoutData[i]);
				var geometries = geometriesMap.get(geometryKey);
				
				if (geometries) {
							var cubeGeometry = geometries.cubeGeometry;
							var edgeGeometry = geometries.edgeGeometry;	
				} //if
				else {
							var cubeGeometry =   new THREE.BoxGeometry(	properties.schema.sceneWidth(layoutData[i]),
																		properties.schema.sceneHeight(layoutData[i]), 
																		properties.schema.sceneDepth(layoutData[i])
																		); // the visual width(x-axis),height(y-axis) depth(z-axis)
							var edgeGeometry = 	 new THREE.EdgesGeometry( cubeGeometry ); //  https://stackoverflow.com/questions/31539130/display-wireframe-and-solid-color/31541369#31541369
							geometriesMap.set(geometryKey,{cubeGeometry: cubeGeometry, edgeGeometry: edgeGeometry});
				} //else
 				
				var cubeMaterial = new THREE.MeshBasicMaterial( {transparent: true,  wireframe: false});
						
				// https://stackoverflow.com/questions/41031214/javascript-threejs-3d-draw-solid-cubic-with-border		

				var edge = new THREE.LineSegments( edgeGeometry, edgeMaterial ); // Can't control linewidth: https://threejs.org/docs/index.html#api/materials/LineBasicMaterial.linewidth
				edge.renderOrder = 0; //https://threejs.org/docs/index.html#api/en/core/Object3D.renderOrder
				edge.userData.type = "edge";
				edge.userData.opacity =  edge.material.opacity;
				edge.userData.color = edge.material.color;
				edge.userData.palletNum = 0;
				
				var pallet = new THREE.Mesh(cubeGeometry, cubeMaterial);
				pallet.material.opacity = 0;
				pallet.userData.opacity = 0;					
				pallet.userData.palletNum = 0;					
				pallet.userData.type = "pallet";
				pallet.userData.selected =  false;
				pallet.renderOrder = 1;
				pallet.name = properties.schema.id(layoutData[i]);				
				
				
				var slot = new THREE.Group();					
				slot.add(edge);				//child[0]		
				slot.add(pallet);		//child[1]		

				slot.name = properties.schema.id(layoutData[i]);		//.name is used as unique key for getObjectByName method. Eg: properties.warehouseGroup.getObjectByName("someName")
				slot.position.x = properties.schema.sceneX(layoutData[i], properties.aisleWidthEdgeToEdge ); 
				slot.position.y = properties.schema.sceneY(layoutData[i]); 									
				slot.position.z =  properties.schema.sceneZ(layoutData[i], properties.aisleWidthEdgeToEdge ); 
				slot.userData.aisle = properties.schema.aisle(layoutData[i]);
				slot.userData.aisleSide = layoutData[i]["AISLE SIDE"] || layoutData[i].AISLESIDE;
				slot.userData.bay = layoutData[i].BAY;
				slot.userData.type = "slot"; 
				slot.userData.numPallets = 1;
				slot.userData.selected = false;

			
				warehouse.add(slot);
					
			
		} //for
		
		
		return warehouse;
		
	} //fnBuildWarehouse	
	
	
	//Add pallets to slots
	function fnAddPallets() {
			
		if (properties.inventoryDataMap) {
			
			var edgeColor = fnGetBackGroundColorInvert(); 
			var edgeMaterial = new THREE.LineBasicMaterial( { color: edgeColor, transparent: true, opacity: 0.2} ); // 0xffffff Can't control linewidth: https://threejs.org/docs/index.html#api/materials/LineBasicMaterial.linewidth				
			
			//properties.warehouseGroup.getObjectByName(location) is too expensive resource wise...so iterate through warehousegroup 1 by 1
			for (var locationIndex = 0; locationIndex < properties.warehouseGroup.children.length; locationIndex++){	
				
				if (properties.warehouseGroup.children[locationIndex].userData.type == "slot"){
					
					var slot = properties.warehouseGroup.children[locationIndex];
					var location =  slot.name;	
					var layoutData = properties.layoutData[properties.layoutDataMap.get(location)];	
					
					var pallets = properties.inventoryDataMap.get(location); //undefined means empty slot		
					
					if (pallets){ //Inventory pallets exist

						var numSlotPallets = slot.userData.numPallets;
						var numInventoryPallets = pallets.length;
						
						if (numSlotPallets === numInventoryPallets && numSlotPallets == 1 ){  //Get to re-use the existing pallet(s)
								var pallet = slot.children[1]; //slot edge plus pallet
								pallet.name = properties.inventoryData[pallets[0]].PALLET;	//pallets[i] is the index into the inventory data stored with inventoryDataMap					
						} //if
						else {
							
							//Remove previously built pallets
							for(var i = slot.children.length-1; i >=1 ; i--){ //First child is the edge of the slot
									slot.remove(slot.children[i]);
							};				

							var palletHeight = properties.schema.sceneHeight(layoutData) / pallets.length;
							var palletGeometry =   new THREE.BoxGeometry(	properties.schema.sceneWidth(layoutData),
																	palletHeight, 
																	properties.schema.sceneDepth(layoutData)
																	);
							var edgeGeometry = 	 new THREE.EdgesGeometry( palletGeometry ); //  https://stackoverflow.com/questions/31539130/display-wireframe-and-solid-color/31541369#31541369
															
																	
							for (var i=0; i < pallets.length; i++){	
							
								var edge = new THREE.LineSegments( edgeGeometry, edgeMaterial ); // Can't control linewidth: https://threejs.org/docs/index.html#api/materials/LineBasicMaterial.linewidth
								edge.renderOrder = 0; //https://threejs.org/docs/index.html#api/en/core/Object3D.renderOrder
								edge.userData.type = "edge";
								edge.userData.opacity =  edge.material.opacity;
								edge.userData.color = edge.material.color;
								edge.userData.palletNum = 0;								
						
								var cubeMaterial = new THREE.MeshBasicMaterial( {transparent: true,  wireframe: false});
								
								var pallet = new THREE.Mesh(palletGeometry, cubeMaterial);
								pallet.renderOrder = 1;
								pallet.userData.type = "pallet";
								pallet.userData.selected =  false;
								pallet.userData.palletNum = i;
								pallet.name = properties.inventoryData[pallets[i]].PALLET;
								
								slot.add(pallet);
								slot.add(edge);


								var yBase = 0 - (properties.schema.sceneHeight(layoutData) / 2);   //The base of the slot
								pallet.position.y  =  yBase + ( i * palletHeight) + (palletHeight/2)  ;
								edge.position.y  =  yBase + ( i * palletHeight) + (palletHeight/2)  ;

							} //for	
							
							slot.userData.numPallets = numInventoryPallets;
							
						} //else
					
					} //if
					else { //Empty the slot
							
						if (slot.children.length == 2){  //Just 1 pallet
							slot.children[1].name = location;
						} //if
						else { //Remove all pallets and put a single empty pallet
							
							//Remove previously built pallets, if any
							for(var i = slot.children.length-1; i >=1 ; i--){ //First child is the edge of the slot
									slot.remove(slot.children[i]);
							};	
							
							var palletGeometry =   new THREE.BoxGeometry(	properties.schema.sceneWidth(layoutData),
																			properties.schema.sceneHeight(layoutData), 
																			properties.schema.sceneDepth(layoutData)
																	);
							var edgeGeometry = 	 new THREE.EdgesGeometry( palletGeometry ); //  https://stackoverflow.com/questions/31539130/display-wireframe-and-solid-color/31541369#31541369
															

							var edge = new THREE.LineSegments( edgeGeometry, edgeMaterial ); // Can't control linewidth: https://threejs.org/docs/index.html#api/materials/LineBasicMaterial.linewidth
							edge.renderOrder = 0; //https://threejs.org/docs/index.html#api/en/core/Object3D.renderOrder
							edge.userData.type = "edge";
							edge.userData.opacity =  edge.material.opacity;
							edge.userData.color = edge.material.color;
							edge.userData.palletNum = 0;							
							
							var pallet = new THREE.Mesh(palletGeometry, cubeMaterial);
							pallet.renderOrder = 1;							
							pallet.material.opacity = 0;
							pallet.userData.opacity = 0;					
							pallet.userData.palletNum = 0;					
							pallet.userData.type = "pallet";
							pallet.userData.selected =  false;
							pallet.name = location;				
											
							slot.add(edge);			//child[0]		
							slot.add(pallet);		//child[1]	

							
						} //else
												
					} //else
						
				} //if		
				
			} //for
		} //if	

	} // fnAddPallets		


	//https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	function uuidv4() {
	  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	  )
	}	
	

	
} //End visual class
