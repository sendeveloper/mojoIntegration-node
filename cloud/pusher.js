/**
 ** Utility functions for the Pusher service
 ** Created by TJ
 ** Jan 31, 2015
 **/

var Pusher = require('pusher');

var trkPusher = function() {

	/**
		** sends pusher message to a vendor/backend website
		** params: {cloudFunction: "name of cloud function to call", cloudFunctionParams: "parameters objects to send with cloud func", data:"data object"}
		** return: response.success("message") or response.error(error)
		** NOTE: if 'data' object is included then the cloudFunction is ignored!

	**/

	var sendMessageToVendor = function(request,response) {

		try {
			// var requestParams = JSON.parse(request.body);
			var requestParams = request.params;

			var eventData={};

			if(!requestParams.vendorId) {
				throw {
			      message: 'vendorId is required',
			      code: 400
			    };
			}

			if(!requestParams.messageCode) {
				throw {
			      message: 'messageCode is required',
			      code: 400
			    };
			}

			Parse.Config.get().then(function(config){

				var pusher = new Pusher({
							  appId: config.get("pusherAppId"),
							  key: config.get("pusherKey"),
							  secret: config.get("pusherSecret")
							});

				if(!requestParams.data) {

					var cloudFunction= requestParams.cloudFunction;
					var cloudFunctionParams= requestParams.cloudFunctionParams;

					Parse.Cloud.run(cloudFunction,cloudFunctionParams)
						.then(function(result) {

							pusher.trigger( requestParams.truckId,'trckedVendorEvent',{code:requestParams.messageCode,dateTime:new Date(),data:result});
							response.success("Message sent");

						},function(error) {
							response.error(error);
						})
				}

				else {
					pusher.trigger( requestParams.vendorId, 'trckedVendorEvent',{code:requestParams.messageCode,dateTime:new Date(),data:requestParams.data} );
					response.success("Message sent");
				}

			},function(error){			//failed to get Config
				response.error(error);
			});
		}

		catch (error) {
			response.error({
    			"message" : error.message,
    			"code" : error.code
    		})
		}
	}

	/**
		** sends pusher message to a truck
		** params: {cloudFunction: "name of cloud function to call", cloudFunctionParams: "parameters objects to send with cloud func", data:"data object"}
		** return: response.success("message") or response.error(error)
		** NOTE: if 'data' object is included then the cloudFunction is ignored!

	**/

	var sendMessageToTruck_internal = function(requestParams) {
		
		try {
			console.log('sendMessageToTruck_internal');
			var globalPromise = new Parse.Promise();
			var eventData={};

			if(!requestParams.truckId) {
				throw {
			      message: 'truckId is required',
			      code: 400
			    };
			}

			if(!requestParams.messageCode) {
				throw {
			      message: 'messageCode is required',
			      code: 400
			    };
			}

			console.log('validations complete');
			
			var theTruck;
			var query = new Parse.Query("Truck");
			query.get(requestParams.truckId, {useMasterKey:true})
			.then(function(aTruck){
			
				theTruck = aTruck;

				return Parse.Config.get();
			}).then(function(config){
				console.log('initializing Pusher class');
				var pusher = new Pusher({
								  appId: config.get("pusherAppId"),
								  key: config.get("pusherKey"),
								  secret: config.get("pusherSecret")
				});


				if(!requestParams.data) {
					console.log('request is with data');

					var cloudFunction = requestParams.cloudFunction;
					var cloudFunctionParams = requestParams.cloudFunctionParams

					return Parse.Cloud.run(cloudFunction,cloudFunctionParams)
					.then(function(result) {

						// console.log('PUSHER requestParams are ' + JSON.stringify(requestParams));
						if (requestParams.orderId)
							result.orderId = requestParams.orderId;

						if (requestParams.objectId)
							result.objectId = requestParams.objectId;

						if (requestParams.orderState)
							result.orderState = requestParams.orderState;

						if (requestParams.acceptanceDateTime)
							result.acceptanceDateTime = requestParams.acceptanceDateTime;

						if (requestParams.terminalId)
							result.terminalId = requestParams.terminalId;

						var aPromise = new Parse.Promise();
						
						if (requestParams.isRepush == true)
							aPromise.resolve();
						else 
							aPromise = _createPendingNotifs(theTruck, requestParams.objectId, {code:requestParams.messageCode,dateTime:new Date(),data:result});

						aPromise.then(function(){

						if (requestParams.isRepush == true)
							pusher.trigger( requestParams.truckId,'POSEventRepush',{code:requestParams.messageCode,dateTime:new Date(),data:result});
						else 
							pusher.trigger( requestParams.truckId,'trckedPOSEvent',{code:requestParams.messageCode,dateTime:new Date(),data:result});

																	
							
							var centralKitchen = theTruck.get("centralKitchen");

							if (centralKitchen){
								pusher.trigger( centralKitchen.id,'trckedPOSEvent',{code:requestParams.messageCode,dateTime:new Date(),data:result});
							};
							// console.log('resolvign global promise');
							globalPromise.resolve("Message sent");							
						});

					});
				} else {
					var aPromise = new Parse.Promise();
					
					if (requestParams.isRepush == true)
						aPromise.resolve();
					else 
						aPromise = _createPendingNotifs(theTruck, requestParams.data.internalId, {code:requestParams.messageCode,dateTime:new Date(),data:requestParams.data});
					
					aPromise.then(function(){
						// console.log('calling pusher with data: ' + JSON.stringify(requestParams.data));
						
						if (requestParams.isRepush == true)
							pusher.trigger( requestParams.truckId, 'POSEventRepush',{code:requestParams.messageCode,dateTime:new Date(),data:requestParams.data} );
						else 
							pusher.trigger( requestParams.truckId, 'trckedPOSEvent',{code:requestParams.messageCode,dateTime:new Date(),data:requestParams.data} );
						
						var centralKitchen = theTruck.get("centralKitchen");

						if (centralKitchen){
							pusher.trigger( centralKitchen.id,'trckedPOSEvent',{code:requestParams.messageCode,dateTime:new Date(),data:requestParams.data});
						};
						// console.log('resolvign global promise in ELSE');
						globalPromise.resolve("Message sent");
					});					
				}

			},function(error) {
				globalPromise.reject(error);
			});
			return globalPromise;
		}

		catch (error) {
			globalPromise.reject({
    			"message" : error.message,
    			"code" : error.code
    		})
		}
		
	}
	
	var sendMessageToTruck = function(request, response) {
		// var requestParams = JSON.parse(request.body);

		var requestParams = request.params;

		var TrkPusher = require('cloud/pusher.js').trkPusher;
		var trkPusher = new TrkPusher();
		trkPusher.sendMessageToTruck_internal(requestParams)
    	.then(function(sendResult){
    		response.success(sendResult);
    	}, function(errorResponse){
    		response.error(errorResponse);
    	});
	};
	
	var confirmPendingNotification = function(request, response){
		console.log('******CONFIRMPUSH******');
		console.log('Confirmation received on the server from client ' + request.params.notifClientId + ' for Order ' + request.params.referenceId);

		var aQuery = new Parse.Query("PendingNotifications");
		aQuery.equalTo("notifClientId", request.params.notifClientId);
		aQuery.equalTo("referenceId", request.params.referenceId);
		aQuery.equalTo("truck", request.params.truck);
		return aQuery.first({useMasterKey:true})
		.then(function(pendingNotif){
			if (pendingNotif)
				return pendingNotif.destroy({useMasterKey:true});//delete the record since all is well
		}).then(function(){
			response.success({code:200, message:'OK'});
		}, function(error){
			response.error(error);
		});
	};

	var _createPendingNotifs = function(aTruck, referenceId, extData){
		//1. get all the registered notification clients for this
		// truck
		var moment = require("moment-timezone");

		var cutOffDateTime = new moment().utc().subtract(24, "hours");

		var NotificationClient = Parse.Object.extend("NotificationClient");

		var aQuery = new Parse.Query(NotificationClient);

		aQuery.equalTo("truck", aTruck);
		aQuery.greaterThan("updatedAt", cutOffDateTime.toDate());
		
		return aQuery.each(function(notifClient){
			//for each one, create a pending nofication record
			var PendingNotif = Parse.Object.extend("PendingNotifications");
			var pendingNotif = new PendingNotif();

			pendingNotif.set("notifClientId", notifClient.get("clientId"));
			pendingNotif.set("notifClient", notifClient); //info field only. not really required
			pendingNotif.set("referenceId", referenceId);
			pendingNotif.set("truck", aTruck);
			pendingNotif.set("extData", extData);
			return pendingNotif.save(null, {useMasterKey:true});
		}, {useMasterKey:true}
		);
	};

	var registerNotificationClient = function(request, response){
		var aQuery = new Parse.Query("NotificationClient");
		aQuery.equalTo("truck", request.params.truck);
		aQuery.equalTo("vendor", request.params.vendor);
		aQuery.equalTo("clientId", request.params.clientId);
		aQuery.first({sessionToken: request.user.getSessionToken()})
		.then(function(notifClientRecord){
			if (notifClientRecord){
				//it is superflous to set the clientId since it is all ready
				//set however we want to update the _updatedAt time stamp
				return notifClientRecord.save({clientId:request.params.clientId});
			} else {
				var NotifClient = Parse.Object.extend("NotificationClient");
				
				notifClient = new NotifClient();
				notifClient.set("truck", request.params.truck);
				notifClient.set("vendor", request.params.vendor);
				notifClient.set("clientId", request.params.clientId);
				return notifClient.save(null, {sessionToken:request.user.getSessionToken()});
			};
		}).then(function(){
			response.success({code:200, message:'OK'});
		},function(error){
			response.error(error);
		});

	}

	var repushMissedNotifications = function(job, data){
		var allreadyPushed = [];
		var moment = require("moment-timezone");
		
		var fromMoment = new moment().utc().subtract(6, 'minutes').set("second", "00");
		var toMoment = new moment().utc().subtract(1, 'minutes').set("second", "00");

		var aQuery = new Parse.Query("PendingNotifications");
		aQuery.greaterThanOrEqualTo("createdAt", fromMoment.toDate());
		aQuery.lessThanOrEqualTo("createdAt", toMoment.toDate());

		return aQuery.each(function(pendingNotification){
			//if we all ready have pushed this order then do not do it again
			var arrayIndex = allreadyPushed.indexOf(pendingNotification.get("referenceId"));
			if (arrayIndex > -1)
				return Parse.Promise.as();
			else {
				//1. Get the pending order
				var Order = Parse.Object.extend("Order");
				var orderQuery = new Parse.Query(Order);
				orderQuery.include('state');

				return orderQuery.get(pendingNotification.get("referenceId"), {useMasterKey:true})
				.then(function(anOrder){
					var jsonData = pendingNotification.get("extData");

					//the only thing that may have changed since the last push attempt
					//is the status of the order and the date/time
					jsonData.state = anOrder.get("state");
					jsonData.dateTime = new Date();
					jsonData.isRepush = true;

					sendMessageToTruck_internal(jsonData);
					//add this reference ID to the 'all ready pushed' array
					allreadyPushed.push(pendingNotification.get("referenceId"));
				});				
			}

		}, {useMasterKey:true});
	};

	return {
		sendMessageToTruck: sendMessageToTruck,
		sendMessageToTruck_internal: sendMessageToTruck_internal,
		sendMessageToVendor: sendMessageToVendor,
		registerNotificationClient:registerNotificationClient,
		confirmPendingNotification: confirmPendingNotification,
		repushMissedNotifications:repushMissedNotifications
	}
}

exports.trkPusher = trkPusher;