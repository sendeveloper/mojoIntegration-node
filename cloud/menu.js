var moment = require('moment-timezone');

function padZeros(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  }
  
function getSecureUrl(currentUrl){
	//console.log('current URL is ' + currentUrl);
	return currentUrl.replace("http://", "https://s3.amazonaws.com/");
}

var _ = require('lodash');

var trkMenu = function(){

	//TODO: all constants need to go into one javascript file
	var const_inStock = 0;
	var const_outOfStock = 86;

	var const_orderState_recvd = 0;
	var const_orderState_conf = 1;
	var const_orderState_ready = 2;
	var const_orderState_comp = 3;
	var const_orderState_canc = 4;

	var const_orderSaleMode_online = 2;
	var const_orderSaleMode_pos = 1;

	var const_stripe_provider_code="STRIPE";
	var const_payl_provider_code="PAYL";
	var const_bams_provider_code="BAMS";
	var const_hland_provider_code="HLAND";
	var const_cash_provider_code="CASH";
	var const_voucher_provider_code="VOUCH";

	var _menuOrderCalcTotals = function(orderInfo){
		var theTruck;
		var theVendor;
		var subTotal = 0;
		var totalTax = 0;
		var taxCodes = null;
		var menuItemOptions = null;
		var orderHeader = null;
		var aPayProviderHandler = null;
		// validate inbound order object for sanity check, valid objects
		return Parse.Promise.as()
		.then(function(){


			if (!orderInfo.pickUpDateTime)
				//if pickup date not supplied, set it to now
			 	orderInfo.pickUpDateTime= new Date();
				else
					//if a pick update time is specified, convert it to UTC
					orderInfo.pickUpDateTime = moment(orderInfo.pickUpDateTime).utc().toDate();

			// load the truck and vendor
			var query = new Parse.Query("Truck");
			query.include("vendor");

			// we have to use the MasterKey here because this GET fails
			// due to the fact that there is no FIND authorization on the vendor CLP.
			return query.get(orderInfo.truckId, {useMasterKey:true});

		}).then(function(aTruck){
			theTruck = aTruck;
			theVendor = theTruck.get("vendor");
		
			// get all the taxes for this vendor
			var taxCodesQuery = new Parse.Query("TaxCode");
			taxCodesQuery.equalTo("vendor", theVendor);
			return taxCodesQuery.find({useMasterKey:true});
		}).then(function(taxCodeList){
			taxCodes = taxCodeList;

			var menuItemOptionsQuery = new Parse.Query("MenuItemOptions");
			menuItemOptionsQuery.equalTo("vendor", theVendor);
			return menuItemOptionsQuery.find({useMasterKey:true});
		}).then(function(menuItemOptionResults){
			menuItemOptions = menuItemOptionResults;

			//make sure that the phone number is consistently formatted regardless of client.
			if (orderInfo.customerPhone){
				//strip out all non numeric characters
				orderInfo.customerPhone = String(orderInfo.customerPhone).replace(/\D/g,'');
				// console.log('ISO is ' + theVendor.get("isoCurrency"));
				if (theVendor.get("isoCurrency") == 'USD'){
					var phoneNumberValid = false;
					console.log('phone length is ' + String(orderInfo.customerPhone).length);
					switch (String(orderInfo.customerPhone).length){
						case 10:
							orderInfo.customerPhone = '+1' + orderInfo.customerPhone;
							phoneNumberValid = true;
							break;
						case 11:
							orderInfo.customerPhone = '+' + orderInfo.customerPhone;
							phoneNumberValid = true;
							break;
						case 12:
							//all is well, nothing to do
							phoneNumberValid = true;
							break;
					}
					//prepend +1  if required
					// if (orderInfo.customerPhone.substring(0, 1) != '+1')
					// 	orderInfo.customerPhone = '+1' + orderInfo.customerPhone;
					if (!phoneNumberValid)
						return Parse.Promise.error({code:"101", message:"Phone number not valid"});
				};
					
			};

			//validate inbound items
			// var promises = [new Parse.Promise.as(), new Parse.Promise.error(), new Parse.Promise.as()];
			var promises = [];
			_.each(orderInfo.items, function(itemJSON, index){
			// 	//since items is passed in from the outside we ignore everything except the objectId
				var aPromise = new Parse.Promise();
				promises.push(aPromise);
				//now load the menu item
				var MenuItems = Parse.Object.extend("MenuItem");
				var menuItemsQuery = new Parse.Query(MenuItems);
				var aGrandTotal = 0;

				menuItemsQuery.get(itemJSON.id, {useMasterKey:true})
				.then(function(aMenuItem){
					// itemJSON.menuItem = aMenuItem;

					var menuItemTax = 0;
					//1. Make sure that the priceText exists
					if (!itemJSON.priceText)
						itemJSON.priceText = '';

					var aPricePoint = _.find(aMenuItem.get("prices"), {text:itemJSON.priceText});
					if (!aPricePoint)
						return aPromise.reject({code:404, message:'Price not found'});
					else {
						//if price point was found then add it to total
						itemJSON.verifiedPrice = aPricePoint.price; //just in case the client decided to provide their own price :-)
						itemJSON.verifiedPriceText = aPricePoint.text;
						itemJSON.desc = aMenuItem.get("name");

						var anItemTotal = 0;
						var modifierTotal = 0;
						_.each(itemJSON.options, function(aModifier){
							if (aModifier.id){
								var modGroupId = String(aModifier.id).split('-')[0];
								var modId = parseInt(String(aModifier.id).split('-')[1]);

								aModGroup = _.find(menuItemOptions, {id:modGroupId} );
								if (aModGroup){
									console.log(aModGroup.get("options"));
									console.log(String(aModifier.id).split('-')[1]);

									var aMod = _.find(aModGroup.get("options"), {id:modId});
									if (aMod){
										if (!itemJSON.verifiedMods)
											itemJSON.verifiedMods = [];

										if (aModifier.removed)
											itemJSON.verifiedMods.push({
												id: aModGroup.id + '-' + aMod.id,
												modifierText:aMod.description,
												cost: aMod.price,
												removed: "true"
											});
										else {
											itemJSON.verifiedMods.push({
												id: aModGroup.id + '-' + aMod.id,
												modifierText:aMod.description,
												cost: aMod.price
											});
										};

										if (!aMod.price)
											aMod.price = 0;

										anItemTotal = parseFloat(anItemTotal) + parseFloat(aMod.price);
									}
								};
								
							};
						});
						anItemTotal = parseFloat(anItemTotal) + parseFloat(itemJSON.verifiedPrice); // * itemJSON.qty;

						anItemTotal = parseFloat(Math.round(anItemTotal*Math.pow(10,2))/Math.pow(10,2)).toFixed(2);

						subTotal = parseFloat(subTotal) + parseFloat(anItemTotal * itemJSON.qty);
	
						//apply appropriate taxes
						_.each(aMenuItem.get("taxes"), function(aMenuItemTax){
							if (aMenuItemTax.taxId){
								var aTaxRecord = _.find(taxCodes, {id:aMenuItemTax.taxId});
								if (aTaxRecord){
									var menuItemTax = parseFloat(anItemTotal * (aTaxRecord.get("percentage")/100) );
									//rounding
									menuItemTax = (Math.round(menuItemTax*Math.pow(10,2))/Math.pow(10,2)).toFixed(2);

									//now that it is rounded, multiply by qty
									totalTax = parseFloat(totalTax) + ( parseFloat(menuItemTax) * itemJSON.qty );

									//currency rounding
									totalTax = parseFloat((Math.round(totalTax*Math.pow(10,2))/Math.pow(10,2)).toFixed(2));

									if (!itemJSON.verifiedTaxes)
										itemJSON.verifiedTaxes = [];

									itemJSON.verifiedTaxes.push({
										taxId: aTaxRecord.id,
										description: aTaxRecord.get("description"),
										percentage: aTaxRecord.get("percent")
									});
								}; //ignore if not found
										
							}
							 
						});

						//now apply any global taxes for this vendor
						_.each(taxCodes, function(aTaxCode){

							if (aTaxCode.get("applyToAll") === true){
								//apply global tax
								menuItemTax = parseFloat( menuItemTax + (anItemTotal * (aTaxCode.get("percentage")/100) ) );
								//rounding
								menuItemTax = (Math.round(menuItemTax*Math.pow(10,2))/Math.pow(10,2)).toFixed(2);
								//now that it is rounded, multiply by qty
								totalTax = parseFloat(totalTax) + parseFloat(menuItemTax * itemJSON.qty);
								//currency rounding
								totalTax = parseFloat((Math.round(totalTax*Math.pow(10,2))/Math.pow(10,2)).toFixed(2));

								if (!itemJSON.verifiedTaxes)
									itemJSON.verifiedTaxes = [];

								itemJSON.verifiedTaxes.push({
									taxId: aTaxCode.id,
									description: aTaxCode.get("description"),
									percentage: aTaxCode.get("percentage")
								});
							};
						});
						
						orderInfo.subTotal = subTotal;
						orderInfo.taxTotal = totalTax;

						aPromise.resolve();

					};

				}, function(error){
					return aPromise.reject(error);
				});
			});

			return Parse.Promise.when(promises);
		}).then(function(){
			return Parse.Promise.as(orderInfo, theTruck, theVendor);
		});
	};

	var menuOrderCalcTotals = function(request, response){
		var orderInfo = request.params;
		_menuOrderCalcTotals(orderInfo)
		.then(function(orderObject){
			response.success(orderObject);
		}, function(error){
			response.error(error);
		});
	};

	var menuOrderCreateAnon = function(request, response){
		// this order can be called from any 'unknown' source (website, etc)
		// it provides much stricter controls then menuOrderCreate

		// var orderInfo = request.params;
		var orderInfo = null;
		var theTruck;
		var theVendor;
		var subTotal = 0;
		var totalTax = 0;
		var taxCodes = null;
		var menuItemOptions = null;
		var orderHeader = null;
		var aPayProviderHandler = null;

		return Parse.Promise.as()
		.then(function(){
			if (!request.params.items || request.params.items.length == 0) 
				return Parse.Promise.error({
					message: 'You must specify at least 1 item in your order',
					code: 400
				});

			//truck ID required
			if (!request.params.truckId) {
			    return Parse.Promise.error({
			      message: 'Please specify a truck Id',
			      code: 400
			    });
			};

			if (!request.params.chargeTokenId || !request.params.credit_card_type || !request.params.cc_expiry) {
			    return Parse.Promise.error({
			      message: 'Payment Information invalid',
			      code: 400
			    });
			};	

			return _menuOrderCalcTotals(request.params)
		
		}).then(function(orderObject, aTruck, aVendor){
			orderInfo = orderObject;
			theTruck = aTruck;
			theVendor = aVendor;

			var Orders = Parse.Object.extend("Order");
			var anOrder = new Orders();
			var state;
			var stateText = "";

			TrkUtils = require('./utility.js').trkUtility;
			trkUtils = new TrkUtils();		
					
			return Parse.Promise.as()
			.then(function(){
				return trkUtils.encrypt(orderInfo.cc_expiry);
			}).then(function(encryptedCCExpiry){
				anOrder.set("cc_expiry", encryptedCCExpiry);
				return trkUtils.encrypt(orderInfo.chargeTokenId);
			}).then(function(encryptedToken){

				anOrder.set("chargeTokenId", encryptedToken);		
				return trkUtils.encrypt(orderInfo.credit_card_type);	
			}).then(function(encryptedCardType){

				anOrder.set("credit_card_type", encryptedCardType);

				//get the credit card provider
    			var paymentInfoArray = theTruck.get("paymentInfo");
    			if (!paymentInfoArray || paymentInfoArray.length == 0){
    				//payment info is not on truck, check for vendor level
    				paymentInfoArray = theVendor.get("paymentInfo");
    			};

    			if (!paymentInfoArray || paymentInfoArray.length == 0)
    				return Parse.Promise.error({code:141, message: "This vendor is not setup to accept online orders"});
    			else
					anOrder.set("provider", paymentInfoArray[0].providerId);
					
				anOrder.set("paid",false);

				orderInfo.orderId = Math.floor((Math.random() * 10000) + 1);

				anOrder.set("orderId", orderInfo.orderId);
			
				switch(state){
					case const_orderState_recvd:
						stateText = 'Order received. Confirmation pending from ' + theVendor.get("description") + '.';
						break;
					case const_orderState_conf:
						stateText = "Order has been confirmed. We'll let you know when its ready..."
						break;
					case const_orderState_ready:
						stateText = 'Order ready for pickup. Come and get it!';
						break;
					case const_orderState_comp:
						stateText = 'Order picked up. Thank you!';
						break;
					case const_orderState_canc:
						stateText = 'Order cancelled/rejected';
						break;	
				};

				anOrder.set("state", const_orderState_recvd);
				anOrder.set("status", stateText);
				anOrder.set("tags", orderInfo.tags);

				anOrder.set("deliveryRequested", orderInfo.deliveryRequested);
				anOrder.set('deliveryDetail', orderInfo.deliveryDetail);

				anOrder.set("requestedPickupDateTime", new Date(orderInfo.pickUpDateTime) ); 

				orderInfo.amount = subTotal;
				orderInfo.taxAmount = totalTax;

				anOrder.set("amount", orderInfo.amount);
				anOrder.set("taxAmount", orderInfo.taxAmount);
				anOrder.set("customerPhone", orderInfo.customerPhone);
				
				orderInfo.totalDiscountAmount = 0;
				orderInfo.subTotalDiscountAmount = 0;
				orderInfo.deliveryDiscountAmount = 0;

				anOrder.set("totalDiscountAmount", orderInfo.totalDiscountAmount);
				anOrder.set("subTotalDiscountAmount", orderInfo.subTotalDiscountAmount);
				anOrder.set("deliveryDiscountAmount", orderInfo.deliveryDiscountAmount);
				
				if (!orderInfo.tipAmount)
					orderInfo.tipAmount = 0.00;

				if (!orderInfo.txDate)
					orderInfo.txDate = new Date().toUTCString();

				anOrder.set("txDate", new Date(orderInfo.txDate));

				anOrder.set("tipAmount", parseFloat(orderInfo.tipAmount));

				//calculate the grand total
				var grandTotal = Number(orderInfo.amount) + Number(orderInfo.taxAmount) + Number(orderInfo.tipAmount);
				grandTotal = Number(parseFloat(Math.round(grandTotal*Math.pow(10,2))/Math.pow(10,2)).toFixed(2) );

				if (orderInfo.deliveryDetail){
					if (!orderInfo.deliveryDetail.deliveryTax)
						orderInfo.deliveryDetail.deliveryTax = 0;

					if (!orderInfo.deliveryDetail.deliveryAmount)
						orderInfo.deliveryDetail.deliveryAmount = 0;

					grandTotal += Number(orderInfo.deliveryDetail.deliveryAmount) + Number(orderInfo.deliveryDetail.deliveryTax) ;
				
				};

				grandTotal = Number(grandTotal) - Number(orderInfo.totalDiscountAmount);
				grandTotal = Number( parseFloat(Math.round(grandTotal*Math.pow(10,2))/Math.pow(10,2)).toFixed(2) );

				anOrder.set("grandTotal", grandTotal); 

				orderInfo.currency = 'USD';
				anOrder.set("currency" , orderInfo.currency);

				orderInfo.saleMode = const_orderSaleMode_online;
				anOrder.set("saleMode",orderInfo.saleMode);			// if saleMode is not set assume it's coming from a mobile
				
				anOrder.set("tags", orderInfo.tags);

				if (orderInfo.notes)
					anOrder.set("notes", orderInfo.notes);

				anOrder.set("truck",theTruck);
				anOrder.set("vendor",theVendor);
				return anOrder.save({}, {useMasterKey:true});

			});
		}).then(function(aSavedOrder){
			orderHeader = aSavedOrder;
			var orderItemArray = [];

			var OrderItem = Parse.Object.extend("OrderItem");

			_.each(orderInfo.items, function(itemJSON){
				//now loop through the items and save
				var anOrderItem = new OrderItem();
				
				anOrderItem.set("menuItem", itemJSON.menuItem);

				anOrderItem.set("options", itemJSON.verifiedMods);
				anOrderItem.set("order", aSavedOrder);
				anOrderItem.set("description", itemJSON.desc);
				anOrderItem.set("qty", parseInt(itemJSON.qty));
				anOrderItem.set("price", itemJSON.verifiedPrice);
				anOrderItem.set("taxes", itemJSON.verifiedTaxes);
				anOrderItem.set("note", itemJSON.note);
				anOrderItem.set("priceText", itemJSON.verifiedPriceText);
				anOrderItem.set("discounts", []);
				anOrderItem.set("discountAmount", 0);
				// anOrderItem.set("taxBreakdown", itemJSON.taxBreakdown);
				anOrderItem.set("offMenuItem", false);

				//copy all the verified items to the original properties
				//we use these properties in the downstream methods
				itemJSON.options = itemJSON.verifiedMods;
				itemJSON.priceText = itemJSON.verifiedPriceText;
				itemJSON.price = itemJSON.verifiedPrice;
				itemJSON.taxes = itemJSON.verifiedTaxes;
				
				orderItemArray.push(anOrderItem);
			});

			var PaymentInfo = Parse.Object.extend("paymentInfo");
			//for now we assume that there is one paymentInfo line for each order.
			//when Split Payment is implemented this wont be the case. but for now it is fine.
			var paymentInfo = new PaymentInfo();

			paymentInfo.set("order", orderHeader);
			paymentInfo.set("tipAmount", orderHeader.get("tipAmount"));
			paymentInfo.set("amount", orderHeader.get("grandTotal"));
			paymentInfo.set("provider", orderHeader.get("provider"));
			paymentInfo.set("last4", orderHeader.get("last4"));
			paymentInfo.set("tx_tag", orderHeader.get("tax_tag"));
			paymentInfo.set("chargeTokenId", orderHeader.get("chargeTokenId"));
			paymentInfo.set("cc_expiry", orderHeader.get("cc_expiry"));
			paymentInfo.set("cc_type", orderHeader.get("credit_card_type"));
			orderItemArray.push(paymentInfo);

			return Parse.Object.saveAll(orderItemArray, {useMasterKey:true});
		}).then(function(){

			var TrkPusher = require('./pusher.js').trkPusher;
			var trkPusher = new TrkPusher();
			var jsonCloneObject = {};
			_.extend(jsonCloneObject, orderInfo);

			//delete the signature since we dont want to push that. 
			//pusher limits us to 10kb packets and the signature blows that
			delete jsonCloneObject.signature;

			// console.log('sending to JSON clone to pusher ' + JSON.stringify(jsonCloneObject));
			return trkPusher.sendMessageToTruck_internal({messageCode:101,truckId:theTruck.id,data:jsonCloneObject});
		}).then(function(){

			//if an email address has been provided then send a receipt
			if (orderInfo.sendReceipt && orderInfo.emailAddress && orderInfo.emailAddress != ""){

				console.log('Calling _emailReceipt from menuOrderCreate... ');
				return _emailReceipt(orderInfo, orderInfo.emailAddress, theVendor);

			} else 
				return Parse.Promise.as();
		}).then(function(){

			//check if the vendor has requested email notifications for mobile orders
			var settings = theVendor.get("settings");

			if (settings.orderReceivedEmailList && settings.orderReceivedEmailList != ""){

				return _emailOrderTicket(orderInfo, settings.orderReceivedEmailList, theVendor);
			}
				else return Parse.Promise.as();
		}).then(function(){
		    response.success({
		      message: "Order " + orderHeader.get("orderId") + " has been successfully received",
		      code: 200,
		      orderId: orderHeader.get("orderId"),
		      internalId: orderHeader.id,
		    });

		}, function(error){
			response.error(error);
		});

	}

   	var menuOrderCreate = function(request, response){


		try {		
			// vars

			// var orderInfo = JSON.parse(request.body);

			var orderInfo = request.params;
			console.log('menuOrderCreate: OrderInfo is ' + JSON.stringify(orderInfo));

			// var paymentProviderInfo={};			//this obj will be set will all payment provider details
			var aPayProviderHandler = null;
			var customerCreateMsg = '';
  			var orderHeader;
  			var theVendor;
  			var theTruck;
  			var theConfig;
  			var theAppUrl = "#";
  			var orderItemArray = [];
  			var orderCreated=false; 
  			var trkUtils = null;
	
	  		//check if this sequence number is in the db.
  			//If it is do a full log of the data
  			Parse.Promise.as()
  			.then(function(){
  				console.log('Sequence # is ' + orderInfo.seqNumber);
  				if (orderInfo.seqNumber){
  					var seqLogQuery = new Parse.Query('sequenceLogs');
  					seqLogQuery.equalTo("seqNumber", orderInfo.seqNumber)
	  				return seqLogQuery.first()
	  				.then(function(aSeqLogRecord){

	  					if (aSeqLogRecord){
	  						console.log('Sequence Log Entry Found. Writing Data to Error Log')
	  						//we hve a sequence log
	  						//we need to dump this into the errorLog table
								var ErrorLog = Parse.Object.extend("ErrorLog");
								var anErrorEntry = new ErrorLog();
								anErrorEntry.set("context", 'Entry in seqLog table. Order ID: ' + orderInfo.orderId + '. SeqNumber' + orderInfo.seqNumber + '. Terminal ID: ' + orderInfo.terminalId);
								anErrorEntry.set("details", JSON.stringify(orderInfo));
								anErrorEntry.set("referenceObject", orderInfo);
								return anErrorEntry.save({},{useMasterKey:true});
	  					} else {
	  						console.log('No Sequence Log Entry Found. Carry on');
	  						return Parse.Promise.as();
	  					}
	  				});
  				} else
  					return Parse.Promise.as();
  			}).then(function(){

  				// return response.error({code:122, message:'Error coz we can'});
	  			//just in case one of the clients passes in the boolean as a string (shouldnt happen but you never know)
	  			if (orderInfo.createCustomer === "true")
	  				orderInfo.createCustomer == true;

		  		//vendor ID required
		  		console.log('vendor is ' + orderInfo.vendorId);
		  		if (!orderInfo.vendorId) 
		  			return Parse.Promise.error( {
		    			message: 'Vendor ID not provided',
		    			code: 400
		  			});

				// ensure that there is at least 1 item in the order
				if (!orderInfo.items || orderInfo.items.length == 0) 
					return Parse.Promise.error({
						message: 'You must specify at least 1 item in your order',
						code: 400
					});
			
				//if createCustomer is true make sure that a phone number is supplied
				if (orderInfo.createCustomer == true && !orderInfo.customerPhone || orderInfo.customerPhone == '') {
				    return Parse.Promise.error({
				      message: 'You must provide a phone number.',
				      code: 400
				    });
				}

				//truck ID required
				if (!orderInfo.truckId) {
				    return Parse.Promise.error({
				      message: 'Please specify a truck Id',
				      code: 400
				    });
				}
	   			
	   			// provider required (if NOT Pay Later)
				if (!orderInfo.provider && orderInfo.payLater != true) {
				    return Parse.Promise.error({
				      message: 'Please specify a Payment Provider',
				      code: 400
				    });
				}

	  			//if paid is TRUE then make sure we have a charge Id
	  			if((orderInfo.provider != const_cash_provider_code && orderInfo.provider != const_voucher_provider_code) && !orderInfo.chargeId && orderInfo.paid) {
				    return Parse.Promise.error({
				      message: 'Please specify a Merchant authorization number.',
				      code: 400
				    });
				};

	  			//if a delivery phone number has been passed in but NO customer phone number
	  			//then default the customer number to the delivery phone number
	  			if (orderInfo.deliveryRequested == true && !orderInfo.customerPhone){
	  				orderInfo.customerPhone = orderInfo.deliveryDetail.deliveryPhone;
	  			};

				return Parse.Promise.as();

  			}).then(function(){
	  			//Begin...
	  			// return Parse.Promise.error(JSON.stringify({code:999, message:"Transaction " + orderInfo.seqNumber + " all ready exists."}));
	  			
	  			// STEP a1: Make sure that there is not a transaction with this sequence number all ready
	  			//if there is return an exception
	  			//
	  			if (!orderInfo.saleMode){
	  				if (orderInfo.clientType == 'MOBILEAPP')
	  					orderInfo.saleMode = const_orderSaleMode_online
	  				else
	  					orderInfo.saleMode = const_orderSaleMode_pos;
	  			};

				if (!orderInfo.pickUpDateTime)
					//if pickup date not supplied, set it to now
	    		 	orderInfo.pickUpDateTime= new Date();
	  			else
	  				//if a pick update time is specified, convert it to UTC
	  				orderInfo.pickUpDateTime = moment(orderInfo.pickUpDateTime).utc().toDate();

				TrkUtils = require('./utility.js').trkUtility;
				trkUtils = new TrkUtils();	

  				console.log('checking for duplicate transaction. SeqNo: ' + orderInfo.seqNumber);

  				if (orderInfo.seqNumber && !orderInfo.objectId){
  					console.log('checking if order all ready exists');
	  				var orderQuery = new Parse.Query('Order');
	  				orderQuery.equalTo("vendor", {__type:"Pointer", className:"Vendor", objectId:orderInfo.vendorId});
	  				orderQuery.equalTo("truck", {__type:"Pointer", className:"Truck", objectId:orderInfo.truckId});
	  				orderQuery.equalTo("seqNumber", orderInfo.seqNumber)
	  				return orderQuery.find({useMasterKey:true});
  				} else 
  					return Parse.Promise.as([]);

  			}).then(function(existingOrderList){
  				
  				if (existingOrderList && existingOrderList.length > 0){
  					console.log('found ' + existingOrderList.length + ' orders all ready in db. Sending back a 999');
  					return Parse.Promise.error(JSON.stringify({code:999, message:"Transaction " + orderInfo.seqNumber + " all ready exists."}));
  				} else 
  					return Parse.Promise.as();
  			}).then(function(){
  				//load the truck and vendor
				var query = new Parse.Query("Truck");
				query.include("vendor");

				//we have to use the MasterKey here because this GET fails
				//due to the fact that there is no FIND authorization on the vendor CLP.
				return query.get(orderInfo.truckId, {useMasterKey:true});

  			}).then(function(truckResult){
  				// console.log('truck result is ' + JSON.stringify(truckResult));

  				theTruck = truckResult;
  				theVendor = theTruck.get("vendor");

 				//make sure that the phone number is consistently formatted regardless of client.
				if (orderInfo.customerPhone){
					//strip out all non numeric characters
					orderInfo.customerPhone = String(orderInfo.customerPhone).replace(/\D/g,'');
					// console.log('ISO is ' + theVendor.get("isoCurrency"));
					if (theVendor.get("isoCurrency") == 'USD'){
						var phoneNumberValid = false;
						console.log('phone length is ' + String(orderInfo.customerPhone).length);
						switch (String(orderInfo.customerPhone).length){
							case 10:
								orderInfo.customerPhone = '+1' + orderInfo.customerPhone;
								phoneNumberValid = true;
								break;
							case 11:
								orderInfo.customerPhone = '+' + orderInfo.customerPhone;
								phoneNumberValid = true;
								break;
							case 12:
								//all is well, nothing to do
								phoneNumberValid = true;
								break;
						}
						//prepend +1  if required
						// if (orderInfo.customerPhone.substring(0, 1) != '+1')
						// 	orderInfo.customerPhone = '+1' + orderInfo.customerPhone;
						if (!phoneNumberValid)
							return Parse.Promise.error({code:"101", message:"Phone number not valid"});
					};
						
				};

				console.log('Customer Phone is ' + orderInfo.customerPhone);
  				
  				return Parse.Promise.as();
				
  			}).then(function() {

        		if( orderInfo.provider != const_cash_provider_code && orderInfo.provider != const_voucher_provider_code) {
        			//1. check if the truck has payment level info. If it does then user that
        			var paymentInfoArray = theTruck.get("paymentInfo");
        			if (!paymentInfoArray || paymentInfoArray.length == 0){
        				//payment info is not on truck, check for vendor level
        				paymentInfoArray = theVendor.get("paymentInfo");
        			};

        			if (!paymentInfoArray || paymentInfoArray.length == 0)
        				return Parse.Promise.error("This vendor is not setup to accept online orders");
        			else {
        				// paymentInfo = paymentInfoArray[0];
        				console.log('Getting Payment Provider for ' + JSON.stringify(paymentInfoArray[0]));
						aPayProviderHandler = require('./pay-provider.js')(paymentInfoArray[0], request.user);
						console.log('Got Payment Provider' + JSON.stringify(aPayProviderHandler));

						//make sure payment provider details were set in the loop above

						if (!aPayProviderHandler)
							return Parse.Promise.error({code:"101", message:"Could not find relevant payment provider for this vendor"});
        			};
        		};
        		// } else {			

        		// 	paymentProviderInfo.providerId = orderInfo.provider;

        		// }
        		
        		// Create new customer if required
        		if (orderInfo.createCustomer == true){
        			console.log("creating customer!!!...");

        			return aPayProviderHandler.createCustomer(orderInfo)
        			.then(function(aCreateCustomerMsg){
        				customerCreateMsg = aCreateCustomerMsg;
        				orderInfo.customerId = aCreateCustomerMsg.customerId;
        				return Parse.Promise.as();
        			});
        			
        		} else{
        			console.log('No need to create a customer...');
        			return Parse.Promise.as();
         		
         		}
         	}).then(function(){
				console.log('customer ID is ' + orderInfo.customerId);
				if (orderInfo.customerId && aPayProviderHandler.localCustomerStore){
					var TrkCustomer = Parse.Object.extend("CPay");
					var query = new Parse.Query(TrkCustomer);
					console.log('searching for ' + String(orderInfo.customerId).substring(4));
					return query.get( String(orderInfo.customerId).substring(4), { useMasterKey:true} ) //skip the 'cus_'
					.then(function(aCpayRecord){
						
					}).fail(function(){
						return Parse.Promise.error({code:101, message:"Customer " + orderInfo.customerId + " not found. Please re-enter your payment details"});
					});
				} else 
					return Parse.Promise.as();
			})
			// STEP 2: Charge the payment provider in case of card
			.then(function(){
				// If the order is NOT paid and it is coming from the POS, charge the card
				if(orderInfo.paid == false && orderInfo.saleMode == const_orderSaleMode_pos && orderInfo.payLater !=  true){
					console.log('Step 2: Charge the Card');
					var TrkOrder = require('./order.js').trkOrder;
					var trkOrder = new TrkOrder();
					
					console.log('calling chargeCard_internal');
					return trkOrder.chargeCard_internal({"orderInfo":orderInfo,"paymentProviderInfo":aPayProviderHandler.prototype._payInfo})
					.then(function(result){

						console.log('In chargeCard_internal.then processing. Result is ' + JSON.stringify(result));
						if (result.id || result.authorization_num){
							orderInfo.paid = true;
							if (result.id)  //STRIPE
								orderInfo.chargeId = result.id;
						
							orderInfo.tx_tag = result.transaction_tag;

							orderInfo.last4 = result.last4;
						};

						if (result.ctr){
							orderInfo.ctr = result.ctr; //store CTR for later so we save to db
						}
					});
				}
				else {
					console.log('Step 2: All ready paid or Pay Not required. go to Step 3')
					return Parse.Promise.as();	
				}					

			})
			// STEP 3: save the order
			.then(function(){
				console.log('Step 3: Saving the order...');

				var Orders = Parse.Object.extend("Order");
				var anOrder = new Orders();
				var state;
				var stateText = "";
				
				// set properties of order

				if (orderInfo.objectId)
					anOrder.id = orderInfo.objectId;

				if(orderInfo.chargeId)
					anOrder.set("chargeId",orderInfo.chargeId);
				
				if (orderInfo.tx_tag){
					anOrder.set("tx_tag",String(orderInfo.tx_tag));
				};

				if (orderInfo.ctr)
					anOrder.set("ctr",String(orderInfo.ctr));
						
				return Parse.Promise.as()
				.then(function(){
					if (orderInfo.chargeTokenId)
						return trkUtils.encrypt(orderInfo.chargeTokenId);
							else return Parse.Promise.as();
				}).then(function(encryptedResult){
					if (orderInfo.customerId)
						//if there is a customer ID then there xis no chargeToken Id
						return Parse.Promise.as();
					else {
						if (encryptedResult)
							anOrder.set("chargeTokenId", encryptedResult);
						
						if(orderInfo.cc_expiry)
							return trkUtils.encrypt(orderInfo.cc_expiry);
								else return Parse.Promise.as();
					}

				}).then(function(encryptedResult){
					if (!orderInfo.customerId && encryptedResult){
						//if we have a customer Id then no need to store CC info
						anOrder.set("cc_expiry", encryptedResult);
						return trkUtils.encrypt(orderInfo.credit_card_type);
					} else 
						return Parse.Promise.as();

				}).then(function(encryptedResult){
					if (encryptedResult)
						anOrder.set("credit_card_type", encryptedResult);

					anOrder.set("provider", orderInfo.provider);
					
					if (orderInfo.hasOwnProperty("paid"))
						anOrder.set("paid",orderInfo.paid)
					else
						anOrder.set("paid",false);

					anOrder.set("customerId", orderInfo.customerId);
					if (orderInfo.orderId)
						anOrder.set("orderId", orderInfo.orderId);
					else
						anOrder.set("orderId", Math.floor((Math.random() * 10000) + 1));

					if (!orderInfo.state) {
						orderInfo.state = state = 0;
					} else state = orderInfo.state; 
					
					switch(state){
						case const_orderState_recvd:
							stateText = 'Order received. Confirmation pending from ' + theVendor.get("description") + '.';
							break;
						case const_orderState_conf:
							stateText = "Order has been confirmed. We'll let you know when its ready..."
							break;
						case const_orderState_ready:
							stateText = 'Order ready for pickup. Come and get it!';
							break;
						case const_orderState_comp:
							stateText = 'Order picked up. Thank you!';
							break;
						case const_orderState_canc:
							stateText = 'Order cancelled/rejected';
							break;	
					};

					if(state!=0) {
						anOrder.set("acceptanceDateTime",new Date());			//acceptance date always defaults to now if not an online order
						orderInfo.acceptanceDateTime= new Date();	
					};
					
					anOrder.set("seqNumber", orderInfo.seqNumber);
					anOrder.set("terminalId", orderInfo.terminalId);
					anOrder.set("state", state);

					if (orderInfo.payLater != true)
						orderInfo.payLater = false;

					anOrder.set("payLater", orderInfo.payLater);

					anOrder.set("deliveryRequested", orderInfo.deliveryRequested);
					anOrder.set('deliveryDetail', orderInfo.deliveryDetail);

					anOrder.set("status", stateText);
					anOrder.set("requestedPickupDateTime", new Date(orderInfo.pickUpDateTime) ); 
					anOrder.set("amount", Number(orderInfo.amount));
					anOrder.set("taxAmount", Number(orderInfo.taxAmount));
					anOrder.set("customerPhone", orderInfo.customerPhone);
					anOrder.set("taxes", orderInfo.taxes);
					
					if (!orderInfo.totalDiscountAmount)
						orderInfo.totalDiscountAmount = 0;

					anOrder.set("totalDiscountAmount", orderInfo.totalDiscountAmount);
					
					if (!orderInfo.subTotalDiscountAmount)
						orderInfo.subTotalDiscountAmount = 0;

					anOrder.set("subTotalDiscountAmount", orderInfo.subTotalDiscountAmount);
					
					if (!orderInfo.deliveryDiscountAmount)
						orderInfo.deliveryDiscountAmount = 0;
					
					anOrder.set("deliveryDiscountAmount", orderInfo.deliveryDiscountAmount);
					anOrder.set("discounts", orderInfo.discounts)
				
					if (orderInfo.last4)
						anOrder.set("last4", orderInfo.last4);
					
					anOrder.set("signature", orderInfo.signature);
					if (!orderInfo.tipAmount)
						orderInfo.tipAmount = 0.00;

					//calculate the grand total
					var grandTotal = Number(orderInfo.amount) + Number(orderInfo.taxAmount) + Number(orderInfo.tipAmount);
					grandTotal = Number(parseFloat(Math.round(grandTotal*Math.pow(10,2))/Math.pow(10,2)).toFixed(2) );

					if (orderInfo.deliveryDetail){
						if (!orderInfo.deliveryDetail.deliveryTax)
							orderInfo.deliveryDetail.deliveryTax = 0;

						if (!orderInfo.deliveryDetail.deliveryAmount)
							orderInfo.deliveryDetail.deliveryAmount = 0;

						grandTotal += Number(orderInfo.deliveryDetail.deliveryAmount) + Number(orderInfo.deliveryDetail.deliveryTax) ;
					
					};

					grandTotal = Number(grandTotal) - Number(orderInfo.totalDiscountAmount);
					grandTotal = Number( parseFloat(Math.round(grandTotal*Math.pow(10,2))/Math.pow(10,2)).toFixed(2) );
					
					anOrder.set("grandTotal", grandTotal); 

					if (!orderInfo.txDate)
						orderInfo.txDate = new Date().toUTCString();

					anOrder.set("txDate", new Date(orderInfo.txDate));

					orderInfo.saleMode = orderInfo.saleMode?orderInfo.saleMode:const_orderSaleMode_online;

					anOrder.set("tipAmount", Number(orderInfo.tipAmount));
					anOrder.set("currency" , orderInfo.currency);
					anOrder.set("saleMode",orderInfo.saleMode);			// if saleMode is not set assume it's coming from a mobile
					anOrder.set("tags", orderInfo.tags);


					if (orderInfo.notes)
						anOrder.set("notes", orderInfo.notes);

					anOrder.set("truck",theTruck);
					anOrder.set("vendor",theVendor);


					return anOrder.save({}, { useMasterKey:true})
						.then(function(orderObject){
							var TrkOrder = require('./order.js').trkOrder;
							var trkOrder = new TrkOrder();
							trkOrder.updateCustomer(orderObject);
							return orderObject;
						});
				});
			})

			// STEP 4: save order items
			.then(function(aOrderHeader){
				console.log('Step 4: Saving order items');
				orderHeader = aOrderHeader;			//global order header to return

				var OrderItem = Parse.Object.extend("OrderItem");
				//save the items
				var promise = Parse.Promise.as();
				_.each(orderInfo.items, function(itemJSON, index){
					
					promise = promise.then(function(){

						if (!itemJSON.offMenuItem){
							//check that each item being passed exists in the menu
							var MenuItems = Parse.Object.extend("MenuItem");
							var menuItemsQuery = new Parse.Query(MenuItems);

							if (itemJSON.modifiers && itemJSON.modifiers.length > 0)
								menuItemsQuery.include('legacyOptionGroup')
							// var aMenuItem = null;
							
							return menuItemsQuery.get(itemJSON.id)
								.fail(function(anError){
									// if one of the menu items does not exist
									// then the whole order fails
									var msgError = itemJSON.desc + ' is no longer on the Menu. Please select an alternative.';
									return Parse.Promise.error(msgError);	
								})
								.then(function(aMenuItem){
									//map legacy modifiers to converted option group
									if (itemJSON.modifiers && itemJSON.modifiers.length > 0){
										console.log('Modifers FOUND for order item!! ' + itemJSON.modifiers.length);
																				
										var legacyGroupFound = false;
										legacyOptionGroup = aMenuItem.get("legacyOptionGroup");
										
										if (!legacyOptionGroup){
											console.log('Customer has an OLD version of app. Needs to update.');
											return Parse.Promise.error({code:500, message:'Please update your app from the app store.'});
										}

										console.log('legacy option group is ' + legacyOptionGroup.id);

										itemJSON.options = [];
										_.each(itemJSON.modifiers, function(aModifier){
											console.log('...Processing Modifer ' + aModifier.modifierText);

											//find the option (in the option group) that matches this modifier
											var entryIndex = _.findIndex(	
																			legacyOptionGroup.get("options"), 
																			{description:aModifier.modifierText}
																		);
											
											//map the modifiers to the option Groups for this order item
											itemJSON.options.push({	cost:aModifier.cost, 
																	modifierText: aModifier.modifierText,
																	id: legacyOptionGroup.id + '-' + entryIndex
																});
										});

									} 

									var anOrderItem = new OrderItem();
									
									anOrderItem.set("menuItem", aMenuItem);

									anOrderItem.set("modifiers", itemJSON.modifiers);
									anOrderItem.set("options", itemJSON.options);
									anOrderItem.set("order", aOrderHeader);
									anOrderItem.set("description", itemJSON.desc);
									anOrderItem.set("qty", parseInt(itemJSON.qty));
									anOrderItem.set("price", itemJSON.price);
									anOrderItem.set("taxes", itemJSON.taxes);
									anOrderItem.set("note", itemJSON.note);
									anOrderItem.set("priceText", itemJSON.priceText);
									anOrderItem.set("discounts", itemJSON.discounts);
									anOrderItem.set("discountAmount", itemJSON.discountAmount);
									anOrderItem.set("taxBreakdown", itemJSON.taxBreakdown);
									anOrderItem.set("offMenuItem", false);
									
									// return anOrderItem.save()
									orderItemArray.push(anOrderItem);
									return Parse.Promise.as(aMenuItem);
								});
						} else {
							var anOrderItem = new OrderItem();

							anOrderItem.set("order", aOrderHeader);
							anOrderItem.set("description", itemJSON.desc);
							anOrderItem.set("qty", parseInt(itemJSON.qty));
							anOrderItem.set("price", itemJSON.price);
							anOrderItem.set("note", itemJSON.note);
							anOrderItem.set("taxes", itemJSON.taxes);
							anOrderItem.set("discounts", itemJSON.discounts);
							anOrderItem.set("discountAmount", itemJSON.discountAmount);
							anOrderItem.set("taxBreakdown", itemJSON.taxBreakdown);
							anOrderItem.set("offMenuItem", true);
							
							// return anOrderItem.save()
							orderItemArray.push(anOrderItem);
							return Parse.Promise.as();
						}

					})
				});

				return promise;
			}).then(function(){
				// xyz.method();

				var deletePromises = [];
				//before saving the menu items we should make sure that there are no items for this order 
				//all ready in the DB. If there are then we should delete them first
				if (orderInfo.objectId){
					//if the internalId (objectId) is passed from the client 
					//it means that this order has previously been saved in the DB
					//therefore should delete any items in the DB for this order 
					//as we are bout to over write them

					var orderItemQuery = new Parse.Query("OrderItem");
					orderItemQuery.equalTo("order", orderHeader);
					return orderItemQuery.find({sessionToken:request.user.get("sessionToken")})
					.then(function(dbOrderItems){
						_.each(dbOrderItems, function(oldOrderItem){
							deletePromises.push(oldOrderItem.destroy({useMasterKey:true}));
						});
						return Parse.Promise.when(deletePromises);
					});
				} 
					else return Parse.Promise.as();
			}).then(function(){
				var PaymentInfo = Parse.Object.extend("paymentInfo");
				//for now we assume that there is one paymentInfo line for each order.
				//when SPlit Payment is implemented this wont be the case. but for now it is fine.
				var paymentInfo = new PaymentInfo();

				paymentInfo.set("order", orderHeader);
				paymentInfo.set("tipAmount", orderHeader.get("tipAmount"));
				paymentInfo.set("amount", orderHeader.get("grandTotal"));
				paymentInfo.set("provider", orderHeader.get("provider"));
				paymentInfo.set("last4", orderHeader.get("last4"));
				paymentInfo.set("cc_type", orderHeader.get("credit_card_type"));
				paymentInfo.set("cc_expiry", orderHeader.get("cc_expiry"));
				paymentInfo.set("chargeTokenId", orderHeader.get("chargeTokenId"));
				orderItemArray.push(paymentInfo);

				//save all the menu items in one call 
				// console.log('Step 4a: Calling SaveAll on DB');
				return Parse.Object.saveAll(orderItemArray, {useMasterKey:true});
			}).then(function(resultItemArray){
				// STEP 5: Send Pusher notification on success else respond with error
				orderCreated=true;			// order has been created/processed successfully - 
				orderInfo.orderId= orderHeader.get("orderId");
				orderInfo.internalId= orderHeader.id;
				orderInfo.createdAt= moment(orderHeader.createdAt).toISOString();

				if(orderInfo.acceptanceDateTime) orderInfo.acceptanceDateTime= moment(orderInfo.acceptanceDateTime).toISOString();
				if(orderInfo.pickUpDateTime) orderInfo.pickUpDateTime=moment(orderInfo.pickUpDateTime).toISOString();

				console.log('Step 6: Sending Message to Pusher');
				var TrkPusher = require('./pusher.js').trkPusher;
				var trkPusher = new TrkPusher();
				console.log('calling sendMessageToTruck_internal...');
				var jsonCloneObject = {};
				_.extend(jsonCloneObject, orderInfo);
				// _.merge(jsonCloneObject, orderInfo);
				console.log('After extend ' + JSON.stringify(jsonCloneObject));
				//delete the signature since we dont want to push that. 
				//pusher limits us to 10kb packets and the signature blows that
				delete jsonCloneObject.signature;

				// console.log('sending to JSON clone to pusher ' + JSON.stringify(jsonCloneObject));
				return trkPusher.sendMessageToTruck_internal({messageCode:101,truckId:orderInfo.truckId,data:jsonCloneObject});
			}).then(function(){
				//if an email address has been provided then send a receipt
				if (orderInfo.sendReceipt && orderInfo.emailAddress && orderInfo.emailAddress != ""){

					return _emailReceipt(orderInfo, orderInfo.emailAddress, theVendor);

				} else 
					return Parse.Promise.as();
			}).then(function(){
				//check if the vendor has requested email notifications for mobile orders
				var settings = theVendor.get("settings");
				// console.log('email list is ' + settings.orderReceivedEmailList);
				// console.log('sale mode is ' + orderHeader.get("saleMode"));
				if (orderHeader.get("saleMode") == const_orderSaleMode_online && settings.orderReceivedEmailList && settings.orderReceivedEmailList != ""){
					
					return _emailOrderTicket(orderInfo, settings.orderReceivedEmailList, theVendor);
				}
					else return Parse.Promise.as();
			},function(error){			//handle any errors in the above processes here...
				console.log('inside error handler. Trying to delete the order' + JSON.stringify(error));
				if (orderHeader && error.code != '999'){ //999 is valid 'Error'. Dont delete

					var ErrorLog = Parse.Object.extend("ErrorLog");
					var anErrorEntry = new ErrorLog();
					anErrorEntry.set("context", error.message);
					anErrorEntry.set("details", JSON.stringify(orderInfo));
					anErrorEntry.set("referenceObject", orderInfo);
					return anErrorEntry.save({},{useMasterKey:true})
					.then(function(){
						return orderHeader.destroy()
						.then(function(){
							return Parse.Promise.error(error);			//deleted the order
						},function(_error){
							return Parse.Promise.error(_error);			//failed to delete the order
						});						
					});


				} else 
					return Parse.Promise.error(error);
			})

			// ensure order saved successfully and return response to the caller
			.always(function(error){
				var errorObj = error;

				if(orderCreated){
					console.log('sending successful response from menuOrderCreate');
					if (orderInfo.createCustomer && orderInfo.createCustomer == true) {
					    response.success({
					     	message: "Order " + orderHeader.get("orderId") + " has been successfully received",
					      	code: 200,
						    orderId: orderHeader.get("orderId"),
						    internalId: orderHeader.id,
						    customerId: orderHeader.get("customerId"),
						    customerCreateMsg: customerCreateMsg,
						    terminalId: orderHeader.get("terminalId"),
						    seqNumber: orderHeader.get("seqNumber") 
					    });
	  				} 

	  				else {
					    response.success({
					      message: "Order " + orderHeader.get("orderId") + " has been successfully received",
					      code: 200,
					      orderId: orderHeader.get("orderId"),
					      internalId: orderHeader.id,
					      terminalId: orderHeader.get("terminalId"),
					      seqNumber: orderHeader.get("seqNumber")
					    });
	  				}
				}

				else {
					console.log('Error: ' + JSON.stringify(errorObj));
					response.error(errorObj);	

				}
			}, function(anErrorObj){
				var aPromise = new Parse.Promise.as();
				if (orderHeader)
					aPromise = orderHeader.destroy();

				aPromise.then(function(){
					console.log('menuOrderCreate: Error Obj is ' + JSON.stringify(anErrorObj))
					response.error(anErrorObj);			// error occured in the order creation process					
				})
	
			})
		} catch(errorObj){
			console.log('caught an error!' + JSON.stringify(errorObj));
			errorObj.terminalId = orderInfo.terminalId;
			errorObj.seqNumber = orderInfo.seqNumber;
  			response.error(errorObj);
		};
    }

    var emailReceipt=function(request, response){

		requestParams = request.params;
		var theOrderInfo;

	  		//order ID required
	  		if (!requestParams.orderId){
	  			response.success({code:400, message:"Please specify an order"});
	  		};

		Parse.Promise.as()
		.then(function(){
			return _orderGetInfo(requestParams.orderId);
		}).then(function(orderInfo){
			theOrderInfo = orderInfo;
			// console.log(theOrderInfo.orderItems[0]);

			//the orderInfo contains is a JSON object, we need the full vendor object
		   	var Vendor = Parse.Object.extend('Vendor');
		   	var query = new Parse.Query(Vendor);
			return query.get(orderInfo.vendor.objectId);
		}).then(function(aVendor){
			
			//the method below expects all order items to be in an array called items
			//but the method above returns an array called orderItems
			//so just copy it over
			//also a few other vars
			theOrderInfo.items = theOrderInfo.orderItems.splice(0);
			theOrderInfo.emailAddress = requestParams.emailId;
			// delete theOrderInfo.orderItems;

			_.each(theOrderInfo.items, function(anOrderItem){
				anOrderItem.desc = anOrderItem.description;
				delete anOrderItem.description;
				delete anOrderItem.menuItem;
				delete anOrderItem.createdAt;
				delete anOrderItem.updatedAt;
				delete anOrderItem.objectId;
				delete anOrderItem.priceText;
			});
			
			// console.log(theOrderInfo.items);
			// console.log(theOrderInfo.orderItems);
			return _emailReceipt(theOrderInfo, requestParams.emailId, aVendor);	
		}).then(function(){
			response.success({code:200, message:'Email Sent'});
		}, function(error){
			response.success(error);
		});
		
    }

    var _emailReceipt = function(orderInfo, emailAddress, aVendor){
    	var theConfig;
    	var theAppUrl;
    	var theVendor = aVendor;

		console.log('receipt has been requested. Loading config...');
		return Parse.Promise.as()
		.then(function(){
			return Parse.Config.get()	
		}).then(function(config){
			theConfig = config;

			// console.log('Vendor is ' + theVendor.id);
			// console.log('getting app url...');

			var TrkVendor = require('./vendor.js').trkVendor;
		  	var trkVendor = new TrkVendor();
		  	return trkVendor.getAppUrl(theVendor);
		}).then(function(appUrl){
			theAppUrl = appUrl;
			console.log('app url is ' + theAppUrl);
			//get the social Secrets
			// var Secrets = Parse.Object.extend("Secret");
			// var socialQuery = new Parse.Query(Secrets);
			// socialQuery.equalTo("vendor", theVendor);
			// socialQuery.containedIn("keyName", ["fb_access_token", "tw_oauth_token", "tw_oauth_token_secret", "fb_pageaccess_token" , "fb_page_id"]);
			// return socialQuery.find()					 	
			return Parse.Promise.as([]);
		}).then(function(socialSecrets){
			console.log('Mandril API Key has been retrieved...');
			var mandrillAPIKey = theConfig.get("MandrillAPIKey");

			var mandrill = require('mandrill-api/mandrill');
			var mandrill_client = new mandrill.Mandrill(mandrillAPIKey);

			var accounting = require('./accounting.js');
			//loop through all the items and calculate the total for each item
			_.each(orderInfo.items, function(orderItem){
				// console.log(orderItem);
				orderItem.itemTotal = accounting.formatMoney(orderItem.qty * orderItem.price);
				orderItem.extras = 0;

				_.each(orderItem.options, function(anOption){
					if (!anOption.removed)
						orderItem.extras = orderItem.extras + anOption.cost;
				});
				if (orderItem.extras > 0)
					orderItem.extras = accounting.formatMoney(orderItem.extras * orderItem.qty);

				console.log(orderItem);

			});

			if (orderInfo.deliveryRequested == true)
				var deliveryCost = orderInfo.deliveryDetail.deliveryAmount;
			else 
				var deliveryCost = 0;

			var grandTotal = (parseFloat(orderInfo.amount) + parseFloat(deliveryCost)) - parseFloat(orderInfo.totalDiscountAmount)
				+ parseFloat(orderInfo.taxAmount) + parseFloat(orderInfo.tipAmount)

			console.log('grand total is ' + grandTotal);

			// var grandTotal =  accounting.formatMoney(parseFloat(orderInfo.amount) 
			// 	+ parseFloat(orderInfo.taxAmount) + parseFloat(orderInfo.tipAmount));

			//if FB is connected then get the page Id
			//get the FB Page ID
			// console.log('Seaching for FB Page ID' + JSON.stringify(socialSecrets));
			var fbPageLink = "#";
			var twLink = "#";
			// _.each(socialSecrets, function(aSecret){
			// 	if (aSecret.get("keyName") == "fb_page_id"){
			// 		fbPageLink = 'facebook.com/' + aSecret.get("secretValue");
			// 	}
			// 	if (aSecret.get("keyName") == "tw_oauth_token"){
			// 		twLink = 'twitter.com/intent/user?user_id=' + aSecret.get("secretValue").split('-')[0];
			// 	}
			// });
			
			var logoUrl;

			//if the vendor has uploaded a logo, get the URL
			if (theVendor.get("pictureLogo"))
				logoUrl = theVendor.get("pictureLogo").url();

			var mailParams = {
				async:true, 
				template_name: theConfig.get("emailReceiptTemplate"),
				template_content:{},
				message: {
					merge_language: 'handlebars',
					from_email:"info@getyomojo.com",
					from_name: theVendor.get("description"),
					to: [{
				  		email: emailAddress,
				  		type: 'to'
				  	}],
				  	merge_vars: [{
				  		rcpt: emailAddress,
				  		vars: [{
				  			name: "VENDORLOGO",
				  			content: logoUrl
				  		},
				  		{
				  			name:"VENDORNAME",
				  			content:theVendor.get("description")
				  		},
				  		{
				  			name:"RECEIPTDATE",
				  			content: moment(orderInfo.createdAt).tz(theVendor.get("timeZone")).format("dddd, MMMM Do YYYY, h:mm a")
				  		},
				  		{
				  			name:"ORDERID",
				  			content:orderInfo.orderId
				  		},
				  		{
				  			name:"TAX",
				  			content:accounting.formatMoney(orderInfo.taxAmount)
				  		},
				  		{
				  			name:"DISCTOTAL",
				  			content:accounting.formatMoney(orderInfo.totalDiscountAmount)
				  		},
				  		{
				  			name:"SUBTOTAL",
				  			content:accounting.formatMoney(orderInfo.amount)
				  		},
				  		{
				  			name:"GRANDTOTAL",
				  			content:accounting.formatMoney(grandTotal)
				  		},
				  		{
				  			name:"TIP",
				  			content:accounting.formatMoney(orderInfo.tipAmount)
				  		},
				  		{
				  			name:"RECEIPTITEMS",
				  			content:orderInfo.items
				  		},
				  		{
				  			name:"FBLINK",
				  			content:fbPageLink
				  		},
				  		{
				  			name:"TWLINK",
				  			content:twLink
				  		},
				  		{
				  			name:"APPURL",
				  			content: theAppUrl
				  		}]
				  	}]
				}
			};

			console.log('Calling Mandrill... I hope he answers.');
			// console.log('Mail params are ' + JSON.stringify(mailParams));

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
		}, function(error){
			console.log(error);
			return Parse.Promise.error(httpResponse.data);
		});
    }

    var _emailOrderTicket=function(orderInfo, emailAddressList, aVendor){
    	var theConfig;
    	var theAppUrl;
    	var mapImageUrl = null;
    	var mapUrl = null;
    	var orderPending = false;
    	var theVendor = aVendor;
    	var toRecipients = [];

    	// console.log('email - orderinfo is ' + JSON.stringify(orderInfo));
    	// console.log('email - vendor is ' + JSON.stringify(aVendor));

		var receipients = String(emailAddressList).split(",");
		_.each(receipients, function(emailAddress){
			toRecipients.push({email:emailAddress, type:'to'});
		});

		console.log('order Tickets has been requested. Loading config...');
		return Parse.Promise.as()
		.then(function(){
			return Parse.Config.get()	
		}).then(function(config){
			theConfig = config;

		}).then(function(socialSecrets){
			console.log('Mandril API Key has been retrieved...');
			var mandrillAPIKey = theConfig.get("MandrillAPIKey");

			var mandrill = require('mandrill-api/mandrill');
			var mandrill_client = new mandrill.Mandrill(mandrillAPIKey);

			//if there are NO modifiers then set an empty array
			_.each(orderInfo.items, function(aMenuItem, menuItemIndex){
				if (!aMenuItem.modifiers)
					aMenuItem.modifiers = [];

				if (!aMenuItem.options)
					aMenuItem.options = [];

				_.each(aMenuItem.options, function(anOption, optionIndex){
					if (!anOption.removed)
						anOption.removed = false
					
					aMenuItem.options[optionIndex] = anOption;				
				});

				orderInfo.items[menuItemIndex] = aMenuItem;
			});

			if (orderInfo.deliveryRequested == true){
				mapImageUrl = 'https://maps.googleapis.com/maps/api/staticmap?center='
				+ orderInfo.deliveryDetail.deliveryLat + ',' + orderInfo.deliveryDetail.deliveryLong
				+ '&markers=color:blue|'
				+ orderInfo.deliveryDetail.deliveryLat + ',' + orderInfo.deliveryDetail.deliveryLong
				+ '&size=600x300&maptype=roadmap' + '&key='+ theConfig.get("googleAPIServerKey");

				mapUrl = 'http://maps.google.com/?q=' + orderInfo.deliveryDetail.deliveryLat + ',' + orderInfo.deliveryDetail.deliveryLong;
				// console.log('map image url is ' + mapImageUrl);
			};

			if (orderInfo.state == 0){
				orderPending = true;
			} else orderPending = false;


			// console.log('mail data ' + JSON.stringify(orderInfo));

			var mailParams = {
				async:true, 
				template_name: theConfig.get("emailOrderNotify"),
				template_content:{},
				message: {
					merge_language: 'handlebars',
					from_email:"info@getyomojo.com",
					from_name: theVendor.get("description"),
					to: toRecipients,
				  	global_merge_vars: [
				  		{
				  			name:"VENDORNAME",
				  			content:theVendor.get("description")
				  		},
				  		{
				  			name:"RECEIPTDATE",
				  			content: moment(orderInfo.createdAt).tz(theVendor.get("timeZone")).format("dddd, MMMM Do YYYY, h:mm a")
				  		},
				  		{
				  			name:"PICKUPDATE",
				  			content: moment(orderInfo.pickUpDateTime).tz(theVendor.get("timeZone")).format("dddd, MMMM Do YYYY, h:mm a")
				  		},
				  		{
				  			name:"ORDERID",
				  			content:orderInfo.orderId
				  		},
				  		{
				  			name:"ORDERPENDING",
				  			content:orderPending
				  		},
				  		{
				  			name:"RECEIPTITEMS",
				  			content:orderInfo.items
				  		},
				  		{
				  			name:"DELIVERYREQUESTED",
				  			content:orderInfo.deliveryRequested
				  		},
				  		{
				  			name:"DELIVERYDETAIL",
				  			content:orderInfo.deliveryDetail
				  		},
				  		{
				  			name:"MAPIMAGEURL",
				  			content:mapImageUrl
				  		},
				  		{
				  			name:"MAPURL",
				  			content: mapUrl
				  		}
				  	]
				}
			};

			// console.log('Calling Mandrill... I hope he answers.');
			// console.log('Mail params are ' + JSON.stringify(mailParams));

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
		}, function(error){
			console.log(error);
			return Parse.Promise.error(httpResponse.data);
		});
    }

    _orderGetInfo = function(internalId, loadSignature){
	   	var resultHeader = {};
	   	
	   	var orderFields = ["customerPhone", "description", "qty", "updatedAt", "createdAt","modifiers","options", "menuItem", "price", "priceText", "seqNumber", "discounts", "discountAmount"];

	   	var Orders = Parse.Object.extend('Order');
	   	var query = new Parse.Query(Orders);
	    return query.get(internalId, {useMasterKey:true})
	    .then(function(anOrderHeader){
	    	resultHeader = anOrderHeader.toJSON();

	    	//get the order items for this order
	   		var OrderItems = Parse.Object.extend('OrderItem');
	    	var orderItemQuery = new Parse.Query(OrderItems);
	    	orderItemQuery.equalTo("order", anOrderHeader);
	    	
	    	if (loadSignature == true)
	    		orderFields.push('signature');

	    	orderItemQuery.select(orderFields); //only return these fields
	    	return orderItemQuery.find({useMasterKey:true})
	    	.then(function(orderItemRecords){
	    		resultHeader.orderItems = [];

	    		for (var i = 0; i < orderItemRecords.length; i++){
	    			var orderItem = orderItemRecords[i].toJSON();
	    			
	    			// if (orderItem.menuItem)
	    			// 	if (orderItem.menuItem.menuItemImage)
	    			// 		orderItem.menuItem.picture.url = getSecureUrl(orderItem.menuItem.menuItemImage);
	    			
	    			resultHeader.orderItems.push(orderItem);
	    		}
	    	});
	    }).then(function(){
	    	console.log('successful result is ' + JSON.stringify(resultHeader));
	    	return Parse.Promise.as(resultHeader);
	    }, function(error){
	    	return Parse.Promise.error(error);
	    });
    }

   	var orderGetInfo = function(request, response){
    	requestParams = request.params;
    	var resultJSON = {orders:[]};
    	// var counter = 0;

		var promises = [];

		Parse.Promise.as()
		.then(function(){
	    	
	    	_.each(requestParams.orders, function(anOrder){
				console.log('loading internal id' + anOrder.internalId);
				var aPromise = _orderGetInfo(anOrder.internalId, requestParams.loadSignature)
				.then(function(resultHeader){
					resultJSON.orders.push(resultHeader);
				});

				promises.push(aPromise);
			});
			return Parse.Promise.when(promises);			
		}).then(function(){
			response.success(resultJSON);	   	
		}, function(error){
			response.error(error);
		});



		   //  .then(function(resultHeader){
		   // 		if (!resultJSON.orders) resultJSON.orders = [];

		   // 		//order is retrieved (with order Items), check if there are any more
		   // 		resultJSON.orders.push(resultHeader);
		   // 		counter++;	
		   // 		if ( counter == requestParams.orders.length ){
					// response.success(resultJSON);	   			
		   // 		};
		   //  }, function(error){
		   //  	response.error(error);
		   //  });	

		   	// var resultHeader = {};

		   	// var Orders = Parse.Object.extend('Order');
		   	// var query = new Parse.Query(Orders);
		   	
		    // query.get(anOrder.internalId)
		    // .then(function(anOrderHeader){
		    // 	resultHeader = anOrderHeader.toJSON();
		    // 	//return as standard date format
		    // 	//if (resultHeader.requestedPickupDateTime) 
		    // 	//	resultHeader.requestedPickupDateTime = resultHeader.requestedPickupDateTime.iso; 
		    	
		    // 	//get the order items for this order
		   	// 	var OrderItems = Parse.Object.extend('OrderItem');
		    // 	var orderItemQuery = new Parse.Query(OrderItems);
		    // 	orderItemQuery.equalTo("order", anOrderHeader);
		    // 	orderItemQuery.select("description", "qty", "updatedAt", "createdAt","modifiers", "menuItem", "price", "priceText"); //only return these fields
		    // 	return orderItemQuery.find()
		    // 	.then(function(orderItemRecords){
		    // 		resultHeader.orderItems = [];

		    // 		for (var i = 0; i < orderItemRecords.length; i++){
		    // 			var orderItem = orderItemRecords[i].toJSON();
		    // 			if (orderItem.menuItem.picture)
		    // 				orderItem.menuItem.picture.url = getSecureUrl(orderItem.menuItem.picture.url);
		    			
		    // 			resultHeader.orderItems.push(orderItem);
		    // 		}
		    // 	});
		   //  }).then(function(resultHeader){
		   // 		if (!resultJSON.orders) resultJSON.orders = [];

		   // 		//order is retrieved (with order Items), check if there are any more
		   // 		resultJSON.orders.push(resultHeader);
		   // 		counter++;	
		   // 		if ( counter == requestParams.orders.length ){
					// response.success(resultJSON);	   			
		   // 		};
		   //  }, function(error){
		   //  	response.error(error);
		   //  });	
    	// });	
    };
 	
 	var getDigitalMenu = function(request, response){
 		
 		var self = this;

 		var requestParams = request.params;
 		var theTruck = null;
 		var theMenu = null;
 		var resulObject = {};

 		if (requestParams.effectiveDate)
 			var effectiveFromDate = new moment(requestParams.effectiveDate);
 		else 
 			var effectiveFromDate = new moment().utc();

 		var effectiveToDate = effectiveFromDate.clone();
 		effectiveToDate.endOf("hour"); //get the nearest hour

		var TrkTruck = require('./truck.js').trkTruck;
		var trkTruck = new TrkTruck;

		var truckQuery = new Parse.Query('Truck');
		truckQuery.get(requestParams.locationId)
		.then(function(aTruck){
			theTruck = aTruck;

			return trkTruck._truckScheduleGet({
				truckId: requestParams.locationId,
				fromTimeStamp: effectiveFromDate.format(),
				toTimeStamp: effectiveToDate.format(),
				ignorePrivateSettings: false});

		}).then(function(truckScheduleList){
			
			if (truckScheduleList.length > 0){
				theMenu = truckScheduleList[0].get("overrideMenu");
			};

			if (!theMenu){
				//get the default menu
				theMenu = theTruck.get("menuHeader");
			};

			if (!theMenu)
				response.error({code:404, message:"No menu found"});

			return self._menuGetDetail({menuId: theMenu.id})

		}).then(function(resultObject){
			
			for (var key in resultObject) {
			  if (resultObject.hasOwnProperty(key)) {
			    //remove everything except the categories
			    if (key != 'categories')
			    	delete resultObject[key];
			  }
			};

			_.each(resultObject.categories, function(aCategory){
				
				_.each(aCategory.menuItems, function(aMenuItem){
					delete aMenuItem.picture;
					delete aMenuItem.pictureObj;
					delete aMenuItem.taxes;
					delete aMenuItem.vendor;
				})
			});

			return Parse.Config.get()
			.then(function(aConfig){
				resultObject.pusherAppKey = aConfig.get("pusherAppId");
				resultObject.pusherChannel = 'digitalMenu';
				resultObject.pusherEvent = 'reloadRequested';
				response.success(resultObject);	
			});

			

		}, function(error){
			response.error(error);
		});

 	};

 	var _menuGetDetail = function(requestParams){
		try{
	
			//get the menu header first
			if (!requestParams.menuId){
			    throw {
			      message: 'Please provide a Menu ID.',
			      code: '400'
			    };			
			} else {
				console.log('Loading Menu: ' + requestParams.menuId);
			};

			var resultObj = {};
			var responseObject = {};
			var menuHeaderObj = {};
			var taxCodesList;
			var vendor = {};
			var aConfig = {};
			var globalTaxItems = [];
			// var allMenuItems = [];
			var promise = new Parse.Promise();

		   	var MenuHeader = Parse.Object.extend('MenuHeader');
		   	var query = new Parse.Query(MenuHeader);
		   	query.include('vendor');

		   	return Parse.Config.get()
		   	.then(function(theConfig){
		   		aConfig = theConfig;
			   	
			   	return query.get(requestParams.menuId, {useMasterKey:true})
			   	.then(function(aMenuHeaderObj){
			   		//console.log(aMenuHeaderObj);
			   		menuHeaderObj = aMenuHeaderObj;
			   		//_.extend(resultObj, menuHeaderObj);
			   		resultObj.objectId = aMenuHeaderObj.toJSON().objectId;
			   		resultObj.Description = aMenuHeaderObj.get("name");
			   		resultObj.minOrderAmt = aMenuHeaderObj.get("minOrderAmt");
			   		resultObj.minOrderNotice = aMenuHeaderObj.get("minOrderNotice");

			   		vendor = menuHeaderObj.get("vendor");

			   		if (requestParams.includeVendor)
			   			resultObj.vendor = vendor.toJSON();

			   		//load all the tax items for this vendor which are marked as 'applyToAll'
			   		var TaxCodes = Parse.Object.extend("TaxCode");
			   		var taxCodesQuery = new Parse.Query(TaxCodes);
			   		taxCodesQuery.equalTo('vendor', vendor);
			   		//taxCodesQuery.equalTo('applyToAll', true);
			   		//console.log('Result Obj is ' + JSON.stringify(resultObj));

			   		return taxCodesQuery.find();
			   	}).always(function(aTaxCodesList){
			   		var promise = new Parse.Promise();
			   		taxCodesList = aTaxCodesList;
			   		var readConfig = false;
	  		
			   		//now load the ZIP based tax items
			   		console.log('Getting sales tax for Zip code: ' + requestParams.zipCode);
			   		if (requestParams.zipCode){
			   			console.log('getting zip code based tax items....' + requestParams.zipCode);
						var SalesTaxRates = Parse.Object.extend("SalesTaxRates");
						var query = new Parse.Query(SalesTaxRates);
						query.equalTo("zipCode", requestParams.zipCode);
						query.first()
						.then(function(salesTaxRecord){
							console.log('found sales tax: ' + JSON.stringify(salesTaxRecord));
							if (salesTaxRecord){
								// append the salesTaxData to the global tax list
								var percentage =salesTaxRecord.get('combinedRate') * 100; 
								globalTaxItems.push({
									description:'City/State Tax',
									percentage: percentage,
									applyToAll: true,
									objectId: salesTaxRecord.id
								});
							};
						
							//console.log('resolving promise...');
							promise.resolve();
						});	
			   		} else {
						if (taxCodesList)
							for (var i = 0; i < taxCodesList.length; i++){
								if ( taxCodesList[i].get("applyToAll") == true ){

									var taxItemJSON = taxCodesList[i].toJSON();
									delete taxItemJSON.vendor;
									delete taxItemJSON.createdAt;
									delete taxItemJSON.updatedAt;

									globalTaxItems.push(taxItemJSON);
								};
							};
			   			promise.resolve();
			   		}   		

			  		return promise;
			   	}).then(function(){
			   		//get all the menu uption groups for this vendor
			   		if (vendor){
			   			var query = new Parse.Query('MenuItemOptions');
			   			query.equalTo("vendor", vendor);
			   			// query.include(['name','options']);
			   			return query.find()
			   		} else 
			   			return Parse.Promis.as();
			   	
			   	}).then(function(menuItemOptionGroups){
			   		console.log('Menu Item Options Retrieved!');
			   		//convert the menu item option group to JSON
			   		resultObj.menuItemOptionGroups = [];
			   		_.each(menuItemOptionGroups, function(menuItemOptionGroup){
			   			//remove superflous properties
			   			delete menuItemOptionGroup.createdAt;
			   			delete menuItemOptionGroup.updatedAt;
			   			resultObj.menuItemOptionGroups.push(menuItemOptionGroup.toJSON());
			   		});

			   		// if (menuItemOptionGroups)
			   		// 	resultObj.menuItemOptionGroups = menuItemOptionGroups;

			   		console.log('Querying menu categories for Menu Header ' + JSON.stringify(menuHeaderObj));
			   		//tax codes are loaded, go get the categories, menu items
					var MenuCategory = Parse.Object.extend("MenuCategory");
					var query = new Parse.Query(MenuCategory);
					// query.include("menuHeade r.vendor");
					query.equalTo("menuHeader", menuHeaderObj);
					query.ascending("displayOrder");
					return query.find();
					// .fail(function(){
					// 	console.log('no categories found for ' + resultObj.objectId);
					// 	response.success(resultObj); //no categories found, just return the header
					// })
				}).then(function(menuCategories){
					console.log('Found ' + menuCategories.length + ' categories for menu');
					resultObj.categories = [];

					//if there are no menu categories then there are no menu items
					// so we are don here.
					if (!menuCategories || menuCategories.length == 0){
						console.log('No Menu Categories Found');
						return Parse.Promise.as();
					};

					var promises = [];
					//for each menu category get the menu items
					_.each(menuCategories, function(aMenuCategory, menuCategoryIndex) {
						console.log('getting menu items for category...');
						var promise = new Parse.Promise();
						promises.push(promise);

						// console.log('Processing menu category ' + aMenuCategory.id);
						var menuCategory = aMenuCategory.toJSON();
						delete menuCategory.menuHeader;
						resultObj.categories.push(menuCategory);

						var query = new Parse.Query("MenuItemDisplay");
						// console.log('Menu Category is ' + JSON.stringify(aMenuCategory));
						query.equalTo("menuCategory", aMenuCategory);

						if (requestParams.clientType == 'MOBILEAPP'){
							// console.log('call for MOBILEAPP!!');
							query.equalTo("onlineOrderingAvailable", true);
						};

						query.include(['menuItem']);
						query.ascending("displayOrder");
						// console.log('calling query.find for Category: ' + JSON.stringify(query));
						// console.log(query);
						query.find()
						.then(function(menuItemsDisplay){
							// console.log('I will make you famous' + JSON.stringify(menuItemsDisplay));

							console.log('No of Menu Items found are ' + menuItemsDisplay.length);
							if (menuItemsDisplay.length == 0){ 
								promise.resolve(); //no menu items assigned, move on
							};

							if (!menuCategory.menuItems) 
								menuCategory.menuItems = [];

							_.each(menuItemsDisplay, function(aMenuItemDisplay, menuItemIndex){
								// console.log('--')
								console.log('Procesing ASSOCIATED menu item ' + JSON.stringify(aMenuItemDisplay.get("menuItem")));

								if (aMenuItemDisplay.get("menuItem")){
									var menuItem = aMenuItemDisplay.get("menuItem").toJSON();
									
									delete menuItem.menuCategory;

									var aMenuItem = aMenuItemDisplay.get("menuItem");
									menuItem.displayOrder = aMenuItemDisplay.get("displayOrder");
									//check for override pricing
									var overridePricingArray = aMenuItemDisplay.get("overridePricing");
									if (overridePricingArray && overridePricingArray.length > 0)
										menuItem.prices = overridePricingArray.splice(0);

									console.log('tax exempt is ' + aMenuItem.get("globalTaxExempt"));

									//default global Tax Exempt to False (if undefinde)
									if (aMenuItem.get("globalTaxExempt") == undefined){
										menuItem.globalTaxExempt = false;
										console.log('defaulting tax exempt to false');
									} else {
										console.log('defaulting tax exempt to true');
									};

									if (aMenuItem.get("printToKT") == undefined)
										menuItem.printToKT = true;

								} 
									else return null;


								// //convert to SSL Url
								if (requestParams.clientType == 'MOBILEAPP'){
									if (menuItem.picture) {
										menuItem.pictureObj= menuItem.picture;
										// menuItem.picture = menuItem.picture.url;
										// console.log(menuItem.picture.name);
										menuItem.picture = getSecureUrl(menuItem.picture.url);

									};

									if (menuItem.menuItemImage){
										menuItem.pictureObj= menuItem.menuItemImage;
										menuItem.picture = aConfig.get("fileStoreUrl") + menuItem.menuItemImage.name;								
									}									
								} else 
									if (menuItem.menuItemImage){
										menuItem.pictureObj= menuItem.menuItemImage;
										menuItem.picture = aConfig.get("fileStoreUrl") + menuItem.menuItemImage.name;								
									}

								console.log('Picture URL is ' + menuItem.picture);

								// console.log('dealing with modifiers');
								// if (menuItem.modifiers && !menuItem.legacyOptionGroup){
								// 	// console.log('Processing modifiers for item ' + aMenuItem.id);
								// 	for (var l = 0; l < menuItem.modifiers.length; l++) {
								//     	var modifier = menuItem.modifiers[l];
								//     	//console.log('Modifier is ' + modifier);
								//         if (!modifier.modifierId) {
								//         	modifier.modifierId = menuItem.objectId + padZeros(l + 1, 4);
								//         }
	       //  						}
								// };

								//these are the legacy modifieres which we no longer use
								//the new version if aclled optionGroups
								delete menuItem.modifiers;

								// console.log('Modifiers Done');

								// console.log('dealing with taxes');
								var menuItemTaxes = aMenuItem.get("taxes");
								//get all the taxitems in the menuItem and replace them with the actual tax items
								if (!menuItemTaxes)
									menuItem.taxes = []
								else 

									// see if the item has any taxCodes directly assigned to it
									for (var j = 0; j < menuItemTaxes.length; j++){
										//find this taxId in the taxItems
										for (var k = 0; k < taxCodesList.length ; k++){
											var aTaxItemJSON = taxCodesList[k].toJSON();

											//console.log("**" + aTaxItemJSON.objectId + "**");
											if ( aTaxItemJSON.objectId == menuItemTaxes[j].taxId ){
												delete aTaxItemJSON.vendor;
												delete aTaxItemJSON.createdAt;
												delete aTaxItemJSON.updatedAt;
												menuItem.taxes[j] = aTaxItemJSON; //overwrite the existig record with the full record
											};
										};		
									};
								
								//adding global taxes to menu item (if not exempt)
								if (globalTaxItems.length > 0 && menuItem.globalTaxExempt != true)
									menuItem.taxes.push.apply(menuItem.taxes, globalTaxItems);	
								// console.log('Taxes Done');
								// console.log('item tax items are now ' + JSON.stringify(menuItem.taxes));
								//if no truck
								if (requestParams.truckId){
									// console.log('truck has been specified. check for menu item status records');
									//for this item, check its status
									var Truck = Parse.Object.extend("Truck");
									var truckObject = new Truck();
									truckObject.id = requestParams.truckId;
									var aQuery = new Parse.Query('MenuItemStatus');
									aQuery.equalTo("truck", truckObject);
									aQuery.equalTo("menuItem", aMenuItem);
									//console.log('loooking for menu item status records ' + aMenuItem.id);
									aQuery.find()
									.always(function(menuItemStatus){
										if (menuItemStatus && menuItemStatus.length > 0){
											// console.log('getting menu item status from ' + JSON.stringify(menuItemStatus));
											menuItem.status = menuItemStatus[0].get("status");
										} else 
											menuItem.status = const_inStock; //default as in stock

										//console.log('menu item status set!');
										if (menuItemIndex == (menuItemsDisplay.length - 1) ){
											menuCategory.menuItems.push(menuItem);
											//console.log('resolving at 614. ' + menuCategory.menuItems.length + ' items in CATEGORY');
											promise.resolve(); //this resolves when ALL the menu items have been processed
															//it will trigger the .always processing below
										};
									}); 
								} else {
									// console.log('Menu Item index is ' + menuItemIndex);
									// console.log('No truck Id provided');
									if (menuItemsDisplay)
										if (menuItemIndex == (menuItemsDisplay.length - 1) ){		
											menuCategory.menuItems.push(menuItem);
											//console.log('resolving at 625. ' + menuCategory.menuItems.length + ' items in CATEGORY');
											promise.resolve(); //this resolves when ALL the menu items have been processed
															//it will trigger the .always processing below
										};
								};
								//add this menu item to the category if it is not the last one
								// the last item is done above just beofre the promise resolution.
								if (menuItemIndex != (menuItemsDisplay.length - 1))
									menuCategory.menuItems.push(menuItem);
						 	}); //end of _.each
						});			
					});		
					return Parse.Promise.when(promises);
				});
			}).then(function(){
				// var aPromise = new Parse.Promise();
				// //if there is a printful API Key then load the item from the
				// //printful shop
				// // if (vendor.get("printfulAPI") ){
				// 	var PrintfulClient = require('./printfulclient.js');
				// 	var pf = new PrintfulClient('aax4w4xn-rtzt-rcqf:lzdk-jknhm0exd5lq');

				//     var ok_callback = function(data, info){
				//         console.log('SUCCESS');
				//         console.log(data);
				//         //If response includes paging information, show total number available
				//         _.each(data, function(anItem){
				//         	console.log(JSON.stringify(anItem));
				//         })
				//     };

				//     var error_callback = function(message, info){
				//         console.log('ERROR ' + message);
				//         //Dump raw response
				//         console.log(info.response_raw);
				//     };


				// 	//Get product list
    // 				pf.get('products').success(ok_callback).error(error_callback);
				// } else 
					return Parse.Promise.as(resultObj);

					// return aPromise;

			}, function(error){
				return Parse.Promise.error(error);
			});		

		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});
		}
 	};

    var menuGetDetail = function(request, response){
		// var requestParams = request.params;
        var requestParams = request.params;

		return this._menuGetDetail(requestParams)
		.then(function(resultObject){
			response.success(resultObject);
		}, function(error){
			response.error(error);
		});	
    };

  //   var menuGetDetail = function(request, response){
		// try{
	
		// 	//get the menu header first
		// 	requestParams = request.params;
		// 	console.log('menuGetDetail Request Params are :' +  JSON.stringify(requestParams));
		// 	if (!requestParams.menuId){
		// 	    throw {
		// 	      message: 'Please provide a Menu ID.',
		// 	      code: '400'
		// 	    };			
		// 	} else {
		// 		console.log('Loading Menu: ' + requestParams.menuId);
		// 	};

		// 	var resultObj = {};
		// 	var responseObject = {};
		// 	var menuHeaderObj = {};
		// 	var taxCodesList;
		// 	var vendor = {};
		// 	var aConfig = {};
		// 	var globalTaxItems = [];
		// 	// var allMenuItems = [];
		// 	var promise = new Parse.Promise();

		//    	var MenuHeader = Parse.Object.extend('MenuHeader');
		//    	var query = new Parse.Query(MenuHeader);
		//    	query.include('vendor');

		//    	Parse.Config.get()
		//    	.then(function(theConfig){
		//    		aConfig = theConfig;
			   	
		// 	   	return query.get(requestParams.menuId, {useMasterKey:true})
		// 	   	.then(function(aMenuHeaderObj){
		// 	   		//console.log(aMenuHeaderObj);
		// 	   		menuHeaderObj = aMenuHeaderObj;
		// 	   		//_.extend(resultObj, menuHeaderObj);
		// 	   		resultObj.objectId = aMenuHeaderObj.toJSON().objectId;
		// 	   		resultObj.Description = aMenuHeaderObj.get("name");
		// 	   		resultObj.minOrderAmt = aMenuHeaderObj.get("minOrderAmt");
		// 	   		resultObj.minOrderNotice = aMenuHeaderObj.get("minOrderNotice");

		// 	   		vendor = menuHeaderObj.get("vendor");

		// 	   		if (requestParams.includeVendor)
		// 	   			resultObj.vendor = vendor.toJSON();

		// 	   		//load all the tax items for this vendor which are marked as 'applyToAll'
		// 	   		var TaxCodes = Parse.Object.extend("TaxCode");
		// 	   		var taxCodesQuery = new Parse.Query(TaxCodes);
		// 	   		taxCodesQuery.equalTo('vendor', vendor);
		// 	   		//taxCodesQuery.equalTo('applyToAll', true);
		// 	   		//console.log('Result Obj is ' + JSON.stringify(resultObj));

		// 	   		return taxCodesQuery.find();
		// 	   	}).always(function(aTaxCodesList){
		// 	   		var promise = new Parse.Promise();
		// 	   		taxCodesList = aTaxCodesList;
		// 	   		var readConfig = false;
	  		
		// 	   		//now load the ZIP based tax items
		// 	   		console.log('Getting sales tax for Zip code: ' + requestParams.zipCode);
		// 	   		if (requestParams.zipCode){
		// 	   			console.log('getting zip code based tax items....' + requestParams.zipCode);
		// 				var SalesTaxRates = Parse.Object.extend("SalesTaxRates");
		// 				var query = new Parse.Query(SalesTaxRates);
		// 				query.equalTo("zipCode", requestParams.zipCode);
		// 				query.first()
		// 				.then(function(salesTaxRecord){
		// 					console.log('found sales tax: ' + JSON.stringify(salesTaxRecord));
		// 					if (salesTaxRecord){
		// 						// append the salesTaxData to the global tax list
		// 						var percentage =salesTaxRecord.get('combinedRate') * 100; 
		// 						globalTaxItems.push({
		// 							description:'City/State Tax',
		// 							percentage: percentage,
		// 							applyToAll: true,
		// 							objectId: salesTaxRecord.id
		// 						});
		// 					};
						
		// 					//console.log('resolving promise...');
		// 					promise.resolve();
		// 				});	
		// 	   		} else {
		// 				if (taxCodesList)
		// 					for (var i = 0; i < taxCodesList.length; i++){
		// 						if ( taxCodesList[i].get("applyToAll") == true ){

		// 							var taxItemJSON = taxCodesList[i].toJSON();
		// 							delete taxItemJSON.vendor;
		// 							delete taxItemJSON.createdAt;
		// 							delete taxItemJSON.updatedAt;

		// 							globalTaxItems.push(taxItemJSON);
		// 						};
		// 					};
		// 	   			promise.resolve();
		// 	   		}   		

		// 	  		return promise;
		// 	   	}).then(function(){
		// 	   		//get all the menu uption groups for this vendor
		// 	   		if (vendor){
		// 	   			var query = new Parse.Query('MenuItemOptions');
		// 	   			query.equalTo("vendor", vendor);
		// 	   			// query.include(['name','options']);
		// 	   			return query.find()
		// 	   		} else 
		// 	   			return Parse.Promis.as();
			   	
		// 	   	}).then(function(menuItemOptionGroups){
		// 	   		console.log('Menu Item Options Retrieved!');
		// 	   		//convert the menu item option group to JSON
		// 	   		resultObj.menuItemOptionGroups = [];
		// 	   		_.each(menuItemOptionGroups, function(menuItemOptionGroup){
		// 	   			//remove superflous properties
		// 	   			delete menuItemOptionGroup.createdAt;
		// 	   			delete menuItemOptionGroup.updatedAt;
		// 	   			resultObj.menuItemOptionGroups.push(menuItemOptionGroup.toJSON());
		// 	   		});

		// 	   		// if (menuItemOptionGroups)
		// 	   		// 	resultObj.menuItemOptionGroups = menuItemOptionGroups;

		// 	   		console.log('Querying menu categories for Menu Header ' + JSON.stringify(menuHeaderObj));
		// 	   		//tax codes are loaded, go get the categories, menu items
		// 			var MenuCategory = Parse.Object.extend("MenuCategory");
		// 			var query = new Parse.Query(MenuCategory);
		// 			// query.include("menuHeade r.vendor");
		// 			query.equalTo("menuHeader", menuHeaderObj);
		// 			query.ascending("displayOrder");
		// 			return query.find();
		// 			// .fail(function(){
		// 			// 	console.log('no categories found for ' + resultObj.objectId);
		// 			// 	response.success(resultObj); //no categories found, just return the header
		// 			// })
		// 		}).then(function(menuCategories){
		// 			console.log('Found ' + menuCategories.length + ' categories for menu');
		// 			resultObj.categories = [];

		// 			//if there are no menu categories then there are no menu items
		// 			// so we are don here.
		// 			if (!menuCategories || menuCategories.length == 0){
		// 				console.log('No Menu Categories Found');
		// 				return Parse.Promise.as();
		// 			};

		// 			var promises = [];
		// 			//for each menu category get the menu items
		// 			_.each(menuCategories, function(aMenuCategory, menuCategoryIndex) {
		// 				console.log('getting menu items for category...');
		// 				var promise = new Parse.Promise();
		// 				promises.push(promise);

		// 				// console.log('Processing menu category ' + aMenuCategory.id);
		// 				var menuCategory = aMenuCategory.toJSON();
		// 				delete menuCategory.menuHeader;
		// 				resultObj.categories.push(menuCategory);

		// 				var query = new Parse.Query("MenuItemDisplay");
		// 				// console.log('Menu Category is ' + JSON.stringify(aMenuCategory));
		// 				query.equalTo("menuCategory", aMenuCategory);

		// 				if (requestParams.clientType == 'MOBILEAPP'){
		// 					// console.log('call for MOBILEAPP!!');
		// 					query.equalTo("onlineOrderingAvailable", true);
		// 				};

		// 				query.include(['menuItem']);
		// 				query.ascending("displayOrder");
		// 				// console.log('calling query.find for Category: ' + JSON.stringify(query));
		// 				// console.log(query);
		// 				query.find()
		// 				.then(function(menuItemsDisplay){
		// 					// console.log('I will make you famous' + JSON.stringify(menuItemsDisplay));

		// 					console.log('No of Menu Items found are ' + menuItemsDisplay.length);
		// 					if (menuItemsDisplay.length == 0){ 
		// 						promise.resolve(); //no menu items assigned, move on
		// 					};

		// 					if (!menuCategory.menuItems) 
		// 						menuCategory.menuItems = [];

		// 					_.each(menuItemsDisplay, function(aMenuItemDisplay, menuItemIndex){
		// 						// console.log('--')
		// 						console.log('Procesing ASSOCIATED menu item ' + JSON.stringify(aMenuItemDisplay.get("menuItem")));

		// 						if (aMenuItemDisplay.get("menuItem")){
		// 							var menuItem = aMenuItemDisplay.get("menuItem").toJSON();
									
		// 							delete menuItem.menuCategory;

		// 							var aMenuItem = aMenuItemDisplay.get("menuItem");
		// 							menuItem.displayOrder = aMenuItemDisplay.get("displayOrder");
		// 							//check for override pricing
		// 							var overridePricingArray = aMenuItemDisplay.get("overridePricing");
		// 							if (overridePricingArray && overridePricingArray.length > 0)
		// 								menuItem.prices = overridePricingArray.splice(0);

		// 							console.log('tax exempt is ' + aMenuItem.get("globalTaxExempt"));

		// 							//default global Tax Exempt to False (if undefinde)
		// 							if (aMenuItem.get("globalTaxExempt") == undefined){
		// 								menuItem.globalTaxExempt = false;
		// 								console.log('defaulting tax exempt to false');
		// 							} else {
		// 								console.log('defaulting tax exempt to true');
		// 							};

		// 							if (aMenuItem.get("printToKT") == undefined)
		// 								menuItem.printToKT = true;

		// 						} 
		// 							else return null;


		// 						// //convert to SSL Url
		// 						if (requestParams.clientType == 'MOBILEAPP'){
		// 							if (menuItem.picture) {
		// 								menuItem.pictureObj= menuItem.picture;
		// 								// menuItem.picture = menuItem.picture.url;
		// 								// console.log(menuItem.picture.name);
		// 								menuItem.picture = getSecureUrl(menuItem.picture.url);

		// 							};

		// 							if (menuItem.menuItemImage){
		// 								menuItem.pictureObj= menuItem.menuItemImage;
		// 								menuItem.picture = aConfig.get("fileStoreUrl") + menuItem.menuItemImage.name;								
		// 							}									
		// 						} else 
		// 							if (menuItem.menuItemImage){
		// 								menuItem.pictureObj= menuItem.menuItemImage;
		// 								menuItem.picture = aConfig.get("fileStoreUrl") + menuItem.menuItemImage.name;								
		// 							}

		// 						console.log('Picture URL is ' + menuItem.picture);

		// 						// console.log('dealing with modifiers');
		// 						if (menuItem.modifiers){
		// 							// console.log('Processing modifiers for item ' + aMenuItem.id);
		// 							for (var l = 0; l < menuItem.modifiers.length; l++) {
		// 						    	var modifier = menuItem.modifiers[l];
		// 						    	//console.log('Modifier is ' + modifier);
		// 						        if (!modifier.modifierId) {
		// 						        	modifier.modifierId = menuItem.objectId + padZeros(l + 1, 4);
		// 						        }
	 //        						}
		// 						};
		// 						// console.log('Modifiers Done');

		// 						// console.log('dealing with taxes');
		// 						var menuItemTaxes = aMenuItem.get("taxes");
		// 						//get all the taxitems in the menuItem and replace them with the actual tax items
		// 						if (!menuItemTaxes)
		// 							menuItem.taxes = []
		// 						else 

		// 							// see if the item has any taxCodes directly assigned to it
		// 							for (var j = 0; j < menuItemTaxes.length; j++){
		// 								//find this taxId in the taxItems
		// 								for (var k = 0; k < taxCodesList.length ; k++){
		// 									var aTaxItemJSON = taxCodesList[k].toJSON();

		// 									//console.log("**" + aTaxItemJSON.objectId + "**");
		// 									if ( aTaxItemJSON.objectId == menuItemTaxes[j].taxId ){
		// 										delete aTaxItemJSON.vendor;
		// 										delete aTaxItemJSON.createdAt;
		// 										delete aTaxItemJSON.updatedAt;
		// 										menuItem.taxes[j] = aTaxItemJSON; //overwrite the existig record with the full record
		// 									};
		// 								};		
		// 							};
								
		// 						//adding global taxes to menu item (if not exempt)
		// 						if (globalTaxItems.length > 0 && menuItem.globalTaxExempt != true)
		// 							menuItem.taxes.push.apply(menuItem.taxes, globalTaxItems);	
		// 						// console.log('Taxes Done');
		// 						// console.log('item tax items are now ' + JSON.stringify(menuItem.taxes));
		// 						//if no truck
		// 						if (requestParams.truckId){
		// 							// console.log('truck has been specified. check for menu item status records');
		// 							//for this item, check its status
		// 							var Truck = Parse.Object.extend("Truck");
		// 							var truckObject = new Truck();
		// 							truckObject.id = requestParams.truckId;
		// 							var aQuery = new Parse.Query('MenuItemStatus');
		// 							aQuery.equalTo("truck", truckObject);
		// 							aQuery.equalTo("menuItem", aMenuItem);
		// 							//console.log('loooking for menu item status records ' + aMenuItem.id);
		// 							aQuery.find()
		// 							.always(function(menuItemStatus){
		// 								if (menuItemStatus && menuItemStatus.length > 0){
		// 									// console.log('getting menu item status from ' + JSON.stringify(menuItemStatus));
		// 									menuItem.status = menuItemStatus[0].get("status");
		// 								} else 
		// 									menuItem.status = const_inStock; //default as in stock

		// 								//console.log('menu item status set!');
		// 								if (menuItemIndex == (menuItemsDisplay.length - 1) ){
		// 									menuCategory.menuItems.push(menuItem);
		// 									//console.log('resolving at 614. ' + menuCategory.menuItems.length + ' items in CATEGORY');
		// 									promise.resolve(); //this resolves when ALL the menu items have been processed
		// 													//it will trigger the .always processing below
		// 								};
		// 							}); 
		// 						} else {
		// 							// console.log('Menu Item index is ' + menuItemIndex);
		// 							// console.log('No truck Id provided');
		// 							if (menuItemsDisplay)
		// 								if (menuItemIndex == (menuItemsDisplay.length - 1) ){		
		// 									menuCategory.menuItems.push(menuItem);
		// 									//console.log('resolving at 625. ' + menuCategory.menuItems.length + ' items in CATEGORY');
		// 									promise.resolve(); //this resolves when ALL the menu items have been processed
		// 													//it will trigger the .always processing below
		// 								};
		// 						};
		// 						//add this menu item to the category if it is not the last one
		// 						// the last item is done above just beofre the promise resolution.
		// 						if (menuItemIndex != (menuItemsDisplay.length - 1))
		// 							menuCategory.menuItems.push(menuItem);
		// 				 	}); //end of _.each
		// 				});			
		// 			});		
		// 			return Parse.Promise.when(promises);
		// 		});
		// 	}).then(function(){
		// 		response.success(resultObj);
		// 	}, function(error){
		// 			response.error(error);
		// 	});		

		// } catch(error){
		// 	console.log('An error has been caught...');
		// 	console.error(error);
		// 	response.error({"message":error.message, "code":error.code});
		// }
  //   };

    var menuDeleteById = function(request, response){
		console.log('Request received for menuDeleteById');
		var bodyParams = request.params;
		var menuToDelete;
		var Menu = Parse.Object.extend("MenuHeader");
		var aMenuHeaderQuery = new Parse.Query(Menu);
		aMenuHeaderQuery.get(bodyParams.menuId)
		.then(function(aMenuHeader){
			menuToDelete = aMenuHeader;
			//now get the catgories
			var aMenuCategoryQuery = new Parse.Query("MenuCategory");
			aMenuCategoryQuery.equalTo("menuHeader", aMenuHeader);
			return aMenuCategoryQuery.find();
		})
		.fail(function(){
			//if no categories are found, just delete the header and be done 
			if (menuToDelete)
				menuToDelete.destroy()
				.then(function(){
					response.success({});	
				});	
			else
				response.success({});	
		})
		.then(function(menuCategoryRecords){
			console.log('Found ' + menuCategoryRecords.length + ' menu category records');
			var promise = Parse.Promise.as();
			// for each category we are going to call delete
			_.each(menuCategoryRecords, function(aMenuCategory){
				console.log('Processing ' + JSON.stringify(aMenuCategory));
				//this method will delete all categories and menu items
				promise = promise.then(function(){
					return Parse.Cloud.run("menuCategoryDeleteById",{ menuCategoryId: aMenuCategory.id })	
				});
			});
			return promise;
		}).then(function(){
			//delete the menuHeader
			menuToDelete.destroy()
			.then(function(){
				response.success({});	
			});
			
		});
    };

    var menuCategoryDeleteById = function(request, response){
		try{
		console.log('Request received for menuCategoryDeleteById');
		var bodyParams = request.params;
		var menuCatToDelete;
		var MenuCategory = Parse.Object.extend("MenuCategory");
		var menuCatquery = new Parse.Query("MenuCategory");
		console.log('Searching for category ' + bodyParams.menuCategoryId);

		//this will load both the menuHeader and the vendor
		menuCatquery.include("menuHeader.vendor")
		menuCatquery.get(bodyParams.menuCategoryId, {useMasterKey:true})
		.then(function(aMenuCategory){
			console.log('category is ' + JSON.stringify(aMenuCategory));
			menuCatToDelete = aMenuCategory;
			var query = new Parse.Query("MenuItemDisplay");
			query.equalTo("menuCategory", aMenuCategory);
			return query.find();
		})
		.fail(function(anError){
			console.log('No items found' + JSON.stringify(anError));
			//if an error occurs just ignore
			menuCatToDelete.destroy()
			.then(function(){
				response.success({});	
			});
		})
		.then(function(menuItemDisplayRecords){
			console.log('Found ' + menuItemDisplayRecords.length + " Display menu items");
			var promises = [];
			_.each(menuItemDisplayRecords, function(menuItemDisplayRecord){
				promises.push(menuItemDisplayRecord.destroy());
			});			
			return Parse.Promise.when(promises);
		}).then(function(){
			console.log('success!');
			menuCatToDelete.destroy()
			.then(function(){
				response.success({});	
			}); 
		});

		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});		
		};
    };

    var menuCategoryCreate = function(request, response){
		try{ 
			console.log("menu Category Create CALL Received");
			function checkIfDuplicateCategory(requestParams, menuObj){
				var promise = new Parse.Promise();
				console.log("check if Duplicate exists");
				var MenuCategory = Parse.Object.extend("MenuCategory");
				var query = new Parse.Query(MenuCategory);
				query.equalTo("name", requestParams.menuDesc);
				query.equalTo("menuHeader", menuObj);
				query.find().then(function(results){
						//return results;
						if (results.length > 0)
							promise.resolve(true)
						else 
							promise.resolve(false);
					});
				return promise;  			
			}
			var bodyParams = request.params;

		   	//create menu
		   	var MenuHeader = Parse.Object.extend('MenuHeader');
		   	var query = new Parse.Query(MenuHeader);
		   	query.get(bodyParams.menuObj._id, {
		   		success: function(aMenuObj){
					   	//Check if menu all ready exists
					   	checkIfDuplicateCategory(bodyParams, aMenuObj)
					   	.then(function(duplicateFound){
					   		if (duplicateFound)
					   			response.success({"message":"Category " + bodyParams.categoryName + " all ready exists", "code":101})
					   		else {
						  		//create a new Menu Category entry
						  		var MenuCategory = Parse.Object.extend("MenuCategory");
						  		var menuCategory = new MenuCategory();
						  		menuCategory.set("menuHeader", aMenuObj);
						  		menuCategory.set("name", bodyParams.categoryName);
						  		menuCategory.set("visible", bodyParams.categoryVisible);
						  		menuCategory.set('displayOrder', bodyParams.displayOrder);
						  		menuCategory.save(null, {
						  			success:function(aMenuCategory){
						  				console.log(aMenuCategory); 
						  				response.success({"_id": aMenuCategory.id, "_createdAt": aMenuCategory.createdAt});
						  			},
						  			error: function(aMenuHeader, error){
						  				response.success({"message":error.message, "code":error.code});
						  			}
						  		});
						  	} 

						  });

					   }, 
					   error: function(object, error){
					   	response.error({"message":'Menu with ID ' + bodyParams.menuObj._id + ' not found', "code":error.code});
					   }
					});



		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});
		};
    };

    var reorderDisplayOrder = function(request, response){
    	//1. Get the item and its NEW display order
    	//2. Get the item and its CURRENT display order
    	//3. Loop through every menu item between current and new display order (not including current and new)
    	//   and reduce the display order by 1.
    	//4. Return the items that we modified so that the client can have the latest display Order
    		requestParams = request.params;
    		var currentDisplayOrder = 0;
			var updateArray = [];
    		//1. Get all the items for the vendor
    		//2. Get all the items assigned to the category
    		if (!requestParams.vendor){
			    throw {
			      message: 'Please provide a vendor',
			      code: '400'
			    };			
			};

			console.log('Params are ' + JSON.stringify(requestParams));

			var aMenuItem = {__type:"Pointer", className:"MenuItem", objectId:requestParams.objectId};

			//1.load the category
			Parse.Promise.as()
			.then(function(){
				var query = new Parse.Query('MenuItemDisplay');
				console.log('New Display Order is ' + requestParams.displayOrder);
				console.log('loading display records for category ' + requestParams.menuCategory);
				query.equalTo('menuCategory', requestParams.menuCategory);
				query.include('menuItem');
				query.ascending('displayOrder');
				// query.include('menuCategory.menuHeader.vendor');
				return query.find();
			}).then(function(menuItemDisplayRecords){
				var directionFactor = 0;
				var endDisplayOrder;
				var startDisplayOrder;

				console.log('found ' + menuItemDisplayRecords.length + ' display records');

				//we need to establish if we are moving the  menu item UP or DOWN the list as this 
				// will dictate whether we need to subtract or add to the current displayOrder
				//1. If we are moving an item DOWN the list (ie. from position 2 to position 7)
				//   then we subtract the displayOrder of all the items between
				//2. BUT if we move an item UP the list (ie. from position 6 to position 2)
				//   then we need to add to the displayOrder for all the items between

				console.log('Searching for requestParams.objectId');

				var currentDisplayRecord = _.find(menuItemDisplayRecords, function(aDisplayRecord){
					// console.log('Checking menu item ' + aDisplayRecord.get("menuItem").id);

					if (aDisplayRecord.get("menuItem").id == requestParams.objectId){
						console.log('display order record found!! It is ' + aDisplayRecord.id);
						return aDisplayRecord; 
					}
				});

				console.log('Target Display Record is ' + JSON.stringify(currentDisplayRecord));

				if (currentDisplayRecord){
					var currentDisplayOrder = currentDisplayRecord.get("displayOrder");
					
					if (currentDisplayOrder > requestParams.displayOrder){
						console.log('-1');
						//moving the item is physically moving up the list (ie. 4 -> 2)
						directionFactor = -1; //by making it negative we add, because minus a 'minus' is positive
						startDisplayOrder = requestParams.displayOrder;  
						endDisplayOrder = currentDisplayOrder-1; // we subtract 1 so that the loop will exclude the item being moved 
					}
					else {
						//item is moving down the list (ie. 2 -> 4)
						console.log('+1');
						directionFactor = 1;
						requestParams.displayOrder = requestParams.displayOrder - 1;
						startDisplayOrder = currentDisplayOrder+1;
						endDisplayOrder = requestParams.displayOrder; // we subtract 1 so that the loop will exclude the item being moved 
					
					};

					console.log('Item current display order is ' + currentDisplayOrder);
					console.log('Target display order is ' + requestParams.displayOrder);
					console.log('Start Display Order ' + startDisplayOrder);
					console.log('End Display Order ' + endDisplayOrder);
					console.log('Direction Factor ' + directionFactor);
				} else {
					//should never happen
				    throw {
				      message: 'Menu Item not found in Category',
				      code: '400'
				    };	
				}
			// 	response.success();
			// });
				_.each(menuItemDisplayRecords, function(aMenuDisplayItem, arrayIndex){
					//we have reached the end of the update set the factor to 0 and be done
					// console.log("checking " + aMenuDisplayItem.get("menuItem").id);

					if (aMenuDisplayItem.get("displayOrder") >= startDisplayOrder 
						&&  aMenuDisplayItem.get("displayOrder") <= endDisplayOrder){

						//dont process the item being moved as we do that outside of the loop
						var newDisplayOrder = aMenuDisplayItem.get("displayOrder") - directionFactor;
						
						//check for edge case
						// if (newDisplayOrder == 0)
						// 	newDisplayOrder = 1;

						console.log('Changing ' + aMenuDisplayItem.id + ' from ' + aMenuDisplayItem.get("displayOrder") + " to " + newDisplayOrder);
						
						aMenuDisplayItem.set("displayOrder", newDisplayOrder);
						updateArray.push(aMenuDisplayItem);
					};						
				});	

				//update the displayOrder of the target display record
				if (directionFactor == 1){
					var newDisplayOrder = requestParams.displayOrder;
					console.log('Changing TARGET (1)' + currentDisplayRecord.id + ' from ' + currentDisplayRecord.get("displayOrder") + " to " + newDisplayOrder);
					currentDisplayRecord.set("displayOrder", newDisplayOrder);
				} else {
					var newDisplayOrder = requestParams.displayOrder;
					console.log('Changing TARGET (-1)' + currentDisplayRecord.id + ' from ' + currentDisplayRecord.get("displayOrder") + " to " + newDisplayOrder);
					currentDisplayRecord.set("displayOrder", newDisplayOrder);
				};

				updateArray.push(currentDisplayRecord);

				console.log('saveAll...'); // + JSON.stringify(updateArray));
		  		return Parse.Object.saveAll(updateArray)

			}).then(function(savedObjects){
				var resultArray = []
				_.each(updateArray, function(aRecord){
					var resultRecord = aRecord.get("menuItem").toJSON();
					resultRecord.displayOrder = aRecord.get("displayOrder");
					resultArray.push(resultRecord);
				});
				response.success(resultArray);
			}, function(error){
				response.error(error);
			});
    };

    var displayOrderSet = function(request,response) {
    	try {
    		requestParams = request.params;
			var resultArray = [];
    		//1. Get all the items for the vendor
    		//2. Get all the items assigned to the category
    		if (!requestParams.vendor){
			    throw {
			      message: 'Please provide a vendor',
			      code: '400'
			    };			
			};

			console.log('Params are ' + JSON.stringify(requestParams));

			var aMenuItem = null;

			//1.load the category
			Parse.Promise.as()
			.then(function(){
				//load the menu Item from the DB
				var menuItemQuery = new Parse.Query('MenuItem');
				return menuItemQuery.get(requestParams.objectId)
			}).then(function(resultMenuItem){
				aMenuItem = resultMenuItem;

				var query = new Parse.Query('MenuItemDisplay');
				console.log('Display Order is ' + requestParams.displayOrder);

				// query.equalTo('menuItem', aMenuItem);
				query.equalTo('menuCategory', requestParams.menuCategory);
				query.greaterThanOrEqualTo("displayOrder", requestParams.displayOrder);
				query.include('menuItem');
				query.ascending('displayOrder');
				// query.include('menuCategory.menuHeader.vendor');
				return query.find();
			}).then(function(menuItemDisplayRecords){
				console.log('menu item display records found: ' + menuItemDisplayRecords.length);
				//no existing items for category
				if (menuItemDisplayRecords.length == 0){
					//this is just a straight forward create
			  		var MenuItemDisplay = Parse.Object.extend("MenuItemDisplay");
			  		var aMenuItemDisplay = new MenuItemDisplay();
			  		aMenuItemDisplay.set("menuItem", aMenuItem);
			  		aMenuItemDisplay.set("menuCategory", requestParams.menuCategory);
			  		aMenuItemDisplay.set("displayOrder", requestParams.displayOrder);
			  		aMenuItemDisplay.set("onlineOrderingAvailable", requestParams.onlineOrderingAvailable);
			  		aMenuItemDisplay.set("vendor", requestParams.vendor);

			  		// console.log('Setting' + aMenuItem.id + " to order " + requestParams.displayOrder);

			  		return aMenuItemDisplay.save();
				} else {
					//there are menu items all ready in this category so we have to update them all
					var updateArray = [];

					_.each(menuItemDisplayRecords, function(aMenuItemDisplay){
						// console.log('for' + aMenuItemDisplay.get("menuItem").get("name") + ' display order is ' + aMenuItemDisplay.get("displayOrder"));
						aMenuItemDisplay.set("displayOrder", aMenuItemDisplay.get("displayOrder") + 1);
						updateArray.push(aMenuItemDisplay);
					});

					//create a new record for the ACTUAL menu item
			  		var MenuItemDisplay = Parse.Object.extend("MenuItemDisplay");
			  		var aNewMenuItemDisplay = new MenuItemDisplay();
			  		aNewMenuItemDisplay.set("menuItem", aMenuItem);
			  		aNewMenuItemDisplay.set("menuCategory", requestParams.menuCategory);
			  		aNewMenuItemDisplay.set("displayOrder", requestParams.displayOrder);
			  		aNewMenuItemDisplay.set("vendor", requestParams.vendor);

			  		// console.log('Setting' + aMenuItem.id + " to order " + requestParams.displayOrder);

			  		updateArray.push(aNewMenuItemDisplay);
					
					console.log('saveAll...');
			  		return Parse.Object.saveAll(updateArray)
				};

			}).then(function(savedObjects){
				
				if (savedObjects.length && savedObjects.length > 0){
					console.log('saved object is ' + JSON.stringify(savedObjects));
					
					var promise = Parse.Promise.as();

					_.each(savedObjects, function(aSavedObject){
						promise = promise.then(function() {
							var theMenuItem = aSavedObject.get("menuItem");
							return theMenuItem.fetch()
							.then(function(){
								var aMenuItemJSON = theMenuItem.toJSON();
								aMenuItemJSON.displayOrder = aSavedObject.get("displayOrder");
								resultArray.push(aMenuItemJSON);								
							});

						});
					});
					return promise;
				} else {
					var theMenuItem = savedObjects.get("menuItem");
					return theMenuItem.fetch()
					.then(function(resultMenuItem){
						var aMenuItemJSON = resultMenuItem.toJSON();
						aMenuItemJSON.displayOrder = requestParams.displayOrder;
						resultArray.push(aMenuItemJSON);								
					});
				};
				
			}).then(function(){
				response.success(resultArray);
			}, function(error){
				response.error(error);
			});

    	} catch(error) {
    		response.error(error);
    	}
    }

    var displayOrderUnset = function(request,response) {
    	try {
    		requestParams = request.params;
			var resultArray = [];
			var objectToDelete = null;
    		//1. Get all the items for the vendor
    		//2. Get all the items assigned to the category
    		if (!requestParams.vendor){
			    throw {
			      message: 'Please provide a vendor',
			      code: '400'
			    };			
			};

			// console.log('Params are ' + JSON.stringify(requestParams));

			var aMenuItem = {__type:"Pointer", className:"MenuItem", objectId:requestParams.objectId};

			//1.load the category
			Parse.Promise.as()
			.then(function(){
				var query = new Parse.Query('MenuItemDisplay');

				console.log('display order is ' + requestParams.displayOrder);

				query.equalTo('menuCategory', requestParams.menuCategory);
				query.greaterThanOrEqualTo("displayOrder", requestParams.displayOrder);
				query.ascending('displayOrder');
				return query.find();
			}).then(function(menuItemDisplayRecords){
				console.log('menu item display records found: ' + menuItemDisplayRecords.length);
				//no existing items for category
					var updateArray = [];

					_.each(menuItemDisplayRecords, function(aMenuItemDisplay){
						console.log(aMenuItemDisplay.get("menuItem").id);

						if (aMenuItemDisplay.get("menuItem").id == requestParams.objectId)
							objectToDelete = aMenuItemDisplay;
						else {
							aMenuItemDisplay.set("displayOrder", aMenuItemDisplay.get("displayOrder") - 1);
							updateArray.push(aMenuItemDisplay);
						}
					});

					// console.log('Object to Delete ' + objectToDelete.id);

					if (objectToDelete){
						console.log('About to delete... ' + objectToDelete.get("menuItem").id);
						return objectToDelete.destroy()
						.then(function(deletedObject){
							console.log('deleted object successfully is ' + deletedObject.id);
							if (updateArray.length > 0){
								console.log('updating display order on other objects');
								return Parse.Object.saveAll(updateArray);
							}
							else {
								console.log('delete only. No update to Display Order required');
								return Parse.Promise.as(deletedObject);
							};
						});
					} 
						else return Parse.Promise.error('Item not currently assigned to category.');


			  		
				// };

			}).then(function(savedObjects){

				if (savedObjects && savedObjects.length > 0){
					
					var promise = Parse.Promise.as();

					_.each(savedObjects, function(aSavedObject){
						promise = promise.then(function() {
							var aMenuItem = aSavedObject.get("menuItem");
							return aMenuItem.fetch()
							.then(function(){
								var aMenuItemJSON = aMenuItem.toJSON();
								aMenuItemJSON.displayOrder = aSavedObject.get("displayOrder");
								resultArray.push(aMenuItemJSON);								
							});

						});
					});
					return promise;
				} else {
					//only one item was deleted and nothing was updated
					return Parse.Promise.as();
				};
				
			}).then(function(){
				console.log('returning success response for displayOrderUnset. resultArray length is ' + resultArray.length);
				response.success(resultArray);
			}, function(error){
				console.log('returning ERROR response for displayOrderUnset');
				response.error(error);
			});

    	} catch(error) {
    		response.error(error);
    	}
    }

    var menuCreateFromCopy = function(request, response){
			
			var bodyParams = request.params;
			var sourceMenu = bodyParams.menuId;
		   	var originalObject;
		   	var newMenu;
		   	var newCategory;
		   	
		   	//request vendor Info also
		   	bodyParams.includeVendor = true;

			Parse.Cloud.run("menuGetDetail",bodyParams)
				
				.then(function(responseObj){
					originalObject = responseObj;
					
					//1. create a new menu Header
					return Parse.Cloud.run("menuCreate",{"vendorId":responseObj.vendor.objectId,"menuDesc":'Copy of ' + responseObj.Description});

				}).then(function(cloudResponse){
					
					var promise = Parse.Promise.as();

					//the cloud function returns a sucess repsonse with an error message in it
					// so check if there is an error code
					if (cloudResponse.code) return Parse.Promise.error(cloudResponse);

					newMenu = cloudResponse;
					
					//2. now we have a new menu header - create the menu categories
					_.each(originalObject.categories, function(menuCategoryJSON, menuCategoryIndex){
						
						promise = promise.then(function(){
							
							var MenuCategory = Parse.Object.extend("MenuCategory");
							var newMenuCategory = new MenuCategory();

							newMenuCategory.set("menuHeader", {"__type":"Pointer", "className":"MenuHeader","objectId":newMenu._id});
							
							if (!menuCategoryJSON.displayOrder) menuCategoryJSON.displayOrder = 0;

							newMenuCategory.set("displayOrder", menuCategoryJSON.displayOrder);
							newMenuCategory.set("name", menuCategoryJSON.name);
							newMenuCategory.set("visible", menuCategoryJSON.visible);

							return newMenuCategory.save()
								.then(function(aNewCategory){
									newCategory = aNewCategory.toJSON();			//convert toJSON
									
									if (!newMenu.categories)
										newMenu.categories = [];

									newMenu.categories.push(newCategory);
									//get the assigned menu items for the 'original' category
							    	var MenuItemDisplay = Parse.Object.extend('MenuItemDisplay');
							    	var query = new Parse.Query(MenuItemDisplay);
							    	query.equalTo("menuCategory", {__type:"Pointer", className:"MenuCategory", objectId:menuCategoryJSON.objectId});
	    							return query.find()									
								}).then(function(menuDisplayRecords){
									//loop through each record and clone it.
									var promises = [];
									_.each(menuDisplayRecords, function(aDisplayRecord){
										var newDisplayRecord = aDisplayRecord.clone();
										newDisplayRecord.set("menuCategory", {__type:"Pointer", className:"MenuCategory", objectId:newCategory.objectId}); //set the NEW category to this record
										if (!bodyParams.copyOverridePricing)
											newDisplayRecord.unset("overridePricing");

										promises.push( newDisplayRecord.save() );
									});
									return Parse.Promise.when(promises);
								});
						});
					})

					return promise;
				}).then(function(){

					response.success({"newId":newMenu._id});

				},function(error){
					response.error(error);
				})
			
    }

    var menuCreate = function(request, response){
		try{ 

			function checkIfDuplicate(requestParams, vendorObj){

				var promise = new Parse.Promise();
				console.log("check if Duplicate exists");
				var MenuHeader = Parse.Object.extend("MenuHeader");
				var query = new Parse.Query(MenuHeader);
				query.equalTo("name", requestParams.menuDesc);
				query.equalTo("vendor", vendorObj);
				query.find().then(function(results){
						//return results;
						if (results.length > 0)
							promise.resolve(true)
						else 
							promise.resolve(false);
					});

				return promise;  			

			}

			var bodyParams = request.params;

	  		//create a new Menu entry
	  		var MenuHeader = Parse.Object.extend("MenuHeader");
	  		var menuHeader = new MenuHeader();

	  		if (!bodyParams.vendorId || bodyParams.vendorId == ""){
	  			response.success({
	  				message: 'Please specify a vendor ID.',
	  				code: '109'
	  			});
	  		}; 

		   	//create menu
		   	var Vendor = Parse.Object.extend('Vendor');
		   	var query = new Parse.Query(Vendor);
		   	query.get(bodyParams.vendorId, {
		   		useMasterKey:true,
		   		success: function(aVendor){
					   	//Check if menu all ready exists
					   	checkIfDuplicate(bodyParams, aVendor)
					   	.then(function(duplicateFound){
					   		if (duplicateFound)
					   			response.success({"message":"Menu " + bodyParams.menuDesc + " all ready exists", "code":101})
					   		else {
					   			menuHeader.set("vendor", aVendor);
					   			menuHeader.set("name", bodyParams.menuDesc);
					   			menuHeader.save(null, {
					   				success:function(aMenuHeader){
					   					console.log(aMenuHeader); 
					   					response.success({"_id": aMenuHeader.id, "_createdAt": aMenuHeader.createdAt});
					   				},
					   				error: function(aMenuHeader, error){
					   					response.error({"message":error.message, "code":error.code});
					   				}
					   			});
					   		} 


					   	});

					   }, 
					   error: function(object, error){
					   	response.error({"message":'Vendor with ID ' + bodyParams.vendorId + ' not found', "code":error.code});
					   }
					});

			} catch(error){
				console.log('An error has been caught...');
				console.error(error);
				response.error({"message":error.message, "code":error.code});
			}
	};
	    
    var setMenuItemsStockStatus = function(request, response) {

    	try {
    		requestParams = request.params;

    		if (!requestParams.truckId){
			    throw {
			      message: 'truckId is required',
			      code: '400'
			    };			
			}

			if(!(requestParams.menuItems && requestParams.menuItems.length) ) {
				throw {
					message: 'menuItems is required with length > 0',
					code: '400'

				}
			}

			var MenuItemStatus = Parse.Object.extend("MenuItemStatus");
			var MenuItem = Parse.Object.extend("MenuItem");
			var Truck = Parse.Object.extend("Truck");

		   	var query = new Parse.Query(MenuItemStatus);
		   	var promises=[];
		   	var truck=new Truck();

		   	truck.id= requestParams.truckId;

		   	_.each(requestParams.menuItems, function(item, index) {

		   		var menuItem= new MenuItem();
		   		menuItem.id= item.ID;

		   		if(item.outOfStock) {			//add a row to the table
		   			
		   			var menuItemStatus=new MenuItemStatus();
		   			menuItemStatus.set("status",const_outOfStock);
		   			menuItemStatus.set("truck",truck);
		   			menuItemStatus.set("menuItem",menuItem);

		   			promises.push(menuItemStatus.save());			//push the save to the promise

		   		}

		   		else {							//delete entry from the table

		   			promises.push((function(){
		   				var promise = new Parse.Promise();

						query.equalTo("menuItem",menuItem);

		   				query.first({
					          success: function(object) {
							        if (object)  
												object.destroy({
								                    success:function() {
								                    	 promise.resolve();			//all good -- object has been deleted
								                    },
								                    error:function(error) {
								                         promise.reject("Failed to delete object");
								                    }
								         });
											else 
												promise.resolve(); //item has all ready been deleted, so assume all is well
					          },
					          error: function(object, error) {
					          	   promise.reject("Failed to find menu item")
					          }
					     });

		   				return promise;
		   			})() );			//important! function must be executed before adding to promises array

		   		}

		   	});

		   	Parse.Promise.when(promises).then(function(){			//success
		   		response.success({"message": "Stock statuses set successfully", "code":200});

		   	},function(){											//error
		   		response.success({"message": "An error occured while setting stock status", "code":400});
		   	})


    	}			//-try block

    	catch(error) {
    		response.error({"message":error.message, "code":error.code});
    	}
    };

    var menuCategoryGetForMenu = function(request, response){
    	try {
    		requestParams = request.params;

    		if (!requestParams.menuHeader){
			    throw {
			      message: 'MenuHeader is required',
			      code: '400'
			    };			
			}

			var resultObject = [];
			console.log('Finding categories for ' + requestParams.menuHeader.objectId);

			// if (requestParams.menuHeader.objectId == 'UNASSIGN001'){
			// 	resultObject.push( {displayOrder:9999, name:'All', visible:false, objectId:'UNASSIGNCAT001'} );
			// 	response.success(resultObject);		
			// } else {
	   		var MenuCategory = Parse.Object.extend("MenuCategory");
			var query = new Parse.Query(MenuCategory);
			// console.log('vendor is ' + JSON.stringify(requestParams.vendor));

			query.equalTo("menuHeader", requestParams.menuHeader);
			query.addAscending("displayOrder");

			query.find()
			.then(function(menuCategoryResults){
				_.each(menuCategoryResults, function(aMenuCategory){
					var resultLine = aMenuCategory.toJSON();
					console.log('Found Menu Category ' + resultLine.objectId);
					delete resultLine.menuHeader;

					resultObject.push( resultLine );
				});

				response.success(resultObject);			
			});
			// };


		} catch(error){
			response.error(error);
		}    	
    };

    var menuCategoryGetForMenuItem = function(request, response){
    	try {
    		requestParams = request.params;

    		if (!requestParams.menuItem){
			    throw {
			      message: 'Menu Item is required',
			      code: '400'
			    };			
			}

			var resultObject = [];

	   	var MenuItemDisplay = Parse.Object.extend("MenuItemDisplay");
			var query = new Parse.Query(MenuItemDisplay);

			query.equalTo("menuItem", requestParams.menuItem);
			query.include("menuCategory", "menuCategory.menuHeader");
			query.addAscending("displayOrder");

			query.find()
			.then(function(menuCategoryResults){
				_.each(menuCategoryResults, function(aMenuCategory){
					var resultLine = aMenuCategory.toJSON();

					resultObject.push( resultLine );
				});

				response.success(resultObject);			
			});
			// };


		} catch(error){
			response.error(error);
		}    	    	
    };

    var menuItemDelete = function(request, response){
    	console.log('in menu item Delete...');
    	var bodyParams = request.params;
    	console.log('Params are ' + JSON.stringify(bodyParams));

    	var MenuItem = Parse.Object.extend('MenuItem');
    	var query = new Parse.Query(MenuItem);
    	var deletedObjectJSON = {};
    	
    	return query.get(bodyParams.objectId)
    	.then(function(objectToDelete){
    		return objectToDelete.destroy()
    		.then(function(deletedObject){
    			//delete any 'display records for this menu item'
    			deletedObjectJSON = deletedObject.toJSON();
    			
				var query = new Parse.Query("MenuItemDisplay");
				query.equalTo("menuItem", deletedObject);
				return query.find()
    		}).then(function(menuItemDisplayRecords){
				var promises = [];
			  	_.each(menuItemDisplayRecords, function(menuItemDisplayRecord) {
			  		promises.push(menuItemDisplayRecord.destroy());
			  	});
			  	return Parse.Promise.when(promises);
    		});
    	}).then(function(deletedObject){
    		console.log('success!!!!' + JSON.stringify(deletedObjectJSON));
    		if (deletedObjectJSON)
    			response.success(deletedObjectJSON)
    		else 
    			response.success();
		}, function(error){
    		console.log('error is ' + JSON.stringify(error));
    		response.error({"code":101, "error": error.message});			
		});
    };

    //THIS IS THE ORIGINAL menuItemSave
    var menuItemSave = function(request, response) {
    	console.log('in menu item Save...');
    	var bodyParams = request.params;
    	var aNewItem; 
    	var MenuItem = Parse.Object.extend('MenuItem');

    	if (!bodyParams.vendor)
    		response.error({"code":101, "error": 'Please specify a vendor'});

    	var menuHeader = bodyParams.menuHeader;
    	var menuCategory = bodyParams.menuCategory;
    	
    	if (bodyParams.overridePricing)
    		var overridePricing = bodyParams.overridePricing.splice(0);

		var onlineOrderingAvailable = bodyParams.onlineOrderingAvailable;

		if (bodyParams.displayOrder)
			var displayOrder = bodyParams.displayOrder;

		if (bodyParams.globalTaxExempt === undefined)
			bodyParams.globalTaxExempt = false; 
		
		//if not specified then default to TRUE 
		if (onlineOrderingAvailable != false)
			onlineOrderingAvailable = true
		else 
			onlineOrderingAvailable = false;

    	delete bodyParams.menuHeader;
   		delete bodyParams.menuCategory;
   		delete bodyParams.displayOrder;
   		delete bodyParams.overridePricing;
   		delete bodyParams.onlineOrderingAvailable;

   		var objectArray = [];

    	var aMenuItem = new MenuItem();
	   	for (var property in bodyParams) {
		    if (bodyParams.hasOwnProperty(property)) {
		        console.log('setting ' + property + ' to ' + bodyParams[property]);
		        aMenuItem.set(property, bodyParams[property]);
		    }
		}

    	Parse.Promise.as()
    	.then(function(){
    		console.log('inside promise Params are ' + bodyParams.objectId);
    		// console.log('menu item id is ' + JSON.stringify(bodyParams));
	    	if (bodyParams.objectId && menuCategory){
	    		console.log('saving override pricing');
	    		//reload the category 
		    	var MenuItemDisplay = Parse.Object.extend('MenuItemDisplay');
		    	var MenuItemDisplayQuery = new Parse.Query(MenuItemDisplay);
		    	
		    	MenuItemDisplayQuery.equalTo("menuItem", {__type:"Pointer", className:"MenuItem", objectId:bodyParams.objectId});
		    	MenuItemDisplayQuery.equalTo("menuCategory", {__type:"Pointer", className:"MenuCategory", objectId:menuCategory.objectId});
		    	// console.log('calling first...');
		    	return MenuItemDisplayQuery.first()
		    	.then(function(aRecord){
		    		// console.log('override record is ' + JSON.stringify(aRecord));
		    		if (aRecord){
		    			//existing record has been found, just update it
		    			console.log('setting override pricing' + JSON.stringify(overridePricing));
		    			aRecord.set("overridePricing", overridePricing);
		    			
		    			if (overridePricing && overridePricing.length > 0)
		    				aRecord.set("hasOverridePricing", true);
		    			else 
		    				aRecord.set("hasOverridePricing", false);

		    			aRecord.set("onlineOrderingAvailable", onlineOrderingAvailable);
		    			aRecord.set("displayOrder", displayOrder);
		    			aRecord.set("vendor",bodyParams.vendor);
		    			objectArray.push(aRecord);
		    		} else {
		    			var newDisplayRecord = new MenuItemDisplay();
		    			newDisplayRecord.set("overridePricing", []);
		    			newDisplayRecord.set("hasOverridePricing", false);
		    			newDisplayRecord.set("onlineOrderingAvailable", true);
		    			newDisplayRecord.set("displayOrder", displayOrder);
		    			newDisplayRecord.set("menuItem", {__type:"Pointer", className:"MenuItem", objectId:bodyParams.objectId});
		    			newDisplayRecord.set("menuCategory",  {__type:"Pointer", className:"MenuCategory", objectId:menuCategory.objectId});
		    			newDisplayRecord.set("vendor",bodyParams.vendor);
		    			objectArray.push(newDisplayRecord);		
		    		}   		
		    	});
	    	} else {
	    		console.log('no object id or category. This is a straight create...');
	    		return Parse.Promise.as();
	    	}   		
    	}).then(function(){
    		objectArray.push(aMenuItem);
    		return Parse.Object.saveAll(objectArray, {useMasterKey:true});    		
    	}).then(function(){
    		// console.log('success!!!!' + JSON.stringify(aMenuItem));
    		
    		response.success(aMenuItem.toJSON());     		
    	}, function(error){
    		console.log('error is ' + JSON.stringify(error));
    		response.error({"code":101, "error": error.message});
    	});

    };

  
    var menuItemsGet = function(request, response) {
    	try{
	    	console.log('in menu items Get');
	    	var bodyParams = request.params;
	    	console.log(bodyParams);

	    	var httpResponse = {};

	    	if (!bodyParams.menuCategory){
	    		//just get all the items for this vendor
	    		console.log('getting all the items');
		    	var MenuItem = Parse.Object.extend('MenuItem');
		    	var query = new Parse.Query(MenuItem);
		    	query.limit(1000);
	    		query.equalTo("vendor", bodyParams.vendor);
	    		query.descending("updatedAt, createdAt");
	    	} else {
	    		console.log('getting menu cat items ' + bodyParams.menuCategory.objectId);
		    	var MenuItemDisplay = Parse.Object.extend('MenuItemDisplay');
		    	var query = new Parse.Query(MenuItemDisplay);
		    	query.equalTo("menuCategory", bodyParams.menuCategory);
		    	query.include(['menuItem']);
		    	query.ascending("displayOrder");
	    	};

	    	query.find()
	    	.then(function(itemResults){
	    		var httpResponse = [];
				_.each(itemResults, function(aResult){
					var resultJSON;
					
					//This .then gets called after a query on MENUITEM or MENUITEMDISPLAY
					//The format is not the ame so we need to modify it a bit
					if (aResult.get("menuItem"))
						resultJSON = aResult.get("menuItem").toJSON();
					else
						resultJSON = aResult.toJSON();

					if (resultJSON){
						// console.log('menu item exists ' + JSON.stringify(resultJSON));
	
						// console.log('global tax exempt is ' + resultJSON.globalTaxExempt);
						// console.log('result is ' + JSON.stringify(aResult));

						if (aResult.get("displayOrder") != undefined){
							console.log('Display Order is ' + aResult.get("displayOrder"));
							resultJSON.displayOrder = aResult.get("displayOrder");
						} else
							console.log('No Display Order: ' + aResult.get("displayOrder"));

						if (aResult.get("overridePricing"))
							resultJSON.overridePricing = aResult.get("overridePricing");

						resultJSON.onlineOrderingAvailable = aResult.get("onlineOrderingAvailable");

						// console.log('tax exempt is...');
						// console.log(aResult.get("globalTaxExempt"));

						if (aResult.get("globalTaxExempt") == undefined)
							resultJSON.globalTaxExempt = false;

						if (aResult.get("printToKT") == undefined)
							resultJSON.printToKT = true;

					} else {
						resultJSON = aResult.toJSON();
						console.log('no menu item exists');
					};
					resultJSON.menuCategory = bodyParams.menuCategory;
					// console.log('men categ is ' + JSON.stringify(resultJSON.menuCategory));
					httpResponse.push(resultJSON);
				});

				response.success(httpResponse);

	   		}, function(error){
	   			response.error(error);
	   		});
    	} catch(error) {
    		response.error({"message":error.message, "code":error.code});
    	}
    };

    var menuItemOptionsSave = function(request, response){
    	console.log('in menu item OPTIONS Save...');
    	var bodyParams = request.params;
    	var aNewItem; 
    	var MenuItemOptions = Parse.Object.extend('MenuItemOptions');

    	if (!bodyParams.vendor)
    		response.error({"code":101, "error": 'Please specify a vendor'});

    	var aMenuItemOptionsGroup = new MenuItemOptions();
    	Parse.Promise.as()
    	.then(function(){
    		return aMenuItemOptionsGroup.save(bodyParams);
    	}).then(function(){
    		response.success(aMenuItemOptionsGroup.toJSON());    
    	}, function(error){
    		console.log('error is ' + JSON.stringify(error));
    		response.error({"code":101, "error": error.message});		
    	});	
    };

    var menuItemOptionsDelete = function(request, response){
    	console.log('in menu item OPTIONS Delete...');
    	var bodyParams = request.params;
    	console.log('Params are ' + JSON.stringify(bodyParams));

    	var MenuItemOptions = Parse.Object.extend('MenuItemOptions');
    	var query = new Parse.Query(MenuItemOptions);
    	
    	return query.get(bodyParams.objectId)
    	.then(function(objectToDelete){
    		return objectToDelete.destroy()
    		.then(function(deletedObject){
				var query = new Parse.Query("MenuItem");
				query.equalTo("vendor", deletedObject.get("vendor"));
				return query.find()
    		}).then(function(menuItemRecords){
				var promises = [];

			  	_.each(menuItemRecords, function(aMenuItemRecord) {
			  		var optionsArray = aMenuItemRecord.get("options");
			  		if (optionsArray && optionsArray.length > 0){
			  			optionsArray = _.without(optionsArray, _.find(optionsArray, {objectId: bodyParams.objectId}));
				  		//only save to db is the options array has been changed
				  		if (optionsArray.length != aMenuItemRecord.get("options").length){
					  		aMenuItemRecord.set("options", optionsArray);
					  		promises.push(aMenuItemRecord.save());
				  		};
				  	};
			  	});
			  	return Parse.Promise.when(promises);
    		});
    	}).then(function(){
    		console.log('success!!!!');
   			response.success();
		}, function(error){
    		console.log('error is ' + JSON.stringify(error));
    		response.error({"code":101, "error": error.message});			
		});
    };

    var menuItemOptionsGet = function(request, response){
    	try {
    		requestParams = request.params;

    		if (!requestParams.vendor){
			    throw {
			      message: 'Vendor is required',
			      code: '400'
			    };			
			};

	   		var MenuItemOptions = Parse.Object.extend("MenuItemOptions");
			var query = new Parse.Query(MenuItemOptions);
			query.equalTo("vendor", requestParams.vendor);
			// query.include('name', 'options');

			query.find()
			.then(function(menuOptionsResults){
				console.log('records found: ' + menuOptionsResults.length);
				var resultObject = [];
		
				_.each(menuOptionsResults, function(aMenuOption){
					var resultLine = aMenuOption.toJSON();
					delete resultLine.vendor;

					// if (requestParams.includeLegacy == true)
						resultObject.push( resultLine );
					// else{
					// 	//we only want real modifiers (not modifiers)
					// 	if (!resultLine.legacy)
					// 		resultObject.push( resultLine );	
					// } 

				});

				response.success(resultObject);
			}, function(error){
				response.error(error);
			});
    	} catch(error) {
    		response.error(error);
    	}
    };

    var menuListGet = function(request, response) {

    	try {
    		requestParams = request.params;

    		if (!requestParams.vendor){
			    throw {
			      message: 'Vendor is required',
			      code: '400'
			    };			
			}
    	
	   		var MenuHeader = Parse.Object.extend("MenuHeader");
			var query = new Parse.Query(MenuHeader);
			// console.log('vendor is ' + JSON.stringify(requestParams.vendor));

			query.equalTo("vendor", requestParams.vendor);
			query.addAscending("name");

			query.find()
			.then(function(menuHeaderResults){
				console.log('records found: ' + menuHeaderResults.length);
				var resultObject = [];
		
				_.each(menuHeaderResults, function(aMenuHeader){
					var resultLine = aMenuHeader.toJSON();
					delete resultLine.vendor;

					resultObject.push( resultLine );
				});

				response.success(resultObject);
			}, function(error){
				response.error(error);
			});

    	} catch(error) {
    		response.error(error);
    	}	

    };

    return {
        menuGetDetail : menuGetDetail,
        _menuGetDetail:_menuGetDetail,
        menuCreateFromCopy: menuCreateFromCopy,
        menuDeleteById: menuDeleteById,
        menuCategoryDeleteById : menuCategoryDeleteById,
        menuCategoryCreate: menuCategoryCreate,
        menuOrderCreateAnon:menuOrderCreateAnon,
        menuCreate: menuCreate,
        getDigitalMenu: getDigitalMenu,
        menuItemSave: menuItemSave,
        menuItemsGet: menuItemsGet,
        menuItemDelete: menuItemDelete,
        menuItemOptionsGet: menuItemOptionsGet,
        menuItemOptionsDelete: menuItemOptionsDelete,
        menuItemOptionsSave: menuItemOptionsSave,
        menuOrderCreate: menuOrderCreate,
        menuOrderCalcTotals: menuOrderCalcTotals,
        displayOrderSet:displayOrderSet,
        displayOrderUnset:displayOrderUnset,
        reorderDisplayOrder: reorderDisplayOrder,
        setMenuItemsStockStatus: setMenuItemsStockStatus,
        orderGetInfo: orderGetInfo,
        _orderGetInfo: _orderGetInfo,
        _emailOrderTicket: _emailOrderTicket,
        emailReceipt:emailReceipt,
        _emailReceipt:_emailReceipt,
        menuListGet: menuListGet,
        menuCategoryGetForMenu: menuCategoryGetForMenu,
        menuCategoryGetForMenuItem: menuCategoryGetForMenuItem
        
    }

}

exports.trkMenu = trkMenu;