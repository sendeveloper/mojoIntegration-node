var _ = require('lodash');
var moment = require("moment-timezone");

var appDefaults= {

	paymentMode: {
		"CASH": "CASH",
		"CARD": "CARD"
	},

	paymentProvider: {
		"CASH": "CASH",
		"STRIPE" : "CARD",
		"PAYL" : "CARD"
	},

	saleMode:{
		"inPerson":1,
		"online": 2
	}
}

var trkOrder=function() {

	var const_stripe_provider_code="STRIPE";
	var const_bams_provider_code="BAMS";
	var const_hlnd_provider_code="HLAND";
	var const_cash_provider_code="CASH";
	var const_vouch_provider_code="VOUCH";

	var const_orderState_recvd = 0;
	var const_orderState_conf = 1;
	var const_orderState_ready = 2;
	var const_orderState_comp = 3;
	var const_orderState_canc = 4;
	var const_orderState_saved = 5;

	var const_saleMode_walkup = 1;
  var const_saleMode_mobile = 2;

	// var posOrderCreate = function(request, response){
 //        try{        
 //            // var orderInfo = JSON.parse(request.body);
 //            var requestParams = request.params;

 //            if (!orderInfo.vendorId) throw {
 //                message: 'Vendor ID not provided',
 //                code: '101'
 //            };
 
	// 		// ensure that there is at least 1 item in the order
	// 		if (!orderInfo.items || orderInfo.items.length == 0) throw {
	// 			message: 'You must specify at least 1 item in your order',
	// 			code: '101'
	// 		};
            
 //            //if createCustomer is true make sure that a phone number is supplied
 //            if (orderInfo.createCustomer && orderInfo.createCustomer == "true" && !orderInfo.customerPhone || orderInfo.customerPhone == '') {
 //                throw {
 //                  message: 'You must provide a phone number.',
 //                  code: '101'
 //                };
 //            };
 
 //            if (!orderInfo.truckId) {
 //                throw {
 //                  message: 'Please specify a truck Id',
 //                  code: '101'
 //                };
 //            };

 //            // all good save the order
 //            var newOrderInfo=null;

 //            var Order = Parse.Object.extend("Order");
	// 		var order = new Order();

	// 		var Truck= Parse.Object.extend("Truck");
	// 		var truck=new Truck();

	// 		var Vendor=Parse.Object.extend("Vendor");
	// 		var vendor=new Vendor();

	// 		vendor.id=orderInfo.vendorId;
	// 		truck.id=orderInfo.truckId;

	// 		order.set("orderId", Math.floor((Math.random() * 10000) + 1));
	// 		order.set("vendor",vendor);
	// 		order.set("truck",truck);
	// 		order.set("state",orderInfo.state);
	// 		order.set("paid",orderInfo.paid);
	// 		order.set("taxAmount",orderInfo.taxAmount);
	// 		order.set("amount",orderInfo.amount);
	// 		order.set("currency",orderInfo.currency);
	// 		order.set("saleMode",orderInfo.saleMode);
	// 		order.set("paymentMode",orderInfo.paymentMode);
	// 		order.set("pickedupDateTime",orderInfo.pickedupDateTime);

	// 		order.save()	
	// 		.then(function(order){

	// 			newOrderInfo=order;

	// 			//resolved promise
	// 			var promise = Parse.Promise.as();

	// 			var OrderHeader=Parse.Object.extend("Order");	
	// 			var orderHeader=new OrderHeader();

	// 			orderHeader.id=order.id;


	// 			_.each(orderInfo.items, function(item, itemIndex) {

	// 				promise=promise.then(function(){

	// 					var OrderItem=Parse.Object.extend("OrderItem");
	// 					var orderItem=new OrderItem();

	// 					var MenuItem=Parse.Object.extend("MenuItem");
	// 					var menuItem=new MenuItem();

	// 					menuItem.id=item.menuItemId;

	// 					orderItem.set("order",orderHeader);

	// 					if(item.menuItemId!="0")	//off-menu items do not set the menu pointer
	// 						orderItem.set("menuItem",menuItem);

	// 					orderItem.set("description",item.description);
	// 					orderItem.set("qty",item.quantity);
	// 					orderItem.set("price",item.price);
	// 					orderItem.set("modifiers",item.modifiers);
	// 					orderItem.set("taxes",item.taxes);
	// 					orderItem.set("note",item.note);

	// 					return orderItem.save();

	// 				})

	// 			})

				
	// 			return promise;

	// 		})

	// 		.then(function(){
	// 			response.success(newOrderInfo);

	// 		},function(error){

	// 			response.error(error);

	// 		})

 //        }

 //        catch(e){
            
 //            response.error({
 //                "message": e.message,
 //                "code": e.code
 //            });
 //        }
 //    }

    // If Order state is converted from 0->1 and paid is set to false, credit card will be charged before incrementing the state
    // For refunds whose payment type was credit card, Stripe refunds API will be called
    var updateCustomer = function(anOrder, returnPhoneNo){
    	//console.log(anOrder.toJSON());
    	if (anOrder.get("customerPhone")){
    			var theVendor = anOrder.get("vendor");
    			theVendor.fetch({useMasterKey:true})
    			.then(function(){
    				// console.log('vendor loaded...');
	  				var stateText = "";
					var state = anOrder.get("state");
					var orderId = anOrder.get("orderId");
					switch(state){
						// case const_orderState_recvd:
						// 	stateText = 'Order ' + orderId + ' received. Confirmation pending from truck.';
						// 	break;
						case const_orderState_conf:
							stateText = "Your Order M" + orderId + " has been confirmed by " 
										+ theVendor.get("description") + ". We'll let you know when its ready..."
							break;
						case const_orderState_ready:
							if (anOrder.get("deliveryRequested"))
								stateText = "Order M" + orderId + " is out for delivery. We will see you soon!"
							else
								stateText = "Order M" + orderId + " ready for pickup. Come and get it!"
							break;
						// case const_orderState_comp:
						// 	stateText = "Order " + orderId + " picked up. Thank you!";
						// 	break;
						case const_orderState_canc:

							if (returnPhoneNo)
								stateText = "Sorry but we are unable to complete order M" + orderId + " at this time. Please call "
											+ theVendor.get("description") + " on "+ returnPhoneNo + " for assistance with your order.";
								else 
									stateText = "Sorry. We are unable to complete order M" + orderId + " at this time.";
							break;							
					};

					if (stateText != ""){
						var smsInterface = require('./sms-interface.js');
						Parse.Config.get()
						.then(function(aConfig){
							return smsInterface.init(aConfig);	
						}).then(function(){
							return smsInterface.sendSMS(anOrder.get("customerPhone"), stateText);
						});			
					} else 
						return Parse.Promise.as();    				
	    			});
    	}

    }

    var orderStateModify = function(request, response) {
    	
    	console.log('In orderStateModify!');
    	try {

    		// var requestParams = JSON.parse(request.body);

    		var requestParams = request.params;
    		var orderObj;
    		var paymentInformation;
    		var theVendor;
    		var theTruck;
    		// var paymentProviderInfo={};
    		var aPaymentProvider = null;

    		if (!requestParams.orderId){
			    throw {
			      message: 'orderId is required',
			      code: 400
			    };			
			}

			if(!requestParams.truckId) {
				throw {
			      message: 'truckId is required',
			      code: 400
			    };
			}

    		if (!requestParams.orderState){
			    throw {
			      message: 'orderState is required',
			      code: 400
			    };			
			}

			var Order= Parse.Object.extend("Order");
			var query = new Parse.Query(Order);
			query.include("truck", "vendor");
			query.get(requestParams.orderId,{useMasterKey:true})			//get the order

			
			// if order's payment type was credit card, get the vendor info
			.then(function(aOrder) {
				//check if the order being updated by the terminal is all ready assigned to ANOTHER terminal
				//if it is, return an error
				var currentTerminalId = aOrder.get("terminalId");

				if (requestParams.orderState != 4) //4 means cancel and we should be able to cancel from any terminal
					if (requestParams.terminalId && currentTerminalId && requestParams.terminalId != currentTerminalId)
						return Parse.Promise.error({"code":401,"message":"Order all ready assigned to terminal: " + currentTerminalId});

				orderObj=aOrder;
			
				//now load the customers payment details
				var paymentInfoQuery = new Parse.Query("paymentInfo");
				paymentInfoQuery.equalTo("order", orderObj);
				return paymentInfoQuery.first({useMasterKey:true});

			}).then(function(aPaymentInfo) {
				paymentInformation = aPaymentInfo;

				theVendor = orderObj.get("vendor");
				theTruck = orderObj.get("truck");
				console.log('vendor pay info is ' + theVendor.get("paymentInfo"));

				if((requestParams.orderState==1 || (requestParams.orderState==4 && orderObj.get("state")!=0)) 
					&&  (orderObj.get("provider") != const_cash_provider_code && orderObj.get("provider") != const_vouch_provider_code)) {
					var paymentInfoArray = theTruck.get("paymentInfo");
					
					if (!paymentInfoArray || paymentInfoArray.length == 0)
						paymentInfoArray = theVendor.get("paymentInfo");

					if (!paymentInfoArray || paymentInfoArray.length == 0)
						return Parse.Promise.error({message: 'This vendor is not setup to accept online orders',code: 400});
					else {

						// paymentInfo = paymentInfoArray[0];
						aPaymentProvider = require('./pay-provider.js')(paymentInfoArray[0], request.user);

						// //make sure payment provider details were set in the loop above
						if(aPaymentProvider)
							return Parse.Promise.as(true);
						else
							return Parse.Promise.error({"code":400,"message":"Could not find relevant payment provider for this vendor"});
					}

        		}
			})

			// if need to charge or refund do that here
			// processCreditCard set to 'true' if we need to charge/refund CC
			.then(function(processCreditCard){
				// console.log('Process credit card is ' + processCreditCard);

				if(processCreditCard) {
					var orderJSON = orderObj.toJSON();

					//if the caller did not provide a currency code then default the vendors
					if (!requestParams.currency)
						orderJSON.currency = theVendor.get("isoCurrency");

						if(requestParams.orderState==1 && orderObj.get("paid") == false) {			//charge card if not cash trans
							console.log('Calling Payment Provider chargeCardWithToken...');

							return aPaymentProvider.chargeCardWithToken(orderJSON);
						}

						else if(requestParams.orderState==4 && orderObj.get("paid") == true) {		//refund card if not cash trans

							return aPaymentProvider.refundCard(orderJSON);

						}
				}

				else
					return Parse.Promise.as();
			})
			
			// set the order state & save
			.then(function(oPayment){				//success
				// console.log('payment infor is ' + JSON.stringify(oPayment));
				var orderState= requestParams.orderState;

				if(oPayment) {
					console.log('Payment Data is ' + JSON.stringify(oPayment));
					if(orderState==1){
						if (oPayment.id){
							orderObj.set("chargeId",oPayment.id);
							paymentInformation.set("chargeId", oPayment.id);
						};

						if (oPayment.transaction_tag)
							orderObj.set("tx_tag",String(oPayment.transaction_tag));
							paymentInformation.set("tx_tag", String(oPayment.transaction_tag));

						if (oPayment.last4){
							orderObj.set("last4", oPayment.last4);
							paymentInformation.set("last4", oPayment.last4);
						};

						orderObj.set("paid", true);

						//since the card was charged successfully, we may as well get rid of the 
						//sensitive data that we no longer need
						orderObj.unset("chargeTokenId");
						orderObj.unset("cc_expiry"); 
						orderObj.unset("credit_card_type"); 

						paymentInformation.unset("chargeTokenId");
						paymentInformation.unset("cc_expiry"); 
						paymentInformation.unset("credit_card_type"); 


					}
					else if(orderState==4){
						console.log('refund opyament is ' + JSON.stringify(oPayment));
						orderObj.set("refundId",oPayment.id);
						paymentInformation.set("refundId",oPayment.id);
						// if (oPayment.ctr){
						// 	orderObj.set("refund_ctr", oPayment.ctr); //store CTR for later so we save to db
						// }

					};
				}

				if (requestParams.terminalId)
					orderObj.set("terminalId", requestParams.terminalId);


				orderObj.set("state",orderState);

				switch(orderState) {
					
					case 0:
						orderObj.set('Order has been received. Confirmation is pending from truck.');
						break;
					case 1:
						orderObj.set("acceptanceDateTime", new Date());
						orderObj.set("status","Your Order M" + orderObj.get("orderId") + " has been confirmed by " 
									+ theVendor.get("description") + ". Wel'll let you know when its ready...");
						break;
					case 2:

						console.log('delivery requested is ' + orderObj.get("deliveryRequested"))
						if (orderObj.get("deliveryRequested") == true)
							orderObj.set("status","Order is out for delivery. We will see you soon!");
						else 
							orderObj.set("status","Order is ready for pickup. Come and get it!");
						//need to send SMS text if the order has a phone Number associated with it.
						break;
					case 3:
						orderObj.set("pickedupDateTime",new Date());			//set the pickedup date-time to NOW
						orderObj.set("status","Order has been picked up. Thank you!");
						break;

					case 4:
						orderObj.set("status","Order has been cancelled/rejected");
						break;
				}

				var dbArray = [];
				
				if (paymentInformation)
					dbArray.push(paymentInformation);
				
				dbArray.push(orderObj);

				// return orderObj.save()
				return Parse.Object.saveAll(dbArray, {useMasterKey:true})
				.then(function(resultArray){
					//this will send an outbound sms, if needed
					console.log('calling update customer');
					updateCustomer(orderObj, requestParams.phoneNo);
				});

			})
			
			.then(function(object) {
				// console.log('order obj is ' + JSON.stringify(orderObj));
				console.log('calling pusher with state modify update');
				var TrkPusher = require('./pusher.js').trkPusher;
				var trkPusher = new TrkPusher();
				console.log('calling sendMessageToTruck_internal from OrderStateModify...');
				return trkPusher.sendMessageToTruck_internal({	
					messageCode:100,
					truckId:requestParams.truckId,
					objectId: orderObj.id,
					orderId: orderObj.id, //this really shouldnt .id by fix later
					externalId: orderObj.get('orderId'),
					orderState:orderObj.get("state"),  //this should be deleted but keeping for backward compatibility
					state:orderObj.get("state"),
					acceptanceDateTime: orderObj.get("acceptanceDateTime"),
					terminalId: orderObj.get("terminalId"),
					cloudFunction:"ordersGetCount",
					cloudFunctionParams:{"truckId":requestParams.truckId, terminalId: orderObj.get("terminalId")}
				});
				
			}).then(function(object) {			//all done return success/error
				console.log('Mystery object is ' + JSON.stringify(object));
				response.success({"code":200,"message": "Successfully set Order State"});
			},function(error){
				console.log('Error in orderStateModify: 1 ' + JSON.stringify(error));
				response.error(error);
			});
    	}

    	catch(error) {
    		console.log('Error in orderStateModify: 2' + JSON.stringify(error));
    		response.error({
    			"message" : error.message,
    			"code" : error.code
    		})
    	}

    }

   	var posGetOrders=function(request,response) {
		// response.error({code:122, message:"Simulating BAD response from server"});
    	try {

    		// var requestParams = JSON.parse(request.body);
    		var requestParams = request.params;
    		var aSessionToken = request.user.get("sessionToken");

			var responseObject = [];

			if(!requestParams.vendorId)
				throw {message: "Vendor ID is required", code: "101"}

			// Get the order list first
			var Order = Parse.Object.extend("Order");
			var OrderItem = Parse.Object.extend("OrderItem");
			var Truck = Parse.Object.extend("Truck");
			var Vendor = Parse.Object.extend("Vendor");

			var truck=new Truck();
			var vendor=new Vendor();

			vendor.id=requestParams.vendorId;


		   	var ordersQuery = new Parse.Query(Order);
		   	ordersQuery.equalTo("vendor",vendor);
		   	
		   	if (requestParams.terminalId && requestParams.orderState!="CO")
		   		ordersQuery.equalTo("terminalId",requestParams.terminalId);

		   	// console.log("completed promise....");
		   	return Parse.Promise.as()
		   	.then(function(){
			   	console.log('Truck ID is ' + requestParams.truckId);

			   	if(requestParams.truckId) {
			   		
		   			//1. Determine the truck/locations that this truck is a central kitchen for
		   			// console.log('checking for central kitchen...');

		   			var truckQuery = new Parse.Query(Truck);
		   			truckQuery.equalTo("centralKitchen", {__type:"Pointer", className:"Truck", objectId:requestParams.truckId});
		   			return truckQuery.find({sessionToken:aSessionToken});

			   	} else 
			   		return Parse.Promise.as([]);
		   	}).then(function(truckList){

				if (requestParams.truckId){
					// console.log('pushing truck onto array...');
					// truck.id=requestParams.truckId;
					truckList.push({__type:"Pointer", className:"Truck", objectId:requestParams.truckId});
				};
				console.log("truck list has " + truckList.length + ' entries in it');

				if (truckList.length > 0)
					ordersQuery.containedIn("truck", truckList);
		   		console.log('order state request is ' + requestParams.orderState );

			   	//select which orders to get
			   	if(requestParams.orderState=="H") { 				//History
			   		
			   		if(requestParams.dateFrom && requestParams.dateTo) {
			   			ordersQuery.greaterThanOrEqualTo("acceptanceDateTime",new Date(requestParams.dateFrom));
						ordersQuery.lessThanOrEqualTo("acceptanceDateTime", new Date(requestParams.dateTo));
			   		}

			   		ordersQuery.greaterThanOrEqualTo("state",1);
			   		ordersQuery.lessThanOrEqualTo("state",4);
			   		ordersQuery.equalTo("paid",true);
			   		
			   	}
			   	else if(requestParams.orderState == 'PI')        //Pending and In Process
			   		ordersQuery.containedIn("state", [0,1]);

			   	else if(requestParams.orderState=="C")			//Pending Acceptance, In Process and Ready
			   		ordersQuery.lessThan("state",3);

			   	else if(requestParams.orderState=="CO")			//Pending Acceptance
			   		ordersQuery.equalTo("state",0);

			   	else if(requestParams.orderState=="CP")			//In Process
			   		ordersQuery.equalTo("state",1);

			   	else if(requestParams.orderState=="CR")			//Ready
			   		ordersQuery.equalTo("state",2);

			   	else if(requestParams.orderState=="PL"){			//Pay Later
			   		ordersQuery.equalTo("payLater",true);
			   		ordersQuery.equalTo("paid",false);
			   	} else {
			   		//return the whole lot
			   	};

			   	if (requestParams.limit && requestParams.limit > 0)
			   		ordersQuery.limit(requestParams.limit);

			   	if (requestParams.skip)
					ordersQuery.skip(requestParams.skip);		   		

			   	if(requestParams.orderState=="CO")
			   		ordersQuery.ascending("requestedPickupDateTime");
			   	else if(requestParams.orderState=="CP" || requestParams.orderState=="CR")
			   		ordersQuery.ascending("txDate")
			   	else if (requestParams.orderState == 'PI')
			   		ordersQuery.ascending("acceptanceDateTime")
			   	else
			   		ordersQuery.descending("txDate");
		   	
			   	if (requestParams.last4)
			   		ordersQuery.equalTo("last4", requestParams.last4);

			   	ordersQuery.include('truck');

				//finally get the actual records
				return ordersQuery.find({sessionToken:aSessionToken});
			   	
		   	}).then(function(orders){
		   		console.log('Found ' + orders.length + ' matching orders');

		   		for(i=0;i<orders.length;i++) {
		   			var orderJSON = orders[i].toJSON();
		   			// console.log('Delivery details is ' + orderJSON.objectId + ' ' + orders[i].deliveryDetail);

		   			// console.log('terminal id is ' + orderJSON.terminalId);
		   			var theTruck = orders[i].get('truck');
		   			if (theTruck){
		   				var truckName = theTruck.get('name');
		   				// console.log('truck name is ' + truckName);
		   				orderJSON.truckName = truckName;
		   				orderJSON.truckId = theTruck.id;
		   			}

		   			orderJSON.txDate = moment(orders[i].get("txDate")).toISOString();
		   			// console.log('the truck is ' + JSON.stringify(orderJSON.truck));
		   			
		   			//console.log('order ' + i + JSON.stringify(orderJSON));
		   			// convert each order object to JSON equivalent
		   			delete orderJSON.signature; //dont return it
		   			// console.log('before short id ' + orderJSON.orderId);
   			
		   			responseObject.push(orderJSON);
		   		}

			   	//resolved promise
				var promise = Parse.Promise.as();

				console.log('noItem ' + requestParams.noItem);
				if (requestParams.noItem != true){
					_.each(orders, function(order, orderIndex) {
						promise=promise.then(function(){

							var orderItemsQuery=new Parse.Query(OrderItem);
							orderItemsQuery.equalTo("order", order);
							orderItemsQuery.include("menuItem");
										
							return orderItemsQuery.find({
								success: function(orderItems) {
									
									responseObject[orderIndex].orderItems=[];

									for(var i=0;i<orderItems.length;i++) {
										
										var _r=orderItems[i].toJSON();
					   					var _m=orderItems[i].get("menuItem");
					   					
					   					if(_m)
					   						_r.menuItem=_m.toJSON();
					   					
					   					responseObject[orderIndex].orderItems.push(_r);
									}
								},

								error: function(error) {
									console.log('Error getting POS orders ' + JSON.stringify(error));
									//response.error({"message":error.message, "code":error.code});
									//return promise.reject(error);
								},
								sessionToken:aSessionToken
							})
						})
					});
				};

				return promise;

		   	}).then(function() {
				console.log('returning success responseObject')
				response.success(responseObject);

			}, function(error){
				response.error(error);
			})

    	}

    	catch(e) {
    		response.error({
                "message": e.message,
                "code": e.code
            });
    	}
    }

    var posGetOrdersSummaryReport=function(request,response) {

    	try {

    		// var requestParams = JSON.parse(request.body);
    		var requestParams = request.params;

			var responseObject = [];
			var ordersArray = [];

			// ensure all required parameters are sent
			if(!requestParams.dateFrom)
				throw {message:"Date From is required",code:"400"}

			if(!requestParams.dateTo)
				throw {message:"Date To is required",code:"400"}

			if(!requestParams.truckId)
				throw {message:"TruckID is required",code:"400"}

			if(!requestParams.vendorId)
				throw {message: "Vendor ID is required", code: "400"}

			// fetch the orders and items
			var Order = Parse.Object.extend("Order");
			var OrderItem = Parse.Object.extend("OrderItem");
			var Truck = Parse.Object.extend("Truck");
			var Vendor = Parse.Object.extend("Vendor");

			var truck=new Truck();
			var vendor=new Vendor();

			truck.id=requestParams.truckId;
			vendor.id=requestParams.vendorId;

		   	var ordersQuery = new Parse.Query(Order);
		   	
		   	ordersQuery.equalTo("vendor",vendor);
		   	ordersQuery.equalTo("truck",truck);
		   	
		   	ordersQuery.greaterThanOrEqualTo("state",1);
		   	ordersQuery.lessThanOrEqualTo("state",4);
		   	ordersQuery.equalTo("paid",true);
		   	
		  	ordersQuery.greaterThanOrEqualTo("acceptanceDateTime",new Date(requestParams.dateFrom));
			ordersQuery.lessThanOrEqualTo("acceptanceDateTime", new Date(requestParams.dateTo));
			ordersQuery.limit(500);
			ordersQuery.find()
		   .then(function(orders){

		   		for(i=0;i<orders.length;i++) {
		   			// convert each order object to JSON equivalent
		   			ordersArray.push(orders[i].toJSON());
		   		}

		   		//resolved promise
			var promise = Parse.Promise.as();

			//get order items for each order
			_.each(orders, function(order, orderIndex) {
				promise=promise.then(function(){

					var orderItemsQuery=new Parse.Query(OrderItem);
					orderItemsQuery.equalTo("order", order);
					orderItemsQuery.include("menuItem");
					
					return orderItemsQuery.find({
						success: function(orderItems) {
							
							ordersArray[orderIndex].orderItems=[];

							for(var i=0;i<orderItems.length;i++) {
								
								var _r=orderItems[i].toJSON();
			   					var _m=orderItems[i].get("menuItem");
			   					
			   					if(_m)
			   						_r.menuItem=_m.toJSON();
			   					
			   					ordersArray[orderIndex].orderItems.push(_r);

							}
						},

						error: function(error) {
							response.error({"message":error.message, "code":error.code});
						}
					})


				})
			});

			return promise;

		   }).then(function() {

		   		//create the summary report from the fetched ordersArray
		   		var ordersGroup=[];

		   		var foundIndex=-1;

		   		for(var i=0; i< ordersArray.length; i++) {

		   			// test if the Date is already in the ordersGroup array - if not add, else append
		   			for(var j=0;j< ordersGroup.length;j++) {

		   				if(ordersGroup[j].date==ordersArray[i].acceptanceDateTime.iso.substring(0,10)) {
		   					foundIndex=j;
		   					break;
		   				}

		   			}

		   			if(foundIndex<0){					//insert a new object in the orderGroup array

		   				var obj={};

		   				obj.date=ordersArray[i].acceptanceDateTime.iso.substring(0,10);
		   				obj.orderTotal=0;
		   				obj.orderCount=0;
		   				obj.inPerson=[];
		   				obj.online=[];
		   				obj.refund=[];
		   				obj.salesByItem=[];

		   				for(var prop in appDefaults.paymentMode) {
		   					obj.inPerson.push({"paymentMode":appDefaults.paymentMode[prop],"count":0,"value":0});
		   					obj.online.push({"paymentMode":appDefaults.paymentMode[prop],"count":0,"value":0});
		   					obj.refund.push({"paymentMode":appDefaults.paymentMode[prop],"count":0,"value":0});

		   				}

		   				ordersGroup.push(obj);

		   				foundIndex=ordersGroup.length-1;
					}

					ordersGroup[foundIndex].orderTotal+=ordersArray[i].amount+ordersArray[i].taxAmount;
					ordersGroup[foundIndex].orderCount++;
		   			
		   			if(ordersArray[i].saleMode==appDefaults.saleMode.inPerson && ordersArray[i].state!=4) {
		   				
		   				var obj=ordersGroup[foundIndex];
		   				var indexToUpdate=-1;

		   				for(var j=0;j< obj.inPerson.length;j++) {

		   					if(obj.inPerson[j].paymentMode== appDefaults.paymentProvider[ordersArray[i].provider] ) {
		   						indexToUpdate=j;
		   						break;
		   					}
		   				}

		   				if(indexToUpdate>=0){
			   				obj.inPerson[indexToUpdate].count++;
			   				obj.inPerson[indexToUpdate].value+= ordersArray[i].amount+ordersArray[i].taxAmount;
		   				}

		   			}

		   			else if(ordersArray[i].saleMode==appDefaults.saleMode.online && ordersArray[i].state!=4) {
		   				
		   				var obj=ordersGroup[foundIndex];
		   				var indexToUpdate=-1;

		   				for(var j=0;j< obj.online.length;j++) {
		   					if(obj.online[j].paymentMode==appDefaults.paymentProvider[ordersArray[i].provider]) {
		   						indexToUpdate=j;
		   						break;
		   					}
		   				}

		   				if(indexToUpdate>=0) {
			   				obj.online[indexToUpdate].count++;
			   				obj.online[indexToUpdate].value+= ordersArray[i].amount+ordersArray[i].taxAmount;
		   				}

		   			}

		   			else {			//refunds

		   				var obj=ordersGroup[foundIndex];
		   				var indexToUpdate=-1;

		   				for(var j=0;j< obj.refund.length;j++) {
		   					if(obj.refund[j].paymentMode==appDefaults.paymentProvider[ordersArray[i].provider]) {
		   						indexToUpdate=j;
		   						break;
		   					}
		   				}

		   				if(indexToUpdate>=0) {
			   				obj.refund[indexToUpdate].count++;
			   				obj.refund[indexToUpdate].value+= ordersArray[i].amount+ordersArray[i].taxAmount;
		   				}
		   			}

		   			//add sales by item
		   			for(var j=0; j< ordersArray[i].orderItems.length;j++) {

		   				var indexToUpdate=-1;
		   				var objectId;
		   				var itemName;

		   				if(ordersArray[i].orderItems[j].menuItem) {
		   					objectId=ordersArray[i].orderItems[j].menuItem.objectId;
		   					itemName=ordersArray[i].orderItems[j].menuItem.name;
		   				}

		   				else {
		   					objectId="0";
		   					itemName=ordersArray[i].orderItems[j].description;
		   				}
		   				
		   				for(var k=0;k< ordersGroup[foundIndex].salesByItem.length;k++) {

		   					if(ordersGroup[foundIndex].salesByItem[k].objectId==objectId) {
		   						indexToUpdate=k;
		   						break;
		   					}

		   				}	

		   				if(indexToUpdate <0) {
		   					ordersGroup[foundIndex].salesByItem.push({"objectId":objectId,"name":itemName,"qty":ordersArray[i].orderItems[j].qty });
		   				}

		   				else {
		   					ordersGroup[foundIndex].salesByItem[indexToUpdate].qty+=ordersArray[i].orderItems[j].qty;
		   				}

		   			}

		   			ordersGroup[foundIndex].salesByItem=_.sortBy(ordersGroup[foundIndex].salesByItem, function(o) { return -o.qty; });
		   			
		   			

		   			foundIndex=-1;
		   		}

		   		response.success(ordersGroup);

		   }, function(error){
		   		response.error(error);
		   })

    	}

    	catch(e) {

    		response.error({
                "message": e.message,
                "code": e.code
            });
    	}

    }

    // var executeDemandReport = function(request, response){

    // },

    var executetxVolumeReport = function(request, response){
        var resultObject = {
            totalCount:0,
            cashCount:0,
            creditCount:0,
            voucherCount:0
        };

			// var requestParams = JSON.parse(request.body

			var requestParams = request.params;
    		var aSessionToken = request.user.get("sessionToken");

			var Order = Parse.Object.extend("Order");
			var orderQuery = new Parse.Query(Order);

			if (requestParams.startDateTime)
				orderQuery.greaterThanOrEqualTo("txDate", moment(requestParams.startDateTime).utc().toDate());
			
			if (requestParams.endDateTime)
				orderQuery.lessThanOrEqualTo("txDate", moment(requestParams.endDateTime).utc().toDate());
			
			if (requestParams.truck){
				orderQuery.equalTo('truck', requestParams.truck);
			};

			orderQuery.equalTo('vendor', requestParams.vendor);
			orderQuery.containedIn("state", [1, 2, 3]); //exclude 0 and 4 since the order was never accepted or 4 was refunded
			orderQuery.each(function(result){
				// console.log(result);
				resultObject.totalCount++;

				switch(result.get("provider")){
				    case 'BAMS':
				        resultObject.creditCount++;
				        break;
				    case 'CASH':
				        resultObject.cashCount++;
				        break;
				    case 'VOUCH':
				    		resultObject.voucherCount++;
				}
			}, {sessionToken: aSessionToken}).then(function(){
				response.success(resultObject);
			});

    }

    var executeDiscountUsageReport = function(request, response){
    	var resultObject = {
    		discounts:[]
    	};

		// // var requestParams = JSON.parse(request.body);
		var requestParams = request.params;
		var aSessionToken = request.user.get("sessionToken");
		
		var Order = Parse.Object.extend("Order");
		var orderQuery = new Parse.Query(Order);

		if (requestParams.startDateTime)
			orderQuery.greaterThanOrEqualTo("txDate", moment(requestParams.startDateTime).utc().toDate());
		
		if (requestParams.endDateTime)
			orderQuery.lessThanOrEqualTo("txDate", moment(requestParams.endDateTime).utc().toDate());
		
		if (requestParams.truck){
			orderQuery.equalTo('truck', requestParams.truck);
		};

		orderQuery.greaterThan("totalDiscountAmount", 0);

		orderQuery.equalTo('vendor', requestParams.vendor);
		orderQuery.containedIn("state", [1,2,3]); //exclude 0,4 and 5: 0 = Pending, 4 = Cancelled, 5 = Not yet Paid
		orderQuery.equalTo("paid", true);
		
		var matchingRecord;

		var _ = require('lodash');

		// console.log('calling EACH');
		return orderQuery.each(function(anOrder){

			var aPromise = new Parse.Promise();

			matchingRecord = null;

			console.log('result is ' + JSON.stringify(anOrder));

			_.each(anOrder.get("discounts"), function(aDiscount){
				var matchingRecord = _.find(resultObject.discounts, {objectId: aDiscount.discountID});
				if (!matchingRecord){
					resultObject.discounts.push({
						objectId:aDiscount.discountID,
						amount: anOrder.get("subTotalDiscountAmount"),
						quantity: 1
					})
				} else {
					matchingRecord.amount = matchingRecord.amount + anOrder.get("subTotalDiscountAmount");
					matchingRecord.quantity = matchingRecord.quantity + 1; 
				};

			});

			//now if the total Discount != subTotalDiscount it means that there are further
			//discounts applied at the order Item level. We should retrieve those and process accordingly
			if ( anOrder.get("totalDiscountAmount") > anOrder.get("subTotalDiscountAmount") ){
				//fetch order items
				var OrderItem = Parse.Object.extend("OrderItem");
				var orderItemQuery = new Parse.Query(OrderItem);
				orderItemQuery.equalTo("order", anOrder);
				orderItemQuery.greaterThan("discountAmount", 0);
				orderItemQuery.each(function(anOrderItem){
					_.each(anOrderItem.get("discounts"), function(aDiscount){
						var matchingRecord = _.find(resultObject.discounts, {objectId: aDiscount.discountID});
						if (!matchingRecord){
							resultObject.discounts.push({
								objectId:aDiscount.discountID,
								amount: anOrderItem.get("discountAmount"),
								quantity: anOrderItem.get("qty")
							})
						} else {
							matchingRecord.amount = matchingRecord.amount + anOrderItem.get("discountAmount");
							matchingRecord.quantity = matchingRecord.quantity + anOrderItem.get("qty"); 
						};
					});
				}).then(function(){
					aPromise.resolve();
				});

			} else {
				aPromise.resolve();
			};

			return aPromise;

		}, {sessionToken: aSessionToken}).then(function(){
			//now load all the discounts for this vendor and get the description
			var discountQuery = new Parse.Query('Discounts');
			discountQuery.equalTo("vendor", requestParams.vendor);
			return discountQuery.find({sessionToken:aSessionToken});
		}).then(function(discountList){
			//now sort the results from highest to lowest
			if (resultObject.discounts.length > 1){
				resultObject.discounts.sort(function(a,b){
					//since we are looping through all the records anyway, 
					//may as well populate the descrpiton of the discount
					if (!a.description){
						var aDiscountMasterRecord = _.find(discountList, {id:a.objectId});
						if (aDiscountMasterRecord){
							a.description = aDiscountMasterRecord.get("name");
						};
					};

					if (!b.description){
						var aDiscountMasterRecord = _.find(discountList, {id:b.objectId});
						if (aDiscountMasterRecord){
							b.description = aDiscountMasterRecord.get("name");
						};
					};

					//actually do the Sort
					return (b[requestParams.sortBy] - a[requestParams.sortBy]);
				});
			} else {
				if (resultObject.discounts.length == 1){
					
					var aDiscountMasterRecord = _.find(discountList, {id:resultObject.discounts[0].objectId});
					if (aDiscountMasterRecord){
						resultObject.discounts[0].description = aDiscountMasterRecord.get("name");
					};
				};
			};

			response.success(resultObject);

		}, function(errorObject){
			response.error(errorObject);
		});	
    }

    var executeTopModifiersReport = function(request, response){
    	var resultObject = {
    		modifiers:[]
    	};

		// // var requestParams = JSON.parse(request.body);
		var requestParams = request.params;
		var aSessionToken = request.user.get("sessionToken");
		
		var OrderItem = Parse.Object.extend("OrderItem");
		var orderItemQuery = new Parse.Query(OrderItem);

		var Order = Parse.Object.extend("Order");
		var orderQuery = new Parse.Query(Order);

		if (requestParams.startDateTime)
			orderQuery.greaterThanOrEqualTo("txDate", moment(requestParams.startDateTime).utc().toDate());
		
		if (requestParams.endDateTime)
			orderQuery.lessThanOrEqualTo("txDate", moment(requestParams.endDateTime).utc().toDate());
		
		if (requestParams.truck){
			orderQuery.equalTo('truck', requestParams.truck);
		};

		orderQuery.equalTo('vendor', requestParams.vendor);
		orderQuery.containedIn("state", [1,2,3]); //exclude 0,4 and 5 since the order was never accepted

		//now setup the order item query
		orderItemQuery.matchesQuery("order", orderQuery);
		orderItemQuery.exists("options"); //pick up orders that have modifiers/options specified

		var matchingRecord;
		var totalRevenue = 0.00;
		var newPriceRecord = false;
		var newItemRecord = false;

		var _ = require('lodash');

		// console.log('calling EACH');
		orderItemQuery.each(function(anOrderItem){
			matchingRecord = null;

			console.log('result is ' + JSON.stringify(anOrderItem));

			//loop through the modifiers in the order item and 
			_.each(anOrderItem.get("options"), function(anOption){
				//1. See if we have a result record for this modifiers all ready
				// var modifierId = String(anOption.id).split('-')[0];
				var matchingRecord = _.find(resultObject.modifiers, {modifierId: anOption.id});
				var isNewRecord = false;

				if (!matchingRecord){
					matchingRecord = {
						modifierId:anOption.id,
						amount: anOption.cost ? anOption.cost:0,
						quantity: anOrderItem.get("qty"),
						description: anOption.modifierText
					};
					isNewRecord = true;
				} else {
					//append data to existing record
					if (!anOption.cost)
						anOption.cost = 0;

					matchingRecord.amount = matchingRecord.amount + anOption.cost;
					matchingRecord.quantity = matchingRecord.quantity + anOrderItem.get("qty");
				};

				if (isNewRecord === true)
					resultObject.modifiers.push(matchingRecord);
			});

		}, {sessionToken: aSessionToken}).then(function(){
			//now sort the results from highest to lowest
			resultObject.modifiers.sort(function(a,b){
				return (b[requestParams.sortBy] - a[requestParams.sortBy]);
			});

			response.success(resultObject);
		}, function(errorObject){
			response.error(errorObject);
		});	
    }

    var executeTop5Report=function(request, response){
    	var resultObject = {
    		items:[]
    	};

		// // var requestParams = JSON.parse(request.body);
		var requestParams = request.params;
		var aSessionToken = request.user.get("sessionToken");
		
		console.log('Top 5 request params are ' + JSON.stringify(requestParams));

		var OrderItem = Parse.Object.extend("OrderItem");
		var orderItemQuery = new Parse.Query(OrderItem);

		var Order = Parse.Object.extend("Order");
		var orderQuery = new Parse.Query(Order);

		if (requestParams.startDateTime)
			orderQuery.greaterThanOrEqualTo("txDate", moment(requestParams.startDateTime).utc().toDate());
		
		if (requestParams.endDateTime)
			orderQuery.lessThanOrEqualTo("txDate", moment(requestParams.endDateTime).utc().toDate());
		
		if (requestParams.truck){
			orderQuery.equalTo('truck', requestParams.truck);
		};

		orderQuery.equalTo('vendor', requestParams.vendor);
		orderQuery.greaterThan("state", 0); //exclude 0 since the order was never accepted

		//now setup the order item query
		orderItemQuery.matchesQuery("order", orderQuery);

		var matchingRecord;
		var totalRevenue = 0.00;
		var newPriceRecord = false;
		var newItemRecord = false;

		var _ = require('lodash');

		// console.log('calling EACH');
		orderItemQuery.each(function(result){
			matchingRecord = null;
			newPriceRecord = false;
			newItemRecord = false;
			console.log('result is ' + JSON.stringify(result));

			// console.log('is off menu item: ' + result.get("offMenuItem"));

			//see if we have a record for this items all ready
			if (!result.get("offMenuItem")){
				console.log('Not off menu item');

				matchingRecord = _.find(resultObject.items, {objectId:result.get("menuItem").id});

				console.log('lodash command over');
				if (!matchingRecord){
					console.log('menu item object id is ' + result.get("menuItem").id);
					matchingRecord = {
						offMenuItem:false, 
						quantity:0, 
						amount:0.00, 
						prices:[],
						objectId:result.get("menuItem").id
					};
					newItemRecord = true;
				};
			} else {
				console.log('off menu item found!');
				//off menu Item
				matchingRecord = _.find(resultObject.items, {offMenuItem:true});
				if (!matchingRecord){
					matchingRecord = {offMenuItem:true, quantity:0, amount:0.00, prices:[]};
					newItemRecord = true;	
				}
			};

			console.log('matching record description is ' + result.get("description"));
			matchingRecord.description = result.get("description");
			matchingRecord.quantity = parseInt(matchingRecord.quantity) + result.get("qty");
			matchingRecord.amount = parseFloat(matchingRecord.amount) + (parseFloat(result.get("price")) * parseInt(result.get("qty")));
			
			//add this to the total revenue
			totalRevenue = parseFloat(totalRevenue) + (parseFloat(result.get("price")) * parseInt(result.get("qty")));
			// console.log('total revenue is ' + totalRevenue);

			if (result.get("priceText") != null && result.get("priceText") != ""){
				var priceRecord = _.find(matchingRecord.prices, {text:result.get("priceText")});
				if (!priceRecord){
					newPriceRecord = true;
					priceRecord = {qty:0, amount:0.00};
				};

				priceRecord.text = result.get("priceText");
				priceRecord.quantity = parseInt(priceRecord.quantity) + result.get("qty");
				priceRecord.amount = parseFloat(priceRecord.amount) + (parseFloat(result.get("price")) * parseInt(result.get("qty")));

				if (newPriceRecord)
					matchingRecord.prices.push(priceRecord);
			};

			if (newItemRecord)
				resultObject.items.push(matchingRecord);

		}, {sessionToken: aSessionToken}).then(function(){
			_.each(resultObject.items, function(anItem){
				//calculate the % of the total revenue
				anItem.percentOfTotal = (anItem.amount / totalRevenue);
				//sort the price array by the same criteria
				// console.log('sort by is ' + requestParams.sortBy);
				// anItem.prices.sort(function(a, b){
				// 	return (b[requestParams.sortBy] - a[requestParams.sortBy]);	
				// });
			});

			//now sort the results from highest to lowest
			resultObject.items.sort(function(a,b){
				return (b[requestParams.sortBy] - a[requestParams.sortBy]);
			});
			

			response.success(resultObject);
		}, function(errorObject){
			response.error(errorObject);
		});
    }

    var emailDailySalesReport=function(job, data){
	    	// Get all vendors
			var self=this;
			var masterList = [];
			var averageFigures = {};
			var aStartMoment;
			var aEndMoment;
			var Moment = require("moment-timezone");			//include moment with timezone information
			var accounting = require('./accounting.js');

			var queryVendor = new Parse.Query("Vendor");

     		queryVendor.exists("timeZone");			//vendor must have timezone set
     		queryVendor.equalTo("suspended", false);

     		return queryVendor.each(function(aVendor){

	     		console.log('Processing vendor : ' + aVendor.get("description"));
				//Get start/end moments in target timezone
				aStartMoment = new Moment().subtract('1', 'days');


				aStartMoment.tz(aVendor.get("timeZone"));

				//set to midnight
				aStartMoment.startOf('day');

				//aEndMoment is set to NOW
				aEndMoment = aStartMoment.clone();
				aEndMoment.endOf('day'); //set to 23:59:59

				return _executeSalesReport({
					startDateTime : aStartMoment.toISOString(),
					endDateTime: aEndMoment.toISOString(),
					vendor: aVendor
				}).then(function(salesFigures){
					console.log('Gross Sales for ' + aVendor.get("description") + ' are ' + salesFigures.grossSales);
					if (salesFigures.grossSales > 0){
						// console.log('sales figures for ' + aVendor.id + ' are ' + JSON.stringify(salesFigures));
						// averageFigures.grossSales = averageFigures.grossSales + salesFigures.grossSales;
						// averageFigures.refunds = averageFigures.refunds + salesFigures.refundTotal;
						// averageFigures.netSales = averageFigures.netSales + salesFigures.netSales;
						masterList.push({vendor:aVendor, salesFigures:salesFigures});
					}
			});
     	}, {useMasterKey:true}).then(function(){
     		// //calculate the average Gross across all the vendors
     		// averageFigures.averageGrossSales = accounting.formatMoney(averageFigures.grossSales / masterList.length);
     		// averageFigures.averageRefunds = accounting.formatMoney(averageFigures.refunds / masterList.length);
     		// averageFigures.averageNetSales = accounting.formatMoney(averageFigures.netSales / masterList.length);

     		//load the config
     		return Parse.Config.get();	
     	}).then(function(aConfig){
			var mandrillAPIKey = aConfig.get("MandrillAPIKey");
			// var Mandrill = require('mandrill');
			// Mandrill.initialize(mandrillAPIKey);
			
			var mandrill = require('mandrill-api/mandrill');
			var mandrill_client = new mandrill.Mandrill(mandrillAPIKey);

			var promise = Parse.Promise.as();
			_.each(masterList, function(vendorSalesFigures){
				promise = promise.then(function() {

					console.log('sending email for vendor ' + vendorSalesFigures.vendor.id);
					var aUser = null;
					//get the user  to email
					var User = Parse.Object.extend("User");
					var userQuery = new Parse.Query(User);
					userQuery.equalTo("vendor", vendorSalesFigures.vendor);
					
					// console.log('getting user...');

					return userQuery.find({useMasterKey:true})
	    			.then(function(resultUsers){
	    				// console.log(resultUser);
	    				// 
							var mailParams = {
								async:true, 
								template_name: aConfig.get("dailySalesTemplate"),
								template_content:{},
								message: {
									merge_language: 'handlebars',
									from_email:"info@getyomojo.com",
									from_name: vendorSalesFigures.vendor.get("description"),
					  				to: [],
								  	global_merge_vars: [
								  		{
								  			name:"VENDORNAME",
								  			content:vendorSalesFigures.vendor.get("description")
								  		},
								  		{
								  			name:"TARGETDATE",
								  			content: aStartMoment.format("dddd, MMMM Do YYYY")
								  		}		  		
								  	]
								}
						};
	
						//add all the user for this vendor as recipients to this
						_.each(resultUsers, function(aResultUser){
							console.log('sending email to ' + aResultUser.getEmail());
							mailParams.message.to.push({type:'to', email:aResultUser.getEmail()});
						});

						// console.log('iterating properties' + JSON.stringify(mailParams));
						//write all the figures to the template
						for (var fieldName in vendorSalesFigures.salesFigures) {
						   // console.log(' name=' + fieldName + ' value=' + vendorSalesFigures.salesFigures[fieldName]);
						   switch (fieldName.toUpperCase()){
						   	case 'MOBILEORDERCOUNT':
						   	case 'WALKUPORDERCOUNT':
								   mailParams.message.global_merge_vars.push({
								   		name : String(fieldName).toUpperCase(),
								   		content: String(vendorSalesFigures.salesFigures[fieldName])
								   });						   		
						   		break;
						   	default:
							   mailParams.message.global_merge_vars.push({
							   		name : String(fieldName).toUpperCase(),
							   		content: accounting.formatMoney(vendorSalesFigures.salesFigures[fieldName])
							   });
							   break;					   		
						   };


						};
						
						// // console.log('Gross Sales across all vendors are' + averageFigures.grossSales);
						// if (averageFigures.grossSales > 0){
						//    mailParams.message.global_merge_vars.push({
						//    		name : 'AVERAGEFIGURES',
						//    		content: averageFigures
						//    });
						//    mailParams.message.global_merge_vars.push({
						//    		name : 'SHOWCOMPARISON',
						//    		content: true
						//    });						   
						// } else {
						//    mailParams.message.global_merge_vars.push({
						//    		name : 'SHOWCOMPARISON',
						//    		content: false
						//    });	
						// };

						// console.log('calling mandrill with return ' + JSON.stringify(mailParams.message.global_merge_vars));
					  	return mandrill_client.messages.sendTemplate( mailParams,
					  		function(httpResponse){
					  			//return a response to the user
					  			console.log('Mandril response is ...' + JSON.stringify(httpResponse[0]));
					  			return Parse.Promise.as();
					  		},
					  		function(httpResponse){
					  			console.log('Error sending Mandril Email...' + JSON.stringify(httpResponse));
					  			//we are going to return a success message anyway, as the user can always
					  			//request a re-send
					  			return Parse.Promise.error(httpResponse);
					  		}
					  	);
	    			});
				});

		  	});

			return promise;

     	}).then(function(){
     		console.log(masterList.length + ' email(s) were sent.');
     		return Parse.Promise.as();
     	}, function(error){
     		console.log('Error sending daily sales report' + JSON.stringify(error));
     		// status.error('Error. See log');
     		return Parse.Promise.error(error);
     	});
    	
    }

    var _executeSalesBreakdownReport = function(requestParams, user){
    	var resultObject = {
    		timePoints:[]
    	};
    	var Moment = require('moment');
    	var noData = true;
    	//create a time point for every half hour of the day
    	//and append it to the resultObject

    	var startMoment = new Moment(requestParams.targetDate).startOf('day'); 
    	var endMoment = new Moment(startMoment).endOf('day'); 

    	var currentMoment = startMoment.clone();

    	do {

    		var aTimePoint = {};
    		aTimePoint.startMoment = currentMoment.clone();
    		aTimePoint.endMoment = currentMoment.clone().add(29, 'minutes').add(59, 'seconds');

    		aTimePoint.startTime = currentMoment.format();
    		aTimePoint.endTime = aTimePoint.endMoment.format();
    		aTimePoint.runningTotal = 0;
    		aTimePoint.timePointTotal = 0;
    		aTimePoint.totalTickets = 0;
    		aTimePoint.walkUpTickets = 0;
    		aTimePoint.mobileTickets = 0;

    		resultObject.timePoints.push(aTimePoint);

    		//update the currentMoment to point to the next half hour
    		currentMoment = aTimePoint.endMoment.clone().add(1, 'seconds');

    	} while ( currentMoment.isBetween(startMoment, endMoment, null, '[]') );

		var Order = Parse.Object.extend("Order");
		var query = new Parse.Query(Order);
		query.equalTo('truck', requestParams.truck);
		query.containedIn("state", [1,2,3]); //exclude 0 since the order was never accepted
		query.equalTo("paid", true);
		query.greaterThanOrEqualTo('txDate', startMoment.toDate());
		query.lessThanOrEqualTo('txDate', endMoment.toDate());

		query.select(['grandTotal', 'saleMode', 'txDate']);

		return query.each(function(anOrder){

			var txMoment = new moment( anOrder.get("txDate") );

			//1. Find the appropriate time point for this order and update according
			var targetTimePoint = _.find(resultObject.timePoints, function(aTimePoint){
				
				if (txMoment.isBetween(aTimePoint.startMoment, aTimePoint.endMoment, null, '[]'))
					return true
				else 
					return false;
			
			}, { sessionToken:user.getSessionToken() });

			//2. now that we have our target time point, lets update it
    		// targetTimePoint.runningTotal += anOrder.get('grandTotal');
    		targetTimePoint.timePointTotal += anOrder.get('grandTotal');
    		targetTimePoint.totalTickets++;

    		if ( anOrder.get("saleMode") == const_saleMode_walkup )
    			targetTimePoint.walkUpTickets++;
    		else 
    			targetTimePoint.mobileTickets++;
		
		}).then(function(){
			// Now loop through all the time points and 
			// update the running total for each timePoint
			var runningTotal = 0;

			_.each(resultObject.timePoints, function(aTimePoint){
				//remove these moment objects otherwise Parse will try to 
				//convert them to JSON which causes some runtime errors
				delete aTimePoint.startMoment;
				delete aTimePoint.endMoment;

				runningTotal += aTimePoint.timePointTotal;
				aTimePoint.runningTotal = runningTotal;
			});
			
			if (runningTotal > 0)
				resultObject.noData = false;
			else
				resultObject.noData = true;

			return Parse.Promise.as(resultObject);
		}, function(error){
			return Parse.Promise.reject(error);

		});
    };

    var executeSalesBreakdownReport=function(request, response){

    	var requestParams = request.params;
		
    	_executeSalesBreakdownReport(requestParams, request.user)
    	.then(function(result){
    		response.success(result);
    	}, function(errorResponse){
    		response.error(errorResponse);
    	});
    }

    var _executeSalesReport = function(requestParams, user){
    	// console.log('In here!' + JSON.stringify(requestParams));
    	var resultObject = {
                grossSales: 0.00,
                refundTotal:0.00,
                salesDiscountTotal:0.00,
                netSales:0.00, //netTakings = grossTakings - refundTotal;
                prodOrderCount:0,
                averageOrder:0,

                grossDelivery:0.00,
                refundDelivery:0.00,
                discountDelivery:0.00,
                netDelivery:0.00, //netDelivery = grossDelivery - deliveryRefund
                deliveryCount:0,
                averageDelivery:0,
                
                grossTax:0.00,
                refundedTax:0.00,
                netTax:0.00, //netTax = grossTax - refundedTax
                taxOrderCount:0,
                averageTax:0,
                
                grossTips:0.00,
                refundedTips:0.00,
                netTips:0.00, //netTips = grossTips - refundedTips
                tipOrderCount:0,
                averageTip:0,
                
                grossGrandTotal:0.00,
                grandTotalRefunds:0.00,
                netGrandTotal:0.00, //netGrandTotal = grossGrandTotal - totalRefunds - grandTotalDiscount

                cashGross:0.00,
                cashRefund:0.00,
                cashNet:0.00,
                cashOrderCount:0,
                cashDiscount:0,
                averageCash:0,

                creditGross:0.00,
                creditRefund:0.00,
                creditNet:0.00,
                creditOrderCount:0,
                creditDiscount:0,
                averageCredit:0,

                voucherGross:0.00,
                voucherRefund:0.00,
                voucherNet:0.00,
                voucherOrderCount:0,
                voucherDiscount:0,
                averageVoucher:0,

                walkupGross:0,
                walkupRefund:0,
                walkupNetReceipts:0,
                walkupOrderCount:0,
                walkupDiscount:0,
                averageWalkup:0,

                mobileGross:0,
                mobileRefund:0,
                mobileNet:0,
                mobileOrderCount:0,
                mobileDiscount:0,
                averageMobile:0,

                terminals:[]
        };

        var aSessionToken;
        var useMasterKey = false;

        if (!user)
        	useMasterKey = true;
        else 
        	aSessionToken = user.getSessionToken();

		function doCurrencyRound(aNumber){
			var decimals = 2;

			var t=Math.pow(10, decimals);   
			
			return parseFloat((Math.round((aNumber * t) + (decimals>0?1:0)*(Math.sign(aNumber) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals));

		};

        //this is used in calculating average mobile/walk up ticket amount
		var walkUpNetTaxes = 0; 
		var mobileNetTaxes = 0;
		var Order = Parse.Object.extend("Order");
		var query = new Parse.Query(Order);
		// console.log(requestParams.startDateTime);
		// console.log(requestParams.endDateTime);

		if (requestParams.startDateTime)
			query.greaterThanOrEqualTo("txDate", moment(requestParams.startDateTime).utc().toDate());
		if (requestParams.endDateTime)
			query.lessThanOrEqualTo("txDate", moment(requestParams.endDateTime).utc().toDate());
		
		if (requestParams.truck){
			// console.log('truck is ' + JSON.stringify(requestParams.truck));
			query.equalTo('truck', requestParams.truck);
		}
		query.equalTo('vendor', requestParams.vendor);
		query.containedIn("state", [1,2,3,4]); //exclude 0 since the order was never accepted
		query.equalTo("paid", true);  

		var newTerminalRecord;
		var terminalRecord = null;
		// console.log('calling each...');
		query.select(["amount", "taxAmount", "tipAmount", "deliveryRequested", "deliveryDetail", "totalDiscountAmount", "deliveryDiscountAmount", "saleMode", "terminalId", "state", "provider"]);
		return query.each(function(result){
			// console.log('looping...' + JSON. stringify(result));
			newTerminalRecord = false;
			terminalRecord = null;

			resultObject.prodOrderCount++;
			resultObject.taxOrderCount++;
			resultObject.tipOrderCount++;

			// var rawAmount = result.get("amount") + result.get("taxAmount") + result.get("tipAmount");
			// var totalAmount = parseFloat(rawAmount);
			var grossSale = parseFloat(result.get("amount"));
			
			if (result.get("taxAmount"))
				var taxAmount = parseFloat(result.get("taxAmount"));
			else
				var taxAmount = 0.00;

			if (result.get("tipAmount"))
				var tipAmount = parseFloat(result.get("tipAmount"));
			else
				var tipAmount = 0.00;

			if (result.get("amount"))
				var grossSale = parseFloat(result.get("amount"));
			else
				var grossSale = 0.00;

			if (result.get("deliveryRequested") == true){
				resultObject.deliveryCount++;

				var deliveryObject = result.get("deliveryDetail");
				
				if (deliveryObject.deliveryTax)
					var deliveryTax = parseFloat(deliveryObject.deliveryTax);
				else 
					var deliveryTax = 0.00;

				if (deliveryObject.deliveryAmount)
					var deliveryAmount = parseFloat(deliveryObject.deliveryAmount);
				else 
					var deliveryAmount  = 0.00;
			} else {
				var deliveryTax = 0.00;
				var deliveryAmount  = 0.00;
			};

			if (result.get("totalDiscountAmount"))
				var totalDiscountAmount = parseFloat(result.get("totalDiscountAmount"));
			else 
				var  totalDiscountAmount = 0;

			if (result.get("deliveryDiscountAmount"))
				var discountDelivery = parseFloat(result.get("deliveryDiscountAmount"));
			else 
				var  discountDelivery = 0;
		
			if (discountDelivery == undefined)
				discountDelivery = 0;

			var totalAmount = (taxAmount + tipAmount + grossSale) - totalDiscountAmount;
			
			switch (result.get("saleMode")){
				case const_saleMode_walkup:
					resultObject.walkupGross = resultObject.walkupGross + grossSale + taxAmount + deliveryAmount + deliveryTax + tipAmount;
					resultObject.walkupOrderCount++;
					break;
				case const_saleMode_mobile:
					resultObject.mobileGross = resultObject.mobileGross + grossSale + taxAmount + deliveryAmount + deliveryTax + tipAmount;
					resultObject.mobileOrderCount++;
					break;
			};
			
			var terminalId = result.get("terminalId");
			if (terminalId && requestParams.truck){
				terminalRecord = _.find(resultObject.terminals, {id:terminalId});
				if (!terminalRecord){
					newTerminalRecord = true;
					// console.log('creating new terminal record id ' + terminalId);
					terminalRecord = {	id:terminalId, 
										cashGross:0, creditGross:0, voucherGross:0,
										cashRefund:0, creditRefund:0, voucherRefund:0, 
										netCash:0, netCredit:0, netVoucher:0, creditDiscount:0,
										voucherDiscount:0, cashDiscount:0
									};
				};
			};

			resultObject.grossSales = doCurrencyRound(parseFloat(resultObject.grossSales) + grossSale);
			resultObject.grossTax = doCurrencyRound(parseFloat(resultObject.grossTax) + taxAmount + deliveryTax);
			resultObject.grossTips = doCurrencyRound(parseFloat(resultObject.grossTips) + tipAmount);
			resultObject.grossDelivery = doCurrencyRound(parseFloat(resultObject.grossDelivery) + deliveryAmount);
			
			console.log('Provider is ' + result.get("provider"));


			if (result.get("state") == "4"){ // 4= refunded/cancelled
				resultObject.netSales = doCurrencyRound(parseFloat(resultObject.netSales) - ( parseFloat(grossSale) - totalDiscountAmount ));
				resultObject.netTax =  doCurrencyRound(parseFloat(resultObject.netTax) - taxAmount - deliveryTax);
				resultObject.netTips =  doCurrencyRound(parseFloat(resultObject.netTips) - tipAmount);
				
				resultObject.salesDiscountTotal = doCurrencyRound(parseFloat(resultObject.salesDiscountTotal) + totalDiscountAmount);

				resultObject.refundTotal = doCurrencyRound(parseFloat(resultObject.refundTotal) + parseFloat(grossSale) - totalDiscountAmount);
				resultObject.refundedTax = doCurrencyRound(parseFloat(resultObject.refundedTax) + taxAmount + deliveryTax);
				resultObject.refundedTips = doCurrencyRound(parseFloat(resultObject.refundedTips) + tipAmount);
				resultObject.refundDelivery = doCurrencyRound(parseFloat(resultObject.refundDelivery) + deliveryAmount - discountDelivery);

				//since this order was refundede any discounts dont count
				// resultObject.discountDelivery = parseFloat(resultObject.discountDelivery) - discountDelivery;  

				switch (result.get("saleMode")){
					case const_saleMode_walkup:
						resultObject.walkupRefund = resultObject.walkupRefund + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount) - totalDiscountAmount;
						resultObject.walkupDiscount = resultObject.walkupDiscount + totalDiscountAmount;
						//walkUpNetTaxes = walkUpNetTaxes + taxAmount + deliveryTax;
						break;
					case const_saleMode_mobile:
						resultObject.mobileRefund = resultObject.mobileRefund + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount) - totalDiscountAmount;
						resultObject.mobileDiscount = resultObject.mobileDiscount + totalDiscountAmount;
						//mobileNetTaxes = mobileNetTaxes + taxAmount + deliveryTax;
						break;
				};

				if (result.get("provider") == "CASH"){
					resultObject.cashOrderCount++;
					//cash transaction
					// console.log('cash refund is ' + totalAmount);
					resultObject.cashRefund = doCurrencyRound(parseFloat(resultObject.cashRefund) + (taxAmount + tipAmount + grossSale + deliveryTax + deliveryAmount) - totalDiscountAmount);
					resultObject.cashGross = doCurrencyRound(parseFloat(resultObject.cashGross) + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount));
					resultObject.cashDiscount = doCurrencyRound(parseFloat(resultObject.cashDiscount) + totalDiscountAmount);
					//check if there is a terminal Id
					if (terminalRecord){
						terminalRecord.cashRefund = doCurrencyRound(parseFloat(terminalRecord.cashRefund) + (taxAmount + tipAmount + grossSale + deliveryTax + deliveryAmount) - totalDiscountAmount);
						terminalRecord.cashGross = doCurrencyRound(parseFloat(terminalRecord.cashGross) + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount));
						terminalRecord.cashDiscount = doCurrencyRound(parseFloat(terminalRecord.cashDiscount) + totalDiscountAmount);
					};
				};

				//Credit transaction
				if ( (result.get("provider") == "HLAND") || (result.get("provider") == "BAMS") || (result.get("provider") == "STRIPE")){
					resultObject.creditOrderCount++;
					// console.log('card refund is ' + totalAmount);
					resultObject.creditRefund = doCurrencyRound(parseFloat(resultObject.creditRefund) + (taxAmount + tipAmount + grossSale + deliveryTax + deliveryAmount) - totalDiscountAmount);
					resultObject.creditGross = doCurrencyRound(parseFloat(resultObject.creditGross) + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount));
					resultObject.creditDiscount = doCurrencyRound(parseFloat(resultObject.creditDiscount) + totalDiscountAmount);
					if (terminalRecord){
						terminalRecord.creditRefund = doCurrencyRound(parseFloat(terminalRecord.creditRefund) + (grossSale + taxAmount + tipAmount + deliveryAmount + deliveryTax) - totalDiscountAmount);
						terminalRecord.creditGross = doCurrencyRound(parseFloat(terminalRecord.creditGross)  + (grossSale + taxAmount + tipAmount + deliveryAmount  + deliveryTax ));
						terminalRecord.creditDiscount = doCurrencyRound(parseFloat(terminalRecord.creditDiscount) + totalDiscountAmount);
					};
				};

				if (result.get("provider") == "VOUCH"){
					resultObject.voucherOrderCount++;
					//credit transaction
					// console.log('card refund is ' + totalAmount);
					resultObject.voucherRefund = doCurrencyRound(parseFloat(resultObject.voucherRefund) + (taxAmount + tipAmount + grossSale + deliveryTax + deliveryAmount) - totalDiscountAmount);
					resultObject.voucherGross = doCurrencyRound(parseFloat(resultObject.voucherGross) + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount));
					resultObject.voucherDiscount = doCurrencyRound(parseFloat(resultObject.voucherDiscount) + totalDiscountAmount);
					if (terminalRecord){
						terminalRecord.voucherRefund = doCurrencyRound(parseFloat(terminalRecord.voucherRefund) + (grossSale + taxAmount + tipAmount + deliveryAmount + deliveryTax) - totalDiscountAmount);
						terminalRecord.voucherGross = doCurrencyRound(parseFloat(terminalRecord.voucherGross) + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount));
						terminalRecord.voucherDiscount = doCurrencyRound(parseFloat(terminalRecord.voucherDiscount) + totalDiscountAmount);
					};
				};
			} else {

				switch (result.get("saleMode")){
					case const_saleMode_walkup:
						walkUpNetTaxes = walkUpNetTaxes + taxAmount + deliveryTax;
						resultObject.walkupDiscount = resultObject.walkupDiscount + totalDiscountAmount;
						break;
					case const_saleMode_mobile:
						mobileNetTaxes = mobileNetTaxes + taxAmount + deliveryTax;
						resultObject.mobileDiscount = resultObject.mobileDiscount + totalDiscountAmount;
						break;
				};

				resultObject.salesDiscountTotal = doCurrencyRound(parseFloat(resultObject.salesDiscountTotal) + totalDiscountAmount);
				resultObject.discountDelivery = doCurrencyRound(parseFloat(resultObject.discountDelivery) + discountDelivery);

				if (result.get("provider") == "CASH"){
					resultObject.cashOrderCount++;
					//cash transaction
					resultObject.cashGross = doCurrencyRound(parseFloat(resultObject.cashGross) + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount));
					resultObject.cashDiscount = doCurrencyRound(parseFloat(resultObject.cashDiscount) + totalDiscountAmount);
					if (terminalRecord){
						terminalRecord.cashGross = doCurrencyRound(parseFloat(terminalRecord.cashGross) + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount));
						terminalRecord.cashDiscount = doCurrencyRound(parseFloat(terminalRecord.cashDiscount) + totalDiscountAmount); 
					}
				}; 

				if ((result.get("provider") == "HLAND") || (result.get("provider") == "BAMS") || (result.get("provider") == "STRIPE")){
					resultObject.creditOrderCount++;
					// console.log('card refund is ' + totalAmount);
					//credit transaction
					resultObject.creditGross = doCurrencyRound(parseFloat(resultObject.creditGross) + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount));
					resultObject.creditDiscount = doCurrencyRound(parseFloat(resultObject.creditDiscount) + totalDiscountAmount);
					if (terminalRecord){
						terminalRecord.creditGross = doCurrencyRound(parseFloat(terminalRecord.creditGross) + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount));
						terminalRecord.creditDiscount = doCurrencyRound(parseFloat(terminalRecord.creditDiscount) + totalDiscountAmount);
					}
				};

				if (result.get("provider") == "VOUCH"){
					resultObject.voucherOrderCount++;
					// console.log('card refund is ' + totalAmount);
					//credit transaction
					resultObject.voucherGross = doCurrencyRound(parseFloat(resultObject.voucherGross) + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount));
					resultObject.voucherDiscount = doCurrencyRound(parseFloat(resultObject.voucherDiscount) + totalDiscountAmount);
					if (terminalRecord){
						terminalRecord.voucherGross = doCurrencyRound(parseFloat(terminalRecord.voucherGross) + (grossSale + deliveryAmount + taxAmount + deliveryTax + tipAmount));
						terminalRecord.voucherDiscount = doCurrencyRound(parseFloat(terminalRecord.voucherDiscount) + totalDiscountAmount);
					}
				};
			};
			
			if (newTerminalRecord)
				resultObject.terminals.push(terminalRecord);

		}, {sessionToken: aSessionToken, useMasterKey:useMasterKey}).then(function(){

			resultObject.grossGrandTotal = doCurrencyRound( parseFloat(resultObject.grossTax) 
				+ parseFloat(resultObject.grossTips) + parseFloat(resultObject.grossSales) + parseFloat(resultObject.grossDelivery) );

			resultObject.grandTotalRefunds = doCurrencyRound(parseFloat(resultObject.refundedTax) 
				+ parseFloat(resultObject.refundedTips) + parseFloat(resultObject.refundTotal) + parseFloat(resultObject.refundDelivery) );
			
			resultObject.grandTotalDiscount = doCurrencyRound(parseFloat(resultObject.salesDiscountTotal) + parseFloat(resultObject.discountDelivery));

			resultObject.netGrandTotal = doCurrencyRound(parseFloat(resultObject.grossGrandTotal) - parseFloat(resultObject.grandTotalRefunds) - parseFloat(resultObject.grandTotalDiscount) );

			resultObject.netSales = doCurrencyRound(parseFloat(resultObject.grossSales) - parseFloat(resultObject.refundTotal) - parseFloat(resultObject.salesDiscountTotal) );
			resultObject.netDelivery = doCurrencyRound(parseFloat(resultObject.grossDelivery) - parseFloat(resultObject.refundDelivery) - parseFloat(resultObject.discountDelivery));
			resultObject.netTax =  doCurrencyRound(parseFloat(resultObject.grossTax) - parseFloat(resultObject.refundedTax));
			resultObject.netTips =  doCurrencyRound(parseFloat(resultObject.grossTips) - parseFloat(resultObject.refundedTips));

			resultObject.cashNet =  doCurrencyRound(parseFloat(resultObject.cashGross) - parseFloat(resultObject.cashRefund) - parseFloat(resultObject.cashDiscount));
			resultObject.creditNet =  doCurrencyRound(parseFloat(resultObject.creditGross) - parseFloat(resultObject.creditRefund) - parseFloat(resultObject.creditDiscount));
			resultObject.voucherNet =  doCurrencyRound(parseFloat(resultObject.voucherGross) - parseFloat(resultObject.voucherRefund) - parseFloat(resultObject.voucherDiscount));
			resultObject.walkupNetReceipts =  doCurrencyRound(parseFloat(resultObject.walkupGross) - parseFloat(resultObject.walkupRefund) - parseFloat(resultObject.walkupDiscount));
			resultObject.mobileNet =  doCurrencyRound(parseFloat(resultObject.mobileGross) - parseFloat(resultObject.mobileRefund) - parseFloat(resultObject.mobileDiscount));

			if (resultObject.netSales > 0 || resultObject.netDelivery > 0)
				resultObject.averageOrder = doCurrencyRound((parseFloat(resultObject.netSales) + parseFloat(resultObject.netDelivery)) / resultObject.prodOrderCount);
			
			if (resultObject.grossDelivery > 0)
				resultObject.averageDelivery = doCurrencyRound(resultObject.grossDelivery / resultObject.deliveryCount);
			
			if (resultObject.grossTax > 0)
				resultObject.averageTax = doCurrencyRound(resultObject.grossTax / resultObject.taxOrderCount);
			
			if (resultObject.grossTips > 0)
				resultObject.averageTip = doCurrencyRound(resultObject.grossTips / resultObject.tipOrderCount);
			
			if (resultObject.walkupGross > 0)
				resultObject.averageWalkup = doCurrencyRound((resultObject.walkupNetReceipts - walkUpNetTaxes) / resultObject.walkupOrderCount);
			
			if (resultObject.mobileGross > 0)
				resultObject.averageMobile = doCurrencyRound((resultObject.mobileNet - mobileNetTaxes) / resultObject.mobileOrderCount);
			
			if (resultObject.cashOrderCount > 0 && resultObject.cashGross > 0)
				resultObject.averageCash = doCurrencyRound(resultObject.cashGross / resultObject.cashOrderCount);

			if (resultObject.creditOrderCount > 0 && resultObject.creditGross > 0)
				resultObject.averageCredit = doCurrencyRound(resultObject.creditGross / resultObject.creditOrderCount);
			
			if (resultObject.voucherCount > 0 && resultObject.voucherGross > 0)
				resultObject.averageVoucher = doCurrencyRound(resultObject.voucherGross / resultObject.voucherCount);

			_.each(resultObject.terminals, function(aTerminalRecord, index){
				aTerminalRecord.netCash = parseFloat(aTerminalRecord.cashGross) - aTerminalRecord.cashRefund - aTerminalRecord.cashDiscount;
				aTerminalRecord.netCredit = parseFloat(aTerminalRecord.creditGross) - aTerminalRecord.creditRefund - aTerminalRecord.creditDiscount;
				aTerminalRecord.netVoucher = parseFloat(aTerminalRecord.voucherGross) - aTerminalRecord.voucherRefund - aTerminalRecord.voucherDiscount;
				resultObject.terminals[index] = aTerminalRecord;
			});

			// console.log('returning result object for sales report' + JSON.stringify(resultObject));
			return Parse.Promise.as(resultObject);
		}, function(errorObject){
			console.log('Error in sales report calc');
			return Parse.Promise.error(errorObject);
		});    	


    }

    var executeSalesReport=function(request, response){

    	// var requestParams = JSON.parse(request.body);
    	var requestParams = request.params;
		
    	_executeSalesReport(requestParams, request.user)
    	.then(function(result){
    		response.success(result);
    	}, function(errorResponse){
    		response.error(errorResponse);
    	});
    }

    var ordersGetCount = function(request, response) {

    	try {

    		// var requestParams = JSON.parse(request.body);
    		var requestParams = request.params;
    		
    		if(!requestParams.truckId)
				throw {message:"TruckID is required",code:400}

			var Order=Parse.Object.extend("Order");

			var query = new Parse.Query("Order");
			var Truck= Parse.Object.extend("Truck");
			var truck=new Truck();
			truck.id=requestParams.truckId;

			query.limit(1000);
			//query.equalTo("truck",truck);

			//if the truck is also a central kitchen location then we need
			//to count the orders for the other truck/locations
			Parse.Promise.as()
			.then(function(){
	   			var truckQuery = new Parse.Query(Truck);
	   			truckQuery.equalTo("centralKitchen", {__type:"Pointer", className:"Truck", objectId:requestParams.truckId});
	   			return truckQuery.find();
			}).then(function(truckList){
				truckList.push({__type:"Pointer", className:"Truck", objectId:requestParams.truckId});
				query.containedIn("truck", truckList);
				// if (requestParams.terminalId)
				// 	query.equalTo('terminalId', requestParams.terminalId);

				query.lessThanOrEqualTo("state", 2);
				return query.find();
			}).then(function(orders){
				console.log('found # orders: ' + orders.length);

				var orderOnline=0,orderInProcess=0,orderReady=0;
				// console.log('terminal id ' + requestParams.terminalId);
				_.each(orders, function(aOrder){
					// console.log('state is ' + aOrder.get("state"));
					//if a terminal ID has been specified then check if it matches
					switch(aOrder.get("state")) {
					    case 0:{
					    	// console.log('online');
					        orderOnline++;
					        break;
					    }
					    case 1:{
					    	// console.log('in process');
							if (requestParams.terminalId){
								// console.log('terminal id ' + aOrder.get("terminalId"));
								if (requestParams.terminalId == aOrder.get("terminalId"))
									orderInProcess++;
					        } else
					        	orderInProcess++;
					        break;
					    }
					    case 2:{
					    	// console.log('ready!');
					    	if (requestParams.terminalId){
								if (requestParams.terminalId == aOrder.get("terminalId"))
									orderReady++;	
							} else 
								orderReady++;
							break;
						}
					}
					// if(aOrder.get("state")==0)
					// 	orderOnline++;
					// else { 
					// 	if(aOrder.get("state")==1)  //order is in process
					// 		if (requestParams.terminalId){
					// 			if (requestParams.terminalId == aOrder.get("terminalId"))
					// 				orderInProcess++;
					// 		} else 
					// 			orderInProcess++;
					// } else {
					// 	 if (requestParams.terminalId){
					// 	 	if (requestParams.terminalId == aOrder.get("terminalId"))
					// 	 		orderReady++;	
					// 	 } else 
					// 	 	orderReady++;
					// };
				});

				response.success({"online":orderOnline,"inProcess":orderInProcess,"ready":orderReady});

			},function(error){
				response.error(error);
			});

			
    	}

    	catch (error) {

    		response.error(error);
    	}
    }

    var ordersActivitySummary = function(request,response) {
    	try {

    		// var requestParams = JSON.parse(request.body);
    		var requestParams = request.params;

    		var ordersObj=[];

    		if (!requestParams.truckId){
			    
			    throw {
			      message: 'truckId is required',
			      code: 400
			    };			

			}

			if (!requestParams.dateFrom || !requestParams.dateTo){
			    
			    throw {
			      message: 'date range is required',
			      code: 400
			    };			

			}


			var Order= Parse.Object.extend("Order");
			var Truck = Parse.Object.extend("Truck");
			var truck = new Truck();
			var query = new Parse.Query(Order);
			var queryDateRange = new Parse.Query(Order);
			var queryIncompleteOrder = new Parse.Query(Order);

			var salesByItem=[];

			truck.id = requestParams.truckId;

			query.greaterThanOrEqualTo("acceptanceDateTime",new Date(requestParams.dateFrom));
			query.lessThanOrEqualTo("acceptanceDateTime", new Date(requestParams.dateTo));
			query.greaterThanOrEqualTo("state",1);
		   	query.lessThanOrEqualTo("state",4);
		   	
			query.equalTo("paid",true);
			query.equalTo("truck",truck);
			query.limit(100);
			query.find()
		   			   .then(function(orders){

		   			   		for(i=0;i<orders.length;i++) {
		   			   			// convert each order object to JSON equivalent
		   			   			ordersObj.push(orders[i].toJSON());
		   			   		}

		   			   		//resolved promise
							var promise = Parse.Promise.as();

							//get order items for each order
							_.each(orders, function(order, orderIndex) {
								promise=promise.then(function(){

									var orderItemsQuery=new Parse.Query("OrderItem");
									orderItemsQuery.equalTo("order", order);
									orderItemsQuery.include("menuItem");
									
									return orderItemsQuery.find({
										success: function(orderItems) {
											
											ordersObj[orderIndex].orderItems=[];

											for(var i=0;i<orderItems.length;i++) {
												
												var _r=orderItems[i].toJSON();
							   					var _m=orderItems[i].get("menuItem");
							   					
							   					if(_m)
							   						_r.menuItem=_m.toJSON();
							   					
							   					ordersObj[orderIndex].orderItems.push(_r);

											}
										},

										error: function(error) {
											response.error({"message":error.message, "code":error.code});
										}
									})


								})
							});

							return promise;

		   			   })

					   .then(function() {

					   		var POSOrdersCount=0, POSOrdersValue=0, mobileOrdersCount=0,mobileOrdersValue=0,refundOrdersCount=0;refundOrdersValue=0;
					   		var prepTime=0, prepTimeCount=0;

					   		// recurse the ordersObj and create results
					   		_.each(ordersObj, function(order,index) {

					   			if(order.saleMode==2 && order.state!=4) {											//mobile order
					   				mobileOrdersCount++;
					   				mobileOrdersValue+= order.amount + order.taxAmount;
					   			}

					   			else if(order.saleMode==1 && order.state!=4) {										//POS order
					   				POSOrdersCount++;
					   				POSOrdersValue+= order.amount + order.taxAmount;

					   				if(order.pickedupDateTime) {
						   				prepTimeCount++;
						   				prepTime+=moment.duration(moment(order.pickedupDateTime.iso).diff(moment(order.createdAt),"minutes"));
					   				}
					   			}

					   			else if(order.state==4) {
					   				refundOrdersCount++;
					   				refundOrdersValue+= order.amount+order.taxAmount;
					   			}

					   			//add sales by items
					   			var indexToUpdate=-1;
					   			var objectId;
					   			var itemName;

					   			if(order.state!=4) {			// item count for sales only --no refunds

					   				_.each(order.orderItems,function(orderItem,orderItemIndex){
						   				if(orderItem.menuItem) {
						   					objectId=orderItem.menuItem.objectId;
						   					itemName=orderItem.menuItem.name;
						   				}

						   				else {
						   					objectId="0";
						   					itemName=orderItem.description;
						   				}

						   				for(var k=0;k< salesByItem.length;k++) {

						   					if(salesByItem[k].objectId==objectId) {
						   						indexToUpdate=k;
						   						break;
						   					}
						   				}	

						   				if(indexToUpdate <0) {
						   					salesByItem.push({"objectId":objectId,"name":itemName,"qty":orderItem.qty });
						   				}

						   				else {
						   					salesByItem[indexToUpdate].qty+=orderItem.qty;
						   				}


						   			})
					   			}
					   			

					   		});

							salesByItem=_.sortBy(salesByItem, function(o) { return -o.qty; })

							if(salesByItem.length>5)			//only return top 5 items
								salesByItem.splice(5,salesByItem.length-5);

					   		response.success({"mobileOrdersCount":mobileOrdersCount,"mobileOrdersValue":mobileOrdersValue,
					   			"POSOrdersCount":POSOrdersCount,"POSOrdersValue":POSOrdersValue,"refundOrdersCount":refundOrdersCount, "refundOrdersValue":refundOrdersValue, 
					   			"averagePrepTime":prepTimeCount?prepTime/prepTimeCount:0,
					   			"salesByItem":salesByItem});

					   }, function(error){
					   		response.error(error);
					   })

    	}

    	catch (error) {
    		response.error({
    			"message" : error.message,
    			"code" : error.code
    		});
    	}
    }

    var chargeCard_internal = function(requestParams){
    	try {
    		console.log('inside charge internal');

    		var globalPromise = new Parse.Promise();

			var orderInfo = requestParams.orderInfo;
			var paymentProviderInfo= requestParams.paymentProviderInfo;
			// console.log('orderINfo is : ' + JSON.stringify(orderInfo));
			console.log('orderINfo ID is : ' + orderInfo.objectId);			

			//using the PayProviderFactory get the appropraite handler class
			var aPayProviderHandler = require('./pay-provider.js')(paymentProviderInfo);
			aPayProviderHandler.chargeCardWithToken(orderInfo)
			.then(function(httpResponse){
				globalPromise.resolve(httpResponse)
			}, function(error){
				globalPromise.reject(error);
			});


			return globalPromise;
	   	}

		catch (error) {
			console.log('ChargeCard_internal Error: ' + JSON.stringify(error));
			return Parse.Promise().reject(error);
		}

    }

    var chargeCard = function(request,response){
    	
	   	var requestParams = request.params;

		console.log('calling chargecard_internal');
		// console.log(this);
    	this.chargeCard_internal(requestParams)
    	.then(function(chargeResult){
    		response.success(chargeResult);
    	}, function(errorResponse){
    		response.error(errorResponse);
    	});
    }

    var refundCard_internal = function(requestParams) {

    	try {
    		var globalPromise = new Parse.Promise();

    		var orderInfo = requestParams.orderInfo;
    		var paymentProviderInfo= requestParams.paymentProviderInfo;

			//using the PayProviderFactory get the appropraite handler class
			var aPayProviderHandler = require('./pay-provider.js')(paymentProviderInfo);
			aPayProviderHandler.refundCard(orderInfo)
			.then(function(httpResponse){
				globalPromise.resolve(httpResponse)
			}, function(error){
				globalPromise.reject(error);
			});
    		
    		console.log('Refunding Order ' + orderInfo.objectId);

			return globalPromise;
    	} catch (error) {
			globalPromise.reject(error);
    	}
    }

    

    var refundCard = function(request,response) {
    	// var requestParams = JSON.parse(request.body);
    	var requestParams = request.params;

		console.log('calling refundcard_internal');
		// console.log(this);
    	this.refundCard_internal(requestParams)
    	.then(function(refundResult){
    		response.success(refundResult);
    	}, function(errorResponse){
    		response.error(errorResponse);
    	});
    };

    var completeOutstandingOrders = function(request, response){
  		var count = 0;
		var promise = Parse.Promise.as();
		promise = promise.then(function() {
			console.log("*********************************");
			var ordersQuery = new Parse.Query("Order");
			ordersQuery.lessThan('state', 3);
			ordersQuery.equalTo('saleMode', 1);  //only deal with walk-up orders
			ordersQuery.equalTo('paid', true); //only orders that have been paid
			console.log( moment().utc().subtract('2', 'days').format());
			ordersQuery.lessThan("createdAt", moment().utc().subtract('2', 'days').toDate());

			return ordersQuery.each(function(anOrder){
				anOrder.set("state", 3); //complete
				count++;
				return anOrder.save({}, {useMasterKey:true});

			});
		}).then(function(){
			//all done
			console.log('calling success...');
			// status.success('Done ' + count + ' records');
		}, function(error){
			console.log('calling error ' + JSON.stringify(error));
			// status.error('error');	
		});

		return promise;
    };

    var batchUpdateOrderPayInfo2 = function(job, data){
		//this is a ONE-OFF batch job that does the following
		//1. Go through EVERY order in the system and calculates the grand total
		//2. moves payment info to new collection paymentInfo collection
		//3. Markes the payLater flag to false (if not set to true)
		var moment = require('moment-timezone');

		var startMoment = new moment();
		var PaymentInfo = Parse.Object.extend("paymentInfo");

	  	var count = 0;
		var promise = Parse.Promise.as();

		promise = promise.then(function() {
			console.log("*********************************");
			var ordersQuery = new Parse.Query("Order");

			return ordersQuery.each(function(anOrder){
				if (anOrder.get("payLater") != true)
					anOrder.set("payLater", false);

				//now calculate the grand total
				var grossSale = parseFloat(anOrder.get("amount"));
			
				if (anOrder.get("taxAmount"))
					var taxAmount = parseFloat(anOrder.get("taxAmount"));
				else
					var taxAmount = 0.00;

				if (anOrder.get("tipAmount"))
					var tipAmount = parseFloat(anOrder.get("tipAmount"));
				else
					var tipAmount = 0.00;

				if (anOrder.get("amount"))
					var grossSale = parseFloat(anOrder.get("amount"));
				else
					var grossSale = 0.00;


				var deliveryObject = anOrder.get("deliveryDetail");
				if (deliveryObject){
					if (deliveryObject.deliveryTax)
						var deliveryTax = parseFloat(deliveryObject.deliveryTax);
					else 
						var deliveryTax = 0.00;

					if (deliveryObject.deliveryAmount)
						var deliveryAmount = parseFloat(deliveryObject.deliveryAmount);
					else 
						var deliveryAmount  = 0.00;
				} else {
					deliveryAmount  = 0.00;
					deliveryTax = 0.00;
				}

				if (anOrder.get("totalDiscountAmount"))
					var totalDiscountAmount = parseFloat(anOrder.get("totalDiscountAmount"));
				else 
					var  totalDiscountAmount = 0;

				var grandTotal = (taxAmount + tipAmount + grossSale) - totalDiscountAmount;

				anOrder.set("grandTotal", grandTotal);
				return anOrder.save(null, {useMasterKey:true})
				.then(function(aSavedOrder){
					//now move the payment Info to the payment Info table
					
					var paymentInfo = new PaymentInfo();

					paymentInfo.set("order", aSavedOrder);
					paymentInfo.set("chargeId", aSavedOrder.get("chargeId"));
					paymentInfo.set("tipAmount", aSavedOrder.get("tipAmount"));
					paymentInfo.set("amount", aSavedOrder.get("grandTotal"));
					paymentInfo.set("provider", aSavedOrder.get("provider"));
					paymentInfo.set("refundId", aSavedOrder.get("refundId"));
					paymentInfo.set("last4", aSavedOrder.get("last4"));
					paymentInfo.set("tx_tag", aSavedOrder.get("tax_tag"));
					paymentInfo.set("cc_type", aSavedOrder.get("credit_card_type"));
					paymentInfo.set("cc_expiry", aSavedOrder.get("cc_expiry"));
					paymentInfo.set("chargeTokenId", aSavedOrder.get("chargeTokenId"));
					return paymentInfo.save(null, {useMasterKey:true});
				});
			});
		}).then(function(){
			//all done
			console.log('calling success...Run time was ' + startMoment.toNow(true));
			return Parse.promise.as('Done ' + count + ' records');
		}, function(error){
			console.log('calling error ' + JSON.stringify(error));
			return Parse.Promise.error('error');	
		});
		// return promise;
    };

    var batchUpdateOrderPayInfo = function(job, data){
		//this is a ONE-OFF batch job that does the following
		//1. Go through EVERY order in the system and calculates the grand total
		//2. moves payment info to new collection paymentInfo collection
		//3. Markes the payLater flag to false (if not set to true)
		var moment = require('moment-timezone');

		var startMoment = new moment();
		var PaymentInfo = Parse.Object.extend("paymentInfo");

	  	var count = 0;
		var promise = Parse.Promise.as();

		var promises = [];
		
		console.log("*********************************");
		var ordersQuery = new Parse.Query("Order");

	 	ordersQuery.each(function(anOrder){
	 		if (anOrder.get("payLater") != true)
				anOrder.set("payLater", false);
			
			//now calculate the grand total
			var grossSale = parseFloat(anOrder.get("amount"));
		
			if (anOrder.get("taxAmount"))
				var taxAmount = parseFloat(anOrder.get("taxAmount"));
			else
				var taxAmount = 0.00;

			if (anOrder.get("tipAmount"))
				var tipAmount = parseFloat(anOrder.get("tipAmount"));
			else
				var tipAmount = 0.00;

			if (anOrder.get("amount"))
				var grossSale = parseFloat(anOrder.get("amount"));
			else
				var grossSale = 0.00;


			var deliveryObject = anOrder.get("deliveryDetail");
			if (deliveryObject){
				if (deliveryObject.deliveryTax)
					var deliveryTax = parseFloat(deliveryObject.deliveryTax);
				else 
					var deliveryTax = 0.00;

				if (deliveryObject.deliveryAmount)
					var deliveryAmount = parseFloat(deliveryObject.deliveryAmount);
				else 
					var deliveryAmount  = 0.00;
			} else {
				deliveryAmount  = 0.00;
				deliveryTax = 0.00;
			}

			if (anOrder.get("totalDiscountAmount"))
				var totalDiscountAmount = parseFloat(anOrder.get("totalDiscountAmount"));
			else 
				var  totalDiscountAmount = 0;

			var grandTotal = (taxAmount + tipAmount + grossSale) - totalDiscountAmount;
			grandTotal = Number( parseFloat(Math.round(grandTotal*Math.pow(10,2))/Math.pow(10,2)).toFixed(2) );

			anOrder.set("grandTotal", grandTotal);
			promises.push(anOrder.save(null, {useMasterKey:true})
			.then(function(aSavedOrder){
				//now move the payment Info to the payment Info table
				
				var paymentInfo = new PaymentInfo();

				paymentInfo.set("order", aSavedOrder);
				paymentInfo.set("chargeId", aSavedOrder.get("chargeId"));
				paymentInfo.set("tipAmount", aSavedOrder.get("tipAmount"));
				paymentInfo.set("amount", aSavedOrder.get("grandTotal"));
				paymentInfo.set("provider", aSavedOrder.get("provider"));
				paymentInfo.set("refundId", aSavedOrder.get("refundId"));
				paymentInfo.set("last4", aSavedOrder.get("last4"));
				paymentInfo.set("tx_tag", aSavedOrder.get("tax_tag"));
				paymentInfo.set("cc_type", aSavedOrder.get("credit_card_type"));
				paymentInfo.set("cc_expiry", aSavedOrder.get("cc_expiry"));
				paymentInfo.set("chargeTokenId", aSavedOrder.get("chargeTokenId"));
				return paymentInfo.save(null, {useMasterKey:true});
			}));

	  	});
		
		// Return a new promise that is resolved when all of the deletes are finished.
		return Parse.Promise.when(promises);
	};

    return {
        posGetOrders: posGetOrders,
        posGetOrdersSummaryReport : posGetOrdersSummaryReport,
        orderStateModify : orderStateModify,
        ordersGetCount: ordersGetCount,
        completeOutstandingOrders: completeOutstandingOrders,
        ordersActivitySummary: ordersActivitySummary,
        chargeCard: chargeCard,
        chargeCard_internal: chargeCard_internal,
        refundCard: refundCard,
        refundCard_internal: refundCard_internal,
        updateCustomer: updateCustomer,
        executeSalesReport:executeSalesReport,
        emailDailySalesReport:emailDailySalesReport,
        executeTop5Report: executeTop5Report,
        executeTopModifiersReport:executeTopModifiersReport,
        executeDiscountUsageReport:executeDiscountUsageReport,
        executetxVolumeReport: executetxVolumeReport,
        executeSalesBreakdownReport:executeSalesBreakdownReport,
        batchUpdateOrderPayInfo:batchUpdateOrderPayInfo
    };
}

exports.trkOrder = trkOrder;