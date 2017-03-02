/**
 ** Utility functions for Trcked App
 ** Created by TJ
 ** April 17, 2015
 **/

var _ = require('lodash');
var moment = require("moment-timezone");

var trkUtility = function() {

	// performs cleanup of the DB
	// delete orphaned pointers
	var deleteExpiredUrls = function(job, data){
		var cutOffDate = moment().utc();
		var noOfRecords = 0;
		console.log('cut off date is ' + cutOffDate.format());
		
		var urlQuery = new Parse.Query("TrkUrls");
		urlQuery.lessThanOrEqualTo("expiresOn", cutOffDate.toDate());
		return urlQuery.find()
		.then(function(results){
			//console.log(results.length + ' expired URLs were found. Deleting...');
			noOfRecords = results.length;

			var promises = [];

			_.each(results, function(anExpiredUrl) {
				promises.push(anExpiredUrl.destroy());
			});

			return Parse.Promise.when(promises);
	
		},	function(error){
				console.log(error);
				// status.success("error");
				return Parse.Promise.error(error);
		}).then(function(){
			return Parse.Promise.as();
			// status.success(noOfRecords.toString() + ' expired URLs were found and deleted.');
		});

	}

	var removeOrphanedRecords = function(request, status) {
		try {

			var requestParams = JSON.parse(request.body);

			var queryOrderItem = new Parse.Query("OrderItem");
			var queryOrder = new Parse.Query("Order");

			var orderItemsDeleted=0;

			queryOrderItem.doesNotMatchKeyInQuery('order','objectId', queryOrder);

			queryOrderItem.find().then(function(results){
				var promises = [];

				if(results && results.length) orderItemsDeleted=results.length;

				_.each(results, function(result) {
    				promises.push(result.destroy());
 				});

				return Parse.Promise.when(promises);
			
			}).then(function(){
				//console.log("Deleted "+ orderItemsDeleted+" order items");
				status.success("Deleted "+ orderItemsDeleted+" order items");

			},function(error){
				status.error(error);
			})

		}

		catch (error) {
			status.error(error);
		}
	}

	var createTrkUrl = function(fullURL, expiresOn){
		var resultUrl;
		var aTrkUrl;
		var promise = new Parse.Promise();

		Parse.Config.get()
		.then(function(aConfig){
			var TrkUrls = Parse.Object.extend('TrkUrls');
			var trkUrl = new TrkUrls();
			return trkUrl.save({
					fullUrl : fullURL,
					expiresOn: expiresOn
			}).then(function(resultRecord){
				//console.log('save result record is ' + JSON.stringify(resultRecord));
				aTrkUrl = resultRecord;
				resultUrl = aConfig.get('redirUrl');
			});
		}).then(function(){
			//console.log('aTrkUrl' + JSON.stringify(aTrkUrl));
			resultUrl = resultUrl + '/' + aTrkUrl.id;
			//console.log('result URL is ' + resultUrl);
			promise.resolve(resultUrl);
		});

		return promise;
	};

	var translateTrkUrl = function(trkUrlId){
		//console.log('url id is ' + trkUrlId);
		var TrkUrls = Parse.Object.extend('TrkUrls');
		var trkUrlQuery = new Parse.Query(TrkUrls);
		//console.log('calling get...');
		return trkUrlQuery.get(trkUrlId)
		.fail(function(error){
			console.log('Error' + JSON.stringify(error));
		}).then(function(aTrkUrlRecord){
			//console.log('URL record is ' + JSON.stringify(aTrkUrlRecord));
			return aTrkUrlRecord.get('fullUrl');
		});
	};

	var encrypt = function(clearData){
		var promise = new Parse.Promise();
		Parse.Config.get()
		.then(function(aConfig){
			var crypto = require('crypto');
			var cipher = crypto.createCipher(aConfig.get("encryptionAlgorithm"), aConfig.get("encryptionSecret"));
			var encrypted = cipher.update(""+clearData, 'utf8', 'hex') + cipher.final('hex');
			promise.resolve(encrypted);
		});
		return promise;
	}

	var decrypt = function(encryptedData){
		console.log('start of decrypt');
		var promise = new Parse.Promise();
		Parse.Config.get()
		.then(function(aConfig){
			var crypto = require('crypto');
	        var decipher = crypto.createDecipher(aConfig.get("encryptionAlgorithm"), aConfig.get("encryptionSecret"));
	        var decrypted = decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8');
	        console.log('resolving decryption...');
	        promise.resolve(decrypted);
	    });
	    return promise;
	}

	var sendEmail = function(mailParams, toEmailAddress){
		return Parse.Config.get()
		.then(function(aConfig){
			console.log('sending email...');
			var mandrillAPIKey = aConfig.get("MandrillAPIKey");

	  		var mandrill = require('mandrill-api/mandrill');
	  		var mandrill_client = new mandrill.Mandrill(mandrillAPIKey);

	  		mailParams.async = true;
	  		mailParams.message.merge_language = 'handlebars';
  			mailParams.message.to = [];
  			mailParams.message.to.push({email:toEmailAddress, type:'to'});
  			mailParams.template_content = [];

	  		return mandrill_client.messages.sendTemplate( mailParams, 
	  			function(httpResponse){
	  				//return a response to the user
	  				console.log('Mandril response is ...' + JSON.stringify(httpResponse));
	  				// status.message(JSON.stringify(httpResponse.data));
	  			},
	  			function(httpResponse){
	  				console.log('Mandrill Error response is ...' + JSON.stringify(httpResponse));
	  				// status.message(JSON.stringify(httpResponse.data));
	  				//console.log(httpResponse);
	  			}
	  		);
		});
	};

	return {
		removeOrphanedRecords: removeOrphanedRecords,
		deleteExpiredUrls: deleteExpiredUrls,
        createTrkUrl : createTrkUrl,
        translateTrkUrl : translateTrkUrl,
        encrypt: encrypt,
        decrypt: decrypt,
        sendEmail:sendEmail
	}


}

exports.trkUtility = trkUtility;