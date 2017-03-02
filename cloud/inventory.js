var _ = require('lodash');
var moment = require("moment-timezone");

var trkInventory = function(){
		var sendInventoryEmailReport = function(anInventoryItemList, aVendor){
			// console.log('In sendInventoryEmailWarning');

			var Moment = require("moment-timezone");
			var currentVendorTime = new Moment();
			currentVendorTime.tz(aVendor.get("timeZone"));

			var numberSent = 0;
			var receipients = String(aVendor.get("settings").inventoryAlarmEmailList).split(",");
			var toRecipients = [];

			_.each(receipients, function(emailAddress){
				toRecipients.push({email:String(emailAddress).trim(), type:'to'});
				numberSent++;
			});

			return Parse.Promise.as()
			.then(function(){
				return Parse.Config.get()	
			}).then(function(config){
				config;

				console.log('Mandril API Key has been retrieved...');
				var mandrillAPIKey = config.get("MandrillAPIKey");
				// var Mandrill = require('mandrill');
				// Mandrill.initialize(mandrillAPIKey);

				var mandrill = require('mandrill-api/mandrill');
				var mandrill_client = new mandrill.Mandrill(mandrillAPIKey);

				var mailParams = {
					async:true, 
					template_name: 'inventoryAlert',
					template_content:{},
					message: {
						merge_language: 'handlebars',
						from_email:"info@getyomojo.com",
						from_name: aVendor.get("description"),
						to: toRecipients,
					  	global_merge_vars: [
					  		{
					  			name:"INVENTORYLIST",
					  			content:anInventoryItemList
					  		},
					  		{
					  			name:"VENDORNAME",
					  			content:aVendor.get("description")
					  		},
					  		{
					  			name:'TARGETDATE',
					  			content: currentVendorTime.format("dddd, MMMM Do YYYY")
					  		}
					  	]
					}
				};
			  	return mandrill_client.messages.sendTemplate( mailParams, 
			  		function(httpResponse){
			  			//return a response to the user
			  			console.log('Mandril response is ...' + JSON.stringify(httpResponse[0]));
			  			return Parse.Promise.as(numberSent);
			  		},
			  		function(httpResponse){
			  			console.log('Error sending Mandril Email...' + JSON.stringify(httpResponse));
			  			//we are going to return a success message anyway, as the user can always
			  			//request a re-send
			  			return Parse.Promise.error(httpResponse);
			  		}
			  	);
			});


		}
		var sendInventorySMSWarning = function(anInventoryItem, aVendor, aTruck){
				// console.log('In sendInventorySMSWarning');
				var smsInterface = require('./sms-interface.js');

				var vendorSettings = aVendor.get("settings");

				var phoneNoArray = String(vendorSettings.inventoryAlarmPhoneList).split(",");
				
				var promise = Parse.Promise.as();

				var smsText = 'Low inventory alert at ' + aTruck.get("name") + '. ' + anInventoryItem.get("text") + ' has qty of ' 
								+ anInventoryItem.get("currentLevel") + '.';

				// console.log(smsText);

				_.each(phoneNoArray, function(phoneNo){
					promise = promise.then(function(){
						return Parse.Config.get();
					}).then(function(aConfig){

						// console.log('SMS to Phone' + phoneNo + '. Text is ' + smsText);
						smsInterface.init(aConfig);
						console.log('sending SMS to ' + phoneNo);
						return smsInterface.sendSMS(String(phoneNo).trim(), smsText);
					});
				});

				return promise;
		}

		var _processEmailAlerts = function(){
			var Vendor = Parse.Object.extend("Vendor");
			var numSent = 0;

			var mainQuery =  new Parse.Query(Vendor);
			mainQuery.notEqualTo("suspended", true);
			// Parse.Cloud.useMasterKey();
			
			// console.log('calling find each');
			return mainQuery.each(function(aVendor){
				var alertList = [];

				console.log('Processing vendor ' + aVendor.id);
				//get all the items sold for this vendor since the last run
				var settings = aVendor.get("settings");
				// console.log(JSON.stringify(settings));
				if (!settings.inventoryAlarmEmailList){
					console.log('No Email inventory alerts configured for Vendor ' + aVendor.id);
					return true; //process the next one
				};

				//now get all the inventory items for this vendor
				var inventoryItemQuery = new Parse.Query("InventoryItem");
				inventoryItemQuery.notEqualTo("currentLevel", null);
				inventoryItemQuery.equalTo("vendor", aVendor);
				inventoryItemQuery.include("truck");
				// inventoryItemQuery.addDescending("truck", "currentLevel");

				return inventoryItemQuery.each(function(inventoryItem){
					if (inventoryItem.get("currentLevel") <= inventoryItem.get("alertLevel")){
						
						var alertEntry = inventoryItem.toJSON();

						var aLocation = inventoryItem.get('truck').get('name');
						
						var aMatch = _.find(alertList, {name: aLocation});
						
						if (aMatch){
							aMatch.inventoryItems.push(alertEntry);
						} else {
							aMatch = {};
							aMatch.inventoryItems = [];
							aMatch.inventoryItems.push(alertEntry);
							aMatch.name = aLocation;
							alertList.push(aMatch);	
						};

						
					};
				}, {useMasterKey:true}).then(function(){
					if (alertList.length > 0){
						return sendInventoryEmailReport(alertList, aVendor)
						.then(function(numberEmailsSent){
							numSent = Number(numSent) + Number(numberEmailsSent);
						});
					} 
						else return Parse.Promise.as();
				});	


			}, {useMasterKey:true}).then(function(){
				return Parse.Promise.as(numSent);
			}, function(error){
				return Parse.Promise.error(error);
			});

		}

		var processEmailInventoryAlerts = function(job, data){
			return _processEmailAlerts();
			// .then(function(numSent){
			// 	console.log('status success');
			// 	// status.success('OK. Sent ' + numSent + ' emails');				
			// }, function(error){
			// 	console.log('status error' + JSON.stringify(error));
			// 	// status.error(JSON.stringify(error));
			// });
		}

		var processRealTimeAlerts = function(job, data){
			return _processRealTimeAlerts();
			// .then(function(numSent){
				// console.log('status success');
				// status.success('OK. Sent ' + numSent + ' alerts ');
				// return Parse.Promise.as(numSent)
			// }, function(error){
			// 	console.log('status error' + JSON.stringify(error));
			// 	// status.error(JSON.stringify(error));
			// });
		}

		var _processRealTimeAlerts = function(){
					//load the vendor record from the db
			var Vendor = Parse.Object.extend("Vendor");
			var numSent = 0;
			var masterMenuItemList = [];
			var currentLastRunDate;

			var mainQuery =  new Parse.Query(Vendor);
			mainQuery.notEqualTo("suspended", true);
			// Parse.Cloud.useMasterKey();
			// console.log('calling find each');
			return mainQuery.each(function(aVendor){
				console.log('Processing vendor ' + aVendor.id);
				//get all the items sold for this vendor since the last run
				var settings = aVendor.get("settings");
				// console.log(JSON.stringify(settings));
				if (!settings.inventoryAlarmPhoneList){
					console.log('No Real time inventory alerts configured for Vendor ' + aVendor.id);
					return true; //process the next one
				};

				var inventoryLastRun = aVendor.get("inventoryLastRun");
				var lastRunMoment;

				if (inventoryLastRun)
					lastRunMoment = new moment(inventoryLastRun).utc();
				else {
					//this is the first time this batch job has been run so just default to the last 10 minutes
					lastRunMoment = new moment().utc();
					lastRunMoment.subtract(10, 'm');
				};

				//we subtract 1 minute to ensure that there are no errors with the SELECT 
				//any items that have occurred WITHIN the last minute will be picked up on the NEXT run of this batch job 
				var nowMoment = new moment().utc();
				nowMoment.subtract(1, 'm'); 

				//get all the menu items for this vendor sold since last Run
				var orderQuery = new Parse.Query("Order");
				orderQuery.equalTo("vendor", aVendor);
				orderQuery.containedIn("state", [1, 2, 3]); //1 = in process, 2 = ready for pickup/delivery, 3 = complete
				orderQuery.greaterThan("acceptanceDateTime", lastRunMoment.toDate()); 
				orderQuery.lessThan("acceptanceDateTime", nowMoment.toDate());
				// orderQuery.include("truck");

				var orderItemQuery = new Parse.Query("OrderItem");
				orderItemQuery.matchesQuery("order", orderQuery);
				orderItemQuery.ascending("createdAt");
				//not possible to track inventory on an 'off menu item' so ignore them
				orderItemQuery.equalTo("offMenuItem", false);
				orderItemQuery.include("menuItem", "order", "order.truck");

				return orderItemQuery.find({useMasterKey:true})
				.then(function(orderItems){
					console.log('Found ' + orderItems.length + ' order items. Compressing...');
					// var promise = new Parse.Promise();
					_.each(orderItems, function(anOrderItem){
						var aMatch = _.find(masterMenuItemList, {objectId:anOrderItem.get("menuItem").id});
						if (aMatch){
							aMatch.qty = aMatch.qty + anOrderItem.get("qty");
						} else {
							masterMenuItemList.push({	objecId: anOrderItem.get("menuItem").id, 
														menuItem :anOrderItem.get("menuItem"), 
														qty: anOrderItem.get("qty"),
														truck: anOrderItem.get("order").get("truck")
													});
						};

					});
					return Parse.Promise.as();
				}).then(function(){
					var promise = Parse.Promise.as();

					console.log('After compressing. Processing ' + masterMenuItemList.length  + ' records.');
					_.each(masterMenuItemList, function(aMenuItemEntry){
						promise = promise.then(function(){

							var inventoryItemQuery = new Parse.Query("InventoryItem");
							inventoryItemQuery.notEqualTo("currentLevel", null);
							inventoryItemQuery.equalTo("truck", aMenuItemEntry.truck);
							inventoryItemQuery.equalTo("vendor", aVendor);

							var inventoryAssignQuery = new Parse.Query("InventoryItemAssign");
							inventoryAssignQuery.include("inventoryItem");
							inventoryAssignQuery.equalTo("menuItem", aMenuItemEntry.menuItem);
							inventoryAssignQuery.matchesQuery("inventoryItem", inventoryItemQuery);

							return inventoryAssignQuery.each(function(inventoryAssignment){

								console.log('Found inventory ASSIGNMENT! ID is  ' + inventoryAssignment.id );

								var inventoryItem = inventoryAssignment.get("inventoryItem");
								
								var newLevel = inventoryItem.get("currentLevel") - (aMenuItemEntry.qty * inventoryAssignment.get("decQty"));
								console.log('updating inventory level to new level of ' + newLevel);

								inventoryItem.set("currentLevel", newLevel);								
								return inventoryItem.save({}, {useMasterKey:true})
								.then(function(anInventoryItem){
									//now check if an alert needs to be sent
									var currentLevel = anInventoryItem.get("currentLevel");
									var alertLevel = anInventoryItem.get("alertLevel");
									console.log('Current Level is ' + currentLevel + '. Alert level is ' + alertLevel);
									if (currentLevel <= alertLevel){
										console.log('Need an alert!!');
										var alertRequired = false;

										//send out an SMS alert if the last alert date/time is null
										if (anInventoryItem.get("lastAlertDateTime") == undefined || anInventoryItem.get("lastAlertDateTime") == null){
											//we have never done an alarm so set required flag to true;
											alertRequired = true;

										} else {
											//we have never done an alarm so set required flag to true;
											alertRequired = false;
										}

										if (alertRequired == true){
											console.log('Alert required is set to TRUE. Vendor is ' + aVendor.id);
											
											return sendInventorySMSWarning(anInventoryItem, aVendor, aMenuItemEntry.truck)
											.then(function(numberSent){
											
												numSent = numSent + numberSent;
												//alerts have been sent. update the alert date so we dont do this again for another 24 hours
												console.log('Updating last alert date for ' + anInventoryItem.get("text"));
												anInventoryItem.set("lastAlertDateTime", nowMoment.toDate());
												return anInventoryItem.save({}, {useMasterKey:true});	
											
											}, function(error){
												//error sending alert
												console.log('SMS/Email error' + JSON.stringify(error));
												return Parse.Promise.error(error);
											});

										} else {
											// console.log('Alert required is set to FALSE');
											return Parse.Promise.as();
										};

									} else {
										// console.log('current level is ABOVE alert level so just continue processing.');
										return Parse.Promise.as();
									};
								});						
							}).then(function(){
								//all is well, return success
								return Parse.Promise.as();	
							}, function(error){
								console.log('Error in EACH loop:' + JSON.stringify(error));
								return Parse.Promise.error(error);
							});	

						}, function(error){
							console.log('Error in Promise loop:' + JSON.stringify(error));
							return Parse.Promise.error(error);
						});
						
					});
					return promise;
				}).then(function(){
					console.log('Updating last run date for vendor ' + aVendor.id + ' ' + nowMoment.toDate().toString());
					aVendor.set("inventoryLastRun", nowMoment.toDate());
					// console.log('calling save on aVendor');
					return aVendor.save({}, {useMasterKey:true});
				});
			}, {useMasterKey:true}).then(function(){
				console.log('FINAL success in _updateInventoryLevels');
				return Parse.Promise.as(numSent); //all is well , just return a successful promise
			}, function(error){
				console.log('FINAL Error in _updateInventoryLevels:' + JSON.stringify(error));
				return Parse.Promise.error(error);
			});
		}

	    var inventoryItemCreate = function(request, response){
				// var requestParams = JSON.parse(request.body);
				var requestParams = request.params;

				if (!requestParams.vendor && !requestParams.truck) {
			    response.error({message: 'Please specify a vendor or truck/location.',code: '400'});
				} else {
					var InventoryItem = Parse.Object.extend("InventoryItem");
					var inventoryItem = new InventoryItem();
					inventoryItem.set("text", requestParams.text);
					inventoryItem.set("truck", requestParams.truck);
					inventoryItem.set("vendor", requestParams.vendor);

					inventoryItem.set("currentLevel", requestParams.newLevel);
					inventoryItem.set("alertLevel", requestParams.alertLevel);
					inventoryItem.save({}, {sessionToken:request.user.getSessionToken()})
					.then(function(newInventoryItem){
						var promise = Parse.Promise.as(newInventoryItem);

						if (requestParams.assignedItems){
							_.each(requestParams.assignedItems, function(assignedItem){
								promise = promise.then(function() {
									var InventoryItemAssign = Parse.Object.extend("InventoryItemAssign");
									var inventoryItemAssign = new InventoryItemAssign();
									inventoryItemAssign.set("inventoryItem", inventoryItem);
									inventoryItemAssign.set("menuItem", assignedItem.menuItem);
									inventoryItemAssign.set("decQty", assignedItem.decQty);
									inventoryItemAssign.set("truck", requestParams.truck);
									console.log('calling inventory item assign SAVE' + JSON.stringify(assignedItem.menuItem));
									return inventoryItemAssign.save({}, {sessionToken:request.user.getSessionToken()})
									.then(function(){
										return Parse.Promise.as(newInventoryItem);
									});
								});
							});
						}

						return promise;


					}).then(function(newInventoryItem){
						var InventoryAdjustment = Parse.Object.extend("InventoryAdjustment");
						var anAdjustment = new InventoryAdjustment();
							
							return anAdjustment.save({
								inventoryItem:newInventoryItem,
								previousLevel : null,
								newLevel : newInventoryItem.get("currentLevel"),
								comments: requestParams.adjustReason,
								truck:newInventoryItem.get("truck"),
								vendor: newInventoryItem.get("vendor")
							}, {sessionToken:request.user.getSessionToken()}).then(function(){
								return Parse.Promise.as(newInventoryItem);
							});


					}).then(function(newInventoryItem){
						response.success(newInventoryItem.toJSON());
						
					}, function(error){
						response.error(error);
					});
				}
	    }

	    var inventoryItemUpdate = function(request, response){
					// var requestParams = JSON.parse(request.body);

					var requestParams = request.params;

					var newLevel = requestParams.newLevel;
					var adjustReason = requestParams.adjustReason;
					var oldLevel = requestParams.currentLevel;
					var theInventoryItem;

					console.log(newLevel + ' ' + adjustReason + ' ' + oldLevel);

					var InventoryItem = Parse.Object.extend("InventoryItem");
					var query = new Parse.Query(InventoryItem);
					console.log('Processing inventory item ' + requestParams.objectId);
					console.log('Assigned items are ' + requestParams.assignedItems);

					query.get(requestParams.objectId)
					.then(function(inventoryItem){
						theInventoryItem = inventoryItem;

						if (requestParams.text)
							theInventoryItem.set("text", requestParams.text);

						if (requestParams.truck)
							theInventoryItem.set("truck", requestParams.truck);

						if (requestParams.vendor)
							theInventoryItem.set("vendor", requestParams.vendor);
					
						if (newLevel)
							theInventoryItem.set("currentLevel", newLevel);

						if (requestParams.currentLevel && !newLevel)
							theInventoryItem.set("currentLevel", requestParams.currentLevel);

						if (requestParams.alertLevel)
							theInventoryItem.set("alertLevel", requestParams.alertLevel);

						//if we are adjusting the stock level then clear out any alerts
						if (newLevel != oldLevel)
							theInventoryItem.unset("lastAlertDateTime");							

						//1. Get all the assignments for this inventory items that are in the DB
						var InventoryItemAssign = Parse.Object.extend("InventoryItemAssign");
						var assignQuery = new Parse.Query(InventoryItemAssign);	
						assignQuery.equalTo("inventoryItem", theInventoryItem);
						assignQuery.include('menuItem')
						var theDBAssignments = [];

						return assignQuery.find({sessionToken: request.user.getSessionToken()})
						.then(function(currentDBAssignments){
							theDBAssignments = currentDBAssignments;
							console.log('Found ' + currentDBAssignments.length + ' assignments in the DB');

							var promise = Parse.Promise.as();

							_.each(theDBAssignments, function(aDBAssignment){
									
									promise = promise.then(function(){
										//Find an assignment for this menu item
										var matchedAssignment=null;
										console.log('Found Assignment in DB to menu item ' + aDBAssignment.get("menuItem").id);

										if (requestParams.assignedItems){
											// var aMenuItem = aDBAssignment.get("menuItem");

											// matchedAssignment = _.find(requestParams.assignedItems, {objectId: id} );
											_.every(requestParams.assignedItems, function(anAssignment){
												if (aDBAssignment.get("menuItem").id == anAssignment.menuItem.objectId){
													
													matchedAssignment = anAssignment;
													return false; //break out of the loop
												
												} else
													return true;
											});
										}
										if (!matchedAssignment){
											console.log('deleteing assignment' + aDBAssignment.id);
											return aDBAssignment.destroy();
										} else{

											//update the Qty if has changed
											if (matchedAssignment.decQty != aDBAssignment.get("decQty")){
												console.log('Updating decrement qty on ' + aDBAssignment.id + ' to ' + matchedAssignment.decQty);

												aDBAssignment.set("decQty", matchedAssignment.decQty);
												return aDBAssignment.save({}, {sessionToken:request.user.getSessionToken()});
											} 
												else
													return Parse.Promise.as();
										}												
								});

							});

							return promise;
						}).then(function(){
							var promise = Parse.Promise.as();
							//now loop through the passed in assignments and see if any are NEW
							
							console.log('dbAssignments are ' + JSON.stringify(theDBAssignments));
							
							if (requestParams.assignedItems)
								_.each(requestParams.assignedItems, function(anAssignment){

									promise = promise.then(function(){
										var matchedAssignment = null;
										console.log('anAssignment.objectId is ' + anAssignment.objectId);
										// var matchedAssignment = _.find(theDBAssignments, {menuItem.id: anAssignment.objectId} );
										_.every(theDBAssignments, function(aDBAssignment){
											if (aDBAssignment.get("menuItem").id == anAssignment.menuItem.objectId){
												matchedAssignment = aDBAssignment;
												return false; //break out of the loop
											} else
												return true;
										});

										if (!matchedAssignment){
											console.log('creating a new menu assignment for menu item ');
											console.log('Menu item is ' + anAssignment.menuItem.objectId);
											console.log('Inventory Item is ' + theInventoryItem.id);

											//this menu item was not found in the DB so we need to add it
											var InventoryItemAssign = Parse.Object.extend("InventoryItemAssign");
											var inventoryItemAssign = new InventoryItemAssign();
											inventoryItemAssign.set("inventoryItem", theInventoryItem);
											inventoryItemAssign.set("menuItem", {className:'MenuItem', __type:"Pointer", objectId:anAssignment.menuItem.objectId});
											inventoryItemAssign.set("decQty", anAssignment.decQty);
											console.log('Saving inventory item & menu item assignment');
											return inventoryItemAssign.save({}, {sessionToken:request.user.getSessionToken()});
										} else
												return Parse.Promise.as();
									});
								});

							return promise;
						});

					}).then(function(){
						console.log('Saving inventory item...');
						return theInventoryItem.save();
						
					}).then(function(){
						
						if (newLevel != oldLevel){
							var InventoryAdjustment = Parse.Object.extend("InventoryAdjustment");
							var anAdjustment = new InventoryAdjustment();
							
							anAdjustment.save({
								inventoryItem:theInventoryItem,
								previousLevel : oldLevel,
								newLevel : newLevel,
								comments: adjustReason,
								truck:theInventoryItem.get("truck"),
								vendor: theInventoryItem.get("vendor")
							
							}, {sessionToken:request.user.getSessionToken()}).then(function(anInventoryAdjust){
							
								return Parse.Promise.as();
							
							}, function(error){
								return Parse.Promise.error(error);
							});

						} else 
								return Parse.Promise.as();
					
					}).then(function(){
						response.success(theInventoryItem.toJSON());
					}, function(error){
						response.error(error);
					});

	    }

	    var getAssignedMenuItems = function(request, response){
					//get the params
					// var requestParams = JSON.parse(request.body);
					var requestParams = request.params;
					
					var InventoryItem = Parse.Object.extend("InventoryItem");
					var query = new Parse.Query(InventoryItem);
				
					query.get(requestParams.inventoryItem.objectId, {sessionToken:request.user.getSessionToken()})
					.then(function(anInventoryItem){
							
						var InventoryItemAssign = Parse.Object.extend("InventoryItemAssign");
						var assignQuery = new Parse.Query(InventoryItemAssign);	
						assignQuery.equalTo("inventoryItem", anInventoryItem);
						return assignQuery.find({sessionToken:request.user.getSessionToken()});	

					}).then(function(menuItemAssignments){
						// console.log(JSON.stringify(menuItems));
						var resultArray = [];
						_.each(menuItemAssignments, function(menuItemAssignment){
							resultArray.push(menuItemAssignment.toJSON());
						});

						response.success(resultArray);
					}, function(error){
						response.error(error)
					});
	    }

	    var inventoryItemsGet = function(request, response){
			
	    	var resultArray = [];
				//get the params
				// var requestParams = JSON.parse(request.body);
				var requestParams = request.params;

				if (!requestParams.vendor && !requestParams.truck) {
			    response.error({message: 'Please specify a vendor or truck/location.',code: '400'});
				} else {

					var InventoryItem = Parse.Object.extend("InventoryItem");
					var query = new Parse.Query(InventoryItem);

					console.log('calling inventory query for vendor ' + JSON.stringify(requestParams.vendor));
					
					if (requestParams.vendor)
						query.equalTo("vendor", requestParams.vendor);
					
					if (requestParams.truck)
						query.equalTo("truck", requestParams.truck);

					query.select("text", "truck", "vendor", "currentLevel", "alertLevel");

					query.each(function(anInventoryItem){

							resultArray.push(anInventoryItem.toJSON());
						
					}, {sessionToken:request.user.getSessionToken()}).then(function(){
						
						response.success(resultArray);

					}, function(error){
						response.error(error);
					});
				};
			}

	return {
 		inventoryItemsGet:inventoryItemsGet,
 		inventoryItemUpdate:inventoryItemUpdate,
 		inventoryItemCreate: inventoryItemCreate,
 		getAssignedMenuItems:getAssignedMenuItems,
 		processRealTimeAlerts: processRealTimeAlerts,
 		processEmailInventoryAlerts:processEmailInventoryAlerts 

  };
}

exports.trkInventory = trkInventory;