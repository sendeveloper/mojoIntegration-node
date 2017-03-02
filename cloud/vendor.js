var _ = require('lodash');

function getParameterByName(name, aUrl) {
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( aUrl );
  if( results == null )
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getSecureUrl(currentUrl){
	// console.log('current URL is ' + currentUrl);

	return currentUrl.replace("http://", "https://s3.amazonaws.com/");
}

var trkVendor = function(){
	_qboJSON:null;

	var searchForDupes = function(request, status){

		var requestParams = request.params;
		return this._searchForDupes(requestParams)
		.then(function(dupes){
			status.success('Done. Success!');
		}, function(error){
			console.log(error);
			status.error('Done. Error!');
		});
	};

	var _searchForDupes=function(){
		var jssha = require('./pusher/jssha256.js');
	 		var Buffer = require('buffer').Buffer;

			var params = {
				start_date:'20160323',
				end_date:'20160323',
				limit:10,
				offset:0
				// eventType : 'TRANSACTION_STATUS',
				// limit:10,
				// offset:0,
				// from:'2016-03-23',
				// to:'2016-03-23'
			};

			var headers = {};

			return Parse.Config.get()
			.then(function(configSet){

				headers['Content-type'] = 'application/json';
				headers.apikey = configSet.get("payEezyApiKey");
				// headers.apikey = 'l74SxjKFo46xNXU85KOvl1UuZIcwp3KK';
				headers.token = configSet.get("payEezyMerchantToken");
				// headers.token = 'fdoa-a480ce8951daa73262734cf102641994c1e55e7cdf4c02b6'
			      		
				headers.nonce = function(length){
			    var text = "";
			    var possible = '0123456789';
			    for(var i = 0; i < length; i++) {
			        text += possible.charAt(Math.floor(Math.random() * possible.length));
			    }
			    return text;
				}(19); //call the method passing in 19 as the length (19 is the length in the PayEezy example)

				headers.timestamp = new Date().getTime();

				headers.Authorization = function(){
					var hmacPayload = {};
					hmacPayload.apikey = headers.apikey;
					hmacPayload.nonce = headers.nonce;
					hmacPayload.timestamp = headers.timestamp;
					hmacPayload.token = headers.token;
					// hmacPayload.payload = params;
					hmacPayload.payload = {};

					var concatString = hmacPayload.apikey + hmacPayload.nonce + hmacPayload.timestamp + hmacPayload.token;
					// console.log('concat string is ' + concatString);

					// console.log('payeezy secret is ' + configSet.get("payEezyAPISecret"));

					var hash = jssha.HMAC_SHA256_MAC(configSet.get("payEezyAPISecret"), concatString);
					var buffer1 = new Buffer(hash);
					return buffer1.toString('base64');

				}();
				var url = configSet.get("payEezyUrl") + '/v1/transactions';
				// var url = configSet.get("payEezyUrl") + '/v1/events';   
				// var url = 'https://api-cert.payeezy.com/v1/transactions';
				// var url = 'https://api-cert.payeezy.com/v1/events';

				console.log('calling Payeezy at ' + url); 
				// console.log('headers are ' + JSON.stringify(headers));
				// console.log('params are ' + JSON.stringify(params));

				return Parse.Cloud.httpRequest({
						method: 'GET',
						url: url,
						headers: headers,
						params: params
				});			
			}).then(function(httpResponse){
				console.log('done!');
				console.log('Success: ' + JSON.stringify(httpResponse));
				
				if (httpResponse.data)
					console.log('data: ' + JSON.stringify(httpResponse.data));

				// if (httpResponse.text)
				// 	console.log('text: ' + httpResponse.text);

				var ErrorLog = Parse.Object.extend("ErrorLog");
				var errorLog = new ErrorLog;

				errorLog.set("details", JSON.stringify(httpResponse.text));
				// errorLog.set("referenceObject", httpResponse÷.data);
				return errorLog.save();

				// return Parse.Promise.as(httpResponse);
			}, function(error){
				console.log('Error: ' + JSON.stringify(error.data));
				return Parse.Promise.error(error.data);
			});

	};

	var stripeConnectForVendor = function(request, response){
		try{ 

			//get the params
			var requestParams = request.params;

			if (!requestParams.vendorId || requestParams.vendorId == ""){
				throw {
					message: 'Please specify a Vendor ID.',
					code: '400'
				};
			};			
			return Parse.Config.get()
			.then(function(aConfig){
				console.log('client secret is ' + aConfig.get("stripeSecret"));
				console.log('code is ' + requestParams.code);

				var url = "https://connect.stripe.com/oauth/token?client_secret=" +  aConfig.get("stripeSecret")
						+ "&code=" + requestParams.code + "&grant_type=authorization_code";
				
				// console.log('URL is : ' + url);

				return Parse.Cloud.httpRequest({
	      			method: 'POST',
	      			url: url,
				    success: function(httpResponse) {
				    	// console.log('Stripe Success!!');
			    		//console.log('body is ' + JSON.stringify(httpResponse.text));
			    		var stripeResponse = JSON.parse(httpResponse.text);
			    		console.log(JSON.stringify(stripeResponse));
			    		console.log('vendor is ' + requestParams.vendorId);
						//var payDetails = [];

						//load the vendor record from the db
						var Vendor = Parse.Object.extend("Vendor");
						var query = new Parse.Query(Vendor);
						query.get(requestParams.vendorId, {useMasterKey:true})
						.then(function(aVendorObject){
							// var stripeNotFound = false;
							// console.log('vendor loading from db...');
							//get the paymentInfo field
							var paymentInfo = aVendorObject.get("paymentInfo");
							if (!paymentInfo) 
								paymentInfo = [];

								//update the existing record
								paymentInfo[0] = {	providerId:"STRIPE", 
													costStructure:[
														{type:"CNP", percent:"2.9", fixed:"0.30"},
														{type:"CP", percent:"2.9", fixed:"0.30"}
													],
													access_token: stripeResponse.access_token,
													publishable_key : stripeResponse.stripe_publishable_key
												};

							//finally write the vendor record with the updated stripe details to the db
							aVendorObject.set("paymentInfo", paymentInfo);
							console.log('calling save for payment info...');
							aVendorObject.save()
							.then(function(){
								response.success({
										"message": "Stripe has been connected. You may now accept online payments.",
										"status":"OK"
								});	    							
							});		
						});

			    	
				    },
				    error: function(httpResponse) {
				    	// console.log('Stripe Errror!');
				    	//parse.com treats a 302 as an error (it is not in this case)
						//console.log('body is ' + JSON.stringify(httpResponse.text));
						var stripeResponse = JSON.parse(httpResponse.text);
						console.log('Error from Stripe ' + stripeResponse);

				    	if (!stripeResponse.error)
				    		response.error({"message": "Stripe HTTP status : " + httpResponse.status, code: "101"})
				    	else
				        	response.error({"message": "Stripe Error: " + stripeResponse.error_description, code: "101"});
				    }
	    		});
			});

		}catch(e){
			console.log('An error has been caught...');
			console.error(JSON.stringify(e));
			response.error(e);		
		}  	
	};

	var vendorGetInfoMessages = function(request, response){
		try{ 
			var messages = new Array();
			var infoMsgCheckPromises = new Array();
			
			var menuCountCheck = new Parse.Promise();
			var truckChecks = new Parse.Promise();
			var socialChecks = new Parse.Promise();

			infoMsgCheckPromises.push(menuCountCheck);	
			infoMsgCheckPromises.push(truckChecks);
			infoMsgCheckPromises.push(socialChecks);

			//get the params
			var requestParams = request.params;

			//ensure that a vendor has been specified
			if (!requestParams.vendorId){
				throw {
					message: 'Please provide a Vendor ID.',
					code: '400'
				};
			};
			(function(){
				//load the vendor from the table
				var Vendor = Parse.Object.extend("Vendor");
				var query = new Parse.Query(Vendor);
				query.get(requestParams.vendorId, {useMasterKey:true})
				.fail(function(error){
					response.error({"message":error.message, "code":error.code});
				})
				.then(function(aVendorObject){
					// console.log('Vendor found ' + JSON.stringify(aVendorObject));
					var paymentInfo = aVendorObject.get("paymentInfo");
					if (!paymentInfo || paymentInfo.length == 0) 
						messages.push(
						{
							infoMsg: 'You have not configured online payments.',
							code: 101
						}
						);
					//now check if there are any trucks for this vendor
					var Truck = Parse.Object.extend("Truck");
					var truckQuery = new Parse.Query(Truck);
					truckQuery.equalTo("vendor", aVendorObject);
					truckQuery.equalTo("deleted", false);
					// console.log('checking if ANY trucks have been created...');
					truckQuery.find()
					.fail(function(error){
						// console.log('No Trucks found! ' + JSON.stringify(error));
						messages.push(
						{
							infoMsg: 'You have not created your first truck or fixed location',
							code: 102
						});
	      				//if no trucks are found then we can resolve this truck Check promise
	      				truckChecks.resolve();
	      			})
					.then(function(truckList){
						// console.log('No of trucks found are: ' + truckList.length);
						if (truckList.length == 0)
							messages.push(
							{
								infoMsg: 'You have not created your first truck or fixed location',
								code: 102
							});	

						//now for each truck, check if a menu has been assigned
						_.each(truckList, function(aTruck){
							//console.log('Menu ID Truck object ID is ' + aTruck.id);
							var currentMenu = aTruck.get("menuHeader");
							if (!currentMenu){
								messages.push(
								{
									infoMsg: 'Truck/location ' + aTruck.get("name") + ' does not have a menu assigned to it.',
									code: 104,
									extraInfo: aTruck.id
								});							
							};
						});
						truckChecks.resolve();


					});
					//now check if there are any menus for this vendor
					var Menu = Parse.Object.extend("MenuHeader");
					var menuQuery = new Parse.Query(Menu);
					menuQuery.equalTo("vendor", aVendorObject);
					menuQuery.count()
					.fail(function(error){
						// console.log('Menu search for vendor failed');
						response.error({"message":error.message, "code":error.code});
					})
					.then(function(noOfMenus){
						// console.log('number of menus found :' + noOfMenus);
						if (noOfMenus == 0){
							messages.push(
							{
								infoMsg: 'You have not created your first menu',
								code: 103
							});
							menuCountCheck.resolve();	
						} else
						menuCountCheck.resolve();					
					});
					//now check if social media connectivity has been done
					var Secrets = Parse.Object.extend("Secret");
					var socialQuery = new Parse.Query(Secrets);

					socialQuery.equalTo("vendor", aVendorObject);
					socialQuery.containedIn("keyName", ["fb_access_token", "tw_oauth_token"]);
					socialQuery.find()
					.then(function(results){
						var fbConnected = false;
						var twConnected = false;
						// console.log('No of Secrets found ' + results.length);
						if (results.length > 0)
							_.each(results, function(aResult){
								if (aResult.get("keyName") == "fb_access_token")
									fbConnected = true;
								if (aResult.get("keyName") == "tw_oauth_token")
									twConnected = true;
							});
						
						if (!fbConnected)
							messages.push({
								infoMsg: 'You have not connected to your FaceBook page',
								code: 105,
							});  
						
						if (!twConnected)
							messages.push({
								infoMsg: 'You have not connected to your Twitter page',
								code: 106,
							});
						socialChecks.resolve();
					});
				});
			return Parse.Promise.when(infoMsgCheckPromises);	
		})()
		.then(function(){
			console.log(messages);
			response.success(messages);
		});



		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});
		};
	};

	var vendorCancelAccount = function(request, response){
			
			var vendor;
			//get the params
			var requestParams = request.params;

			var Vendor = Parse.Object.extend("Vendor");
			var query = new Parse.Query(Vendor);
			query.get(requestParams.vendorId, {useMasterKey:true})
			.then(function(aVendor){
				vendor = aVendor;

				var moment = require("moment-timezone");

				nowMoment = new moment();
				vendorCreationMoment = new moment(aVendor.get("createdAt"));
				//if the account is less than 30 days old then cancel account immediately
				if (nowMoment.diff(vendorCreationMoment, 'days') < 30){
					aVendor.set("suspended", true);
					aVendor.unset("vendorToken");
					aVendor.unset("nextBillDate");
				} else {
					aVendor.set("final", true);
					aVendor.set("suspended", true);
				};

				aVendor.set("paymentInfo", []);

				return aVendor.save();
			}).then(function(aVendor){
				//disconnect all social networks
				var Secrets = Parse.Object.extend("Secret");
				var socialQuery = new Parse.Query(Secrets);
				socialQuery.equalTo("vendor", aVendor);
				return socialQuery.find();
			}).then(function(socialSecrets){
				var promises = [];
				_.each(socialSecrets, function(aSecret){
					promises.push(aSecret.destroy());
				});
				
				return Parse.Promise.when(promises);
			}).then(function(){
				//delete any pending social posts
				var SocialPosting = Parse.Object.extend("SocialPosting");
				var socialPostsQuery = new Parse.Query(SocialPosting);
				socialPostsQuery.equalTo("vendor", vendor);
				return socialPostsQuery.find();
			}).then(function(socialPosts){
				var promises = [];
				_.each(socialPosts, function(aSocialPost){
					promises.push(aSocialPost.destroy());
				});
				
				return Parse.Promise.when(promises);

			}).then(function(){
				response.success();
			},function(error){
				response.error(error);
			});
	}

	var vendorGetInfo = function(request, response){
		try{ 
			var moment = require('moment-timezone');

			//get the params
			// console.log('getting params' + JSON.stringify(request.params));
			var requestParams = request.params;
			// console.log('Params are ' + JSON.stringify(requestParams));
			var aVendorJSON = {};
			var truckListArr=[];
			var crewList = [];
			var aVendor = null;
			var discountRecords = null;
			
			var user = Parse.User.current();
			console.log('user is ' + JSON.stringify(user));

			if (!requestParams.vendorId) {
			    throw {
			      message: 'Please provide a Vendor ID.',
			      code: '400'
			    };
			};

			var Vendor = Parse.Object.extend("Vendor");
			var query = new Parse.Query(Vendor);
			console.log('calling vendor get');
			query.get(requestParams.vendorId, {useMasterKey:true})
			.fail(function(error){
				response.error({"message":error.message, "code":error.code});

			}).then(function(aVendorObject){
				console.log('vendor found!!');
				aVendor = aVendorObject;

				//make sure that the account is not suspended
				var isSuspended = aVendor.get("suspended");

				if (isSuspended && isSuspended == true){
					response.error({
				      message: 'Your account has been suspended. Please contact support@trcked.com',
				      code: '601'
				    });
				};

				var discountQuery = new Parse.Query("Discounts");
				discountQuery.equalTo("vendor", aVendor);
				discountQuery.equalTo("deleted", false);
				return discountQuery.find();

			}).then(function(discountResults){
				discountRecords = discountResults;

				//select any discount records and store them in array

				//now get all the trucks for this vendor
				var Truck = Parse.Object.extend("Truck");
				var truckQuery = new Parse.Query(Truck);

				// console.log('Vendor found. It is ' + JSON.stringify(aVendorObject));
				truckQuery.include("menuHeader", "bulkMenuHeader"); 
				truckQuery.ascending("name");

				truckQuery.select("name", "currentStatus" ,"menuHeader", "bulkMenuHeader", "lastLocation", "locationUpdateStamp", "delivery", "paymentInfo", "retailLocation");
				truckQuery.equalTo("vendor", aVendor);
				truckQuery.equalTo("deleted", false);
				console.log('Client Type is ' + requestParams.clientType);

				//if the mobile app is calling then only return RETAIL locations
				// if (requestParams.clientType == "MOBILEAPP")
				// 	truckQuery.equalTo("retailLocation", true);

				truckQuery.find({useMasterKey:true})
				.fail(function(error){
					console.log('No truck info found for vendor' + JSON.stringify(error));
					response.success({"vendorInfo": aVendor.toJSON(), "truckList": []});
				}).then(function(truckList){
					
					console.log('found ' + truckList.length + ' trucks...');
					var promises = [];
					for (var i=0;i<truckList.length;i++) {
						// var aTruck = truckList[i];
				    	
				    	truckListArr.push(truckList[i].toJSON());
					    if(truckList[i].get("menuHeader")){
					    	var aMenuHeader = truckList[i].get("menuHeader").toJSON();
							delete aMenuHeader.vendor;
							truckListArr[i].menuHeader=aMenuHeader;
						}; 

					    if(truckList[i].get("bulkMenuHeader")){
					    	var aBulkMenuHeader = truckList[i].get("bulkMenuHeader").toJSON();
							delete aBulkMenuHeader.vendor;
							truckListArr[i].bulkMenuHeader=aBulkMenuHeader;
						};

						truckListArr[i].discounts = [];

						if (discountRecords.length > 0)
							_.each(discountRecords, function(aDiscountRecord){
								truckListArr[i].discounts.push(aDiscountRecord.toJSON());	
							});

						var now = moment().utc();
						var endMoment = new moment().tz(aVendor.get("timeZone"));

						endMoment.add(7, 'days').endOf("day");

						var newPromise = new Parse.Promise();
						promises.push(newPromise);
						// var truckJSON = truckListArr[i];

						(function(newPromise, aTruck, truckJSON){

							var nextEvent = null;
							var currentEvent = null;
							// console.log('loading truck module');
							var TrkTruck = require('./truck.js').trkTruck;
							var trkTruck = new TrkTruck;

							trkTruck._truckScheduleGet({
								truckId: aTruck.id,
								fromTimeStamp: now.format(), //current UTC time
								toTimeStamp: endMoment.format(),
								ignorePrivateSettings: true 	
							}).then(function(truckScheduleList){
								// console.log('truck schedule loaded. ' + truckScheduleList.length + ' records found.' )
								
								//default the truck to CLOSED (unless OPEN-OFFLINE)
								if (truckJSON.currentStatus != 'OPEN-OFFLINE')
									truckJSON.currentStatus == 'CLOSED';

								//loop through the schedule events and see if any are 
								//going on right now.
								truckJSON.next7DayEvents = false;
								var currentEventFound = false;
								_.each(truckScheduleList, function(aScheduledEvent){
									var isSameOrAfter = now.isSameOrAfter(aScheduledEvent.startDateTime);
									var isSameOrBefore = now.isSameOrBefore(aScheduledEvent.endDateTime);
									
									if (isSameOrAfter && isSameOrBefore){
										console.log('Found a match!' + aScheduledEvent.id);
										currentEvent = aScheduledEvent;

										if (truckJSON.currentStatus != 'OPEN-OFFLINE')
											truckJSON.currentStatus = 'OPEN';
											currentEventFound = true;
									} else {
										if (currentEventFound == false)
											truckJSON.currentStatus = 'CLOSED';
									};

									//now check if there are ANY future dated events
									if (now.isBefore(aScheduledEvent.endDateTime))
										truckJSON.next7DayEvents = true;

									//now check if there are ANY future dated events
									if (now.isBefore(aScheduledEvent.endDateTime)){
										truckJSON.next7DayEvents = true;
										//store the event that is next
										if (nextEvent == null)
											nextEvent = aScheduledEvent;
										else {

											if (moment(aScheduledEvent.startDateTime).isBefore(moment(nextEvent.startDateTime))){
												console.log('Next Event Found! ' + JSON.stringify(aScheduledEvent.locationData));
												nextEvent = aScheduledEvent;
											};
										}
									};
								});
								
								if (truckJSON.currentStatus == 'CLOSED'){
									if (truckJSON.retailLocation == false){
										//we set this to FALSE regardless of whether there is actually an event in the next 
										//7 days because it forces the app to display the VIEW MENU option which is what we want 
										// if the location is NOT retail
										truckJSON.next7DayEvents = false;
									} 
									if (nextEvent && nextEvent.locationData){
										// console.log(truckJSON);
										truckJSON.lastLocation = {};
										truckJSON.lastLocation.latitude = nextEvent.locationData.lat;
										truckJSON.lastLocation.longitude = nextEvent.locationData.lng;
										truckJSON.locationUpdateStamp = nextEvent.startDateTime;
									}
									// console.log('Next event is for ' + truckJSON.objectId + ' is ' + JSON.stringify());
								} else {
									//check if the location is set to be a retailLocation. If NOT, set the status to OPEN-OFFLINE
									// and set the next 7 days to false so the app shows View Menu option only.
									if (truckJSON.retailLocation == false){
										truckJSON.currentStatus = 'OPEN-OFFLINE';
										//we set this to FALSE regardless of whether there is actually an event in the next 
										//7 days because it forces the app to display the VIEW MENU option which is what we want 
										// if the location is NOT retail
										truckJSON.next7DayEvents = false;
									} 
									//truck is currently OPEN (or OPEN-OFFLINE)
									//if there is a location attached then set that as the location of the truck

									if (currentEvent && currentEvent.locationData){
										truckJSON.lastLocation = {};
										truckJSON.lastLocation.latitude = currentEvent.locationData.lat;
										truckJSON.lastLocation.longitude = currentEvent.locationData.lng;
										truckJSON.locationUpdateStamp = currentEvent.startDateTime;
									};
								}
								
								console.log(truckJSON.name + ' is ' + truckJSON.currentStatus);
								console.log(truckJSON.name + ' location ' +  JSON.stringify(truckJSON.lastLocation));

								newPromise.resolve();
							}, function(error){
								console.log('error?' + JSON.stringify(error));
								response.error({"message":error.message, "code":error.code});
							});
						})(newPromise, truckList[i], truckListArr[i]);

				    }

				    //remove the access_token from the STRIPE info as they should not really be 
				    //sent to the front end (it is not required)
				    aVendorJSON = aVendor.toJSON();
				    // console.log(aVendorJSON);

				    // if (aVendorJSON.pictureLogo)
				    // 	aVendorJSON.pictureLogo.url = getSecureUrl(aVendorJSON.pictureLogo.url);
		    
				    if (aVendorJSON.paymentInfo && requestParams.clientType == "MOBILEAPP")
					    for (var i = 0; i < aVendorJSON.paymentInfo.length; i++){
					    	
					    	if (aVendorJSON.paymentInfo[i].providerId == 'STRIPE'){
					    		delete aVendorJSON.paymentInfo[i].access_token
					    	};

					    	if (aVendorJSON.paymentInfo[i].providerId == 'HLAND'){
					    		aVendorJSON.paymentInfo[i].pkey = aVendorJSON.paymentInfo[i].ecom.pkey;
					    		delete aVendorJSON.paymentInfo[i].ecom;
					    		delete aVendorJSON.paymentInfo[i].pos;
					    	};

					    }

					if (aVendorJSON.paymentInfo && requestParams.clientType == "POS")
						for (var i = 0; i < aVendorJSON.paymentInfo.length; i++){
					    	if (aVendorJSON.paymentInfo[i].providerId == 'HLAND'){
					    		aVendorJSON.paymentInfo[i].pkey = aVendorJSON.paymentInfo[i].pos.pkey;
					    		aVendorJSON.paymentInfo[i].skey = aVendorJSON.paymentInfo[i].pos.skey;
					    		delete aVendorJSON.paymentInfo[i].ecom;
					    		delete aVendorJSON.paymentInfo[i].pos;

					    	};						
						};

					 delete aVendorJSON.oneSigRESTAPIKey;
					 delete aVendorJSON.oneSigRESTAPIKey;

					return Parse.Promise.when(promises)

				}).then(function(){
					//load the crew PIN info
					var CrewMember = Parse.Object.extend("CrewMember");
					var query = new Parse.Query(CrewMember);
					console.log('searching for vendor ' + aVendor.id);
					query.equalTo("vendor", aVendor);
					query.exists("pin");
					return query.find({useMasterKey:true});
				}).then(function(crewRecords){
					console.log('Found ' + crewRecords.length + ' records ');
					var jsonCrewArray = [];

					if (crewRecords.length > 0){
						_.each(crewRecords, function(aCrewRecord){
							var crewJSON = aCrewRecord.toJSON();
							//remove anyone who has left the company
							//or has not yet started
							
							if (crewJSON.dateHired)
								var momentDateStarted = new moment(crewJSON.dateHired.iso);
							
							if (crewJSON.dateLeft)
								var momentDateLeft = new moment(crewJSON.dateLeft.iso);
							
							var nowMoment = moment.utc();
							
							if (momentDateLeft)
								if (nowMoment.isAfter(momentDateLeft)){
									console.log('Employee '+ crewJSON.objectId + ' excluded due to Hire END Date of ' + crewJSON.dateLeft.iso);
									return;
								}

							if (momentDateStarted)
								if (nowMoment.isBefore(momentDateStarted)){
									console.log('Employee ' + crewJSON.objectId + ' excluded due to Hire START Date of ' + crewJSON.dateLeft.iso);
									return;	
								}
							
							delete crewJSON.vendor;
							delete crewJSON.truck;
							delete crewJSON.createdAt;
							delete crewJSON.updatedAt;
							delete crewJSON.sendScheduleSMS;

							jsonCrewArray.push(crewJSON);
						});
					} 

					// console.log('Payment Info is ' + JSON.stringify(aVendorJSON.paymentInfo));
					console.log('calling success...');

					response.success(	{	
											"vendorInfo": aVendorJSON, 
											"truckList": truckListArr,
											"crewList" : jsonCrewArray
										}
									);
				}, function(error){
					console.log('vendorGetInfo: ' + JSON.stringify(error));
					response.error(error);
				});			
			});			

		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});
		}
	}

	var vendorSettingsUpdate = function(request, response) {

		try {
			var requestParams = request.params;
			var query = new Parse.Query("Vendor");
				query.get(requestParams.vendorId, {sessionToken:request.user.getSessionToken()})
				.then(function(vendor){

					var vendorSettings= vendor.get("settings")?vendor.get("settings"):{};

					//loop all properties of settings object and set vendor.settings
					for(var prop in requestParams.settings) {
						vendorSettings[prop]= requestParams.settings[prop];

					}

					vendor.set("settings",vendorSettings);

					if (requestParams.vendorToken)
						vendor.set("vendorToken", requestParams.vendorToken);

					if (requestParams.pictureLogo)
						vendor.set("pictureLogo", requestParams.pictureLogo);

					return vendor.save(null, {sessionToken:request.user.getSessionToken()});
				})

				.then(function(result){
					response.success(result);
				},function(error){
					response.error(error);
				})
		}

		catch(error){
			response.error(error);
		}
	}

	var getAppUrl = function(aVendor){
		var settings = aVendor.get("settings");
		var promise = new Parse.Promise();
		if (settings){
			if (settings.appleBundleId || settings.androidAppId){
				Parse.Config.get()
				.then(function(aConfig){
					promise.resolve(aConfig.get("baseUrl") + '/appstore_download.htm?vendorID=' + aVendor.id);
				});
				
	   		} else 
	   			return promise.resolve();
		} else 
			return promise.resolve();
		
		return promise;
	}

	var _generateQBOSalesReceipt = function(anOrder, aTaxId){
		var Moment = new require("moment-timezone");
		var aPromise = new Parse.Promise();

		var aQBOSalesReceipt = {};
		//1. Get all the order Items for this order
		var orderItemsQuery = new Parse.Query("OrderItem");
		orderItemsQuery.equalTo("order", anOrder);

		orderItemsQuery.find({useMasterKey:true})
		.then(function(orderItems){
			console.log('Found ' + orderItems.length + ' items for Order ' + anOrder.id);

			//if there are no Line items then there is nothing to push
			// in that case return a null
			if (orderItems.length == 0)
				aPromise.resolve(null);
			else {
				var txMoment = new Moment(anOrder.get("txDate"));
				 
				aQBOSalesReceipt = {
				    domain: "QBO",
				    sparse: false,
				    SyncToken: "0",
				    TxnDate: txMoment.year() + '-' + (txMoment.month() + 1) + '-' + txMoment.date(),
				    TotalAmt: (anOrder.get("amount") + anOrder.get("tipAmount") ) - anOrder.get("totalDiscountAmount"),
					Line:[],
    				PaymentRefNum:anOrder.id,
    				PrivateNote: anOrder.get("terminalId") + '-' + anOrder.get("orderId"),
        			TxnTaxDetail: {
      					TotalTax: anOrder.get("taxAmount"),
      					TxnTaxCodeRef: {
      						value: aTaxId
      					}
    				}		
				};

				_.each(orderItems, function(anOrderItem, index){
					var taxBreakDown = anOrderItem.get("taxes");
					var taxCodeRef = 'TAX'; //default to taxable

					if (!taxBreakDown || taxBreakDown.length == 0)
						taxCodeRef = 'NON'; //set to Non Taxable

					var lineItemTotal = anOrderItem.get("price") * anOrderItem.get("qty");
																	
					aQBOSalesReceipt.Line.push({
					    LineNum: index,
					    Description: anOrderItem.get("description"),
					    Amount: lineItemTotal,
					    DetailType:"SalesItemLineDetail",
					    SalesItemLineDetail: {
					    	UnitPrice: anOrderItem.get("price"),
					        Qty: anOrderItem.get("qty"),
					        TaxCodeRef: {
					        	value: taxCodeRef
					        }
						}
					});

					//now if there are any modifiers that have a cost lets create another line
					//item for modifiers
					//now add in any modifier costs
					var optionsCost = 0;
					_.each(anOrderItem.get("options"), function(anOption){
						if (anOption.cost && anOption.cost > 0 && anOption.removed != true)
							optionsCost = optionsCost + anOption.cost;
					});

					if (optionsCost > 0)
						aQBOSalesReceipt.Line.push({
						    LineNum: index,
						    Description: anOrderItem.get("description") + ' modifiers/extras',
						    Amount: optionsCost,
						    DetailType:"SalesItemLineDetail",
						    SalesItemLineDetail: {
						        TaxCodeRef: {
						        	value: taxCodeRef
						        }
							}
						});

				});

				//if there is a tip then create a non taxable tip line item
				if (anOrder.get("tipAmount") && anOrder.get("tipAmount") > 0)
					aQBOSalesReceipt.Line.push({
					    LineNum: aQBOSalesReceipt.Line.length,
					    Description: 'Tip',
					    Amount: anOrder.get("tipAmount"),
					    DetailType:"SalesItemLineDetail",
					    SalesItemLineDetail: {
					        TaxCodeRef: {
					        	value: 'NON'
					        }
						}
					});	

				//if a discount was applied we should provide this as a line item
				if (anOrder.get("totalDiscountAmount") && anOrder.get("totalDiscountAmount") > 0)
					aQBOSalesReceipt.Line.push({
					    LineNum: aQBOSalesReceipt.Line.length,
					    Description: 'Discount',
					    Amount: anOrder.get("totalDiscountAmount") * -1,
					    DetailType:"SalesItemLineDetail",
					    SalesItemLineDetail: {
					        TaxCodeRef: {
					        	value: 'NON'
					        }
						}
					});

				aPromise.resolve(aQBOSalesReceipt);
			};		
		});
		
		return aPromise;

	}

	var qboOrdersPush = function(job, data){
		var Moment = new require("moment-timezone");
		var QuickBooks = require('node-quickbooks');

		cutOffMoment = new Moment('2016-10-10');
		var mainPromise = new Parse.Promise();

		//1. Get all Vendors that have a QBO Access Token
		var qboQuery = new Parse.Query("Secret");	
		qboQuery.equalTo("keyName", "qboAccessToken");
		qboQuery.include("vendor");
		return qboQuery.find({useMasterKey:true})
		.then(function(qboAccessTokenRecords){
			_.each(qboAccessTokenRecords, function(anAccessToken){
				//a. Init QBO Interface
				return qboInitInterface(anAccessToken.get("vendor"))
				.then(function(){
		        	
		        	var aQBO = new QuickBooks(
		        			_qboJSON.consumerKey,
		        			_qboJSON.consumerSecret,
		        			_qboJSON.accessToken,
		        			_qboJSON.accessTokenSecret,
		        			_qboJSON.realmId,
		        			_qboJSON.useSandBox,
		        			_qboJSON.debugging
		        	);
		        	var jsItems = [];

		        	var aTaxId = anAccessToken.get("vendor").get("settings").qbo.qboTaxId;
					
		        	//1. Get all the orders for this customer
		        	var ordersQuery = new Parse.Query("Order");
		        	ordersQuery.select(["amount", "taxAmount", "tipAmount", "totalDiscountAmount", "terminalId", "orderId", "saleMode"])
		        	ordersQuery.equalTo("vendor", anAccessToken.get("vendor"));
		        	ordersQuery.containedIn("state", [1,2,3]); //1,2,3 means that the order has been paid and has NOT been refunded 
		        	ordersQuery.greaterThanOrEqualTo("createdAt", cutOffMoment.toDate());
		        	ordersQuery.doesNotExist("extAccountingId");
		        	// ordersQuery.equalTo("objectId", '4BQuitgQ0z');

		        	return ordersQuery.each(function(anOrder){
		        		//get the taxcode to use off the vendor records

	    				//get JSON Object
	    				return _generateQBOSalesReceipt(anOrder, aTaxId.objectId)
	    				.then(function(aQBOSalesReceipt){

	    					var qboPromise = new Parse.Promise();
	    					
	    					//if null then process next order
	    					if (aQBOSalesReceipt != null){
	    						jsItems.push({SalesReceipt:aQBOSalesReceipt});
		    					if (jsItems.length == 25){
		    						//once we have 25 we need to push to QBO
		    						aQBO.batch(jsItems, function(techError, response){
										
										console.log(techError);
										console.log(response);

										if (techError){
											//now send a notification email
											var TrkUtil = require('./utility.js').trkUtility;
											var trkUtil = new TrkUtil();
											
											var jobDataContent = anAccessToken.get("vendor").get("description") + ' (' + anAccessToken.get("vendor").id + ')'
											var mailParams = {
											  	template_name: "batchJobError",
											 	message:{
											 		global_merge_vars:[
												 		{	name: 'jobName', content:job.attrs.name },
												 		{	name: 'jobFailReason', content: JSON.stringify(techError) },
												 		{	name: 'JOBDATA', content: jobDataContent}
											 		]
											 	}
											};

											trkUtil.sendEmail(mailParams, 'support@getyomojo.com');
										} else {

											var updateArray = [];
											jsItems = []; //clear out the array so we can do the next 25 records

											_.each(response.BatchItemResponse, function(aResponse){
												if (aResponse.Fault){
													//now send a notification email
													var TrkUtil = require('./utility.js').trkUtility;
													var trkUtil = new TrkUtil();
													
													var jobDataContent = anAccessToken.get("vendor").get("description") + ' (' + anAccessToken.get("vendor").id + ')'
													var mailParams = {
													  	template_name: "batchJobError",
													 	message:{
													 		global_merge_vars:[
														 		{	name: 'jobName', content:job.attrs.name },
														 		{	name: 'jobFailReason', content: JSON.stringify(aResponse.Fault) },
														 		{	name: 'JOBDATA', content: jobDataContent}
													 		]
													 	}
													};

													trkUtil.sendEmail(mailParams, 'support@getyomojo.com');
												} else {
													//update the Mojo order with the ID of the QBO SalesReceipt
													var Order = Parse.Object.extend("Order");
													updateOrder = new Order;
													updateOrder.id = aResponse.SalesReceipt.PaymentRefNum;
													updateOrder.set("extAccountingId", aResponse.SalesReceipt.Id);
													updateArray.push(updateOrder);
												};
											});

											if (updateArray.length > 0){
												Parse.Object.saveAll(updateArray, {useMasterKey:true})
												.then(function(){
													// jsItems = []; //clear out the array so we can do the next 25 records
													qboPromise.resolve();
												});
											} else {
												qboPromise.resolve();
											};	

											};
													
		    						});
		    					} else qboPromise.resolve();
	    					} 
	    						else qboPromise.resolve();
   					
	    					return qboPromise;
	    				});

		        	}, {useMasterKey:true}, function(error){
		        		console.log(error);
		        	}).then(function(){
		        		if (jsItems.length > 0){
    						aQBO.batch(jsItems, function(techError, response){
								console.log(techError);
								console.log(response);
								if (techError){
									//now send a notification email
									var TrkUtil = require('./utility.js').trkUtility;
									var trkUtil = new TrkUtil();
									
									var jobDataContent = anAccessToken.get("vendor").get("description") + ' (' + anAccessToken.get("vendor").id + ')'
									var mailParams = {
									  	template_name: "batchJobError",
									 	message:{
									 		global_merge_vars:[
										 		{	name: 'jobName', content:job.attrs.name },
										 		{	name: 'jobFailReason', content: JSON.stringify(techError) },
										 		{	name: 'JOBDATA', content: jobDataContent}
									 		]
									 	}
									};

									trkUtil.sendEmail(mailParams, 'support@getyomojo.com');
								} else {

									var updateArray = [];
									jsItems = []; //clear out the array so we can do the next 25 records

									_.each(response.BatchItemResponse, function(aResponse){
										if (aResponse.Fault){
											//now send a notification email
											var TrkUtil = require('./utility.js').trkUtility;
											var trkUtil = new TrkUtil();
											
											var jobDataContent = anAccessToken.get("vendor").get("description") + ' (' + anAccessToken.get("vendor").id + ')'
											var mailParams = {
											  	template_name: "batchJobError",
											 	message:{
											 		global_merge_vars:[
												 		{	name: 'jobName', content:job.attrs.name },
												 		{	name: 'jobFailReason', content: JSON.stringify(aResponse.Fault) },
												 		{	name: 'JOBDATA', content: jobDataContent}
											 		]
											 	}
											};

											trkUtil.sendEmail(mailParams, 'support@getyomojo.com');
										} else {
											//update the Mojo order with the ID of the QBO SalesReceipt
											var Order = Parse.Object.extend("Order");
											updateOrder = new Order;
											updateOrder.id = aResponse.SalesReceipt.PaymentRefNum;
											updateOrder.set("extAccountingId", aResponse.SalesReceipt.Id);
											updateArray.push(updateOrder);
										};

									});

									if (updateArray.length > 0)
										Parse.Object.saveAll(updateArray, {useMasterKey:true});
									};

    						});	
		        		}
		        	});


				});
			});
		});

	}

	var qboInitInterface = function(aVendor){
		var self = this;

		var aPromise = new Parse.Promise();
									
		var qboQuery = new Parse.Query("Secret");	

		qboQuery.equalTo("vendor", aVendor);
		qboQuery.containedIn("keyName", ["qboAccessTokenSecret", "qboAccessToken", "qboRealmId"]);
		
		return qboQuery.find({useMasterKey:true})
        .then(function(aQBOSecrets){
        	theQBOSecrets = aQBOSecrets;
        	return Parse.Config.get()
        }).then(function(aConfig){
			var qboAccessToken = _.find(theQBOSecrets, function(aSecret){
				if (aSecret.get("keyName") == 'qboAccessToken')
					return true
				else 
					return false;
			});

			var qboAccessTokenSecret = _.find(theQBOSecrets, function(aSecret){
				if (aSecret.get("keyName") == 'qboAccessTokenSecret')
					return true
				else 
					return false;
			});

			var qboRealmId = _.find(theQBOSecrets, function(aSecret){
				if (aSecret.get("keyName") == 'qboRealmId')
					return true
				else 
					return false;
			});

			//if any of the secrets are missing then we are NOT connected
			if (!qboRealmId || !qboAccessToken || !qboAccessTokenSecret)
				_qboJSON = {};				
			else 
				_qboJSON = { consumerKey: aConfig.get("qboConsumerKey"),
				                  consumerSecret: aConfig.get("qboConsumerSecret"),
				                  accessToken: qboAccessToken.get("secretValue"),
				                  accessTokenSecret: qboAccessTokenSecret.get("secretValue"),
				                  realmId: qboRealmId.get("secretValue"),
				                  useSandBox: aConfig.get("qboUseSandBox"),
				                  debugging:  true // turn debugging on
				                }; 
        	aPromise.resolve();
        });

        return aPromise;

	};

	var qboCustomerCreate = function(request, response){
		var self = this;
		var requestParams = request.params;
		var theVendor;
		var theQBO;
		var theQBOSecrets;
		var theCustomer;

		if (!requestParams.vendorId || requestParams.vendorId == ""){
			throw {
				message: 'Please specify a Vendor ID.',
				code: '400'
			};
		};

		var Vendor = Parse.Object.extend("Vendor");
		var query = new Parse.Query(Vendor);
		query.get(requestParams.vendorId, requestParams.sessionToken)
		.then(function(aVendorObject){
            theVendor = aVendorObject;

            return qboInitInterface(aVendorObject);
        }).then(function(){
        	var aPromise = new Parse.Promise();

        	var QuickBooks = require('node-quickbooks');
        	
        	var aQBO = new QuickBooks(
        			_qboJSON.consumerKey,
        			_qboJSON.consumerSecret,
        			_qboJSON.accessToken,
        			_qboJSON.accessTokenSecret,
        			_qboJSON.realmId,
        			_qboJSON.useSandBox,
        			_qboJSON.debugging
        	);
        	
        	var firstName;

			switch (requestParams.customerType){
				case 'WALK_UP':
					firstName = 'WalkUp';
					break;
				case 'MOBILE':
					firstName = 'Mobile'
					break;

			};

			aQBO.findCustomers({GivenName:firstName, FamilyName:"Mojo", limit:1},
				function(error, customers){
					//
					if (error)
						console.log(error);
					// console.log(customers);
					if (!customers.QueryResponse.Customer){
						//now customer found. create one
						aQBO.createCustomer({GivenName:firstName, FamilyName:"Mojo"},
						 function(error, resultCustomer){
						 	
						 	if (error){
								console.log(error);
								if (error.Fault.Error[0].Detail)
									aPromise.reject({code:144, message:error.Fault.Error[0].Detail});
							} else {
								console.log(theCustomer);
								theCustomer = resultCustomer;
								aPromise.resolve();
							}
						});
					} else {
						theCustomer = customers.QueryResponse.Customer[0];
						aPromise.resolve();
					};
				}
			);
			return aPromise;
        }).then(function(){
        	//now write the customer to the DB
			var qboQuery = new Parse.Query("Secret");	

			qboQuery.equalTo("vendor", theVendor);
			qboQuery.equalTo("keyName", "qboCustomer_" + requestParams.customerType);
			
			return qboQuery.find()
			.then(function(results){
				var Secrets = Parse.Object.extend("Secret");

				qboCustomer = _.find(results, function(aSecret){
					if (aSecret.get("keyName") == "qboCustomer_" + requestParams.customerType)
						return true
					else 
						return false;
				});

				if (!qboCustomer)
					qboCustomer = new Secrets();

	  			qboCustomer.set("keyName", "qboCustomer_" + requestParams.customerType);
	  			qboCustomer.set("secretValue", theCustomer.Id);
	  			qboCustomer.set("vendor", theVendor);
				return qboCustomer.save();

			});
        }).then(function(){
        	response.success({theCustomer})
        }, function(error){
        	response.error(error);
        });
	};

	var qboCompleteConnection = function(request, response){

		//get the params
		var requestParams = request.params;
		var theVendor;
		var qboRequestTokenSecret;
		var qboRequestToken;
		var qboAccessToken;
		var qboAccessTokenSecret;
		var qboRealmId;

		var aResponse;

		if (!requestParams.vendorId || requestParams.vendorId == ""){
			throw {
				message: 'Please specify a Vendor ID.',
				code: '400'
			};
		};			

		var Vendor = Parse.Object.extend("Vendor");
		var query = new Parse.Query(Vendor);
		query.get(requestParams.vendorId, {useMasterKey:true})
		.then(function(aVendorObject){
			theVendor = aVendorObject;

			//ok so we now have the request Token, Request Token Secret
			//and the verifier

			//we use this to swap out the request token for an QB Access Token


			var qboQuery = new Parse.Query("Secret");	

			qboQuery.equalTo("vendor", aVendorObject);
			qboQuery.containedIn("keyName", ["qboRequestTokenSecret", "qboRequestToken", "qboAccessToken", "qboAccessTokenSecret", "qboRealmId"]);
			
			return qboQuery.find()
			.then(function(results){
				var promiseArray = [];

				var Secrets = Parse.Object.extend("Secret");

				qboRequestTokenSecret = _.find(results, function(aSecret){
					if (aSecret.get("keyName") == 'qboRequestTokenSecret')
						return true
					else 
						return false;
				});

				qboRequestToken = _.find(results, function(aSecret){
					if (aSecret.get("keyName") == 'qboRequestToken')
						return true
					else 
						return false;
				});

				qboAccessToken = _.find(results, function(aSecret){
					if (aSecret.get("keyName") == 'qboAccessToken')
						return true
					else 
						return false;
				});

				qboAccessTokenSecret = _.find(results, function(aSecret){
					if (aSecret.get("keyName") == 'qboAccessTokenSecret')
						return true
					else 
						return false;
				});

				qboRealmId = _.find(results, function(aSecret){
					if (aSecret.get("keyName") == 'qboRealmId')
						return true
					else 
						return false;
				});

				return Parse.Config.get();
			}).then(function(aConfig){

				var OAuth   = require('oauth-1.0a');
				var crypto  = require('crypto');
				
				var oauth = OAuth({
				    consumer: {
				        key: aConfig.get("qboConsumerKey"),
				        secret: aConfig.get("qboConsumerSecret")
				    },
				    signature_method: 'HMAC-SHA1',
				    hash_function: function(base_string, key) {
				        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
				    }
				});

				var token = {
				    key: qboRequestToken.get("secretValue"),
				    secret: qboRequestTokenSecret.get("secretValue")
				};

				var request_data = {
				    url: 'https://oauth.intuit.com/oauth/v1/get_access_token',
				    method: 'GET',
				    data: {
				    	oauth_verifier:requestParams.oauth_verifier
				    }
				};
				// console.log('calling qbo url ' + url);
				var authData = oauth.authorize(request_data, token);

				return Parse.Cloud.httpRequest({
	      			method: request_data.method,
	      			url: request_data.url,
	      			headers: oauth.toHeader(authData),
				    success: function(httpResponse) {
				    	var promiseArray = [];

				    	aResponse = '&' + httpResponse.buffer.toString('utf-8');
				    	console.log(aResponse);

					}
				});		

			}).then(function(){
				var promiseArray = [];

				var Secrets = new Parse.Object.extend("Secret");

				if (!qboAccessToken)
					qboAccessToken = new Secrets();

	  			qboAccessToken.set("keyName", "qboAccessToken");
	  			qboAccessToken.set("secretValue", getParameterByName('oauth_token', aResponse));
	  			qboAccessToken.set("vendor", theVendor);
				promiseArray.push( qboAccessToken.save({}, {useMasterKey:true}) );

				if (!qboAccessTokenSecret)
					qboAccessTokenSecret = new Secrets();

	  			qboAccessTokenSecret.set("keyName", "qboAccessTokenSecret");
	  			qboAccessTokenSecret.set("secretValue", getParameterByName('oauth_token_secret', aResponse));
	  			qboAccessTokenSecret.set("vendor", theVendor);
				promiseArray.push( qboAccessTokenSecret.save({}, {useMasterKey:true}) );

				if (!qboRealmId)
					qboRealmId = new Secrets();

	  			qboRealmId.set("keyName", "qboRealmId");
	  			qboRealmId.set("secretValue", requestParams.realmId);
	  			qboRealmId.set("vendor", theVendor);
				promiseArray.push( qboRealmId.save({}, {useMasterKey:true}) );

				return Parse.Promise.when(promiseArray);
			}).then(function(){
				//we dont need the request tokens anymore so just get rid of those
				var dbDeletePromises = [];

				dbDeletePromises.push(qboRequestTokenSecret.destroy());
				dbDeletePromises.push(qboRequestToken.destroy());
				return Parse.Promise.when(dbDeletePromises);

			}).then(function(){
				response.success({});
			}, function(error){
				response.error(error);
			});
		});
	};

	var qboGetAuthUrl = function(request, response){
		//get the params
		var requestParams = request.params;
		var theVendor;
		var oAuthUrl = 'https://appcenter.intuit.com/Connect/Begin';

		if (!requestParams.vendorId || requestParams.vendorId == ""){
			throw {
				message: 'Please specify a Vendor ID.',
				code: '400'
			};
		};			
		Parse.Config.get()
		.then(function(aConfig){
			
			var aCallBack = aConfig.get("baseUrl") + '/qbo_connect.htm';
			// aCallBack = 'http://ar-nodejs.ddns.net:1337/qbo_connect.htm';

			var OAuth   = require('oauth-1.0a');
			var crypto  = require('crypto');
			
			var oauth = OAuth({
			    consumer: {
			        key: aConfig.get("qboConsumerKey"),
			        secret: aConfig.get("qboConsumerSecret")
			    },
			    signature_method: 'HMAC-SHA1',
			    hash_function: function(base_string, key) {
			        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
			    }
			});

			var request_data = {
			    url: aConfig.get("qboRequestTokenUrl"),
			    method: 'POST',
			    data: {
			    	// oauth_callback: aConfig.get("baseUrl") + '/qbo_connect.htm?statuste=' + requestParams.vendorId
			    	oauth_callback: aCallBack + '?vendorId=' + requestParams.vendorId
			    }
			};
			// console.log('calling qbo url ' + url);
			var authData = oauth.authorize(request_data);
			// authData.oauth_consumer_key = aConfig.get("qboConsumerKey");

			return Parse.Cloud.httpRequest({
      			method: request_data.method,
      			url: request_data.url,
      			headers: oauth.toHeader(authData),
			    success: function(httpResponse) {

			    	// console.log(httpResponse);
			    	var aResponse = '&' + httpResponse.buffer.toString('utf-8');
			    	console.log(aResponse);

					var Vendor = Parse.Object.extend("Vendor");
					var query = new Parse.Query(Vendor);
					query.get(requestParams.vendorId, {sessionToken:request.user.getSessionToken()})
					.then(function(aVendorObject){
			            theVendor = aVendorObject;
										
						var qboQuery = new Parse.Query("Secret");	

						qboQuery.equalTo("vendor", aVendorObject);
						qboQuery.containedIn("keyName", ["qboRequestTokenSecret", "qboRequestToken"]);
						return qboQuery.find({sessionToken:request.user.getSessionToken()});
					}).then(function(results){
						var promiseArray = [];

						var Secrets = Parse.Object.extend("Secret");

						var qboRequestToken = _.find(results, function(aSecret){
							if (aSecret.get("keyName") == 'qboRequestToken')
								return true
							else 
								return false;
						});

						if (!qboRequestToken)
							qboRequestToken = new Secrets();

			  			qboRequestToken.set("keyName", "qboRequestToken");
			  			qboRequestToken.set("secretValue", getParameterByName('oauth_token', aResponse));
			  			qboRequestToken.set("vendor", theVendor);
						promiseArray.push(qboRequestToken.save({},{sessionToken:request.user.getSessionToken()}));

						var qboRequestTokenSecret = _.find(results, function(aSecret){
							if (aSecret.get("keyName") == 'qboRequestTokenSecret')
								return true
							else 
								return false;
						});

						if (!qboRequestTokenSecret)
							qboRequestTokenSecret = new Secrets();
			  			
			  			qboRequestTokenSecret.set("keyName", "qboRequestTokenSecret");
			  			qboRequestTokenSecret.set("secretValue", getParameterByName('oauth_token_secret', aResponse));
			  			qboRequestTokenSecret.set("vendor", theVendor);
						promiseArray.push(qboRequestTokenSecret.save({},{sessionToken:request.user.getSessionToken()}));

						oAuthUrl = oAuthUrl + '?oauth_token=' + getParameterByName('oauth_token', aResponse);

						Parse.Promise.when(promiseArray)
						.then(function(){
							response.success({code:200, oAuthUrl:oAuthUrl});
						});
					});

			    },
			    error:function(httpResponse){
					var aResponse = httpResponse.buffer.toString('utf-8');
					response.error({code:httpResponse.status, message: aResponse});
			    }
    		});
		});
	};

	var getExternalTaxCodes = function(request, response){
		var requestParams = request.params;
		var theVendor;
		var self = this;
		var resultArray = [];

		if (!requestParams.vendorId || requestParams.vendorId == ""){
			throw {
				message: 'Please specify a Vendor ID.',
				code: '400'
			};
		};

		var Vendor = Parse.Object.extend("Vendor");
		var query = new Parse.Query(Vendor);
		query.get(requestParams.vendorId, {sessionToken: request.user.getSessionToken()})
		.then(function(aVendorObject){
            theVendor = aVendorObject;

            return qboInitInterface(theVendor);
        }).then(function(){
        	var aPromise = new Parse.Promise();
        	// var aPromise2 = new Parse.Promise();
        	//if we dont have an access token then we are not connected
        	if (_qboJSON.accessToken){
	        	var QuickBooks = require('node-quickbooks');
	        	
	        	var aQBO = new QuickBooks(
	        			_qboJSON.consumerKey,
	        			_qboJSON.consumerSecret,
	        			_qboJSON.accessToken,
	        			_qboJSON.accessTokenSecret,
	        			_qboJSON.realmId,
	        			_qboJSON.useSandBox,
	        			_qboJSON.debugging
	        		);

				aQBO.findTaxCodes({active:true}, 
					function(error, qboResponse){
						console.log(qboResponse);
						_.each(qboResponse.QueryResponse.TaxCode, function(aQBOTaxCode){
							
								resultArray.push({
									objectId:aQBOTaxCode.Id,
									name: aQBOTaxCode.Name
								});			
						});

						aPromise.resolve();
					}
				);

        	} else {
        		aPromise.resolve();	
        	}
			
			return aPromise; 
        }).then(function(){
        	response.success(resultArray);
        },function(error){
        	response.error(error);
        });
	};

	var qboIsConnected = function(request, response){
		var requestParams = request.params;
		var theVendor;

		if (!requestParams.vendorId || requestParams.vendorId == ""){
			throw {
				message: 'Please specify a Vendor ID.',
				code: '400'
			};
		};			

		var Vendor = Parse.Object.extend("Vendor");
		var query = new Parse.Query(Vendor);
		query.get(requestParams.vendorId, {useMasterKey:true})
		.then(function(aVendorObject){
			theVendor = aVendorObject;
			return qboInitInterface(theVendor);
		}).then(function(){
			var aPromise = new Parse.Promise();

			if (!_qboJSON.accessToken)
				return aPromise.resolve(false, null);
			else {
	        	var QuickBooks = require('node-quickbooks');
	        	
	        	var aQBO = new QuickBooks(
	        			_qboJSON.consumerKey,
	        			_qboJSON.consumerSecret,
	        			_qboJSON.accessToken,
	        			_qboJSON.accessTokenSecret,
	        			_qboJSON.realmId,
	        			_qboJSON.useSandBox,
	        			_qboJSON.debugging
	        	);

	        	aQBO.getCompanyInfo(_qboJSON.realmId, function(error, companyInfo){
	        		console.log(error);
	        		if (error)
	        			aPromise.reject(error);

	        		console.log(companyInfo);
	        		aPromise.resolve(true, companyInfo);
	        	})
			};
			return aPromise;

		}).then(function(isQBOConnected, companyInfo){
			var theCompanyName;
			if (companyInfo && companyInfo.CompanyName)
				theCompanyName = companyInfo.CompanyName;
			else {
				theCompanyName = '(Not Connected)';
			};

			response.success({
				isQBOConnected:isQBOConnected, 
				companyInfo:{CompanyName:theCompanyName}
			});
		}, function(error){
			response.error(error);
		});;
	};

	var qboRefreshAccessToken = function(job, data){
		//QBO will expire every access token every 180 days.
		//We need to refresh the access token within 30 days of expiration
		var xml2js = require('xml2js').parseString;
		//1. Get all access token that have a create date 150 days ago or greater
		var newAccessToken;
		var newAccessTokenSecret;
		var oldAccessToken = null;
		var oldAccessTokenSecret = null;
		var aConfig = null;

		var Moment = new require("moment-timezone");
		var cutOffMoment = new Moment();
		cutOffMoment.subtract(150, 'days');

		var qboQuery = new Parse.Query("Secret");	
		qboQuery.equalTo("keyName", "qboAccessToken");
		qboQuery.lessThanOrEqualTo("updatedAt", cutOffMoment.toDate());
		qboQuery.include("vendor");
		
		return qboQuery.find({useMasterKey:true})
		.then(function(results){
			var OAuth   = require('oauth-1.0a');
			var crypto  = require('crypto');

			var promise = Parse.Promise.as();

			return Parse.Config.get()
			.then(function(resultConfig){
				aConfig = resultConfig;
			}).then(function(){
				_.each(results, function(anAccessToken){
					oldAccessToken = anAccessToken;
				
					newAccessToken = null;
					newAccessTokenSecret = null;

					promise = promise.then(function() {
						//1. Get the corresponding AccessToken Secret
						var qboQuery = new Parse.Query("Secret");	
						qboQuery.equalTo("keyName", "qboAccessTokenSecret");
						qboQuery.equalTo("vendor", anAccessToken.get("vendor"));
						return qboQuery.first({useMasterKey:true})
						.then(function(anAccessTokenSecret){
							oldAccessTokenSecret = anAccessTokenSecret;
							//now we have both tokens lets refresh the token
								
							var oauth = OAuth({
							    consumer: {
							        key: aConfig.get("qboConsumerKey"),
							        secret: aConfig.get("qboConsumerSecret")
							    },
							    signature_method: 'HMAC-SHA1',
							    hash_function: function(base_string, key) {
							        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
							    }
							});

							var token = {
							    key: oldAccessToken.get("secretValue"),
							    secret: oldAccessTokenSecret.get("secretValue")
							};

							var request_data = {
							    url: 'https://appcenter.intuit.com/api/v1/connection/reconnect',
							    method: 'GET',
							    data: {}
							};
							var authData = oauth.authorize(request_data, token);
							return Parse.Cloud.httpRequest({
				      			method: request_data.method,
				      			url: request_data.url,
				      			headers: oauth.toHeader(authData),
							    success: function(httpResponse) {
							    	var promiseArray = [];
							    	
							    	aResponse = httpResponse.buffer.toString('utf-8');
							    	console.log(aResponse);
							    	var anError = '';
							    	
							    	xml2js(aResponse, function(err, result){
							    		if (err){
							    			console.log(err);
							    			anError = 'Error parsing QBO response: ' + err.message;
							    			// return Parse.Promise.error({code:400, message:err.message});
							    		} else {
							    			var qboResponse = result.PlatformResponse ? result.PlatformResponse: result.ReconnectResponse;
							    			if (qboResponse.ErrorCode[0] != 0){
							    				
							    				anError = 'QBO Token Refresh Error: ' + qboResponse.ErrorMessage[0] + ' (' 
							    					+  qboResponse.ErrorCode[0] + ')';
							    			};
							    			// return Parse.Promise.error({code:result.PlatformResponse.ErrorCode[0], message:result.PlatformResponse.ErrorMessage[0]});
							    		};
							    		if (anError != ''){
											//now send a notification email
											var TrkUtil = require('./utility.js').trkUtility;
											var trkUtil = new TrkUtil();
											
											var jobDataContent = anAccessToken.get("vendor").get("description") + ' (' + anAccessToken.get("vendor").id + ')'
											var mailParams = {
											  	template_name: "batchJobError",
											 	message:{
											 		global_merge_vars:[
												 		{	name: 'jobName', content:job.attrs.name },
												 		{	name: 'jobFailReason', content: anError },
												 		{	name: 'JOBDATA', content: jobDataContent}
											 		]
											 	}
											};

											trkUtil.sendEmail(mailParams, 'support@getyomojo.com');
							    		} else {
									    	newAccessToken = result.ReconnectResponse.OAuthToken[0];
											newAccessTokenSecret = result.ReconnectResponse.OAuthTokenSecret[0];							    			
							    		}
							    	});
								}
							});	
						}).then(function(){
							var promiseArray = [];

							if (newAccessToken){
					  			oldAccessToken.set("secretValue", newAccessToken);
								promiseArray.push( oldAccessToken.save({}, {useMasterKey:true}) );
							};
							

							if (newAccessTokenSecret){
					  			oldAccessTokenSecret.set("secretValue", newAccessTokenSecret);
								promiseArray.push( oldAccessTokenSecret.save({}, {useMasterKey:true}) );								
							};

							return Parse.Promise.when(promiseArray);

						});
					});
				});				
			});

			return promise;
		}, function(error){
			console.log('Error in qboRefreshAccessToken: ' + JSON.stringify(error));
			return Parse.Promise.error(error);
		});
	}

	var qboInterfaceDisconnect = function(request, response){
		var requestParams = request.params;

		if (!requestParams.vendorId || requestParams.vendorId == ""){
			throw {
				message: 'Please specify a Vendor ID.',
				code: '400'
			};
		};			

		var theVendor = null;

		var qboSecrets = [];
		var Vendor = Parse.Object.extend("Vendor");
		var query = new Parse.Query(Vendor);
		query.get(requestParams.vendorId, {sessionToken: request.user.getSessionToken()})
		.then(function(aVendorObject){
			theVendor = aVendorObject;

			var qboQuery = new Parse.Query("Secret");	

			qboQuery.equalTo("vendor", aVendorObject);
			qboQuery.containedIn("keyName", ["qboRequestTokenSecret", "qboRequestToken", "qboAccessToken", "qboAccessTokenSecret", "qboRealmId", "qboCustomer_WALK_UP","qboCustomer_MOBILE", "qboTaxCode"]);
			
			return qboQuery.find({sessionToken: request.user.getSessionToken()})
		}).then(function(results){
			qboSecrets = results;
			//now invalidate the accesToken in QBO
			return Parse.Config.get();
		}).then(function(aConfig){

			var OAuth   = require('oauth-1.0a');
			var crypto  = require('crypto');

			var oauth = OAuth({
			    consumer: {
			        key: aConfig.get("qboConsumerKey"),
			        secret: aConfig.get("qboConsumerSecret")
			    },
			    signature_method: 'HMAC-SHA1',
		        hash_function: function(base_string, key) {
    				return crypto.createHmac('sha1', key).update(base_string).digest('base64');
				}
			});

			qboAccessToken = _.find(qboSecrets, function(aSecret){
				if (aSecret.get("keyName") == 'qboAccessToken')
					return true
				else 
					return false;
			});

			qboAccessTokenSecret = _.find(qboSecrets, function(aSecret){
				if (aSecret.get("keyName") == 'qboAccessTokenSecret')
					return true
				else 
					return false;
			});

			var token = {
			    key: qboAccessToken.get("secretValue"),
			    secret: qboAccessTokenSecret.get("secretValue")
			};

			var request_data = {
			    url: 'https://appcenter.intuit.com/api/v1/Connection/Disconnect',
			    method: 'GET'
			};
			
			var authData = oauth.authorize(request_data, token);

			return Parse.Cloud.httpRequest({
      			method: request_data.method,
      			url: request_data.url,
      			headers: oauth.toHeader(authData)
			});		

		}).then(function(httpResponse){
			console.log(httpResponse);

			var promises = [];
			_.each(qboSecrets, function(aSecret){
				promises.push(aSecret.destroy());
			});

			//also delete all QBO related data stored in Mojo
			var vendorSettings = theVendor.get("settings");
			delete vendorSettings.qbo;

			promises.push( theVendor.save({"settings":vendorSettings}, {sessionToken:request.user.getSessionToken()}) );

			return Parse.Promise.when(promises);
		}).then(function(){
			response.success({code:200, message:"OK"});
		}, function(error){
			response.error(error);
		});;

	};
	var billVendors = function(job, jobData){

	   	console.log("*********************************");
	   	var count = 0;
	 	var promise = Parse.Promise.as();
	 	var configSet = null;
	 	var moment = require('moment');
	 	var effectiveMoment = null;
	 	var lastBillMoment = null;

	 	var jssha = require('./pusher/jssha256.js');
	 	var Buffer = require('buffer').Buffer;
	 	var accounting = require('./accounting.js');

	 	if (jobData.effectiveDate)
	 		effectiveMoment = moment.utc(jobData.effectiveDate) 
	 	else
	 		effectiveMoment = moment.utc();

	 	console.log('Effective Date is ' + effectiveMoment.format());

	 	return Parse.Config.get()
	 	.then(function(aConfigSet){
	 		configSet = aConfigSet;

		 	promise = promise.then(function() {
		 		
		 		var vendorQuery = new Parse.Query("Vendor");
		 		var finalCount = 0;
		 		vendorQuery.exists("vendorToken");
		 		vendorQuery.lessThanOrEqualTo("nextBillDate", effectiveMoment.toDate());

		 		return vendorQuery.each(function(aVendor){
		 			console.log('******************************** - ' + aVendor.id);

		 			var truckCount = 0;
		 			count++;
					var truckQuery = new Parse.Query("Truck");

					truckQuery.equalTo("vendor", aVendor);
					truckQuery.doesNotExist("centralKitchen");

					truckQuery.equalTo("deleted", false);
				 	return truckQuery.count({useMasterKey:true})
				 	.then(function(aTruckCount){
				 		truckCount = aTruckCount;

				 		console.log('Truck count for ' + aVendor.id + ' is ' + truckCount);
				 		if (truckCount == 0)
				 			truckCount = 1;

				 		// if (truckCount > 0){
						vendorRateQuery = new Parse.Query("vendorRate");
						vendorRateQuery.equalTo("vendor", aVendor);
						vendorRateQuery.lessThanOrEqualTo("startDate", new Date());
						vendorRateQuery.greaterThanOrEqualTo("endDate", new Date());
						// console.log('Getting vendor rate');
						return vendorRateQuery.first({useMasterKey:true})
						// } else {
							// truckCount = 1;
						// }
							// return Parse.Promise.as(null, 'Vendor has 0 trucks/locations configured');	
				 	}).then(function(aVendorRate, noBillReason){
				 		if (aVendorRate){
				 			console.log('Vendor Rate for ' + aVendor.id + ' is ' + aVendorRate.id);
				 			//check if the vendor has received their free days
				 			var freeDays = aVendorRate.get("freeDays");
				 			console.log('No of free days for ' + aVendor.id + ' is ' + freeDays);
				 			var diff = effectiveMoment.diff(moment(aVendor.toJSON().createdAt), 'days');
				 			console.log('difference for ' + aVendor.id + ' is ' + diff);

				 			if (diff < freeDays)
				 				return Parse.Promise.as(0, 'Vendor is still in free period');
				 			else{
				 				var accounting = require('./accounting.js');

				 				console.log('calcualting amount owed');
					 			//calculate the total amount owed
								var vendorTotal = truckCount * aVendorRate.get("truckRate");
								var taxTotal = vendorTotal * (aVendorRate.get('taxRate')/100);
								//rounding
								taxTotal = accounting.toFixed(taxTotal, 2);

								vendorTotal = parseFloat(vendorTotal) + parseFloat(taxTotal);
								vendorTotal = parseFloat(accounting.toFixed(vendorTotal, 2));
								
								// console.log('VendorTotal to be charged to ' + aVendor.id + ' is ' + vendorTotal);
								return Parse.Promise.as(vendorTotal);

							}	 			
				 		} else {
				 			console.log('No Vendor Rate found for ' + aVendor.id);
				 			// return Parse.Promise.reject({'Message':'No Rate found for ' + aVendor.id});
				 			if (noBillReason)
				 				return Parse.Promise.as(0, noBillReason);
				 			else
				 				return Parse.Promise.as(0, 'No Vendor Rate Found!');
				 		};
				 		
				 	}).then(function(aVendorTotal, noBillReason){
				 		console.log('total to be charged to ' + aVendor.id + ' is ' + aVendorTotal);
				 		
				 		if (aVendorTotal > 0){
							var params = {
			  								merchant_ref : 'Mojo POS',
							  				transaction_type : 'purchase',
							  				method : 'token',
							  				amount : aVendorTotal * 100, //convert into cents
							  				currency_code : aVendor.get("isoCurrency"),
							  				token : {
			  									token_type : 'FDToken',
			  									token_data : aVendor.get("vendorToken")
			  								}
			  					}

				      		var headers = {};

				      		headers.apikey = configSet.get("payEezyApiKey");
				      		headers.token = configSet.get("payEezyMerchantToken");
				      		headers['Content-type'] = 'application/json';
			      		
				      		headers.nonce = function(length){
								    var text = "";
								    // var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
								    var possible = '0123456789';
								    for(var i = 0; i < length; i++) {
								        text += possible.charAt(Math.floor(Math.random() * possible.length));
								    }
								    return text;
				      		}(19); //call the method passing in 19 as the length (19 is the length in the PayEezy example)

				      		headers.timestamp = new Date().getTime();

				      		headers.Authorization = function(){
				      			var hmacPayload = {};
				      			hmacPayload.apikey = headers.apikey;
				      			hmacPayload.nonce = headers.nonce;
				      			hmacPayload.timestamp = headers.timestamp;
				      			hmacPayload.token = headers.token;
				      			hmacPayload.payload = params;
			      				// console.log('HMac payload is ' + JSON.stringify(hmacPayload));

			      				var concatString = hmacPayload.apikey + hmacPayload.nonce + hmacPayload.timestamp + hmacPayload.token + JSON.stringify(hmacPayload.payload);
								
								var hash = jssha.HMAC_SHA256_MAC(configSet.get("payEezyAPISecret"), concatString);
								var buffer1 = new Buffer(hash);

								return buffer1.toString('base64');

				      		}();
				      		var aPromise = new Parse.Promise();
				      		console.log('Calling PayEezy Server...' + JSON.stringify(params));
							
							Parse.Cloud.httpRequest({
									method: 'POST',
									url: configSet.get("payEezyUrl") + '/v1/transactions',
									headers: headers,
									body: params
							}).then(function(httpResponse){
								aPromise.resolve(httpResponse);
							}, function(httpResponse){
								aResponse = httpResponse.buffer.toString('utf-8');
								aPromise.resolve(false, aResponse);
							});
							return aPromise;
				 		} else 
				 			return Parse.Promise.as(false, noBillReason);
				 	}).then(function(payEezyResponse, noBillReason){
				 		console.log('Payeezy response is ' + JSON.stringify(payEezyResponse));
				 		
				 		if (payEezyResponse != false){
					 		console.log('Payeezy response TEXT is ' + payEezyResponse.text);
					 		console.log('Payeezy response STATUS is ' + payEezyResponse.status);

					 		//for some INSANE resaon, PEZE CAN returns text which is not valid JSON so we have to strip it out so we can convert to JSON
					 		var revisedText = payEezyResponse.text;
					 		revisedText = String(revisedText).replace(/\n/g, "").replace(/\r/g, "").replace(/\t/g, "").replace(/[()]/g, '');
					 		 		
					 		// console.log('converting to JSON...' + revisedText);
					 		payEezyResponseJSON = JSON.parse(revisedText);
					 		// console.log('DONE converting to JSON...');
					 		// console.log('PEZE response is ' + JSON.stringify(payEezyResponseJSON));

					 		if (payEezyResponseJSON.status && payEezyResponseJSON.status != 200){
					 			// console.log('returning error');
					 			return Parse.Promise.as(payEezyResponseJSON, JSON.stringify(payEezyResponseJSON));
					 		} else if (payEezyResponse != false){
					 			// console.log(payEezyResponse.data);
					 			console.log('Vendor: ' + aVendor.id + ' Response: ' + payEezyResponse.data.transaction_status);
					 			if (payEezyResponse.data.transaction_status == 'approved'){
					 				//update the token data (in case it has changed)
					 				if (!aVendor.get("final")){
										aVendor.set("vendorToken", payEezyResponse.data.token.token_data);

										//Calculate the next bill date based on this current effecitve date + 1 month
										currentBillMoment = new moment(aVendor.get("nextBillDate"));
										console.log('current bill date is ' + currentBillMoment.format());

										var nextBillDateMoment = currentBillMoment.clone();
										nextBillDateMoment.add(1, 'months');
										console.log('next bill date is ' + nextBillDateMoment.format());

										aVendor.set("lastBillDate", effectiveMoment.toDate());
										aVendor.set("nextBillDate", nextBillDateMoment.toDate());
									} else {
										//this is the final bill
										console.log('This is the final bill. remove next bill date and vendorToken');
										aVendor.unset('vendorToken');
										aVendor.unset('nextBillDate');
									};

									var updateArray = [];
									updateArray.push(aVendor);

					        		console.log('saving billing event')
							  		var BillingEvent = Parse.Object.extend("BillingEvent");
							  		var aBillEvent = new BillingEvent;
							  		aBillEvent.set("vendor", aVendor);
							  		aBillEvent.set("amount", parseFloat((payEezyResponse.data.amount/100)));
									aBillEvent.set("transaction_id", payEezyResponse.data.transaction_id);
									aBillEvent.set("tx_tag", payEezyResponse.data.transaction_tag);
									updateArray.push(aBillEvent);

									console.log('Updating Vendor & Billing Event record for ' + aVendor.id);
									return Parse.Object.saveAll(updateArray, {useMasterKey:true})
									.then(function(){
										return Parse.Promise.as(payEezyResponse.data);
									});
					 			} else 
					 				return Parse.Promise.as(payEezyResponse.data);

					 		};
				 		} 
				 			else return Parse.Promise.as(payEezyResponse, noBillReason);
				 	}).then(function(payEezyPacket, noBillReason){
				 		console.log('payEezyPacket is' + JSON.stringify(payEezyPacket));
				 		//regardless of what the response was sent an email with the result
				 		var wasBillAttempted;

				 		if (payEezyPacket == false){
				 			wasBillAttempted = 'No';
				 			
				 		} else {
				 			wasBillAttempted = 'Yes';
				 			
				 			if (payEezyPacket.amount)
				 				payEezyPacket.amount = accounting.formatMoney(payEezyPacket.amount/100);
				 		};

				 		console.log('no bill reason is ' + noBillReason);

						var mailParams = {
							async:true, 
							template_name: configSet.get("billErrorEmailTemplate"),
							template_content:{},
							message: {
								merge_language: 'handlebars',
								from_email:"info@getyomojo.com",
								from_name: 'Billing',
								to: [{
							  		email: 'info@getyomojo.com',
							  		type: 'to'
							  	}],
							  	merge_vars: [{
							  		rcpt: 'info@getyomojo.com',
							  		vars: 
							  		[
							  			{
							  				name: "PAYEEZYRESPONSE",
							  				content: payEezyPacket
							  			},
							  			{
							  				name:'VENDORNAME',
							  				content:aVendor.get("description")
							  			},
							  			{
							  				name:'WASBILLATTEMPTED',
							  				content:wasBillAttempted
							  			},
							  			{
							  				name:'NOBILLREASON',
							  				content: noBillReason
							  			}
										]
							  	}]
							}
						};

						// console.log('Calling Mandrill with ' + JSON.stringify(mailParams));

						// Mandrill.initialize(configSet.get("MandrillAPIKey"));
						var mandrill = require('mandrill-api/mandrill');
						var mandrill_client = new mandrill.Mandrill(configSet.get("MandrillAPIKey"));

					  	return mandrill_client.messages.sendTemplate( mailParams,
					  		function(httpResponse){
					  			//return a response to the user
					  			console.log('Mandril response is ...' + JSON.stringify(httpResponse.data));
					  			// return Parse.Promise.as();
					  		},
					  		function(httpResponse){
					  			console.log('Error sending Mandril Email...' + JSON.stringify(httpResponse.data));
					  			//we are going to return a success message anyway, as the user can always
					  			//request a re-send
					  			// return Parse.Promise.error(httpResponse.data);
					  		}
					  	);

						// return Parse.Promise.as();

				 	}, function(error){
				 		console.log('Error for ' + aVendor.id + ': ' + JSON.stringify(error));
				 	});

		 		}, {useMasterKey: true});

		 	}, function(error){
		 		console.log('calling error ' + JSON.stringify(error));
		 		// status.error('error: ' + JSON.stringify(error));	
		 	});
	 	
	 	});
	}

    return {
        vendorGetInfoMessages : vendorGetInfoMessages,
        vendorGetInfo : vendorGetInfo,
        vendorCancelAccount: vendorCancelAccount,
        stripeConnectForVendor: stripeConnectForVendor,
        qboGetAuthUrl: qboGetAuthUrl,
        qboCompleteConnection: qboCompleteConnection,
        qboInitInterface:qboInitInterface,
        qboInterfaceDisconnect: qboInterfaceDisconnect,
        qboIsConnected: qboIsConnected,
        qboCustomerCreate:qboCustomerCreate,
        getExternalTaxCodes: getExternalTaxCodes,
        qboOrdersPush:qboOrdersPush,
        vendorSettingsUpdate: vendorSettingsUpdate,
        getAppUrl: getAppUrl,
        billVendors:billVendors,
        searchForDupes:searchForDupes,
        _searchForDupes: _searchForDupes,
        qboRefreshAccessToken:qboRefreshAccessToken
    };

}

exports.trkVendor = trkVendor;