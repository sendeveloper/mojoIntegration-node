var smsInterface = require('./sms-interface.js');
var trkUser = function(){
    
    var userLogin = function(request, response){
		try{
			function processResponse(aUserRecord){
				//all is well need to 
				// console.log('User record is ' + JSON.stringify(aUserRecord));
				// console.log('Current user is ' + JSON.stringify(Parse.User.current()));
				//console.log(aUserRecord);
				//user has been validated, return success

				// console.log('calling become...' + aUserRecord.get("sessionToken"));
				// Parse.User.become(aUserRecord.get("sessionToken"));

				console.log('calling save on user record - updating last login date');
				aUserRecord.save({lastLogin:new Date()}, { sessionToken: aUserRecord.get("sessionToken"), useMasterKey:true })
				.then(function(){
					console.log('returning a success message for the login');
					response.success({
						"sessionToken": aUserRecord.getSessionToken(),
						"vendor": aUserRecord.get("vendor").id,
						"emailValidated": aUserRecord.get("emailValidated"),
						"userId": aUserRecord.id
					});					
				}, function(error){
					console.log('Error updating user record: ' + JSON.stringify(error));
					response.error({"message":error.message, "code":error.code});
				});

			};

			//retrieve the User
			// console.log('request body is' + request.params + 'params are ' + request.params);
			console.log('UserLogin: getting params' + JSON.stringify(request));
			// var bodyParams = JSON.parse(request.params);
			var bodyParams = request.params;
			// console.log('GOT EM!');
			if (bodyParams.userName && bodyParams.password){
				Parse.User.logIn(bodyParams.userName, bodyParams.password)
				.then(function(aUserRecord){
					console.log('Login user is ' + JSON.stringify(Parse.User.current()));
					processResponse(aUserRecord);
				}, function(error){
					console.log(error);
					response.error({"message":error.message, "code":error.code});
				});
			} else 
				Parse.User.become(bodyParams.sessionToken)
				.then(function(aUserRecord){
					processResponse(aUserRecord);
				
				}, function(error){
					response.error({"message":error.message, "code":error.code});
				});

		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});
		}
    };

    var newUserVerify = function(request, response){
		try{
			//retrieve the User
			console.log('NewUserVerify: getting body params');
			var bodyParams = request.params;
			console.log('NewUserVerify request object is ' + JSON.stringify(request));

			var query = new Parse.Query('User');
			
			console.log('calling Get on User' + bodyParams.verifyId);		
			query.get(bodyParams.verifyId)
			.then(function(aUser){
				console.log('user loaded ' + aUser.id);
				// aUser.set("emailValidated", true);
				console.log('callign save...');
				aUser.save({emailValidated: true},{sessionToken:bodyParams.sessionToken})
				.then(function(){
					console.log('newuserverify success!');
					//user has been validated, return success
					response.success({}); //return a 200 OK
				}, function(error){
					console.log(error);
					return Parse.Promise.reject(error);
				});				
			}, function(errorObj){
				console.log('new user verify error: ' + JSON.stringify(errorObj));
				response.error({"message":errorObj.message});
			});

		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});
		}    	
    };

    var newUserRegister = function(request, response){
		try{ 

			var newUser = null;
			var newVendor = null;
			var refPartner = null;
			var Moment = require('moment');
			var moment = new Moment();

			var bodyParams = request.params;
	  		//console.log('bodyParams: ' + bodyParams);

  			//console.log('External Ref ID is ' + bodyParams.refPartner);

  			//if an external ID has been specified then make sure that it is a valid one
  			var getReferralPartner = function(){
		  		var promise = new Parse.Promise();
		  		if (bodyParams.refPartner){
		  		var RefPartner = Parse.Object.extend("RefPartner");
					var refPartnerQuery = new Parse.Query(RefPartner);

					refPartnerQuery.equalTo("extId", bodyParams.refPartner);
					
					console.log('finding referral partner...');
					refPartnerQuery.find()
					.fail(function(error){
						console.log('referral partner not found!!!');
						//return Parse.Promise.error({code:101,message:'Referral Partner not found'});
						response.error({code:101,message:'Referral Partner not found'});

					}).then(function(aQueryResults){
						console.log('Results are as follows partner found ' + JSON.stringify(aQueryResults));
						if (aQueryResults.length == 0){
							//assume only one
							response.error({code:101,message:'Referral Partner not found'});						
						} else {
							refPartner = aQueryResults[0];
							console.log('ref partner is ' + JSON.stringify(refPartner));
							promise.resolve(refPartner);
						}
					});

				} else
				 	promise.resolve(false);

				return promise;
  			};

			getReferralPartner()
			.then(function(){
				console.log('creating vendor....');
			  	//1. Create a new user in parse
			  	var user = new Parse.User();
			  	user.set("username", bodyParams.email);
			  	user.set("password", bodyParams.password);
			  	user.set("email", bodyParams.email);
			  	return user.signUp()
			  	.then(function(aNewUser){
			  		newUser = aNewUser;
			  		console.log('New user created!' + JSON.stringify(aNewUser));
			  	})
			  	.then(function(){

		  			//now we have created a new user, we need to create a new vendor too
			  		var Vendor = Parse.Object.extend("Vendor");
			  		var aVendor = new Vendor;

					if (refPartner != false){
						aVendor.set("refPartner", refPartner);
					}
					
		  		aVendor.set("accountType", "Trial");
		  		aVendor.set("description", bodyParams.vendorName);
		  		aVendor.set('settings', {fbPublishPrivateEvents: false}); //create with default settings
		  		aVendor.set('timeZone', bodyParams.vendorTimezone);
		  		aVendor.set("vendorToken", bodyParams.vendorToken);
		  		aVendor.set("suspended", false);
		  		aVendor.set('isoCurrency', 'USD'); //default to USD timeone

		  		aVendor.set('paymentInfo', []);
		  		aVendor.set('bamsApplied', false);
		  		//give 30 days 
		  		var now = new Moment();
		  		now.add(1, 'months');
		  		console.log('next bill date is ' + now.format());
		  		aVendor.set('nextBillDate', now.toDate());
		  		aVendor.set('dashboardMessagesConstraints', 
		  													{	showWarningMessages:true, 
		  														showInformationMessages:true,
		  														showSuccessMessages: true
		  													});
					return aVendor.save();
				}).then(function(aNewVendor){
					//create a Vendor Rate Record
			  		var VendorRate = Parse.Object.extend("vendorRate");
			  		var aVendorRate = new VendorRate;
			  		aVendorRate.set("vendor", aNewVendor);
			  		aVendorRate.set("truckRate", 79);
			  		aVendorRate.set("taxRate", 8.25);
			  		aVendorRate.set("startDate",  new Date());
			  		var now = new Moment();
			  		now.add(100, 'y');

			  		aVendorRate.set("endDate", now.toDate());
			  		return aVendorRate.save();

				}).then(function(aNewVendorRate){
						newVendor = aNewVendorRate.get("vendor");

		  			console.log('New vendor successfully created. ' + JSON.stringify(newVendor));
		  			//console.log(newUser);
		  			//update the user record with the new vendor
		  			user.set("emailValidated", false);
		  			user.set("vendor", newVendor);
		  			return user.save({}, {sessionToken: newUser.getSessionToken()});
				}).then(function(){
			  		//send out the email verification email message
			  		return Parse.Config.get();

			  	}).then(function(config) {
			  		var mandrillAPIKey = config.get("MandrillAPIKey");

					var mandrill = require('mandrill-api/mandrill');
					var mandrill_client = new mandrill.Mandrill(mandrillAPIKey);

					console.log('email is ' + newUser.getEmail());
						  	
					var mailParams = {
						async:true, 
						template_name: config.get("emailNewUserWelcome"),
						template_content:{},
						message: {
							to: [{
						  		email: newUser.getEmail(),
						  		type: 'to'
						  	}],
						  	merge_vars: [{
						  		rcpt: newUser.getEmail(),
						  		vars: [{
						  			name: "VERIFYLINK",
						  			content: config.get('baseUrl')  + "/index.htm?verifyid=" + newUser.id // + "#/signin"
						  		}]
						  	}]
						}
					};

				  	mandrill_client.messages.sendTemplate( mailParams, 
				  		function(httpResponse){
				  			//return a response to the user
				  			console.log('Mandril response is ...');
				  			console.log(httpResponse[0]);
				  			response.success({	"_id": newUser.id, 
				  				"newVendorId": newVendor.id,
				  				"sessionToken": newUser.getSessionToken()
				  			});
				  		},
				  		function(httpResponse){
				  			console.log('Error sending Mandril Email...');
				  			console.log(httpResponse);
				  			//we are going to return a success message anyway, as the user can always
				  			//request a re-send
				  			response.error({	"_id": newUser.id, 
				  				"newVendorId": newVendor.id,
				  				"sessionToken": newUser.getSessionToken()
				  			});
				  		});			  	

				}, function(error){
					console.log('User Sign Up Error...' + JSON.stringify(error));
					response.error({"message":error.message, "code":error.code});
				});
			});

		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});
		}	
    };

    var activationRequestValidate = function(request, response){
    	try {
		  	var requestParams = request.params;
		  
		  	if (!requestParams.vendorId) throw {
		    	message: 'Vendor ID not provided',
		    	code: '400'
		  	};

		  	//find a end user activation record for the required parameters
		  	//1. get a vendor
			var Vendor = Parse.Object.extend("Vendor");
			var query = new Parse.Query(Vendor);
			query.get(requestParams.vendorId, {useMasterKey:true})
			.fail(function(error){

				response.error({"message":error.message, "code":error.code});
			})
			.then(function(aVendorObject){
				//console.log(JSON.stringify(aVendorObject));
				// console.log(requestParams.activationCode);
				// console.log(requestParams.customerPhone);

				var EndUserActivations = Parse.Object.extend("EndUserActivation");
				var endUserActivationQuery = new Parse.Query(EndUserActivations);
				endUserActivationQuery.equalTo("activationCode", parseInt(requestParams.activationCode));
				endUserActivationQuery.equalTo("userIdentifier", requestParams.customerPhone);
				endUserActivationQuery.equalTo("vendor", aVendorObject);
				return endUserActivationQuery.find();
			}).then(function(results){
				// console.log("records found : " + results.length);
				// console.log(JSON.stringify(results));
				if (results.length == 1){
					//should only be one record, so update it to
					var activationRecord = results[0];
					activationRecord.set("validated", true);
					activationRecord.save()
					.then(function(){
						response.success({"message":"User activated successfully", code:200});
					});

				} else {
					var msgError = 'Activation code ' + requestParams.activationCode + ' not found for phone ' + requestParams.customerPhone;
					response.error({"message":msgError, "code":101});
				};
			});

		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});
		}
    };    

    var customerActivationRequest = function(request, response){
		try {

			var activationCode;
			var theVendor;
		  	var requestParams = request.params;
		    
		  	if (!requestParams.vendorId) throw {
		    	message: 'Vendor ID not provided',
		    	code: '400'
		  	};
		  	
		  	console.log("Vendor Id " + requestParams.vendorId);
			//load the vendor from the table
			var Vendor = Parse.Object.extend("Vendor");
			var query = new Parse.Query(Vendor);
			query.get(requestParams.vendorId, {useMasterKey:true})
			.fail(function(error){
				response.error({"message":error.message, "code":error.code});
			})
			.then(function(aVendorObject){
				console.log('vendor retrieved');
				theVendor = aVendorObject;
				//now write the entry in the user activation table
			  	activationCode = Math.floor(Math.random() * 90000) + 10000;
			  	
			  	var EndUserActivations = Parse.Object.extend("EndUserActivation");
			  	var endUserActivation = new EndUserActivations;

			  	endUserActivation.set("userIdentifier", requestParams.customerPhone);
			  	endUserActivation.set("vendor", aVendorObject);
			  	endUserActivation.set("validated", false);
			  	endUserActivation.set("activationCode", activationCode);
			  	//console.log();
			  	return endUserActivation.save();
			}).then(function(){
			  		// console.log('activation entry saved');
			  		//record has been saved, now send the text
			  		//1. first load the configuration
			  	return Parse.Config.get();
			}).then(function(aConfig){
				//console.log('Calling Init');
				smsInterface.init(aConfig);
				//console.log(smsInterface);
				console.log('verifying Phone Number ' + requestParams.customerPhone);
				return smsInterface.verifyPhoneNumber(requestParams.customerPhone, aConfig);
			}).fail(function(httpError){
				console.log('Phone verify error: ' + JSON.stringify(httpError));
				var msgError = 'Please confirm that the phone number '+ requestParams.customerPhone +' is correct.';
				response.error(msgError);
			}).then(function(){
				var smsText;				

				if (requestParams.deviceType && requestParams.deviceType == 'android')
					smsText = "Your activation is now complete. If you wish to manually activate a device, please enter " + activationCode + " as your PIN.";
				else
					smsText = "Tada! Your activation is almost complete. Just click the link and you are done. " 
						+ theVendor.get("protocolHandler") + activationCode + " .";

				//ok number is verified now,
				//send the SMS
				console.log('Sending SMS...');
				// var smsText = "Tada! Your activation is almost complete. Just click the link and you are done. foodtruck://" + activationCode + " .";
				smsInterface.sendSMS(requestParams.customerPhone, smsText)
				.fail(function(httpError){
					console.log('Send SMS .FAIL handler: ' + JSON.stringify(httpError) );
					var msgError = 'SMS could not be sent. See server trace for more information.';
					//console.log('calling response.error');
					response.error(msgError);				
				})
				.then(function(xhrResponse){
					console.log('telAPI repsonse is ' + JSON.stringify(xhrResponse));
					//telAPI can return a 200 'success' message with an error in the JSON
				    if (xhrResponse.data && xhrResponse.data.error_code) 
				    	response.error(xhrResponse.data.error_message);  
				    else 
				    	//return success message
						response.success( {message: "You will receive your activation code shortly.", "activationCode": activationCode});

				});				
			});

		}
		catch(error){
			console.log('Error : '  + error);
			response.error({"message":error.message, "code":error.code});
		} 
    };

    var userVerifyEmailResend = function(request, response){
    	console.log('userVerifyEmailResend');
		var requestParams = request.params;
		var config = null;

		Parse.Config.get()
		.then(function(aConfig){
			// console.log('userVerifyEmailResend: Config Loaded');
			config = aConfig;
			// console.log('userVerifyEmailResend: Getting User Info for ' + requestParams.userId);
			var query = new Parse.Query(Parse.User);
			query.equalTo("username", requestParams.userName);
			return query.find({useMasterKey: true});
		}).then(function(aUser){
			var resultUser = aUser[0];
			if (!resultUser){
				response.error({code:404, message:'User not found.'});
			} else {

				console.log('userVerifyEmailResend: Sending message to Mandrill');
				var mandrillAPIKey = config.get("MandrillAPIKey");
				// console.log('user is ' + JSON.stringify(aUser));

				var mandrill = require('mandrill-api/mandrill');
				var mandrill_client = new mandrill.Mandrill(mandrillAPIKey);

			  	var mailParams = {
			  		async:true, 
			  		template_name: config.get("emailNewUserWelcome"),
			  		template_content:{},
			  		message: {
			  			to: [{
			  				email: resultUser.get("email"),
			  				type: 'to'
			  			}], 
			  			merge_vars: [{
			  				rcpt: resultUser.get("email"),
			  				vars: [{
			  					name: "VERIFYLINK",
			  					content: config.get('baseUrl') + "/index.htm?verifyid=" + resultUser.id // + "#/signin"
			  				}]
			  			}]
			  		}
			  	};
			  	return mandrill_client.messages.sendTemplate( mailParams, 
			  		function(httpResponse){
			  			//return a response to the user
			  			// console.log('Mandril response is ...');
			  			console.log(httpResponse);
			  			response.success( { sendStatus: httpResponse[0].status});
			  		},
			  		function(httpResponse){
			  			console.log('Error sending Mandril Email...');
			  			console.log(httpResponse);
			  			//we are going to return a success message anyway, as the user can always
			  			//request a re-send
			  			response.error( {	"message": "Can not send email. Please try again later",
					  						"code": 102});
			  		}
			  	);	

			};
		  	
		}, function(error){
			console.log(error);
  			response.error( {	"message": "Can not send email. Please try again later",
		  						"code": 102});
		});

    };

    var userPwdResetRequest = function(request, response){
		var requestParams = request.params;
		var config = null;

		Parse.Config.get()
		.then(function(aConfig){
			config = aConfig;
			var query = new Parse.Query(Parse.User);
			query.equalTo('username', requestParams.email);
			Parse.Cloud.useMasterKey();
			// console.log('searching for user with email ' + requestParams.email);
			return query.find();
		})
		.then(function(aUser){
			console.log('user found' + JSON.stringify(aUser[0]));
			if (aUser.length == 0){
				//response.error( {message:"No record found for email " + requestParams.email, code:101} );
				return Parse.Promise.error({code:404, message:"No record found for email " + requestParams.email});
			} else {

				console.log('creating a reset request...');
				//create a reset request
				var ResetRequest = Parse.Object.extend("ResetRequest");
				var aResetRequest = new ResetRequest;
				aResetRequest.set("user", aUser[0]);
				return aResetRequest.save();
			}
		})
		.fail(function(anError){
			console.log('Error Object is ' + JSON.stringify(anError));
			if (anError.code != 404)
				response.error({code: anError.code, message: anError.message})
					else 
						response.success({}); //in the case of 404, dont return an error. We dont want the user
											 //to know that the email address was not found
		})
		.then(function(aResetRequest){
			console.log('reset request saved ');// + JSON.stringify(aResetRequest));
			var aUser = aResetRequest.get("user");

			var mandrillAPIKey = config.get("MandrillAPIKey");
			console.log('user is ' + JSON.stringify(aUser));
					
			var mandrill = require('mandrill-api/mandrill');
			var mandrill_client = new mandrill.Mandrill(mandrillAPIKey);

		  	var mailParams = {
		  		async:true, 
		  		template_name: "forgotPwd",
		  		template_content:{},
		  		message: {
		  			to: [{
		  				email: aUser.get("email"),
		  				type: 'to'
		  			}], 
		  			merge_vars: [{
		  				rcpt: aUser.get("email"),
		  				vars: [{
		  					name: "RESETLINK",
		  					content: config.get('baseUrl') + "/index.htm?resetid=" + aResetRequest.id  // + "#/signin"
		  				}]
		  			}]
		  		}
		  	};
		  	mandrill_client.messages.sendTemplate( mailParams, 
		  		function(httpResponse){
		  			//return a response to the user
		  			console.log('Mandril response is ...');
		  			console.log(httpResponse);
		  			response.success( { sendStatus: httpResponse[0].status});
		  		},
		  		function(httpResponse){
		  			console.log('Error sending Mandril Email...');
		  			console.log(httpResponse);
		  			//we are going to return a success message anyway, as the user can always
		  			//request a re-send
		  			response.error( {	"message": "Can not send email. Please try again later",
				  						"code": 102});
		  		}
		  	);
		});

    };
 
 	var userPwdResetComplete = function(request, response){
 		
 		var aResetRequest = null;

 		Parse.Cloud.useMasterKey(); //this allows us to query/update the user

 		var requestParams = request.params;
 		//1. Check if there is a reset request	
		var ResetRequest = Parse.Object.extend("ResetRequest");
		var query = new Parse.Query(ResetRequest);

		query.include(['user']);
		query.get(requestParams.resetRequestId)
		.fail(function(anError){
			console.log(anError);
			// console.log('Record not found!');
			return Parse.Promise.error({code: 101, message: "Reset request has expired. Please try again."});
		})
		.then(function(resetRequest){
			aResetRequest = resetRequest;

			// console.log('reset request found' + JSON.stringify(aResetRequest));
			if (!aResetRequest)
				return Parse.Promise.error({code: 101, message: "Reset request has expired. Please try again."});
			else {
		 		//2. Ensure that it is less than 15 minutes old
		 		var Moment = require('moment');

		 		var aMomentCutOff = new Moment.utc(aResetRequest.createdAt);
				
				//console.log('Creation date 1 is ' + aResetRequest.createdAt);
		 		//console.log('Creation date Moment is ' + aMomentCutOff.toString());
		 		//console.log('adding 15 mins');
		 		
		 		aMomentCutOff.add(15,"m"); //add 15 minutes to the created date/time
		 		var aMomentNow = new Moment.utc();

		 		//console.log('MomentNow is ' + aMomentNow.toString());
		 		//console.log('Cut off  is ' + aMomentCutOff.toString());
		 		if (aMomentNow.isAfter(aMomentCutOff)){
		 			 console.log('reset request has expired as it is more than 15 mins old!');
		 			 return Parse.Promise.error({code: 101, message: "Reset request has expired. Please try again."});
		 		}
		 		


		 		//3. If all is well, update the user's password
		 		var aUser = aResetRequest.get("user");
		 		console.log('setting new password to: ' + requestParams.newPwd);
		 		aUser.setPassword(requestParams.newPwd);
		 		aUser.save({}, {sessionToken:requestParams.sessionToken})
		 		.fail(function(anError){
		 			console.log('error updating user password' + JSON.stringify(anError));
		 			return Parse.Promise.error(anError);
		 		})
		 		.then(function(){
		 			console.log('password updated. Returning successful promise...');
		 			return Parse.Promise.as("");
		 		});
			};
		})
		.fail(function(anError){
			console.log('Error' + JSON.stringify(anError));
			if (aResetRequest) aResetRequest.destroy()  //remove the record
			.then(function(){
				response.success({code: anError.code, message: anError.message});	
			}) 
			else 
				response.success({code: anError.code, message: anError.message});	
			
		})
		.then(function(){
			//4. delete the reset request from the db
			console.log('destroying reset request');
			return aResetRequest.destroy();
		}).then(function(){
			console.log('calling success');
			response.success({success:true});
		});

 	};

    return {
        userLogin : userLogin,
        newUserVerify : newUserVerify,
        newUserRegister: newUserRegister,
        userPwdResetRequest: userPwdResetRequest,
        userPwdResetComplete: userPwdResetComplete,
        userVerifyEmailResend: userVerifyEmailResend,
        activationRequestValidate: activationRequestValidate,
        customerActivationRequest: customerActivationRequest
    };

}

exports.trkUser = trkUser;