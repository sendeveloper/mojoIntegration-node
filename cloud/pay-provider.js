// var aPayProviderFactory = function PayProviderFactory(payProviderInfo){
module.exports = function(payProviderInfo, currentUser){



	var const_stripe_provider_code="STRIPE";
	var const_bams_provider_code="BAMS";
	var const_hland_provider_code="HLAND";
	var const_payl_provider_code="PAYL";
	var const_cash_provider_code="CASH";
	
	var BasePayProvider = function PayProvider(payProviderInfo, currentUser){
		this._payInfo = payProviderInfo;
		this._cPayRecord = null;
		this._user = currentUser;

		TrkUtils = require('./utility.js').trkUtility;
		this._trkUtils = new TrkUtils();

		this.doCurrencyRound = function(aNumber){
			var aResult = parseFloat(Math.round(aNumber*Math.pow(10,2))/Math.pow(10,2)).toFixed(2) ;
			return parseFloat(aResult);
		};

		this.saveNewToken = function(aNewTokenId){
			var self = this;
			return this._trkUtils.encrypt(aNewTokenId)
			.then(function(encryptedToken){
				self._cPayRecord.set("internalId", encryptedToken);
				return self._cPayRecord.save({}, {sessionToken: this._user.get("sessionToken")});			
			});


		},
		this.getCustomerInfo = function(aCustomerId){
			var self = this;
			console.log('customer ID provided!');
			//get the transArmor Token from the DB
			var CPay = Parse.Object.extend("CPay");
			var query = new Parse.Query(CPay);
			return query.get(String(aCustomerId).substring(4), {sessionToken: this._user.get("sessionToken")}) //; skip the first 4 chars 'cus_'
			.then(function(aCPayRecord){
				self._cPayRecord = aCPayRecord;
				return self._cPayRecord;
			});

		};

		this.createCustomer = function(orderInfo){
			var self = this;
			var TrkCustomer = Parse.Object.extend("CPay");
			var aCustomer = new TrkCustomer();
			
			return Parse.Promise.as()
			.then(function(){
				return self._trkUtils.encrypt(orderInfo.chargeTokenId);
			}).then(function(encryptedResult){
				aCustomer.set('internalId', encryptedResult);
				return self._trkUtils.encrypt(orderInfo.cc_expiry);							
			}).then(function(encryptedResult){
				aCustomer.set('cc_expiry', encryptedResult);
				return self._trkUtils.encrypt(orderInfo.credit_card_type);							
			}).then(function(encryptedResult){
				aCustomer.set('credit_card_type', encryptedResult);
				console.log('calling save for the new customer...');

				var dbCallOptions;
				if (this._user){
					dbCallOptions = {sessionToken: this._user.get("sessionToken")};
				} else {
					dbCallOptions = {useMasterKey:true};
				};

				return aCustomer.save({}, dbCallOptions)
				.then(function(aTrkCustomer){
					//concatenate CUS_ to the ID of the customer so we know if we have a token or a customer ID
					console.log('new customer created. Id is ' + aTrkCustomer.id);
					
					var customerCreateMsg = {code:200, message:'Customer Created ' + aTrkCustomer.id, customerId:'cus_' + aTrkCustomer.id};
					return Parse.Promise.as(customerCreateMsg);
				});																
			});	
		};

		this.getPayProviderInfo = function(aPaymentInfo){
			
		};

		this.getDeliveryAmount = function(orderInfo){
			//if required add delivery charges to the amount being charged
			var deliveryAmt = 0;
			if (orderInfo.deliveryRequested == true){
				console.log('delivery amount is ' + orderInfo.deliveryDetail.deliveryAmount);

				if (orderInfo.deliveryDetail.deliveryAmount && orderInfo.deliveryDetail.deliveryAmount > 0){
					// var accounting = require('./accounting.js');
					// deliveryAmt = parseFloat(orderInfo.deliveryDetail.deliveryAmount);
					deliveryAmt = this.doCurrencyRound(orderInfo.deliveryDetail.deliveryAmount); 
				}

				// if (orderInfo.deliveryDetail.deliveryTax && orderInfo.deliveryDetail.deliveryTax > 0){
				// 	// var accounting = require('./accounting.js');
				// 	// deliveryAmt = parseFloat(deliveryAmt) + parseFloat(orderInfo.deliveryDetail.deliveryTax);
				// 	deliveryAmt = this.doCurrencyRound(deliveryAmt);  + this.doCurrencyRound(orderInfo.deliveryDetail.deliveryTax);
				// }
			};

			return deliveryAmt;
		};

		this.getCCTransactionObject = function(orderInfo){
			var resultObject = {};
			
			// resultObject.amount = this.doCurrencyRound(this.getDeliveryAmount(orderInfo)); 
			// resultObject.amount = resultObject.amount + this.doCurrencyRound(orderInfo.amount);
			// resultObject.amount = resultObject.amount - this.doCurrencyRound(orderInfo.totalDiscountAmount);
			// resultObject.amount = resultObject.amount + this.doCurrencyRound(orderInfo.taxAmount?orderInfo.taxAmount:0);

			// //if exists, add delivery tax
			// if (orderInfo.deliveryRequested == true)
			// 	resultObject.amount = resultObject.amount + this.doCurrencyRound(orderInfo.deliveryDetail.deliveryTax?orderInfo.deliveryDetail.deliveryTax:0);

			// resultObject.amount = resultObject.amount + this.doCurrencyRound(orderInfo.tipAmount?orderInfo.tipAmount:0);
			
			// //for safety, format the result to 2 decimal places. This is due to bugs in the core JS which can return more then 2 decimal places
			// resultObject.amount = this.doCurrencyRound(resultObject.amount); 

			resultObject.amount = orderInfo.grandTotal;
			resultObject.currency = String(orderInfo.currency).toLowerCase();

			return resultObject;
		};

		return this;
	}; //instantiate the base class

	var HLANDPayProvider = function PayProviderHLAND(payProviderInfo, currentUser){
		//all properties/functions of the parent are now available to the child
		this.prototype = new BasePayProvider(payProviderInfo, currentUser); // initialize Parent Class
		
		this.localCustomerStore = true; 

		this.getServiceConfig = function(orderInfo){
			self = this;
			return Parse.Config.get()
			.then(function(aConfig){
				var versionNumber;
				var skey;
				var pkey;

				if (orderInfo.saleMode == 2){  //mobile order
					versionNumber = '2377';
					skey = self.prototype._payInfo.ecom.skey;
					pkey = self.prototype._payInfo.ecom.pkey;
				} else {
					skey = self.prototype._payInfo.pos.skey;
					pkey = self.prototype._payInfo.pos.pkey;
					versionNumber = '2398';    //POS Order
				}
				return new Parse.Promise.as({
					uri: 			aConfig.get("hlandEndPoint"),
					secretApiKey: 	skey,
					publicApiKey: 	pkey,
	                versionNumber:  versionNumber,
	                developerId:    '002914'
				});
			});
		};

		// this.getCCTransactionObject = function(orderInfo){
		// 	return {
		// 		amount: (Math.round(parseFloat(this.prototype.getDeliveryAmount(orderInfo))+orderInfo.amount+orderInfo.taxAmount - orderInfo.totalDiscountAmount + (orderInfo.tipAmount?orderInfo.tipAmount:0)) ,
		// 		currency: String(orderInfo.currency).toLowerCase()
		// 	}
		// };

		this.refundCard = function(orderInfo){
			var globalPromise = new Parse.Promise();
			
			var HLANDTransactionObject = this.prototype.getCCTransactionObject(orderInfo);
			console.log(HLANDTransactionObject);
			var heartland = require('heartland-nodejs');
			
			this.getServiceConfig(orderInfo)
			.then(function(serviceConfig){

				hpsCreditService = new heartland.HpsCreditService(serviceConfig, serviceConfig.uri);
				
				//first try to void the Transaction. If that doesnt work then try to refund it.
				hpsCreditService.reverseWithTransactionId(	HLANDTransactionObject.amount, 
															HLANDTransactionObject.currency, 
															Number(orderInfo.chargeId), null, 															
															function(error, result){
																if (error){
																	//void did not work. Try a refund

																	hpsCreditService.refundWithTransactionId(	HLANDTransactionObject.amount, 
																												HLANDTransactionObject.currency, 
																												Number(orderInfo.chargeId), null, null,
																												function(error, result){
																													if (error){
																														globalPromise.reject(error);
																													} else {
																														var aResult = {};
																														aResult.id = String(result.transactionId) ;
																														aResult.transaction_tag = result.authorizationCode;
																														globalPromise.resolve(aResult);
																													};

																											});

																} else {
																	var aResult = {};
																	aResult.id = String(result.transactionId) ;
																	aResult.transaction_tag = result.authorizationCode;
																	globalPromise.resolve(aResult);
																};

														});


			}, function(error){
				globalPromise.reject(error);
			});

			return globalPromise;
		};

		this.chargeCardWithToken = function(orderInfo){
			var self = this;

			var HLANDTransactionObject = self.prototype.getCCTransactionObject(orderInfo);
			console.log('HLAND tranaction object is ' + JSON.stringify(HLANDTransactionObject));
			var heartland = require('heartland-nodejs');

			var globalPromise = new Parse.Promise();
			
			(function(){

				var aPromise = new Parse.Promise();
				if (orderInfo.chargeTokenId)
					self.prototype._trkUtils.decrypt(orderInfo.chargeTokenId)
					.then(function(aDecryptedResult){
						aPromise.resolve(aDecryptedResult);
					});
				else {
						
					self.prototype.getCustomerInfo(orderInfo.customerId)
					.then(function(customerDetails){
						self.prototype._trkUtils.decrypt(customerDetails.get("internalId"))
						.then(function(aDecryptedResult){
							aPromise.resolve(aDecryptedResult);
						});
					}, function(error){
							aPromise.reject(error);
					});
						
				};
				return aPromise;

			})()
			.then(function(decryptedResult){
				HLANDTransactionObject.token = decryptedResult;
				return self.getServiceConfig(orderInfo)
			}).then(function(serviceConfig){
				console.log('HLAND service config is ' + JSON.stringify(serviceConfig));
				hpsCreditService = new heartland.HpsCreditService(serviceConfig, serviceConfig.uri);
				console.log('Charging HLAND with Token using: ' + JSON.stringify(HLANDTransactionObject) );
				hpsCreditService.chargeWithToken(
					HLANDTransactionObject.amount,
					HLANDTransactionObject.currency,
					HLANDTransactionObject.token,
					null,
					false,
					'none',
					function(error, result){
						console.log('HLAND Error' + JSON.stringify(error));
						console.log('HLAND response:' + JSON.stringify(result));

						//there seems to be a bug in the Heartland SecureSubmit SDK and the 
						//callback is triggered twice
						//so we use the globalPromise to see if we have all ready rejected/resolved this
						//promise. If we have then this MUST be a duplicate callback and we just get out
						if (globalPromise._rejected == true || globalPromise._resolved == true)
							return;

						if (error){

							globalPromise.reject(error);
						} else {
							var aResult = {};
							aResult.id = String(result.transactionId) ;
							aResult.transaction_tag = result.authorizationCode;
							//Heartland also returns a Reference number. Not sure what to do with it.

							globalPromise.resolve(aResult);
						};
					}
				);
			}, function(error){
				console.log('In error function'. JSON.stringify(globalPromise));
				console.log('Rejecting global promise...');
				globalPromise.reject(error);
			});
			return globalPromise;
		};


		this.createCustomer = function(orderInfo){


			var self = this;
			//In the case of Heartland, the app will generate a
		 	//Single Use Token from the credit card info. We will use this SUPT to genreate a 
		 	//multi-use toke which we will store on the server
			var heartland = require('heartland-nodejs');
			return self.getServiceConfig(orderInfo)
			.then(function(serviceConfig){
				var aPromise = new Parse.Promise();
				hpsCreditService = new heartland.HpsCreditService(serviceConfig, serviceConfig.uri);
				hpsCreditService.verifyWithToken(orderInfo.chargeTokenId, {address:{zip:orderInfo.zipCode}}, true,function(error, result){
					if (error){
						console.log('Error Creating Customer:' + JSON.stringify(error));
						aPromise.reject(error);
					} else {
						aPromise.resolve(result.tokenData.tokenValue[0]);
					};

				});

				return aPromise;
			}).then(function(aMultiUseToken){
				if (aMultiUseToken){
					orderInfo.chargeTokenId = aMultiUseToken;
					return self.prototype.createCustomer(orderInfo);
				} else {
					var customerCreateMsg = {code:401, message:'Customer could not be created.'};
					return Parse.Promise.as(customerCreateMsg);			

				};
			}, function(error){
				console.log('Error Creating Customer: ' + JSON.stringify(error));
			});
		};
	}

	var STRIPEPayProvider = function PayProviderSTRIPE(payProviderInfo, currentUser){
		this.prototype = new BasePayProvider(payProviderInfo, currentUser); // initialize Parent Class
		
		//STRIPE customer info is stored with STRIPE (remotely)
		this.localCustomerStore = false;

		this.getCCTransactionObject = function(orderInfo){
			//call the parent 
			var resultObject = this.prototype.getCCTransactionObject(orderInfo);
			resultObject.amount = resultObject.amount * 100; //STRIPE requires it in cents

			return resultObject; 
		};

		this.chargeCardWithToken = function(orderInfo){
			var self = this;

			var STRIPETransactionObject = self.getCCTransactionObject(orderInfo);
			return Parse.Promise.as()
			.then(function(){
    		
	    		if(orderInfo.customerId){
	    			STRIPETransactionObject.customer= orderInfo.customerId;
	    			return Parse.Promise.as(STRIPETransactionObject);
	    		} else {
	    			if (orderInfo.noEncryption){
	    				STRIPETransactionObject.card = orderInfo.chargeTokenId;
	    				// console.log('returning promise after unencrypted stripe trans');
	    				return Parse.Promise.as(STRIPETransactionObject);
	    			}
	    			else {
		    			return self.prototype._trkUtils.decrypt(orderInfo.chargeTokenId)
		    			.then(function(decryptedResult){
		    				STRIPETransactionObject.card= decryptedResult;
		    				return Parse.Promise.as(STRIPETransactionObject);
		    			});
	    			};			
				};
			}).then(function(STRIPETransactionObject){
				console.log('Passing to STRIPE...' + JSON.stringify(STRIPETransactionObject));

				console.log('Executing HTTP Request to STRIPE....' + self.prototype._payInfo.access_token);
				return Parse.Cloud.httpRequest({
				    method: 'POST',
				    url: "https://api.stripe.com/v1/charges",
				    body: STRIPETransactionObject,
				    headers:{
				    	"Authorization": 'Bearer ' + self.prototype._payInfo.access_token,
				    	"Content-Type": "application/x-www-form-urlencoded"
				    },
				});
			}).then(function(httpResponse){
				console.log('stripe response is ' + JSON.stringify(httpResponse.data));
				
				if (httpResponse.data.card && httpResponse.data.card.last4){
					httpResponse.data.last4 = httpResponse.data.card.last4;
					console.log('STRIPE LAST4 is ' + httpResponse.data.last4);
				};

				return Parse.Promise.as(httpResponse.data);

			},function(error){
				console.log(error);
				return Parse.Promise.error(error);
			});

		};

		this.refundCard = function(orderInfo){
			var globalPromise = new Parse.Promise();
			self = this;

			Parse.Cloud.httpRequest({
			    method: 'POST',
			    url: "https://api.stripe.com/v1/refunds",
			    body: {charge:orderInfo.chargeId},
			    headers:{
			    	"Authorization": 'Bearer ' + self.prototype._payInfo.access_token,
			    	"Content-Type": "application/x-www-form-urlencoded"
			    },
			}).then(function(httpResponse){
				console.log('stripe response is ' + JSON.stringify(httpResponse.data.id));
				globalPromise.resolve(httpResponse.data);
			}, function(errorObj){
				console.log('STRIPE ERROR response is ' + JSON.stringify(errorObj.data));
				globalPromise.reject({sender:"chargeCard", message:errorObj.data.error.message, code:"130"});
			});
			return globalPromise;
		};

		this.createCustomer = function(orderInfo){
			var self = this;
			var aPromise = new Parse.Promise();

			Parse.Cloud.httpRequest({
			    url: 'https://api.stripe.com/v1/customers',
			    method:"POST",
			    body:{
						description: orderInfo.customerPhone,
						source: orderInfo.chargeTokenId
			    },
			    headers:{
			    	"Authorization": "Bearer " + self.prototype._payInfo.access_token,
			    	"Content-Type": "application/x-www-form-urlencoded"
			    },
			    success: function(httpResponse) {
					//get the newly created customer Id
					console.log('stripe SUCCESS response: ' + JSON.stringify(httpResponse.data.id));
					// orderInfo.customerId = httpResponse.data.id;
					var customerCreateMsg = {code:200, message:'Customer Created ' + httpResponse.data.id, customerId:httpResponse.data.id};
					aPromise.resolve(customerCreateMsg);
			    },
			    error: function(httpResponse) {
			    	console.log('stripe Error response: ' + JSON.stringify(httpResponse.data));
			    	var customerCreateMsg = {code:101, message: 'Customer credentials not stored: ' + httpResponse.data.error.message};
			        aPromise.resolve(customerCreateMsg); //continue as successful as this is not a fatal error

			    }
			});

			return aPromise;
		};
	};

	var BAMSPayProvider = function PayProviderBAMS(payProviderInfo, currentUser){
		this.prototype = new BasePayProvider(payProviderInfo, currentUser); // initialize Parent Class

		this.localCustomerStore = true; 
		
		this.chargeCardWithToken = function(orderInfo){
			var self = this;
			var globalPromise = new Parse.Promise();

			var BAMSTransactionObject = self.prototype.getCCTransactionObject(orderInfo);

			console.log('Provider is BAMS!');
			var promise = new Parse.Promise();
			var cPayDetails;
			if (orderInfo.customerId){
				// console.log('customer ID provided!');
				// //get the transArmor Token from the DB
				// var CPay = Parse.Object.extend("CPay");
				// var query = new Parse.Query(CPay);
				// query.get(String(orderInfo.customerId).substring(4)) //skip the first 4 chars 'cus_'
				self.prototype.getCustomerInfo(orderInfo.customerId)
				.fail(function(error){
					globalPromise.reject({"sender":"chargeCard","message":"Customer ID " + orderInfo.customerId + " not found"});							
				})
				.then(function(customerPaymentDetail){
					//console.log('Cust Payment records found: ' + JSON.stringify(customerPaymentDetail));
					cPayDetails = customerPaymentDetail;
					Parse.Promise.as()
					.then(function(){
						//console.log('deciphering internal Id')
						return self.prototype._trkUtils.decrypt(customerPaymentDetail.get('internalId'));
					}).then(function(decryptedResult){
						BAMSTransactionObject.transarmor_token = decryptedResult;
						//console.log('decrypting ' + orderInfo.cc_expiry);
					 	return self.prototype._trkUtils.decrypt(customerPaymentDetail.get('cc_expiry'));
					}).then(function(decryptedResult){
						//console.log('result is ' + decryptedResult);
						BAMSTransactionObject.cc_expiry = decryptedResult;
						return self.prototype._trkUtils.decrypt(customerPaymentDetail.get('credit_card_type'));
					}).then(function(decryptedResult){
						BAMSTransactionObject.credit_card_type = decryptedResult;
						//pad with leading zero if required
						if (String(BAMSTransactionObject.cc_expiry).length == 3)
							BAMSTransactionObject.cc_expiry = '0' + BAMSTransactionObject.cc_expiry;

						BAMSTransactionObject.cardholder_name = 'None';
						// console.log('BAMS Customer Info has been loaded');
						promise.resolve();
					});	
				});
			} else {

				// TrkUtils = require('cloud/utility.js').trkUtility;
				// var trkUtils = new TrkUtils();						
				Parse.Promise.as()
				.then(function(){
					return self.prototype._trkUtils.decrypt(orderInfo.chargeTokenId);
				}).then(function(decryptedResult){
					BAMSTransactionObject.transarmor_token = decryptedResult;
					
					return self.prototype._trkUtils.decrypt(orderInfo.cc_expiry);						
				}).then(function(decryptedResult){
					BAMSTransactionObject.cc_expiry = decryptedResult;
					return self.prototype._trkUtils.decrypt(orderInfo.credit_card_type);
				}).then(function(decryptedResult){
					BAMSTransactionObject.credit_card_type = decryptedResult;
					//pad with leading zero if required
					if (String(BAMSTransactionObject.cc_expiry).length == 3)
						BAMSTransactionObject.cc_expiry = '0' + BAMSTransactionObject.cc_expiry;
			
					BAMSTransactionObject.cardholder_name = 'None';
					return promise.resolve();						
				});
			}

			promise.then(function(){
				//we have the transArmor Token and other info
				//1. get the BAMS End Point
				return Parse.Config.get();

			}).then(function(aConfig){

				var baseUrl = aConfig.get("bamsBaseUrl");
				var endPoint = aConfig.get("bamsEndpoint");

				BAMSTransactionObject.customer_ref = orderInfo.customerPhone;
				BAMSTransactionObject.gateway_id = self.prototype._payInfo.gateway_id;
				BAMSTransactionObject.password = self.prototype._payInfo.password;
				BAMSTransactionObject.transaction_type = '00'; //purchase
				BAMSTransactionObject.tpp_id = 'EGG001'; //Trucked Partner Id
				BAMSTransactionObject.currency_code = orderInfo.currency;
				
				if (orderInfo.orderId)
					BAMSTransactionObject.reference_no =  orderInfo.orderId;

				//for BAMS gateway, we express the amount in dollars and cents (for stripe its in cents)
				// so we need to conver the amount into dollars and cents
				// BAMSTransactionObject.amount = BAMSTransactionObject.amount / 100;

				console.log('body is ' + JSON.stringify(BAMSTransactionObject));
				console.log('calling ' + baseUrl + endPoint);
				Parse.Cloud.httpRequest({
				    method: 'POST',
				    url: baseUrl + endPoint,
				    body: BAMSTransactionObject,
				    headers:{
				    	//"Authorization": "GGE4_API " + paymentProviderInfo.keyId + ':' + hmac,
				    	"Content-Type": "application/json",
				    	'Accept': 'application/json'
				    	//'X-GGE4-Date': aDateString,
				    	//'X-GGE4-Content-SHA1': hash,
				    	//'Content-Length': ccTransactionObj.length
				    },
				    success: function(httpResponse) {
				    	console.log('BAMS success: ' + JSON.stringify(httpResponse.data));
				    	if (httpResponse.data.transaction_approved == 0){
				    		//card was declined
				    		globalPromise.reject({"sender":"chargeCard","message": 'Card was declined. ' + httpResponse.data.bank_message});
				    	} else {

					    	//return the authorization num as the 'chargeId' fieldName
					    	httpResponse.data.id = httpResponse.data.authorization_num;
					    	console.log('charge ID from BAMS is ' + httpResponse.data.id);

							//get the last 4 of the transArmor token as this is the last 4 of the credit card
							var transArmorToken = String(httpResponse.data.transarmor_token);
							httpResponse.data.last4 = transArmorToken.substr(transArmorToken.length - 4);
							console.log('BAMS last4 is ' + httpResponse.data.last4);

					    	//it is possible that a new transArmorToken is issued so we need to update
					    	//the customer record with the new token
							if (orderInfo.customerId){
								console.log('updating new token ID on customer payment details' + httpResponse.data.transarmor_token);

								// TrkUtils = require('cloud/utility.js').trkUtility;
								// var trkUtils = new TrkUtils();	
								self.prototype._trkUtils.encrypt(httpResponse.data.transarmor_token)
								.then(function(encrypted){
									console.log('Encrypted token is ' + encrypted);
									cPayDetails.set('internalId', encrypted);
									return cPayDetails.save({}, {sessionToken: self.prototype._user.get("sessionToken")})										
								}).then(function(){

									globalPromise.resolve(httpResponse.data);

								}, function(error){
									console.log(error);
									globalPromise.reject({"sender":"chargeCard","message":error.message});
								});

							} else
								globalPromise.resolve(httpResponse.data);

				    	};

				    },
				    error: function(httpResponse) {
				    	console.log('BAMS error: ' + JSON.stringify(httpResponse.text));
							globalPromise.reject({"sender":"chargeCard","message":httpResponse.text});
				    }
				});

			});

			return globalPromise;
		};

		this.refundCard = function(orderInfo){
			var globalPromise = new Parse.Promise();
			self = this;

			//if a customer ID has been provided then get the token associated with it as 
			//it will be used to charge the customer
			console.log('Provider is BAMS for Refund! ');
			
			// var ccTransactionObj={
			// 	currency: orderInfo.currency
			// }
			var ccTransactionObj = this.prototype.getCCTransactionObject(orderInfo);

			if (orderInfo.chargeTokenId)
				ccTransactionObj.transarmor_token = orderInfo.chargeTokenId;

				if (orderInfo.orderId)
					ccTransactionObj.reference_no =  orderInfo.orderId;

			Parse.Promise.as()
			.then(function(){
				console.log('Provider is BAMS for Refund! 22 ' + orderInfo.chargeTokenId);

				if (orderInfo.chargeTokenId)
					return self.prototype._trkUtils.decrypt(orderInfo.chargeTokenId)
						else return Parse.Promise.as();
			}).then(function(decryptedResult){
				console.log('Provider is BAMS for Refund! 33 '); // + decryptedResult);

				if (decryptedResult)
					ccTransactionObj.transarmor_token = decryptedResult;
				
				if (orderInfo.cc_expiry)
					return self.prototype._trkUtils.decrypt(orderInfo.cc_expiry)
						else return Parse.Promise.as();						
			}).then(function(decryptedResult){
				
				if (decryptedResult)
					ccTransactionObj.cc_expiry = decryptedResult;

				//pad with leading zero if required
				if (String(ccTransactionObj.cc_expiry).length == 3)
					ccTransactionObj.cc_expiry = '0' + ccTransactionObj.cc_expiry;
							 					
				console.log('loading config...');
				return Parse.Config.get();
			}).then(function(aConfig){
				console.log('1');
				var baseUrl = aConfig.get("bamsBaseUrl");
				var endPoint = aConfig.get("bamsEndpoint");
			
				ccTransactionObj.gateway_id = self.prototype._payInfo.gateway_id;
				ccTransactionObj.password = self.prototype._payInfo.password;
			
				ccTransactionObj.authorization_num = orderInfo.chargeId;
				ccTransactionObj.transaction_tag = orderInfo.tx_tag;
				ccTransactionObj.transaction_type = '34'; //tagged refund
				ccTransactionObj.tpp_id = 'EGG001'; //Trucked Partner Id

				console.log('body is ' + JSON.stringify(ccTransactionObj));

				Parse.Cloud.httpRequest({
				    method: 'POST',
				    url: baseUrl + endPoint,
				    body: ccTransactionObj,
				    headers:{
				    	"Content-Type": "application/json",
				    	'Accept': 'application/json'
				    },
				    success: function(httpResponse) {
				    	console.log('FDATA success: ' + JSON.stringify(httpResponse.data));
				    	httpResponse.data.id = httpResponse.data.authorization_num;
						globalPromise.resolve(httpResponse.data);
				    },
				    error: function(httpResponse) {
				    	console.log('FDATA error: ' + JSON.stringify(httpResponse));
						globalPromise.reject({"sender":"refundCard","message":httpResponse.text});
				    }
				});
			});


			return globalPromise;
		};

		this.createCustomer = function(orderInfo){
			return this.prototype.createCustomer(orderInfo);
		};

	};

	switch(payProviderInfo.providerId){
		case const_stripe_provider_code:
			console.log('Provider is STRIPE!');
			return new STRIPEPayProvider(payProviderInfo, currentUser);
			break;
		case const_bams_provider_code:
		 	console.log('Provider is BAMS!');
			return new BAMSPayProvider(payProviderInfo, currentUser);
			break;
		case const_hland_provider_code:
		 	console.log('Provider is HLAND!');
			return new HLANDPayProvider(payProviderInfo, currentUser);


			break;
		default:
			// throw paymentProviderInfo.providerId  + ' is not supported'.
	};
}