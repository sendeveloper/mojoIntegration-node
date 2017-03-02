var Buffer = require('buffer').Buffer;
//var base64 = require('cloud/Base64.js');

(function(){
	var _accountSID = "";
	var _authToken = "";
 
	function getAuthHeader(){
		//console.log('Auth:' + _accountSID);
		//console.log('Auth:' + _authToken);

		var authHeader = "Basic " + new Buffer(_accountSID + ':' + _authToken).toString('base64');
		//console.log(authHeader);
		return authHeader;
	};
 
	function init(aConfig){
		_accountSID = aConfig.attributes.telAPIAccountSID; //aConfig.get("telAPIAccountSID");
		_authToken = aConfig.attributes.telAPIAccountAuthToken; //aConfig.get("telAPIAccountAuthToken");
	}; 

	function verifyPhoneNumber(aPhoneNumber){
		//call telApi to verify the phoneNumber
		//console.log('account SID is ' + this._accountSID);
		//var smsAPIURL = 'https://' + this._accountSID + ':' + this._authToken + '@api.telapi.com/v2/Accounts/' + this._accountSID + '/Lookups/Carrier';
		var smsAPIURL = 'https://api.telapi.com/v2/Accounts/' + _accountSID + '/Lookups/Carrier';
		//console.log(smsAPIURL);
		return Parse.Cloud.httpRequest({
			method: 'POST',
			url: smsAPIURL,
			headers: {
				//"Authorization": "Basic " + Base64.encode(accountSID + ':' + authToken),
				"Authorization": getAuthHeader(),
      			"Content-Type": "application/json; charset=utf-8",
			},
			params: {
		      "PhoneNumber": aPhoneNumber,
		      "responseType": 'JSON'
			}
    	});		
	};
  
	function getFromPhone(){
		//for now just return the phone number
		//in the future we may want to implement some sort of algorithm
		return '+1832-539-2482';
	};

	function sendSMS(toPhone, smsText, aConfig){
		// console.log('account SID is ' + _accountSID);
		var promise = new Parse.Promise();
		if (!_accountSID)
			promise.reject({code:100, message:'SMS Interface not initialized'});
		else {
			var smsAPIURL = 'https://api.telapi.com/v1/Accounts/' + _accountSID + '/SMS/Messages.json';
			
			Parse.Cloud.httpRequest({
				method: 'POST',
				url: smsAPIURL,
				headers: {
					"Authorization": getAuthHeader(),
	      			"Content-Type": "application/json; charset=utf-8"
				},
				params: {
			    	"To": toPhone,
			     	"From": getFromPhone(),
			      	"Body": smsText

				},
				success:function(httpResponse){
		    		console.log('Resolve : SMS response is ' + JSON.stringify(httpResponse)); //+ JSON.stringify(httpResponse));
		    		promise.resolve(httpResponse.data);				
				},
				error:function(error){
					console.log('Reject: error sending SMS');// + JSON.stringify(error));
					promise.reject(error);
				}
	    	});
		};

    	return promise;
	};

	module.exports = {
		sendSMS: sendSMS,
		verifyPhoneNumber: verifyPhoneNumber,
		init: init
	}
})();