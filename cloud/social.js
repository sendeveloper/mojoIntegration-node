// var Codebird = require('codebird').Codebird;
var Codebird = require ('codebird');
var _ = require('lodash');

function getQueryParams(qs) {
    qs = qs.split("+").join(" ");

    var params = {}, tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }

    return params;
}


// traverse an array and return true is given key value found

function getKeyValueObjectInArray(key, arr){
    for (var i = 0; i < arr.length; i++) {
      	if (arr[i].get("keyName") == key && arr[i].get("secretValue")) 
      		return arr[i];
    }
    
    return false;  
}

function getKeyValueInArray(key, arr) {

	//console.log('Searching for secret with key ' + key + ' in array ' + JSON.stringify(arr));
	//console.log('length of arrays is ' + arr.length);
    for (var i = 0; i < arr.length; i++) {
      	if (arr[i].get("keyName") == key && arr[i].get("secretValue")) 
      		return arr[i].get("secretValue");
    }
    
    return false;    
};



var trkSocial = function(){
	var const_twitter = '01';
	var const_facebook = '02';
	var const_no_socialnet = '00';

	var _socialSecretsGet = function (aVendor){

		var aSecretsObj = {};
		//now get the vendors token
		var Secrets = Parse.Object.extend("Secret");
		var socialQuery = new Parse.Query(Secrets);
		socialQuery.equalTo("vendor", aVendor);
		socialQuery.containedIn("keyName", ["fb_access_token", "tw_oauth_token", "tw_oauth_token_secret", "fb_pageaccess_token" , "fb_page_id"]);
		return socialQuery.find({useMasterKey:true})
		.then(function(results){
			//console.log('results!!!' + JSON.stringify(results));
			if (!aSecretsObj.secrets)
				aSecretsObj.secrets = [];

			aSecretsObj.secrets = results;
			//console.log('loading config....');
			return Parse.Config.get()
			.then(function(config){
				//console.log('config loaded!')
				aSecretsObj.twConsumerKey = config.get("twitterConsumerKey");
				aSecretsObj.twConsumerSecret = config.get("twitterConsumerSecret");
				//console.log('resolving...' + JSON.stringify(aSecretsObj));
			 	return Parse.Promise.as(aSecretsObj);
			});
		});
	};

	var twitterGetfollowerList = function(request, response){
		//load the vendor from the table

    	var twitterResponse = {};
    	var aSocialSecretsObj = {};

		// var requestParams = JSON.parse(request.body);

		var requestParams = request.params;

		if (!requestParams.vendorId) {
			throw {
				message: 'Please provide a Vendor ID.',
				code: '400'
			};
		};
 
		//load the vendor from the table
		var Vendor = Parse.Object.extend("Vendor");
		var query = new Parse.Query(Vendor);
		query.get(requestParams.vendorId, {useMasterKey:true})
		.then(function(aVendor){
			return _socialSecretsGet(aVendor)
		}).then(function(socialSecrets){
			var twPromise = Parse.Promise();

			aSocialSecretsObj = socialSecrets;
			//console.log('social secrets are ' + JSON.stringify(aSocialSecretsObj));

			var twAuthTokenSecret = getKeyValueObjectInArray('tw_oauth_token_secret', aSocialSecretsObj.secrets);
			var twAuthToken = getKeyValueObjectInArray('tw_oauth_token', aSocialSecretsObj.secrets);

			if (twAuthTokenSecret){
				//var twPromise = Parse.Promise();

				var aCallBird = new Codebird;
				aCallBird.setConsumerKey(aSocialSecretsObj.twConsumerKey, aSocialSecretsObj.twConsumerSecret);
				aCallBird.setToken(twAuthToken.get('secretValue'), twAuthTokenSecret.get('secretValue'));

				var twitterParams = {};
				twitterParams.skip_status = "1";
				twitterParams.include_user_entities = "0";
				twitterParams.user_id = twAuthToken.get('secretValue').split('-')[0];

				console.log('calling' + JSON.stringify(twitterParams));

				return aCallBird.__call("followers_ids", twitterParams, function(httpResponse){
					console.log('Twitter callback. Response  is' + JSON.stringify(httpResponse));

					if (httpResponse.errors)
				    	twitterResponse = {
				        	"message": httpResponse.errors[0].message,
				        	"code": httpResponse.errors[0].code
				      	};
					else {
						twitterResponse = httpResponse;
					};
					response.success(twitterResponse);
					//twPromise.resolve();
				});	  
			} else {
				response.success({"code":101, message:'Connection to Twitter is not available'});
			};
		});
	};

    var socialPlaceIdGet = function(request, response){
		//load the vendor from the table

    	var twitterResponse = {};
    	var fbResponse = {};
    	var aSocialSecretsObj = {};

		// var requestParams = JSON.parse(request.body);

		var requestParams = request.params;

		if (!requestParams.vendorId) {
			throw {
				message: 'Please provide a Vendor ID.',
				code: '400'
			};
		};
 
		//load the vendor from the table
		var Vendor = Parse.Object.extend("Vendor");
		var query = new Parse.Query(Vendor);
		query.get(requestParams.vendorId, {useMasterKey:true})
		.then(function(aVendor){
			return _socialSecretsGet(aVendor)
		}).then(function(socialSecrets){
			var twPromise = new Parse.Promise();

			aSocialSecretsObj = socialSecrets;
			//console.log('social secrets are ' + JSON.stringify(aSocialSecretsObj));

			var twAuthTokenSecret = getKeyValueObjectInArray('tw_oauth_token_secret', aSocialSecretsObj.secrets);
			var twAuthToken = getKeyValueObjectInArray('tw_oauth_token', aSocialSecretsObj.secrets);

			if (twAuthTokenSecret){
				//var twPromise = Parse.Promise();

				var aCallBird = new Codebird;
				aCallBird.setConsumerKey(aSocialSecretsObj.twConsumerKey, aSocialSecretsObj.twConsumerSecret);
				aCallBird.setToken(twAuthToken.get('secretValue'), twAuthTokenSecret.get('secretValue'));

				var twitterParams = {};
			    twitterParams.accuracy = requestParams.accuracy;
				twitterParams.granularity = 'poi';
			    twitterParams.lat = requestParams.lat;
			    twitterParams.long = requestParams.long;
			    twitterParams.query = requestParams.query;
				console.log('calling geo search...' + JSON.stringify(twitterParams));

				return aCallBird.__call("geo_search", twitterParams, function(httpResponse){
					console.log('Twitter callback. Response  is' + JSON.stringify(httpResponse));

					if (httpResponse.errors)
				    	twitterResponse = {
				        	"message": httpResponse.errors[0].message,
				        	"code": httpResponse.errors[0].code
				      	};
					else {
						twitterResponse = httpResponse;
					};
					console.log('resolving after callback...');
					//twPromise.resolve();
				});	  
			} else {
				console.log('No twitter token. resolving empty promise....');
				twPromise.resolve();
			};
			return twPromise;

		}).fail(function(error){
			//ignore any errors and just return an empty promise
			console.log('Error when processing twitter...');
			return Parse.Promise.as();
		}).then(function(){
			console.log('FB Section');

			//now get the FB Places
			var fbUserAccessToken = getKeyValueObjectInArray('fb_access_token', aSocialSecretsObj.secrets);
			
			//console.log('FB access token is ' + JSON.stringify(fbUserAccessToken));

			if (fbUserAccessToken){
				
			    var fbParams = {};
			    fbParams.access_token = fbUserAccessToken.get("secretValue");
			    fbParams.center = requestParams.lat + "," + requestParams.long;
			    fbParams.type = "place";
			    fbParams.distance = requestParams.accuracy;
			    fbParams.q = requestParams.query;
			    fbParams.limit = "10";	
			    console.log('calling FB....');

				return Parse.Cloud.httpRequest({
					method: 'GET', 
					url: 'https://graph.facebook.com/v2.4/search',
					params: fbParams,
					success: function(httpResponse){
						console.log('FB search reponse is ' + JSON.stringify(httpResponse.data));
						console.log('http status is ' + httpResponse.status);
						var jsonResponse = httpResponse.data;
						if (httpResponse.status == 200){
							//console.log('assigning jsonresponse to fbresponse' + jsonResponse);

							fbResponse = jsonResponse;
						};
					},
					error: function(error){
						console.log('FB error: ' + JSON.stringify(error));
						var jsonResponse = error.data;
						if (jsonResponse.error)
						fbResponse = {
					        "message": jsonResponse.error.message,
					        "code": error.status,
					        "type": jsonResponse.error.type 
						};
						//return Parse.Promise.as();
					}
				});
			} else{
				console.log('no FB token. resolving empty promise')
				return Parse.Promise.as();
			};

		}).fail(function(){
			//ignore any errors and just return an empty promise
			console.log('Error when processing FB...');
			return Parse.Promise.as();			
		}).then(function(){
			console.log('calling response.success');
			response.success({
				"twitter": twitterResponse,
				"facebook": fbResponse
			});
		});


    };

    var socialNetworkVerify = function(request, response){
		try{
			//retrieve the User
			// var requestParams = JSON.parse(request.body);

			var requestParams = request.params;

			if (!requestParams.vendorId) {
				throw {
					message: 'Please provide a Vendor ID.',
					code: '400'
				};
			};


			//load the vendor from the table
			var Vendor = Parse.Object.extend("Vendor");
			var query = new Parse.Query(Vendor);
			query.get(requestParams.vendorId, {useMasterKey:true})
			.fail(function(error){
				response.error({"message":error.message, "code":error.code});
			}).then(function(aVendorObject){
				//now check if social media connectivity has been done
				var Secrets = Parse.Object.extend("Secret");
				var socialQuery = new Parse.Query(Secrets);

				var facebookStatus = {};
				var twitterStatus = {};
				var fbPageAccessToken;
				var fbAuthToken;
				var fbPageId;
				var twAuthToken;
				var twAuthTokenSecret;
				var socialNetworkPromises = [];

				socialQuery.equalTo("vendor", aVendorObject);
				socialQuery.containedIn("keyName", ["fb_access_token", "tw_oauth_token", "tw_oauth_token_secret", "fb_pageaccess_token" , "fb_page_id"]);
				socialQuery.find()
				.then(function(results){
					console.log('Vendor secrets found ' + JSON.stringify(results));
					console.log(socialNetworkPromises);
					var twPromise = new Parse.Promise();
					//console.log('twitter promise is in');
					socialNetworkPromises.push(twPromise);
					//console.log('twitter promise is in');
					var fbPromise = new Parse.Promise();
					socialNetworkPromises.push(fbPromise);
					//console.log('fb promise is in');

					//console.log('promises are in array');
					//var socialPromise = Parse.Promise(); 
					console.log('No of Secrets found ' + results.length);
					//console.log('Results are ' + JSON.stringify(results));
					if (results.length > 0){
						console.log('defaulting social network statuses to FALSE');
						facebookStatus.connected = false;
						twitterStatus.connected = false;
						//console.log('All networks set to FALSE!');
						for (var i = 0; i < results.length; i++){
							var aResult = results[i];
							if (aResult.get("keyName") == "fb_pageaccess_token"){
								facebookStatus.connected = false;
								fbPageAccessToken = aResult;
								console.log('fb_pageaccess_token found');
							};

							if (aResult.get("keyName") == "fb_access_token"){
								facebookStatus.connected = false;
								fbAuthToken = aResult;
								console.log('fb_access_token found');
							};

							if (aResult.get("keyName") == "fb_page_id"){
								facebookStatus.connected = false;
								fbPageId = aResult;
								console.log('fb_page_id found');
							};

							if (aResult.get("keyName") == "tw_oauth_token"){
								console.log('Twitter Auth Token Found!');
								twAuthToken = aResult;
								console.log('tw_oauth_token found');
							};

							if (aResult.get("keyName") == "tw_oauth_token_secret"){
								console.log('Twitter Auth Token Secret Found!');
								twAuthTokenSecret = aResult;
								console.log('tw_oauth_token_secret found');
							};
						};
						console.log('about to load config');
						Parse.Config.get()
						.then(function(config){
							// console.log('Parse config is ' + JSON.stringify(config));

							if (twAuthToken && twAuthTokenSecret && !requestParams.onlyFacebook){
								//console.log('Setting Consumer Keys to CodeBird' + JSON.stringify(config));
								var codebird = new Codebird;
								codebird.setUseProxy(false);
								var twConsumerKey = config.get("twitterConsumerKey");
								var twConsumerSecret = config.get("twitterConsumerSecret");

								console.log('Consumer Key ' + twConsumerKey);
								console.log('Consumer Secret ' + twConsumerSecret);
					  
								codebird.setConsumerKey(twConsumerKey, twConsumerSecret);

								console.log('Twitter Auth Token ' + JSON.stringify(twAuthToken));
								console.log('Twitter Auth Token Secret ' + JSON.stringify(twAuthTokenSecret));
								codebird.setToken(twAuthToken.get("secretValue"), twAuthTokenSecret.get("secretValue"));

							    
							    // var JSONParams = {
							    //    include_entities: false,
							    //    skip_status: true
							    // }; 
							    var JSONParams = {};
								
								console.log('calling account_verifyCredentials via codebird');
								codebird.__call("account_verifyCredentials", JSONParams, function(twitterResponse){
									//if all is well, twitter will respond with an authorization URL
									//which we will return
									console.log('Twitter Response  is' + JSON.stringify(twitterResponse));
									//twitterResponse = JSON.parse(twitterResponse);

									if (twitterResponse.errors)
										twitterStatus.connected = false;
									else {
										twitterStatus.connected = true;
										twitterStatus.screen_name = twitterResponse.screen_name
									}
									twPromise.resolve(config);
								});
							
							} else {
								//no twitter Tokens found;
								console.log('No twitter tokens found or Twitter Verification not required');
								twPromise.resolve(config);
							};
							return twPromise;
						
						}).then(function(config){

							//if there is a facebook token then verify the token is still valid
							console.log('Checking for FB Connectivity');
							if (fbPageAccessToken && !requestParams.onlyTwitter){

								var fbParams = { 
							      "input_token": fbPageAccessToken.get("secretValue"),
							      "access_token": config.get("fbAppId") + "|" + config.get("fbAppSecret")
			    				};
								Parse.Cloud.httpRequest({
									method: 'GET', 
									url: 'https://graph.facebook.com/debug_token',
									//headers: xhrHeaderArray,
									params: fbParams,
							        success: function(httpResponse) {
							            // console.log('All is well with FB!');
							            console.log('Response from FB is ' + JSON.stringify(httpResponse.text));
							            var fbResponse = JSON.parse(httpResponse.text);
							            //console.log('fbResponse is ' + JSON.stringify(fbResponse));
							            if (fbResponse.data.is_valid == true){
							            	facebookStatus.connected = true;
							            	facebookStatus.userAccessToken = fbAuthToken.get("secretValue");
							            	facebookStatus.pageAccessToken = fbPageAccessToken.get("secretValue");
							            	facebookStatus.pageId = fbPageId.get("secretValue");
							            };
							            
							            fbPromise.resolve();
							        },
							        error: function(httpResponse) {
							        	console.log('FB error : ' + httpResponse.text);
							        	fbPromise.resolve();
							        }
							    });
							} else {
								console.log('FB page access token was  not found or FB Verification not required');
								fbPromise.resolve();
							};
							return fbPromise;	
						});
					} else {
						console.log('No secrets found. ALl social networks are off.');
						// no secrets found, nothing is connected
						twitterStatus.connected = false;
						facebookStatus.connected = false;
						console.log('calling response 1...');
						response.success({
							"twitter": twitterStatus,
							"facebook": facebookStatus
						});
					};
					return Parse.Promise.when(socialNetworkPromises);			 
				}).then(function(){
					console.log('calling response 2...');
					response.success({
						"twitter": twitterStatus,
						"facebook": facebookStatus
					});				
				});	
			});	
			

		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});
		};
    };


    var facebookSetPageInfo = function(request, response){
		// var requestParams = JSON.parse(request.body);

		var requestParams = request.params;

	  	if (!requestParams.vendorId) {
	    	throw {
	      		message: 'Please provide a Vendor ID.',
	      		code: '400'
	    	};
	  	}

	  	console.log('Searching for secrets...');

		var Vendor = Parse.Object.extend("Vendor");
	  	var aVendorObject = new Vendor();
	  	aVendorObject.id = requestParams.vendorId;
		//get the facebook long lives token
		var Secrets = Parse.Object.extend("Secret");
		var socialQuery = new Parse.Query(Secrets);	

		socialQuery.equalTo("vendor", aVendorObject);
		socialQuery.containedIn("keyName", ["fb_pageaccess_token", "fb_page_id"]);
		socialQuery.find()
		.then(function(results){
				console.log('found ' + results.length + ' secrets');
				var promiseArray = [];

				var aPageAccessTokenSecret = getKeyValueObjectInArray('fb_pageaccess_token', results);
				if (!aPageAccessTokenSecret){
					console.log('creating fb_pageaccess_token record');
					aPageAccessTokenSecret = new Secrets();
		  			aPageAccessTokenSecret.set("keyName", "fb_pageaccess_token");
		  			aPageAccessTokenSecret.set("secretValue", requestParams.fbPageAccessToken);
		  			aPageAccessTokenSecret.set("vendor", aVendorObject);
					promiseArray.push(aPageAccessTokenSecret.save());
				} else {
					console.log('updating fb_pageaccess_token record');
					aPageAccessTokenSecret.set('secretValue', requestParams.fbPageAccessToken);
					promiseArray.push(aPageAccessTokenSecret.save());
				};

				var aPageIDSecret = getKeyValueObjectInArray('fb_page_id', results);
				if (!aPageIDSecret){
					console.log('creating fb_page_id record');
					aPageIDSecret = new Secrets();
			  		aPageIDSecret.set("keyName", "fb_page_id");
			  		aPageIDSecret.set("secretValue", requestParams.fbPageId);
			  		aPageIDSecret.set("vendor", aVendorObject);
					promiseArray.push(aPageIDSecret.save());
				} else {
					console.log('updating fb_page_id record');
					aPageIDSecret.set('secretValue', requestParams.fbPageId);
					promiseArray.push(aPageIDSecret.save());
				};

				return Parse.Promise.when(promiseArray);
		}).then(function(){
			response.success({ "message":"success", "code" : "200" });
		});
    };

    var facebookGetAccessToken = function(request, response){
		try{
			// var requestParams = JSON.parse(request.body);

			var requestParams = request.params;

		  	if (!requestParams.vendorId) {
		    	throw {
		      		message: 'Please provide a Vendor ID.',
		      		code: '400'
		    	};
		  	}
			  
			if (!requestParams.shortLivedToken) {
			    throw {
			      message: 'Please provide a FaceBook Access Token',
			      code: '400'
			    };
			};

			var fbJSON = {};

			//load the vendor from the table
			var Vendor = Parse.Object.extend("Vendor");
			var aVendorObject;
			var query = new Parse.Query(Vendor);
			query.get(requestParams.vendorId, {useMasterKey:true})
			.fail(function(error){
				response.error({"message":error.message, "code":error.code});
			})
			.then(function(aVendor){
				aVendorObject = aVendor;
				return Parse.Config.get();
			})
			.then(function(aConfig){
				var afbAuthTokenRecord = null;

				//get the facebook long lives token
				var Secrets = Parse.Object.extend("Secret");
				var socialQuery = new Parse.Query(Secrets);	

				socialQuery.equalTo("vendor", aVendorObject);
				socialQuery.containedIn("keyName", ["fb_access_token"]);
				socialQuery.find()
				.then(function(results){
					console.log(results.length + ' records found. They are ' + results);
					//we only anticipate one records in results
					if (results.length == 1) afbAuthTokenRecord = results[0];
					
					return Parse.Cloud.httpRequest({
						method: 'GET',
						url: 'https://graph.facebook.com/oauth/access_token',
						params: {
							      "grant_type": 'fb_exchange_token',
							      "client_id": aConfig.get("fbAppId"),
							      "client_secret": aConfig.get("fbAppSecret"),
							      'fb_exchange_token': requestParams.shortLivedToken
	      				},
				        success: function(httpResponse) {
				            // console.log('All is well with FaceBook!');
				            console.log('Response from FB is ' + JSON.stringify(httpResponse.text));
				            fbJSON = getQueryParams(httpResponse.text);
				            // console.log('checking if null or not');
				            if (afbAuthTokenRecord != null){
				            	console.log('Updating existing records in Collection SECRET');
				            	afbAuthTokenRecord.set('secretValue', fbJSON.access_token);
				            	return afbAuthTokenRecord.save();
				            } else {
				            	//create a new secret
				            	console.log('Create new record in collection SECRET');
				            	afbAuthTokenRecord = new Secrets;
						  		afbAuthTokenRecord.set("keyName", "fb_access_token");
						  		afbAuthTokenRecord.set("secretValue", fbJSON.access_token);
						  		afbAuthTokenRecord.set("vendor", aVendorObject);
		  						return afbAuthTokenRecord.save()
				            }
				        },
				        error: function(httpResponse) {
				        	console.log('FB error : ' + httpResponse.text);
				        	var errorObject = JSON.parse(httpResponse.text);
				            response.error(errorObject);
				        }
			    	});

				}).then(function(){
					console.log('SUCESS! : ' + afbAuthTokenRecord);
					if (afbAuthTokenRecord)
						response.success({access_token: fbJSON.access_token});
				});				
			});
			
		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});
		}
    };

    var twitterGetAccessToken = function(request, response){
    	try{
			// var requestParams = JSON.parse(request.body);

			var requestParams = request.params;

			if (!requestParams.vendorId) {
				throw {
					message: 'Please provide a Vendor ID.',
					code: '400'
				};
			};

		  	console.log("oauth_verifier is ..." + requestParams.oauth_verifier);
		  	if (!requestParams.oauth_verifier) {
		    	throw {
		      		message: 'Please provide a oauth_verifier ID.',
		      		code: '101'
		    	};
		  	}

			var aCallBird = new Codebird;
			var aConfig;
			var twAuthTokenSecret;
			var twAuthToken;
			var Vendor = Parse.Object.extend("Vendor");
		  	var aVendorObject = new Vendor();
		  	aVendorObject.id = requestParams.vendorId;		

		  	return Parse.Config.get()
			.then(function(config) {
				aConfig = config;
			}).then(function(){
				//get the twitter secrets for this vendor
				var Secrets = Parse.Object.extend("Secret");
				var secretsQuery = new Parse.Query(Secrets);
				secretsQuery.equalTo("vendor", aVendorObject);
				secretsQuery.containedIn("keyName", ["tw_oauth_token_secret", "tw_oauth_token"]);
				console.log('Querying secrets for this vendor...');
				return secretsQuery.find()
			}).then(function(twitterSecrets){
				if (twitterSecrets.length > 0){
					console.log('about to loop at the secrets');
					_.each(twitterSecrets, function(aSecret){
						var secretName = aSecret.get("keyName");
						if (secretName == "tw_oauth_token_secret")
							twAuthTokenSecret = aSecret;
						if (secretName == "tw_oauth_token")
							twAuthToken = aSecret;
					});
				};

				if (!twAuthTokenSecret) {
				    response.error({
				      message: 'oAuth Token Secret Not Found for Vendor',
				      code: '101'
				    });
  				}
  
				if (!twAuthToken) {
					response.error({
				      message: 'oAuth Token Not Found for Vendor',
				      code: '101'
				    });
				};

				var twConsumerKey = aConfig.get("twitterConsumerKey");
				var twConsumerSecret = aConfig.get("twitterConsumerSecret");

				console.log('Consumer Key ' + twConsumerKey);
				console.log('Consumer Secret ' + twConsumerSecret);

				aCallBird.setConsumerKey(twConsumerKey, twConsumerSecret);
				aCallBird.setToken(twAuthToken.get("secretValue"), twAuthTokenSecret.get("secretValue"));
				aCallBird.__call("oauth_accessToken", { oauth_verifier: requestParams.oauth_verifier},
									function(twitterResponse){
										console.log('TWITTER RESPONSE IS '  + JSON.stringify(twitterResponse));
										// var jsonReply = getQueryParams(twitterResponse);
										var jsonReply = twitterResponse;
										if (jsonReply.oauth_token){
											console.log('Access Token is ' + jsonReply.oauth_token);
                       						console.log('Access Token Secret is ' + jsonReply.oauth_token_secret);
					                       	aCallBird.setToken(jsonReply.oauth_token,
					                                          jsonReply.oauth_token_secret);

					                       	twAuthToken.set("secretValue", jsonReply.oauth_token);
					                       	twAuthTokenSecret.set("secretValue", jsonReply.oauth_token_secret);
					                       	Parse.Promise.when([twAuthToken.save(), twAuthTokenSecret.save()])
					                       	.then(function(){
					                       		response.success({"screen_name": jsonReply.screen_name});
					                       	});

										} else {
											response.error({message:'oAuth Access Token could not be generated by Twitter', code:twitterResponse.http_status});
										}

									}
								);

			});


		} catch(error){
			console.log('An error has been caught...');
			console.error(error);
			response.error({"message":error.message, "code":error.code});
		}

    };

    var twitterRequestTokenForVendor = function(request, response){
    	try{

			//retrieve the vendor
			// var requestParams = JSON.parse(request.body);

			var requestParams = request.params;

			if (!requestParams.vendorId) {
				throw {
					message: 'Please provide a Vendor ID.',
					code: '400'
				};
			};
	  
			//load the vendor from the table
			var Vendor = Parse.Object.extend("Vendor");
			var query = new Parse.Query(Vendor);
			query.get(requestParams.vendorId)
			.fail(function(error){
				response.error({"message":error.message, "code":error.code});
			})
			.then(function(aVendorObject){
				//now get a request token for this vendor
				//console.log('vendor found :' + JSON.stringify(aVendorObject));
				Parse.Config.get()
				.then(function(config) {
					console.log('Config is ' + JSON.stringify(config));
					console.log('Setting Consumer Keys to CodeBird');
					
					var twConsumerKey = config.get("twitterConsumerKey");
					var twConsumerSecret = config.get("twitterConsumerSecret");

					console.log('Consumer Key ' + twConsumerKey);
					console.log('Consumer Secret ' + twConsumerSecret);
					var codebird = new Codebird();
					  
					codebird.setConsumerKey(twConsumerKey, twConsumerSecret);

					console.log('Keys Set...');
					var params = {oauth_callback: requestParams.baseUrl + "twitter_authenticated.htm"};
					//console.log('Params for codeBird are : ' + JSON.stringify(params));
					console.log('calling oauth_requestToken...');
					codebird.__call("oauth_requestToken", params,
										function(queryString){
												// var jsonReply = getQueryParams(queryString);
												var jsonReply = queryString;
												console.log('jsonReply is ' + JSON.stringify(jsonReply));	
												
												//write the auth token to the db so we can use later
												//first see if it exists (if it does then update)
												var Secrets = Parse.Object.extend("Secret");
												var secretsQuery = new Parse.Query(Secrets);
												secretsQuery.equalTo("vendor", aVendorObject);
												secretsQuery.containedIn("keyName", ["tw_oauth_token_secret", "tw_oauth_token"]);
												console.log('Querying secrets for this vendor...');
												secretsQuery.find()
												.then(function(results){
													console.log('secrets query success!. Number of secrets found : ' + results.length);
													//console.log(results);
													var promise = Parse.Promise.as();
													if (results.length > 0){
														console.log('about to loop at the secrets');
														_.each(results, function(aSecret){
															var secretName = aSecret.get("keyName");
															if (secretName == "tw_oauth_token_secret")
																aSecret.set("secretValue", jsonReply.oauth_token_secret);
															if (secretName == "tw_oauth_token")
																aSecret.set("secretValue", jsonReply.oauth_token);
															console.log('About to call Promise saving secret : ' + JSON.stringify(aSecret));
															promise = promise.then(function(){
																//console.log('Inside Promise saving secret : ' + JSON.stringify(aSecret));
																return aSecret.save();	
															});
															
														});
													} else {
														console.log('No secrets found. Creating secret records...');
														console.log('JSON Reply is ' + jsonReply.oauth_token_secret);
														//no secrets found, create them
														var twAuthTokenSecret = new Secrets();
														twAuthTokenSecret.set("keyName", "tw_oauth_token_secret");
														twAuthTokenSecret.set("secretValue", jsonReply.oauth_token_secret);
														twAuthTokenSecret.set("vendor", aVendorObject);
														console.log('calling Save for tw_oauth_token_secret ...');
														return twAuthTokenSecret.save()
														.then(function(){
															console.log("tw_oauth_token_secret saved!");
															//ok now save the auth token
															var twAuthToken = new Secrets();
															twAuthToken.set("keyName", "tw_oauth_token");
															twAuthToken.set("secretValue", jsonReply.oauth_token);
															twAuthToken.set("vendor", aVendorObject);
															twAuthToken.save()
															.then(function(){
																console.log("tw_oauth_token saved!");
																//ok all done
																promise.resolve();
															});
														});
													};

													console.log('returning promise');
													return promise;
												}).then(function(){
													//all the updates or create actions are complete
													//now we request an twitter to authorize the token we have
													console.log('Setting tokens ' + JSON.stringify(jsonReply));
													codebird.setToken(jsonReply.oauth_token, jsonReply.oauth_token_secret);
													codebird.__call("oauth_authorize", {}, function(auth_url){
														//if all is well, twitter will respond with an authorization URL
														//which we will return
														console.log('auth URL is ' + auth_url);
														response.success({"authUrl": auth_url});
													});
												});
										});
				});

			});

			} catch(error){
				console.log('An error has been caught...');
				console.error(error);
				response.error({"message":error.message, "code":error.code});
			}
    };

    var socialPostingCreate = function(request, response){
		try{
			// variables
			// var requestParams = JSON.parse(request.body);
			var requestParams = request.params;

			var vendorInfo = null;
			var aCallBird = new Codebird();
			var fbResponse = {};
			var twitterResponse = {};
			var fbPageID;
			var appPush = {};
			var payload = {}; 
			var appIdentifers = [];
			var vendorSecrets = []; 	

			if (!requestParams.vendorId) {
				throw {
					message: 'Please provide a Vendor ID.',
			    	code: '400'
				};
			}
		  
			// get the Vendor
		  	var Vendor = Parse.Object.extend("Vendor");
		  	var vendorInfo = new Vendor();
		    vendorInfo.id = requestParams.vendorId;

		    if (requestParams.twitter)
		    	console.log('Twitter: ' + JSON.stringify(requestParams.twitter));

		    if (requestParams.facebook)
		    	console.log('Facebook: ' + JSON.stringify(requestParams.facebook));

			console.log('getting vendor secrets...');
			_socialSecretsGet(vendorInfo)
			.then(function(aVendorSecrets){
				var fbPromise = new Parse.Promise();

				vendorSecrets = aVendorSecrets;
				//console.log('Vendor secrets are ' + JSON.stringify(vendorSecrets));

				fbAccessToken = getKeyValueInArray('fb_pageaccess_token', vendorSecrets.secrets);
				//console.log('fb page access token is ' + fbAccessToken);
				if (fbAccessToken){
					fbPageID = getKeyValueInArray('fb_page_id', vendorSecrets.secrets);
			      	console.log('FB page is is ' + fbPageID);
			      if (fbPageID && requestParams.facebook){
			      		// requestParams.facebook.access_token = fbAccessToken;

			      console.log('FB Params are ' + JSON.stringify(requestParams.facebook));
			      // var url = 'https://graph.facebook.com/v2.4/' + fbPageID + "/feed?message=" + requestParams.facebook.message;
			      var url = 'https://graph.facebook.com/v2.4/' + fbPageID + "/feed";
			      console.log('url is ' + url);

						Parse.Cloud.httpRequest({
							method: 'POST',
							headers:{	'Authorization': 'OAuth ' + fbAccessToken,
												'Content-type':'application/json'
							},
							url: url,
							body: requestParams.facebook,
							// params: JSON.stringify(requestParams.facebook),
					        success: function(httpResponse) {
					           
					            console.log('Response from FB is ' + JSON.stringify(httpResponse.data));
					            fbJSON = JSON.parse(httpResponse.text);
					            if (fbJSON.id){
					           		fbResponse = {
      									"message": "success",
      									"code": "200",
      									"fbPostId": fbJSON.id
      								}
					            } else {
					          		if (jsonResponse.error) 
					          			fbResponse = {
												        "message": jsonResponse.error.message,
												        "code": xhrResponse.status,
												        "type": jsonResponse.error.type
      									};        	
					            };

					            fbPromise.resolve();
					        },
					        error: function(httpResponse) {
					        	console.log('FB error : ' + JSON.stringify(httpResponse.text));
					        	var errorObject = JSON.parse(httpResponse.text);
					            if (errorObject.error){
					            	fbResponse = {
								        "message": errorObject.error.message,
								        "code": errorObject.error.code,
								        "type": errorObject.error.type
      								}
					            };
					            console.log('resolving after FB error....');
					            fbPromise.resolve();
					        }
				    	});			      		
			      	}
			      		else fbPromise.resolve(); //should never happen but just in case		
				} 
				else {	
						fbPromise.resolve();
						console.log('FB not connected for this vendor');
				};
				return fbPromise;
			}).then(function(){
				//console.log('Vendor secrets are ' + JSON.stringify(vendorSecrets));
				//ok now process twitter
				var twitterPromise = new Parse.Promise();

				console.log('Processing Twitter...');
				var twAuthTokenSecret = getKeyValueInArray('tw_oauth_token_secret', vendorSecrets.secrets);
				var twAuthToken = getKeyValueInArray('tw_oauth_token', vendorSecrets.secrets);

				if (twAuthTokenSecret && requestParams.twitter) {
					
					//console.log('Twitter Access token is ' + twAuthToken);
					//console.log('Twitter Access token SECRET is ' + twAuthTokenSecret);

					aCallBird.setConsumerKey(vendorSecrets.twConsumerKey, vendorSecrets.twConsumerSecret);
					aCallBird.setToken(twAuthToken,twAuthTokenSecret);
					console.log('calling status update with ' + JSON.stringify(requestParams.twitter));

					aCallBird.__call("statuses_update",requestParams.twitter, function(reply){
						console.log('Twitter has responded with' + JSON.stringify(reply));
						if (reply && reply.errors) {
							var error = reply.errors[0];
					      	twitterResponse = {
						        "message": error.message,
						        "code": error.code
      						};		
						} else {
							if (!reply)
						      	twitterResponse = {
							        "message": 'Twitter has not responded. Please try again later.',
							        "code": 110
	      						};	
							else 
						    	twitterResponse = {
						        	"message": "success",
						        	"code": "200",
						        	"user_id": reply.user.id_str,
						        	"status_id": reply.id_str
						      	};
						};
						//console.log('twitter promise resolving....');
						twitterPromise.resolve();
					});

				} else {
					console.log('Twitter not connected');
					twitterPromise.resolve();	
				};

				return twitterPromise;

			}).then(function(){
				// ok all done, return the result
				console.log('OK now checking app Push...');
	            if (requestParams.appPush)
		            if (requestParams.appPush.network != "00" || !requestParams.appPush){
		            	//go load the vendor object
						return vendorInfo.fetch()
		            } else {
		            	//console.log('No App Push required');
		            	return Parse.Promise.as();	
		            }
		        else 
		        	return Parse.Promise.as();
		        
	        }).then(function(aVendorObject){

				//console.log('Pushing to Vendor : ' + JSON.stringify(aVendorObject));
				vendorInfo = aVendorObject;

				if (!vendorInfo) 
					return Parse.Promise.error({code:151, message:'Vendor could not be loaded' });
				else {
					
					// payload.alert = 'Update from ' + aVendorObject.get('description');

					if (requestParams.appPush.network == const_facebook){
						if (fbResponse.code == 200){
							console.log('APP PUSH FB response is ' + JSON.stringify(fbResponse));
							payload.fbPostId = fbResponse.fbPostId;
							payload.fbPageId = fbPageID;
							payload.alert = requestParams.facebook.message;
						} else {
							appPush = {code: 101, message:"Facebook not posted succesfully so no update to Truck app occurred"};
							return Parse.Promise.as();
						};
					};
					console.log('Network is ' + requestParams.appPush.network);
					//console.log('twitter constant is ' + const_twitter);


					if (requestParams.appPush.network == const_twitter){
						console.log('APP PUSH Twitter response is ' + JSON.stringify(twitterResponse));
						if (twitterResponse.code == 200){
							payload.twPostId =  twitterResponse.status_id;
							payload.userId = twitterResponse.user_id;
							payload.alert = requestParams.twitter.status;
						} else {
							appPush = {code: 101, message:"Twitter not posted succesfully so no update to Truck app occurred"};
							return Parse.Promise.as();
						};
					};
						
					var settings = aVendorObject.get("settings");
					console.log();
					
					if (settings.appleBundleId)
						appIdentifers.push(settings.appleBundleId);

					if (settings.androidAppId)
						appIdentifers.push(settings.androidAppId);

					var pushServer = aVendorObject.get("pushServerApp");
					if (!pushServer){
						// console.log('Push Server not defined for Vendor');
					 //    appPush = {
						// 	"message": 'Push Server not defined for Vendor',
						//     "code": 101
						// };
						return Parse.Promise.as();
					};

					return aVendorObject.get("pushServerApp").fetch();
				};
			}).then(function(aPushApp){
				// console.log("push server is " + JSON.stringify(aPushApp));
				// console.log("push server is " + aPushApp.get("applicationId"));
				// console.log("push server is " + aPushApp.get("restAPIKey"));

				if (!aPushApp)
					return Parse.Promise.as();

				console.log('app appIdentifers are ' + JSON.stringify(appIdentifers));

				var headers = {};
				headers["Content-Type"]="application/json";
            	headers["X-Parse-Application-Id"]=aPushApp.get("applicationId");
            	headers["X-Parse-REST-API-Key"]=aPushApp.get("restAPIKey");

                    	//console.log('Headers are ' + JSON.stringify(headers));

				if (aPushApp && appIdentifers.length > 0){
					console.log('calling Push Server...');
					return Parse.Cloud.httpRequest({
						method: 'POST',
						url: 'https://api.parse.com/1/functions/doPushForVendor',
						headers: headers,
						body: {
							payload: payload,
							channels: [vendorInfo.id],
							appIdentifiers: appIdentifers,
							vendorId: vendorInfo.id
						},
				        success: function(httpResponse) {

				            console.log('Response from Push Server is ' + JSON.stringify(httpResponse.data));
						    appPush = {
						    	code:200, 
						    	message:"Social post sent to app succesfully"
						    };
				        },
				        error: function(httpResponse) {
				        	console.log(httpResponse.data);
				        	var errorResponse = JSON.parse(httpResponse.data.error);
				        	
				        	//console.log('error response is ' + JSON.stringify(errorResponse));

						    appPush = {
								"message": errorResponse.message,
							    "code": errorResponse.code
							};
							//console.log('App Push error : ' + JSON.stringify(appPush));
				        }
			    	});	
				} else return Parse.Promise.as();								

			}).then(function(){
					
				if (vendorInfo.get("oneSigAppId")){
					console.log('calling One Signal Push Server...' + JSON.stringify(payload));
					var headers = [];
					return Parse.Config.get()
					.then(function(config) {
						var headerse = {};
						headers["Authorization"] = "Basic " + vendorInfo.get("oneSigRESTAPIKey");
						headers["Content-Type"]="application/json";

						return Parse.Cloud.httpRequest({
							method: 'POST',
							url: 'https://onesignal.com/api/v1/notifications',
							headers: headers,
							body: {
								app_id:vendorInfo.get("oneSigAppId"),
								contents: {"en": payload.alert},
								data: payload,
								included_segments:['All']
							},
					        success: function(httpResponse) {
					            console.log('Response from One Signal Push Server is ' + JSON.stringify(httpResponse.data));
								if (httpResponse.data.errors && httpResponse.data.errors.length > 0){
						    		appPush = {
						    			code:151,
						    			message: httpResponse.data.errors[0]
						    		}
						    } else 
							    appPush = {
							    	code:200, 
							    	message:"Social post sent to app succesfully"
							    };
					        },
					        error: function(httpResponse) {
					        	console.log('Error from one Signal ' + JSON.stringify(httpResponse.data));
					        	var errorResponse = httpResponse.data.errors[0];
					        	
					        	//console.log('error response is ' + JSON.stringify(errorResponse));

							    appPush = {
									"message": errorResponse.message,
								    "code": errorResponse.code
								};
								//console.log('App Push error : ' + JSON.stringify(appPush));
					        }
				    	});
					});
				} else 
					return Parse.Promise.as();
					// });
				//};

	        }).then(function(){
	        	console.log('calling success...');
				response.success({
    				"twitter": twitterResponse,
    				"facebook": fbResponse,
    				"appPush": appPush
  				});	        	
	        }, function(error){
	        	response.success({
    				"twitter": twitterResponse,
    				"facebook": fbResponse,
    				"appPush": appPush
  				});	
	        });			

		} catch(e){
		  response.error({ message: e.message, code: e.code });
		}
    };

    var installTrckedTabtoFacebook = function(request, response){
		try {
		  	// console.log('installTrckedTabtoFacebook!');
			// variables
			// var requestParams = JSON.parse(request.body);

			var requestParams = request.params;

			var vendorInfo = null;
			var resObj = {};
			var parseConfig = null;
			var fbAccessToken = null;
			var vendorSecrets = null;

		    
		  	if (!requestParams.vendorId) {
			    throw {
			      message: 'Please provide a Vendor ID.',
			      code: '400'
			    };
		  	};

		  	var Vendor = Parse.Object.extend("Vendor");
		  	var vendorQuery = new Parse.Query(Vendor);
		  	vendorQuery.get(requestParams.vendorId, {useMasterKey:true})
		  	.fail(function(anError){
		  		response.error(anError);
		  	}).then(function(aVendorObject){
		  		return Parse.Config.get()
		  		.then(function(aConfig){
		  			console.log('storing config in global var');
		  			parseConfig = aConfig; //store as global var
		  			return Parse.Promise.as(aVendorObject);
		  		})
		  	}).then(function(aVendorObject){
		    	//console.log('Getting secret CLASS' + JSON.stringify(aVendorObject));
				var Secrets = Parse.Object.extend("Secret");
				//console.log('setting up secrets query');
				var socialQuery = new Parse.Query(Secrets);

				socialQuery.equalTo("vendor", aVendorObject);
				socialQuery.containedIn("keyName", ["fb_page_id", "fb_pageaccess_token" ]);
				return socialQuery.find()
			}).then(function(vendorSecrets){
				//ok now call FB API and install the tab
				var fbPageID = getKeyValueInArray('fb_page_id', vendorSecrets);
				var fbPageAccessToken = getKeyValueInArray('fb_pageaccess_token', vendorSecrets);
				var fbAppId = parseConfig.get("fbAppId");
				console.log("FB Info is  " + fbAppId + ' ' + fbPageAccessToken);

				Parse.Cloud.httpRequest({
					method: 'POST',
					url: 'https://graph.facebook.com/v2.2/' + fbPageID + "/tabs",
					params: {
						      "access_token": fbPageAccessToken,
						      "app_id": fbAppId
	  				},
			        success: function(httpResponse) {
			            console.log('Trcked Schedule installed on FB Page');
			            console.log('Response from FB is ' + JSON.stringify(httpResponse.text));
			            fbJSON = JSON.parse(httpResponse.text);
			            response.success(httpResponse.data);
			        },
			        error: function(httpResponse) {
			        	console.log('Trcked Schedule Install Error : ' + httpResponse.text);
			        	var errorObject = JSON.parse(httpResponse.text);
			            response.error(errorObject.error);
			        }
	    		});
			});
		} catch(e){
		  response.error({ message: e.message, code: e.code });
		}
    };

    var socialPostingsGet = function(request, response){
		try {
		  	console.log('socialPostingsGet!');
			// variables
			// var requestParams = JSON.parse(request.body);
			var requestParams = request.params;

			var vendorInfo = null;
			var twitterPosts = [];

			var aCallBird = new Codebird;
			
			var resObj = {};
			var vendorReadParams = {};
			var fbAccessToken = null;
			var twitterAuthToken = null;
			var vendorSecrets = null;
			var aSocialSecretsObj = {};
			var timeLine = {};
			//var codebird = new Codebird();	
		    
		  	if (!requestParams.vendorId) {
			    throw {
			      message: 'Please provide a Vendor ID.',
			      code: '400'
			    };
		  	};

		  	var Vendor = Parse.Object.extend("Vendor");
		  	var vendorQuery = new Parse.Query(Vendor);
		  	vendorQuery.get(requestParams.vendorId, {useMasterKey:true})
		  	.fail(function(anError){
		  		response.error(anError);
		  	})
		  	.then(function(aVendorObject){
		  		return _socialSecretsGet(aVendorObject)
			}).then(function(socialSecrets){
				aSocialSecretsObj = socialSecrets;

				console.log('Found ' + aSocialSecretsObj.secrets.length + ' secrets for vendor');
				
				// get facebook posts
				fbAccessToken = getKeyValueInArray('fb_access_token', aSocialSecretsObj.secrets);				

			    if (fbAccessToken) {
			    	//var fbPromise = new Parse.Promise();

			        console.log('FB Token found');
			    	var facebookPosts = [];
			      	var fbPageID = getKeyValueInArray('fb_page_id', aSocialSecretsObj.secrets);
			      
			      	if (fbPageID) {
						return Parse.Cloud.httpRequest({
							method: 'GET',
							url: 'https://graph.facebook.com/v2.4/' + fbPageID + "/feed",
							params: {
								      "access_token": fbAccessToken,
								      "limit": 3
		      				},
					        success: function(httpResponse) {
					            console.log('All is well with FaceBook!');
					            //console.log('Response from FB is ' + JSON.stringify(httpResponse.text));
					            fbJSON = JSON.parse(httpResponse.text);
					            resObj.facebookPosts = fbJSON.data;
					            //fbPromise.resolve(vendorSecrets);
					        },
					        error: function(httpResponse) {
					        	console.log('FB error : ' + httpResponse.text);
					        	var errorObject = JSON.parse(httpResponse.text);
					            // response.error(errorObject);
					        }
				    	});
			      	};
			      	//return fbPromise;
			    }
			     else {
			     	console.log('No FB tokens found. resolve promise and process twitter');
			    	return Parse.Promise.as();
			    };
			}).then(function(){
				var twPromise = new Parse.Promise();

		    	// get twitter posts/status updates
		    	twitterAuthToken = getKeyValueInArray('tw_oauth_token', aSocialSecretsObj.secrets);
			    	
		    	if(twitterAuthToken){

		    		// console.log('Twitter Token found:' + twitterAuthToken);
		    		// console.log('social secrests are' + JSON.stringify(aSocialSecretsObj.secrets));	

					var twitterAuthTokenSecret = getKeyValueInArray('tw_oauth_token_secret', aSocialSecretsObj.secrets);
					// console.log('TWITTER settings are: ' + aSocialSecretsObj.twoConsumerSecret);

					console.log('tw consumer key ' + aSocialSecretsObj.twConsumerKey);
					console.log('tw consumer secret ' + aSocialSecretsObj.twConsumerSecret);
					aCallBird.setConsumerKey(aSocialSecretsObj.twConsumerKey, aSocialSecretsObj.twConsumerSecret);


					console.log('tw auth token ' + twitterAuthToken);
					console.log('tw auth token secret ' + twitterAuthTokenSecret);
					aCallBird.setToken(twitterAuthToken,twitterAuthTokenSecret);
					    
					var userID=twitterAuthToken.split("-")[0];
					var JSONParams = {
					  	count : 3,
					  	contributor_details : "false",
					   	exclude_replies:"true",
						include_rts:"true",
					   	trim_user:"true",
					   	user_id: userID
					};
					    
					console.log('retriving user time line for ' + userID);

					aCallBird.__call("statuses_userTimeline", JSONParams, function(twitterResponse){
						// console.log('Twitter time line retrieved: ' + JSON.stringify(twitterResponse));
						
						if (twitterResponse && twitterResponse.errors)
							twPromise.reject(twitterResponse.errors[0])
						else {
							if (!twitterResponse)
								twPromise.reject({
							        "message": 'Twitter has not responded. Please try again later.',
							        "code": 110
	      						});
							else {
								timeLine = twitterResponse;
								twPromise.resolve();
							}
						}
					});
				} else 
					twPromise.resolve();

				return twPromise;
			
			}).then(function(){
				//console.log('timeline is :' + JSON.stringify(timeLine));
				//the users time line has been retrieved
				// now go get all the oembed HTML

				var promise = new Parse.Promise();
				var counter = 0;
				_.each(timeLine, function(aTimeLineEntry){
					//console.log('Processing tweet: ' + JSON.stringify(aTimeLineEntry));
					// promise = promise.then(function(){
						var oembedParam = {										
							id : aTimeLineEntry.id_str,
							align : "left",
							omit_script : 1,
						};
						
						return aCallBird.__call("statuses/oembed", oembedParam, function(oembedResponse){
							// console.log('oembed html is ' + oembedResponse.html);
							if (oembedResponse.errors){
								console.log('Error from twitter : ' + JSON.stringify(oembedResponse));
							} else {

								if (!resObj.twitterPosts)
									resObj.twitterPosts = [];
							
								//console.log('Adding HTML to twitterPosts...')
								resObj.twitterPosts.push(oembedResponse.html);
							};

							counter++;
							if (counter == timeLine.length)
								promise.resolve();
						});
					// });
				});
				return promise;

			}).fail(function(errorResponse){
				console.log('returning an error from TWITTER...' + JSON.stringify(errorResponse));
				// if (errorResponse.data.errors.length > 0)
				// 	response.error({code:101, message: 'Twitter: ' + errorResponse.data.errors[0].message});
				// if (errorResponse.error.error)
				// 	response.error({code:101, message: 'Twitter: ' + errorResponse.error.error});
				response.error({code:101, message:'Could not retrieve Social Posts'});
			}).then(function(){
			    //console.log('Result is ' + JSON.stringify(resObj));
			    // all done return with success
			    response.success(resObj);					
			});    	    
		} catch (e) {
		  console.log('CATCH exception is ' + JSON.stringify(e));
		  // server code fail errors are assigned code="500"
		  var errorCode = "500";
		  var errorMessage = "Internal Server Error";
		  
		  if (e.message && e.code) {
		    errorCode = "400";
		    errorMessage = e.message;
		  }
		  
		  response.error(errorMessage, errorCode);
		}
    };

    var savedSocialPostsGet = function(request, response) {
    	try{ 	
    		// var requestParams = JSON.parse(request.body);

    		var requestParams = request.params;


    		var responseObj={"global":[],"saved":[]};

    		console.log('Params are ' + JSON.stringify(requestParams));

    		if (!requestParams.vendorId){
    			console.log('Throwing error...');

			    throw {
			      message: 'vendorId is required',
			      code: 400
			    };			
				}

				var GlobalPost = Parse.Object.extend("GlobalPosts");
				var SocialPosting = Parse.Object.extend("SocialPosting");
				// var Vendor = Parse.Object.extend("Vendor");
				var vendor = null;
				var appUrl = "";

				var Vendor = Parse.Object.extend("Vendor");
				var query = new Parse.Query(Vendor);
				return query.get(requestParams.vendorId, {useMasterKey:true})
				.then(function(aVendor){

					vendor = aVendor;
					return Parse.Promise.as("");
					// appUrl = vendor.get("appUrl");
					// if (!appUrl){
					// 		var TrkVendor = require('cloud/vendor.js').trkVendor;
					// 	  var trkVendor = new TrkVendor();
					// 	  console.log('OK' + JSON.stringify(TrkVendor));
					// 	 	return trkVendor.getAppUrl(vendor)
					// 	 	.then(function(theAppUrl){
					// 	 		console.log("the app url is " + theAppUrl);
					// 	 		if (theAppUrl != ""){
					// 				TrkUtils = require('cloud/utility.js').trkUtility;
					// 					var trkUtils = new TrkUtils();
					// 				var Moment = require("cloud/moment-timezone-with-data.js");

					// 				var expiresOn = new Moment().utc().add(7, 'days').toDate();
					// 				// set expirate date to 7 days from now
					// 				return trkUtils.createTrkUrl(theAppUrl, expiresOn);
					// 			} else 
					// 					return Parse.Promise.as();
					// 	 	});
					// } else 
					// 		return Parse.Promise.as(appUrl);

				}).then(function(theAppUrl){
					appUrl = theAppUrl;
					console.log('App URL is ' + appUrl);

					console.log('Getting Global social posts');
					var query = new Parse.Query(GlobalPost);

					if(requestParams.associatedEvent)
						query.equalTo("associatedEvent",requestParams.associatedEvent);
					
					return query.find();
				}).then(function(result){
					console.log('Global social posts retrieved');
					_.each(result, function(item, index) {

						var facebookPost={"place":{"address":null,"id":null,"name":null},"message":null,"url":null};
						var twitterPost={"place":{"address":null,"id":null,"name":null},"status":null};

						facebookPost.message= item.get("text");
						twitterPost.status= item.get("twitterText")?item.get("twitterText"):item.get("text");

						if (item.get("attachApp") == true && appUrl != ""){

							facebookPost.url = appUrl;
							twitterPost.status = twitterPost.status + appUrl;
						};

						responseObj["global"].push({"facebook":facebookPost,"twitter":twitterPost});
					});

					console.log('getting vendor specific social posts');
					//get the saved social posts
					query= new Parse.Query(SocialPosting);

					if (requestParams.includeAutoGenerated)
						query.equalTo("autoGenerated", true);
					else{
						query.equalTo("autoGenerated", false);
					};

					query.equalTo("vendor",vendor);
					return query.find() //saved posts

				}).then(function(result){

						_.each(result, function(item, index) {
							responseObj["saved"].push({"facebook":item.get("facebook"),"twitter":item.get("twitter")});
						});
						return Parse.Promise.as();
				}).then(function(){
					console.log('savedSocialPostsGet: Success');
			  	response.success(responseObj)
			  }, function(error){
			  	console.log('savedSocialPostsGet: Error!');
			  	response.error(error);
			  });
			} catch (e) {
				console.log('savedSocialPostsGet: Error2!' + JSON.stringify(e));
				response.error(e);
			};
    };

    var getRandomGlobalPost = function(trckedEventType){
    	//console.log('Get random global post for ' + trckedEventType);

	    var GlobalPosts = Parse.Object.extend("GlobalPosts");
	    var query = new Parse.Query(GlobalPosts);
	    query.equalTo( "associatedEvent", trckedEventType)
	    return query.find({
	    	error: function(errorObj){
	    		console.log('Error!' + JSON.stringify(errorObj));
	    	},
	    	success: function(){
	    		//console.log('success!');
	    	}
	    })
	    .then(function(globalPosts){


	    	var min = 0;
	    	var max = globalPosts.length-1;

	    	var randomIndex = Math.floor(Math.random()*(max-min+1)+min);

	    	//var randomIndex = Math.floor(randomNum * (globalPosts.length - 1) ) ;
	    	// console.log('Random index is ' + randomIndex);
	    	// if (randomIndex < 0)
	    	// 	randomIndex = 0;

	    	//console.log('Random index is...' + randomIndex);
	    	//globalPosts[randomIndex].randomNumber = randomNum;
	    	//globalPosts[randomIndex].randomIndex = randomIndex;
	    	//now get that record and return
	    	//console.log('random post is ' + JSON.stringify(globalPosts[randomIndex]));
	    	return Parse.Promise.as(globalPosts[randomIndex]);
	    });
    };

    var publishScheduleToSocial = function(job, data) {
    	
    	try {
    		
    		var self=this;
			var moment = require("moment-timezone");			//include moment with timezone information
			
			var queryVendor = new Parse.Query("Vendor");
			Parse.Cloud.useMasterKey();

			queryVendor.equalTo( "settings.publishScheduleToSocial", true);
	     	queryVendor.exists("timeZone");			//vendor must have timezone set

	     	return queryVendor.find()
	    	.then(function(vendors){
	    		
	    		if(vendors && vendors.length) {

	    			var promise = Parse.Promise.as();
	    			// loop through all vendors and post to social networks where applicable
					_.each(vendors, function(aVendor){

						//ensure that schedule date is +- 5mins from now
						var now = moment();
						var dateCompare = moment().format("YYYY-MM-DD");
						dateCompare+= aVendor.get("settings").publishScheduleToSocialTime;

						dateCompare=moment.tz(dateCompare,"YYYY-MM-DDHH:mm A",aVendor.get("timeZone"));

						if(Math.abs(now.diff(dateCompare,'minutes')) <= 5) {			// process schedule - keep a buffer of +/- 5mins incase job does not run on time
					    // if (1 == 1){
							promise = promise.then(function(){
								//get a random tweet
				    			var socialPostRequest = {};
				    			socialPostRequest.twitter = {};
				    			socialPostRequest.facebook = {};
				    			var aUser = null;
				    			var socialPostHTTPResponse;

				    			return self.getRandomGlobalPost('SCHEDULE_AUTO_PUBLISH')
				    					
				    					// create the post
				    					.then(function(globalPost){
				    						socialPostRequest.vendorId = aVendor.id;
								    		socialPostRequest.facebook.message =  globalPost.get("text");
								    		
								    		if ( globalPost.get("twitterText") )
								    			socialPostRequest.twitter.status = globalPost.get("twitterText")
								    		else 
								    			socialPostRequest.twitter.status = globalPost.get("text");

								    		//now get the URL which will be embedded in the social Post
						    				TrkUtils = require('./utility.js').trkUtility;
											var trkUtils = new TrkUtils();
											// set expirate date to 7 days from now
											var expiresOn = moment().utc().add(7, 'days').toDate();
											var aUrl = '/schedule?vendorid=' + aVendor.id + '&defaultView=basicDay';
											return trkUtils.createTrkUrl(aUrl, expiresOn);

				    					})

				    					// post to social networks
				    					.then(function(resultUrl){
				    						socialPostRequest.twitter.status = socialPostRequest.twitter.status + ' ' + resultUrl;
								    		socialPostRequest.facebook.message = socialPostRequest.facebook.message + ' ' + resultUrl;

							    			//post the update
							    			console.log("Posting to socials networks");
							    			return Parse.Cloud.run("socialPostingCreate", socialPostRequest,{
								    			success: function(result){
								    				console.log("successfully posted to social networks");

								    			},

								    			error: function(error){
								    				console.log('Social Posting Error' + JSON.stringify(error));
								    				//status.message('Social Posting Error' + JSON.stringify(error));
								    			}
								    		});

				    					})

				    					// get user to email
				    					.then(function(httpResponse){
							    			
							    			socialPostHTTPResponse = httpResponse;

						    				//get the user  to email
						    				var User = Parse.Object.extend("User");
						    				var userQuery = new Parse.Query(User);
						    				userQuery.equalTo("vendor", aVendor);
						    				
						    				return userQuery.first({useMasterKey:true})
							    				.then(function(resultUser){
							    					aUser = resultUser;	
							    				});
						    			})

				    					// get parse config
						    			.then(function(){
						    				return Parse.Config.get();
						    			})

						    			// email user
						    			.then(function(aConfig) {

						    				var fbResult;
						    				var twResult;
						    				var fbLink;
						    				var twLink;
						    				var twLinkLabel = '';
						    				var fbLinkLabel = '';
						    				var fbPostText = '';
						    				var twStatusText = '';

						    				var mandrillPromise= new Parse.Promise();			// does not seem mandrill API's return promises hence need to create one manually
						  					var mandrillAPIKey = aConfig.get("MandrillAPIKey");

									  		var mandrill = require('mandrill-api/mandrill');
									  		var mandrill_client = new mandrill.Mandrill(mandrillAPIKey);

						    				fbPostText = socialPostRequest.facebook.message;
						    				twStatusText = socialPostRequest.twitter.status;

						    				console.log('publishScheduleToSocial: HTTP Response' + JSON.stringify(socialPostHTTPResponse));

						    				if (socialPostHTTPResponse.facebook.message != 'success')
						    					fbPostText = 'Did not post due to error: ' + String(socialPostHTTPResponse.facebook.message).toLowerCase();
						    				else {
						    					fbResult = '';
						    					var fbResponseArray = String(socialPostHTTPResponse.facebook.fbPostId).split('_');
						    					fbLink = 'https://www.facebook.com/' + fbResponseArray[0] + '/posts/' + fbResponseArray[1];
						    					fbLinkLabel = 'View Facebook post';
						    				}
						    				
						    				if (socialPostHTTPResponse.twitter.code != 200)
						    					twStatusText = 'Did not post because ' + String(socialPostHTTPResponse.twitter.message).toLowerCase();
						    				else {
						    					twResult = '';
						    					twLink = 'https://twitter.com/' + socialPostHTTPResponse.twitter.user_id + '/status/' + socialPostHTTPResponse.twitter.status_id;
						    					twLinkLabel = 'View Twitter post';
						    				}

						    				var mailParams = {
									  			async:true, 
									  			template_name: "socialnotificationv2",
									  			template_content:{},
									  			message: {
									  				to: [{
									  					email: aUser.getEmail(),
									  					type: 'to'
									  				}],
									  				merge_vars: [{
									  					rcpt: aUser.getEmail(),
									  					vars: [{
									  						name: "FBRESULT",
									  						content: fbResult
									  					},
									  					{
									  						name: "TWRESULT",
									  						content: twResult
									  					},
									  					{
									  						name:"FBLINK",
									  						content: fbLink
									  					},
									  					{
									  						name:"TWLINK",
									  						content: twLink	
									  					},{
									  						name:"TWLINKLABEL",
									  						content: twLinkLabel	
									  					},{
									  						name:"FBLINKLABEL",
									  						content: fbLinkLabel	
									  					},{
									  						name:"FBPOSTTEXT",
									  						content: fbPostText	
									  					},{
									  						name:"TWSTATUSTEXT",
									  						content: twStatusText	
									  					}]
									  				}]
									  			}
					  						}

										  	return mandrill_client.messages.sendTemplate( mailParams,
										  		function(httpResponse){
										  			//return a response to the user
										  			console.log('Mandril response is ...' + JSON.stringify(httpResponse[0]));
										  			mandrillPromise.resolve();
										  		},
										  		function(httpResponse){
										  			console.log('Error sending Mandril Email...' + JSON.stringify(httpResponse));
										  			//we are going to return a success message anyway, as the user can always
										  			//request a re-send
										  			mandrillPromise.resolve();
										  		}
										  	);

					  						// Mandrill.sendTemplate(mailParams, {
									  		// 	success: function(httpResponse){
									  		// 		//return a response to the user
									  		// 		console.log('Mandril response is ...' + JSON.stringify(httpResponse));
									  		// 		mandrillPromise.resolve();
									  		// 	},
									  		// 	error: function(httpResponse){
									  		// 		console.log('Mandril Error response is ...' + JSON.stringify(httpResponse));
									  		// 		mandrillPromise.resolve()
									  				
									  		// 	}
									  		// })

									  		return mandrillPromise;

										})

						    			
							})		// END promise.then
						}

					});		// END _.each	    			

	    			return promise;
	    		}

	    		else {
	    			return Parse.Promise.as();
	    		}
	    	}, {useMasterKey:true}, function(error){
	    		return Parse.Promise.error(error);
	    	});		// END .then
				
		}

		catch(error) {
			// status.error(error);
			return Parse.Promise.error(error);
		}
    
	};

	var generateRepeatedSocialPosts = function(job, data){
		//create a new social posting record for event
		var TrkSocial = require('./social.js').trkSocial;
		var trkSocial = new TrkSocial;

		var Moment = require("moment-timezone");

		// //request should contain the target time zone
		//console.log('request.params is ' + request.params);
		var requestParams;

		//implement work around as requested by Parse Support
		// if (typeof data.params === 'string') 
		// 	requestParams = JSON.parse(request.params)
		// 		else requestParams = request.params;
		requestParams = data;
		//console.log('Processing vendors in time zone ' + requestParams.timeZone);

		//Get start/end moments in target timezone
		var aStartMoment = new Moment();
		aStartMoment.tz(requestParams.timeZone);
		//set to midnight
		aStartMoment.set("hours", 0);
		aStartMoment.set("minutes", 0);
		aStartMoment.set("seconds", 0);
		//console.log('Start moment is ' + aStartMoment.format());

		var aEndMoment = new Moment();
		aEndMoment.tz(requestParams.timeZone);
		//set to end of the day
		aEndMoment.set("hours", 23);
		aEndMoment.set("minutes", 59);
		aEndMoment.set("seconds", 59);
		//console.log('End moment is ' + aEndMoment.format());

		// Get all vendors for the target time zone that have requested auto post of events
		//console.log('settings up query for vendors...');
		Parse.Cloud.useMasterKey();
		var Vendor = Parse.Object.extend("Vendor");
		var queryVendor = new Parse.Query(Vendor);
		queryVendor.equalTo("timeZone", requestParams.timeZone);			//vendor must have timezone set
		queryVendor.greaterThan( "settings.eventPublishOffset", 0);
     	//console.log('calling each...');
     	return queryVendor.each(function(aVendor){
     		//console.log('found ' + aVendor.id + ' to process.');
     		//now get all the schedule entries for 'today' for this vendor
 			return Parse.Cloud.run("truckScheduleGet",{
				vendorId: aVendor.id,
				fromTimeStamp: aStartMoment.utc().format(),
				toTimeStamp: aEndMoment.utc().format(),
				ignorePrivateSettings: true, 
				ignoreDeletedTrucks: true	
			}).then(function(vendorEventList){
				//console.log(vendorEventList);
				// console.log('Found ' + JSON.parse(vendorEventList).length + ' records to process');
				//vendorEventList = []; //FORCE a 'truck is closed' message (for testing purposes only)

				if (!vendorEventList || vendorEventList.length == 0){
					console.log('No events found for ' + aStartMoment.utc().format());
					return trkSocial.generateSchedEventSocialRecords(aVendor, null);
				} else {
					var promise = Parse.Promise.as();
					_.each(vendorEventList, function(aScheduleEvent){

						// console.log('Event Found: ' + aScheduleEvent.name + ' ' 
						// 	+ aScheduleEvent.objectId + ' ' + aScheduleEvent.isPrivate + ' recurring:' + aScheduleEvent.isRecurring);
						
						//we should ensure that the start date of the event is after midnight
						//if it is BEFORE midnight then it started yesterday and 
						//would have been picked up by yesterdays run of this batch program
						var ascheduleEventStartMoment = new Moment(aScheduleEvent.startDateTime);
						if (ascheduleEventStartMoment.isBefore(aStartMoment)){
							//console.log('returning false for ' + aScheduleEvent.name + aScheduleEvent.objectId);
							return false;
						};
										
						promise = promise.then(function() {
							var aParseScheduledEvent;
							//only process recurring events
							if (aScheduleEvent.isRecurring == true){
								//console.log('calling method to create a social post record for event...');
								//unfortunately the records returned from truckScheduleGet is in JSON format
								// and what we want is a Parse.Object so we need to instantiate one
								var TruckScheduleEvents = Parse.Object.extend("TruckScheduleEvent");
								var query = new Parse.Query(TruckScheduleEvents);
								return query.get(aScheduleEvent.objectId)
								.then(function(parseScheduleEvent){

									aParseScheduledEvent = parseScheduleEvent;
									//we need to set the 'calculated' start/end dateTime 
									//into the schedule record that we just loaded from the DB
									aParseScheduledEvent.set("startDateTime", aScheduleEvent.startDateTime);
									aParseScheduledEvent.set("endDateTime", aScheduleEvent.endDateTime);
									aParseScheduledEvent.set("isRecurring", aScheduleEvent.isRecurring); //this will always be true

									//before you create the new record, we should delete any
									//other social posts for this event as these are deemed obsolete
									var SocialPosting = Parse.Object.extend("SocialPosting");
									var socialPostingQuery = new Parse.Query(SocialPosting);
									// socialPostingQuery.equalTo("parentColl", {collName:"truckScheduleEvents", id:aScheduleEvent.objectId});
									socialPostingQuery.equalTo("parentColl.id", aScheduleEvent.objectId);
									return socialPostingQuery.find({useMasterKey:true});
									
								}).then(function(results){
									if (results && results.length > 0){
								 		//console.logma('Found ' + aScheduleEvent.name + ' existing social records. deleting...');
								// 		//delete all existing schedule posts for this event
								 		return Parse.Object.destroyAll(results, {useMasterKey:true});

									} else 
										return Parse.Promise.as();

								}).then(function(){
									// console.log('Generating new social post record for event ' 
									// 	+ aParseScheduledEvent.id + aParseScheduledEvent.startDateTime + aScheduleEvent.endDateTime);

									return trkSocial.generateSchedEventSocialRecords(aVendor, aParseScheduledEvent);								
								});


							} else 
								return Parse.Promise.as();
						});
					});	
					return promise;
				}

			});
     	}, {
     		success:function(){
     			// console.log('calling success');
     			// status.success('success');
     			return Parse.Promise.as();
     		},
     		error:function(error){
     			console.log('Error ' + JSON.stringify(error));
     			// status.error(error.message);
     			return Parse.Promise.error(error);
     		}
     	});

	};

	var generateSchedEventSocialRecords = function(aVendorRecord, aEventRecord, referenceMoment){
		// console.log('reference moment is ' + referenceMoment);
		var Moment = require("moment-timezone");
		var aGlobalPost;
		var appOrderPost;
		var appUrl;
		var twitter;
		var facebook;
		var attachSchedule = false;
		var scheduleUrl;
		var aEventStartMoment;
						
		var globalPostType;
		// console.log(aEventRecord);

		if (aEventRecord){
			if (aEventRecord.get("isPrivate") == true){
				//console.log('Private event!!');
				globalPostType = 'PRIVATE_EVENT';
			} else {
				if (aEventRecord.get("locationData"))
					globalPostType = 'TRUCK_OPEN_WITH_PLACE'
				else 
					globalPostType = 'TRUCK_OPEN';
			}
		} else {
			globalPostType = 'NO_EVENTS';
		};

		console.log(globalPostType);

		return getRandomGlobalPost(globalPostType)	
		.then(function(aResult){
			// console.log(aResult);

			aGlobalPost = aResult;
			
			attachSchedule = aGlobalPost.get("attachSchedule");

			if (aGlobalPost.get("attachApp")){
				//console.log('App should be attached!');
				return getRandomGlobalPost('APP_ORDER');
			}	else return Parse.Promise.as();
		}).then(function(resultPost){
			appOrderPost = resultPost;
			// console.log('App Order post is ' + JSON.stringify(appOrderPost) );
			if (appOrderPost){
				//console.log('Getting App Url from Vendor...');
				var TrkVendor = require('./vendor.js').trkVendor;
			  	var trkVendor = new TrkVendor();
			 	return trkVendor.getAppUrl(aVendorRecord);
			} else 
					return Parse.Promise.as();

		}).then(function(appUrlResult){
			// console.log('App URL is ' + appUrlResult);
			if (appUrlResult){
				appUrl = appUrlResult;
	    		//now get the URL which will be embedded in the social Post
				TrkUtils = require('./utility.js').trkUtility;
				var trkUtils = new TrkUtils();
				// set expiration date to 7 days from the start of the event
				if (aEventRecord)
					var expiresOn = new Moment(aEventRecord.get("startDateTime")).utc().add(7, 'days').toDate();
				else 
					var expiresOn = new Moment().utc().add(7, 'days').toDate();

				return trkUtils.createTrkUrl(appUrl, expiresOn);
			}
				else return Parse.Promise.as();
		}).then(function(shortenedUrl){
			if (shortenedUrl)
				appUrl = shortenedUrl;
			
			// console.log('checking if we shoulld attach schedule');
			if (attachSchedule === true){
				// console.log('getting schedule URL');
				TrkUtils = require('./utility.js').trkUtility;
				var trkUtils = new TrkUtils();
				// set expirate date to 7 days from now
				if (aEventRecord)
					var expiresOn = new Moment(aEventRecord.get("startDateTime")).utc().add(7, 'days').toDate();
				else 
					var expiresOn = new Moment().utc().add(7, 'days').toDate();
				
				return trkUtils.createTrkUrl('/schedule?vendorid=' + aVendorRecord.id 
											+ '&defaultView=basicWeek', expiresOn);
			}
			else return Parse.Promise.as();
			
		}).then(function(aScheduleUrl){
			scheduleUrl = aScheduleUrl;
			return _socialSecretsGet(aVendorRecord);
		}).then(function(aSocialSecretsObj){
			// console.log('social secrets are ');

			var twAuthTokenSecret = getKeyValueObjectInArray('tw_oauth_token_secret', aSocialSecretsObj.secrets);
			var fbAccessToken = getKeyValueInArray('fb_pageaccess_token', aSocialSecretsObj.secrets);
			if (!fbAccessToken && !twAuthTokenSecret){
				//vendor has not connected to ANY social media
				console.log('no social media is connected...');
				return Parse.Promise.as();
			} else {
				var text = "";
				if (aEventRecord){
					var locationData = aEventRecord.get("locationData"); 
					//get the event start date/time
					aEventStartMoment = new Moment(aEventRecord.get("startDateTime"));
				};

				if (twAuthTokenSecret){
					
					if (aGlobalPost.get("twitterText"))
						text = aGlobalPost.get("twitterText")
					else 
						text = aGlobalPost.get("text"); 

					if (String(text).indexOf("[TIME]") > -1){
						//console.log('event start moment is ' + JSON.stringify(aEventStartMoment));
						var timeText = aEventStartMoment.tz(aVendorRecord.get("timeZone")).calendar(referenceMoment);
						//console.log('timetext is ' + timeText);
						text = String(text).replace('[TIME]', timeText);
					};

					//console.log('checking if time to is in text ' + text + '  ' + aEventRecord.id);
					if (String(text).indexOf("[TIME_TO]") > -1){
						//console.log('TIME_TO');
						var aEventEndMoment = new Moment(aEventRecord.get("endDateTime"));
						//console.log('event end moment is ' + JSON.stringify(aEventEndMoment));
						var timeText = aEventEndMoment.tz(aVendorRecord.get("timeZone")).format('hA');
						//console.log('time TO text is ' + timeText);
						text = String(text).replace('[TIME_TO]', timeText);
						//console.log('text is NOW' + text);
					};

					//if the event has a location attach set it on the posting too				
					if (locationData){
						//now check if the text has a [PLACE]
						if (String(text).indexOf("[PLACE]") > -1){
							//console.log('timetext is ' + timeText);
							text = String(text).replace('[PLACE]', locationData.name);
						}					
					}	
					if (appUrl){
						if (appOrderPost.get("twitterText"))
							var appText = appOrderPost.get("twitterText")
						else 
							var appText = appOrderPost.get("text"); 

						text = text + ' ' + appText + ' ' + appUrl;
					};

					if (scheduleUrl != undefined){
						text = text + ' ' + scheduleUrl;
					};	

					twitter = {
						status: text,
					};

					console.log('twttier text is ' + text);

				};

				if (fbAccessToken){
					text = aGlobalPost.get("text"); 

					if (String(text).indexOf("[TIME]") > -1){
						var timeText = aEventStartMoment.tz(aVendorRecord.get("timeZone")).calendar(referenceMoment);
						//console.log('timetext is ' + timeText);
						text = String(text).replace('[TIME]', timeText);
					}

					//console.log('checking if time to is in text ' + text + '  ' + aEventRecord.id);
					if (String(text).indexOf("[TIME_TO]") > -1){
						//console.log('TIME_TO');
						var aEventEndMoment = new Moment(aEventRecord.get("endDateTime"));
						// console.log('event end moment is ' + JSON.stringify(aEventEndMoment));
						var timeText = aEventEndMoment.tz(aVendorRecord.get("timeZone")).format('h:mmA');
						// console.log('time TO text is ' + timeText);
						text = String(text).replace('[TIME_TO]', timeText);
						//console.log('text is NOW' + text);
					};

					//if the event has a location attach set it on the posting too				
					if (locationData){
						//now check if the text has a [PLACE]
						if (String(text).indexOf("[PLACE]") > -1){
							//console.log('timetext is ' + timeText);
							text = String(text).replace('[PLACE]', locationData.name);
						}					
					}	

					//if we have an appUrl to append then do so
					if (appUrl){
						var appText = appOrderPost.get("text"); 
						text = text + ' ' + appText + ' ' + appUrl;
					}
			
					if (scheduleUrl != undefined){
						text = text + ' ' + scheduleUrl;
					};	
					console.log('fb text is ' + text);
					facebook = {
						message: text
					};
				};

				// calculate the post date time by subtracting offset from the event start date/time
				if (aEventStartMoment){
					aEventStartMoment.subtract(aVendorRecord.get("settings").eventPublishOffset, 'minutes');
				// }
				} else {
					aEventStartMoment = new Moment().tz(aVendorRecord.get("timeZone"));
					aEventStartMoment.hour(8); //set for 8am
				};

				var SocialPosting = Parse.Object.extend("SocialPosting");
				var aSocialPost = new SocialPosting();
				
				var aParentColl = null;

				if (aEventRecord)
					aParentColl = {
						"collName": "truckScheduleEvents",
						"id": aEventRecord.id
					};
				
				return aSocialPost.save({
					facebook: facebook,
					twitter: twitter,
					post: text,
					appPush: {"network":0},
					vendor: aVendorRecord,
					postDateTime:aEventStartMoment.toDate(),
					parentColl: aParentColl,
					autoGenerated: true
				}, {useMasterKey:true});			
			}
		});
	};

	var socialMediaUpload = function(request, response){

    	var twitterResponse = {};
    	var fbResponse = {};
    	var aSocialSecretsObj = {};

		// var requestParams = JSON.parse(request.body);

		var requestParams = request.params;

		if (!requestParams.vendorId) {
			throw {
				message: 'Please provide a Vendor ID.',
				code: '400'
			};
		};
 
		//load the vendor from the table
		var Vendor = Parse.Object.extend("Vendor");
		var query = new Parse.Query(Vendor);
		query.get(requestParams.vendorId, {useMasterKey:true})
		.then(function(aVendor){
			return _socialSecretsGet(aVendor)
		}).then(function(socialSecrets){
			console.log('Processing twitter...');
			var twPromise = new Parse.Promise();

			aSocialSecretsObj = socialSecrets;

			var twAuthTokenSecret = getKeyValueObjectInArray('tw_oauth_token_secret', aSocialSecretsObj.secrets);
			var twAuthToken = getKeyValueObjectInArray('tw_oauth_token', aSocialSecretsObj.secrets);
			
			if (twAuthTokenSecret){
				console.log('twitter token found!');
				//var twPromise = Parse.Promise();

				var aCallBird = new Codebird;
				aCallBird.setConsumerKey(aSocialSecretsObj.twConsumerKey, aSocialSecretsObj.twConsumerSecret);
				aCallBird.setToken(twAuthToken.get('secretValue'), twAuthTokenSecret.get('secretValue'));

				var twitterParams = {};
				//retrieve the contents of the fileUrl
				console.log('fetching image data....' + requestParams.fileUrl);
				Parse.Cloud.httpRequest({ 
					url: requestParams.fileUrl,
					error: function(error){
						console.log('error fetching file' + JSON.stringify(error));
				      	twitterResponse = {
					        "message": error.message,
					        "code": error.code
  						};	
						twPromise.resolve();
					},
					success:function(httpResponse){
						console.log('image has been loaded using AJAX...' + JSON.stringify(httpResponse));
						var mediaUploadParams = {};
						//console.log('Buffer is ' + httpResponse.buffer);
						//mediaUploadParams.media = [];
						mediaUploadParams.media = httpResponse.buffer.toString('base64');

						//mediaUploadParams.media = requestParams.fileUrl;
						//console.log('Params for tiwtter call is ' + JSON.stringify(mediaUploadParams));

						console.log('using callBird to call media_upload');
						return aCallBird.__call("media_upload", mediaUploadParams, function(reply){
							console.log('Twitter has responded with' + JSON.stringify(reply));
							if (reply.errors)
							    	twitterResponse = {
							        	"message": reply.errors[0].message,
							        	"code": reply.errors[0].code
							      	};
								else
									twitterResponse = reply;
	
							twPromise.resolve();
						});
						
					}
				});
			} 
				else twPromise.resolve();
			
			return twPromise;
		}).then(function(){
			return Parse.Promise.as();
			//now process Facebook upload
			// var fbPromise = new Parse.Promise();

			// fbAccessToken = getKeyValueInArray('fb_pageaccess_token', aSocialSecretsObj.secrets);
			// //console.log('fb page access token is ' + fbAccessToken);
			// if (fbAccessToken){
			// 	fbPageID = getKeyValueInArray('fb_page_id', aSocialSecretsObj.secrets);
		 //      	//console.log('FB page is is ' + fbPageID);
		 //      	if (fbPageID){
		 //      		var fbParams = {};
		 //      		fbParams.access_token = fbAccessToken;
		 //      		fbParams.url = requestParams.fileUrl;

			// 		Parse.Cloud.httpRequest({
			// 			method: 'POST',
			// 			url: 'https://graph.facebook.com/v2.4/' + fbPageID + "/photos",
			// 			params: fbParams,
			// 	        success: function(httpResponse) {
			// 	            console.log('Response from FB is ' + JSON.stringify(httpResponse.text));
			// 	            fbJSON = JSON.parse(httpResponse.text);
			// 	            if (fbJSON.id){
			// 	           		fbResponse = {
  	// 								"message": "success",
  	// 								"code": "200",
  	// 								"fbPhotoId": fbJSON.id
  	// 							}
			// 	            } else {
			// 	          		if (jsonResponse.error) 
			// 	          			fbResponse = {
			// 								        "message": jsonResponse.error.message,
			// 								        "code": xhrResponse.status,
			// 								        "type": jsonResponse.error.type
  	// 								};        	
			// 	            };

			// 	            fbPromise.resolve();
			// 	        },
			// 	        error: function(httpResponse) {
			// 	        	console.log('FB error : ' + httpResponse.text);
			// 	        	var errorObject = JSON.parse(httpResponse.text);
			// 	            if (errorObject.error){
			// 	            	fbResponse = {
			// 				        "message": errorObject.error.error_user_msg,
			// 				        "code": errorObject.error.code,
			// 				        "type": errorObject.error.type
  	// 							}
			// 	            };
			// 	            console.log('resolving after FB error....');
			// 	            fbPromise.resolve();
			// 	        }
			//     	});			      		
		 //      	}
		 //      		else fbPromise.resolve(); //should never happen but just in case		
			// } 
			// else {	
			// 		fbPromise.resolve();
			// 		console.log('FB not connected for this vendor');
			// };
			// return fbPromise;
		}).then(function(){
			console.log('sending response to clietn caller...');
			response.success({facebook: fbResponse, twitter: twitterResponse});
		});

	}

	//this function is designed to be called from a batch job
    //in parse
    // var processNewTwitterFollowers = function(request, status){
    // 	//1. Get all the vendors who have enabled an autoResponse for follow
	   //  var Vendor = Parse.Object.extend("Vendor");
	   //  var query = new Parse.Query(Vendor);
	   //  query.equal( "settings.twFollowAutoResponse", true);
	   //  query.find()
	   //  .then(function(vendorList){
	   //  	_.each(vendorList, function(aVenodr){
	   //  		var currentList = aVendor.get('twFollowList');
	   //  		var twResponse = {};

	   //  		self.twitterGetfollowerList({vendorId: aVendor.get("objectId")})
	   //  		.then(function(twitterResponse){
	   //  			twResponse = twitterResponse;

				// 	//set this back to the vendor records in the DB
				// 	aVendor.set("twFollowList", twResponse.ids);
				// 	return aVendor.save();    			
	   //  		}).then(function(){
	   //  			//now compare the twitter list with the list from the DB and find the 'differencies'
				// 	var newFollowers = twResponse.ids.filter(function(obj) { return currentList.indexOf(obj) == -1; });	

	   //  		});
	   //  	})
	   //  });
    // }

    //this function is designed to be called from a batch job 
    //in parse
    var savedSocialPostsPOST = function(){
		// var _ = require('lodash');
		//this batch job will pick up all the social posts with a date on them and post them to the various social
		//networks
		// return Parse.Promise.reject({code:400, message:'A customer error message'});
		var rightNow = new Date();
	    var SocialPosting = Parse.Object.extend("SocialPosting");
	    var query = new Parse.Query(SocialPosting);
	    query.lessThanOrEqualTo( "postDateTime", rightNow);
	    return query.find({useMasterKey:true})
	    .then(function(socialPostingRecords){
	    	// status.message(socialPostingRecords.length + ' records found');
	    	if (socialPostingRecords.length == 0){
	    		// status.message('No records to process');
	    		return Parse.Promise.as();
	    	} else {
	    		var promise = Parse.Promise.as();

		    	_.each(socialPostingRecords, function(aPosting){
		    		promise = promise.then(function(){
	    				var fbResult;
	    				var twResult;
	    				var fbLink;
	    				var twLink;
	    				var twLinkLabel = '';
	    				var fbLinkLabel = '';
	    				var fbPostText = '';
	    				var twStatusText = '';
	    				var aUser;
	    				var socialPostHTTPResponse;

			    		// status.message('Processing : ' + JSON.stringify(aPosting));
			    		console.log('Processing : ' + JSON.stringify(aPosting));
			    		console.log('Processing Social Posting ' + aPosting.id);

			    		var socialPostRequest = {};
			    		socialPostRequest.vendorId = aPosting.get("vendor").id;
			    		socialPostRequest.facebook = aPosting.get('facebook');
			    		socialPostRequest.twitter = aPosting.get('twitter');
			    		socialPostRequest.appPush = aPosting.get('appPush');

			    		return Parse.Cloud.run("socialPostingCreate", socialPostRequest,{
			    			success: function(result){
			    				console.log('Social Post has been succesfully posted.' + aPosting.get("postDateTime"));
			    				if (aPosting.get("postDateTime")){
			    					console.log('Date is set on social post so blank it out.');
			    					return aPosting.save({postDateTime:null});
			    				};
			    			}, 
			    			error: function(error){
			    				console.log('Social Posting Error' + JSON.stringify(error));
			    				// status.message('Social Posting Error' + JSON.stringify(error));

			    			}
			    		}).then(function(httpResponse){
			    			console.log('HTTP Response is :' + JSON.stringify(httpResponse));
			    			
			    			socialPostHTTPResponse = httpResponse;

		    				//get the user  to email
		    				var User = Parse.Object.extend("User");
		    				var userQuery = new Parse.Query(User);
		    				userQuery.equalTo("vendor", aPosting.get("vendor"));
		    				return userQuery.first({useMasterKey: true})
		    				.then(function(resultUser){
		    					//console.log('getting user');
		    					aUser = resultUser;	
		    				});
		    			}).then(function(){
		    				// now get the config
		    				console.log('get config');
							return Parse.Config.get()
		    			}).then(function(aConfig){
		    				console.log('sending email');
							var mandrillAPIKey = aConfig.get("MandrillAPIKey");

							var mandrill = require('mandrill-api/mandrill');
							var mandrill_client = new mandrill.Mandrill(mandrillAPIKey);

		    				fbPostText = socialPostRequest.facebook.message;
		    				twStatusText = socialPostRequest.twitter.status;

		    				if ( String(socialPostHTTPResponse.facebook.message).toLowerCase() != 'success' ) 
		    					fbPostText = 'Did not post because ' + String(socialPostHTTPResponse.facebook.message).toLowerCase();
		    				else {
		    					var fbResponseArray = String(socialPostHTTPResponse.facebook.fbPostId).split('_');
		    					fbLink = 'https://www.facebook.com/' + fbResponseArray[0] + '/posts/' + fbResponseArray[1];
		    					fbLinkLabel = 'View Facebook post';
		    				};
		    				
		    				if (socialPostHTTPResponse.twitter.code != 200)
		    					twStatusText = 'Did not post because ' + String(socialPostHTTPResponse.twitter.message).toLowerCase();
		    				else {
		    					twLink = 'https://twitter.com/' + socialPostHTTPResponse.twitter.user_id + '/status/' + socialPostHTTPResponse.twitter.status_id;
		    					twLinkLabel = 'View Twitter post';
		    				};
 
					  		var mailParams = {
					  			async:true, 
					  			template_name: "socialnotificationv2",
					  			template_content:{},
					  			message: {
					  				to: [{
					  					email: aUser.getEmail(),
					  					type: 'to'
					  				}],
					  				merge_vars: [{
					  					rcpt: aUser.getEmail(),
					  					vars: [{
					  						name: "FBRESULT",
					  						content: fbResult
					  					},
					  					{
					  						name: "TWRESULT",
					  						content: twResult
					  					},
					  					{
					  						name:"FBLINK",
					  						content: fbLink
					  					},
					  					{
					  						name:"TWLINK",
					  						content: twLink	
					  					},{
					  						name:"TWLINKLABEL",
					  						content: twLinkLabel	
					  					},{
					  						name:"FBLINKLABEL",
					  						content: fbLinkLabel	
					  					},{
					  						name:"FBPOSTTEXT",
					  						content: fbPostText	
					  					},{
					  						name:"TWSTATUSTEXT",
					  						content: twStatusText	
					  					}]
					  				}]
					  			}
					  		};

						  	return mandrill_client.messages.sendTemplate( mailParams,
						  		function(httpResponse){
						  			//return a response to the user
						  			console.log('Mandril response is ...' + JSON.stringify(httpResponse[0]));
						  		},
						  		function(httpResponse){
						  			console.log('Error sending Mandril Email...' + JSON.stringify(httpResponse));
						  		}
						  	);

			    		});

		    		});

		    	});
				return promise;
			}
	    	
	    }).then(function(){
	    	return Parse.Promise.as({code:200, message:'OK'});
	    }, function(error){
	    	return Parse.Promise.reject(error);
	    });
    };
    return {
        socialNetworkVerify : socialNetworkVerify,
        facebookGetAccessToken : facebookGetAccessToken,
        facebookSetPageInfo: facebookSetPageInfo,
        twitterRequestTokenForVendor: twitterRequestTokenForVendor,
        socialPostingsGet: socialPostingsGet,
        twitterGetAccessToken: twitterGetAccessToken,
        twitterGetfollowerList:twitterGetfollowerList,
        socialPostingCreate:socialPostingCreate,
        generateSchedEventSocialRecords: generateSchedEventSocialRecords,
        generateRepeatedSocialPosts: generateRepeatedSocialPosts,
        savedSocialPostsGet:savedSocialPostsGet,
        installTrckedTabtoFacebook: installTrckedTabtoFacebook,
        savedSocialPostsPOST: savedSocialPostsPOST,
        publishScheduleToSocial: publishScheduleToSocial,
        getRandomGlobalPost: getRandomGlobalPost,
        socialPlaceIdGet: socialPlaceIdGet,
        // socialSecretsGet:socialSecretsGet,
        // socialSecretsGetInternal: socialSecretsGetInternal,
        socialMediaUpload: socialMediaUpload 
    };

}

exports.trkSocial = trkSocial;