function fnGetWarehouseSchemaLoads() {

	//Lipari layout with Y increasing from Northwest (x:0,y:0,z:0 in warehouse coordinates) corner of scene
	//Y is along 'width' of slot, depth geometry of scene when viewing warehouse at eye-level facing 'North', z coordinate of scene
	//X is along 'depth' of slot, width geometry of scene when viewing warehouse at eye-level facing 'North',  x coordinate of scene
	//Z is along 'height' of slot, height geometry of scene when viewing warehouse at eye-level facing 'North', y coordiante of scene


	function callBackLayoutData (properties, layoutData) {
	
		properties.layoutData = layoutData;
			
		properties.layoutDataMap =  new HashMap();    //https://github.com/flesler/hashmap
		for (var i = 0; i < properties.layoutData.length; i++ ){	
			properties.layoutDataMap.set(properties.layoutData[i].LOCATION,i);		
		}
		
		properties.avgSlotWidth =  d3.mean(properties.layoutData , function(d){ return parseFloat(d.WIDTH) })
			
																													
	} //fnSetLayoutData	


	function callBackActivityCompletedData (properties, activityCompletedData){
		
		properties.activityCompletedData = activityCompletedData;

		if (!properties.activityCompletedData) return;
		
		//Limit to no more than 10 activities
		if(d3.nest().key(function(d){return d.MOVE_TYPE}).entries(activityCompletedData).length > 10){
			alert(translations[localLanguage].errorCompletedActivity);
			properties.activityCompletedData = null;
			return;
		}
	
		fnRemoveOrphanedActivity(properties.activityCompletedData,properties);	
		
		//ENRICH activityCompletedData with aisle, aisleSide, bay, center, x, y from layoutData, determine timestamp and recid
		for (var i=0; i < properties.activityCompletedData.length; i++){
			
			var slot = properties.layoutData[properties.layoutDataMap.get(properties.activityCompletedData[i].TO_LOCATION )];
			properties.activityCompletedData[i].aisle = slot.AISLE; 
			properties.activityCompletedData[i].bay =  slot.BAY;
			properties.activityCompletedData[i].centerAxis = slot.CENTERAXIS; 
			properties.activityCompletedData[i].x = parseFloat(slot.X);
			properties.activityCompletedData[i].y = parseFloat(slot.Y);		

			
			properties.activityCompletedData[i].startTime = fnConvertStrDate(activityCompletedData[i].START_TIME);
			properties.activityCompletedData[i].endTime = fnConvertStrDate(activityCompletedData[i].END_TIME);
			properties.activityCompletedData[i].goal = fnConvertStrDate(activityCompletedData[i].GOAL);
						
			properties.activityCompletedData[i].recid = i + 1;													 	//For the dataGrid		
			
		} //for
		

	}	//callBackActivityCompletedData
	

	function callBackActivityActiveData (properties, activityActiveData){
		
		properties.activityActiveData = activityActiveData;

		if (!properties.activityActiveData) return;
		
		if(d3.nest().key(function(d){return d.MOVE_TYPE}).entries(activityActiveData).length > 10){
			alert(translations[localLanguage].errorActiveActivity);
			properties.activityActiveData = null;
			return;
		}
		
		fnRemoveOrphanedActivity(properties.activityActiveData,properties);	
		
		//ENRICH activityActiveData with aisle, aisleSide, bay, center, x, y from layoutData, determine timestamp and recid
		for (var i=0; i < properties.activityActiveData.length; i++){
				
			properties.activityActiveData[i].startTime = fnConvertStrDate(activityActiveData[i].START_TIME);
			properties.activityActiveData[i].endTime = fnConvertStrDate(activityActiveData[i].END_TIME);
			properties.activityActiveData[i].goal = fnConvertStrDate(activityActiveData[i].GOAL);
						
			properties.activityActiveData[i].recid = i + 1;													 	//For the dataGrid		
			
		} //for
		
	}	//callBackActivityCompletedData	
	
	//Remove any orpahned activity	
	function fnRemoveOrphanedActivity(activityData,properties){
		for (var i=activityData.length-1; i >= 0; i--){
			
			var fromSlot = properties.layoutData[properties.layoutDataMap.get(activityData[i].FROM_LOCATION )];
			var toSlot   = properties.layoutData[properties.layoutDataMap.get(activityData[i].TO_LOCATION )];
		
			if (!fromSlot || !toSlot) 
				activityData.splice(i,1);
			
		} //for	
	} //fnRemoveOrphanedActivity
				
	
	function fnConvertStrDate(strDate){ //Eg: "20180716052523"
	
		if (strDate == "") return "";

		var year = strDate.substring(0,4);
		var month = strDate.substring(4,6);
		var day = strDate.substring(6,8);
		var time = strDate.substring(8,15);
		var hours = time.substring(0,2);
		var minutes = time.substring(2,4);
		var seconds = time.substring(4,6);			

		//new Date(year, monthIndex [, day [, hours [, minutes [, seconds [, milliseconds]]]]]);
		return new Date(year, month -1,  day , hours , minutes , seconds );
	} //fnConvertStrDate	

	function callBackInventoryData (properties, inventoryData) {

		properties.inventoryData = inventoryData;
		
		if (!properties.inventoryData) return;
				
		//Remove any orpahned inventory	
		for (var i=properties.inventoryData.length-1; i >= 0; i--){	
			if (!properties.layoutData[properties.layoutDataMap.get(properties.inventoryData[i].LOCATION )]) 
				properties.inventoryData.splice(i,1);
		} //for	
	
			
		//Add a random data color and create a hashMap for Inventory data.
		//Retrieve index of inventoryData as follows:   inventoryIndex = properties.inventoryDataMap.get(properties.layoutData[i].LOCATION)
		//Rerieve the inventoryData record for the the given location as follows:  properties.inventoryData[inventoryIndex] 
		properties.inventoryDataMap =  new HashMap();    //https://github.com/flesler/hashmap
		for (var i = 0; i < properties.inventoryData.length; i++ ){	
			
			//Using New Pallet Logic
			if ( !properties.inventoryDataMap.get(properties.inventoryData[i].LOCATION) ) {
				properties.inventoryDataMap.set(properties.inventoryData[i].LOCATION,[i])
				
			} //if 
			else {
				properties.inventoryDataMap.get(properties.inventoryData[i].LOCATION).push(i);
			}
				
		}
		


				
	} //callBackInventoryData


	var schema = {	
			id: 			function(obj){return obj.LOCATION},
			sceneWidth: 	function(obj){return parseFloat(obj.DEPTH)},
			sceneDepth: 	function(obj){return parseFloat(obj.WIDTH)},
			sceneHeight: 	function(obj){return parseFloat(obj.HEIGHT)},
			sceneX: 		function(obj, aisleWidthEdgeToEdge){return fnCalcSceneXZ(obj, aisleWidthEdgeToEdge, parseFloat(obj.X), parseFloat(obj.DEPTH), "X")},
			sceneY: 		function(obj){return parseFloat(obj.Z) + (parseFloat(obj.HEIGHT)/2)},
			sceneZ: 		function(obj, aisleWidthEdgeToEdge){return fnCalcSceneXZ(obj, aisleWidthEdgeToEdge, parseFloat(obj.Y), parseFloat(obj.WIDTH), "Y")},		
			aisle:          function(obj){return obj.AISLE;},	
		};
	
	
	//aisleWidthEdgeToEdge
	
	//Lipari's logic using aisle width; if it exists along with 'Inverted Logic':  L/R, LI/RI
	function fnCalcSceneXZ( obj, aisleWidthEdgeToEdge, coordinate, dimension, centerAxis){
		
						//For both X and Y must account for:
						// The x or y coordinate
						// then either the slots width or depth
						// then calcualte the sceneX or sceneZ knowing that the slot drawn by threejs is centered...so slot has to be shifted by half the width or height in the 
						// along either the sceneX axis or sceneZ axis.
		
		
						var aisleWidthOnCenter = aisleWidthEdgeToEdge + dimension;
 
						var halfAisleWidthOnCenter = aisleWidthOnCenter/2;     //If X,Y,Z coordinates already account for aisle width, this would be 0.
						var aisleSide = obj["AISLE SIDE"] || obj.AISLESIDE;
						var bInverted = aisleSide.indexOf("I") == 1;
						var aisleSide = bInverted  ? aisleSide.substring(0,1) : aisleSide; // 'I' is for inverted slot //Strip 'I' of the end
						var factor = aisleSide == "L" ?  
													(bInverted  ? -1 : 1) : 
													(bInverted ? 1 : -1) ;     //"R"
						var factor = obj.CENTERAXIS == "X" ? factor : factor * -1;  // X-based vs Y-based center line.	

						return obj.CENTERAXIS == centerAxis ? 
													(coordinate - (dimension/2) )+ (halfAisleWidthOnCenter * factor) : 
													coordinate - (dimension/2);
	
	} //fnCalcSceneXZ
	
	return {schema: schema, 
			callBackLayoutData: callBackLayoutData, 
			callBackActivityCompletedData: callBackActivityCompletedData, 
			callBackActivityActiveData: callBackActivityActiveData, 
			callBackInventoryData: callBackInventoryData
			};
	
	
} //fnGetWarehouseSchemaPreProccess