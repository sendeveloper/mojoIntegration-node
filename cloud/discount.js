var _ = require('lodash');

var trkDiscount = function(){
	var vendorDiscountsGet = function(request, response){
		try{
			var requestParams = request.params;
			
			if (!requestParams.vendor){
                throw {
                    message: 'Vendor ID is not specified',
                    code: '400'
                }; 
			};

			var resultObject = [];

		    var Vendor = Parse.Object.extend("Vendor");
		    var vendorObject = new Vendor();
		    vendorObject.id = requestParams.vendor.objectId;

			var discountsQuery = new Parse.Query("Discounts");
			discountsQuery.equalTo("vendor", vendorObject);
			
			if (!requestParams.includeDeleted)
				discountsQuery.equalTo("deleted", false);

			discountsQuery.find()
			.then(function(discountRecords){
				_.each(discountRecords, function(aDiscount){
					resultObject.push({
						objectId: aDiscount.id,
						name: aDiscount.get("name"),
						type: aDiscount.get('type'),
						value: aDiscount.get('value'),
						applied: aDiscount. get('applied')
					})
				});
				return Parse.Promise.as();
			}).then(function(){
				response.success(resultObject);
			},function(error){
				response.error(error);
			});

		} catch(error){
			response.error(error);
		}

	}

	var vendorDiscountSave = function(request, response){
		try{
			var requestParams = request.params;
			
    	if (!requestParams.vendor)
    		response.error({"code":101, "error": 'Please specify a vendor'});

			var Discounts = Parse.Object.extend('Discounts');
			var aDiscountObject = new Discounts();

			aDiscountObject.save(requestParams, {sessionToken: request.user.get("sessionToken")})
			.then(function(aResult){
				response.success(aResult.toJSON());
			},function(error){
				response.error(error);
			});

		} catch(error){
			response.error(error);
		}
	}

	var vendorDiscountDelete = function(request, response){
		try{
			var requestParams = request.params;

			var Discounts = Parse.Object.extend('Discounts');
			var aDiscountQuery = new Parse.Query(Discounts);

			aDiscountQuery.get(requestParams.objectId)
			.then(function(aDiscount){
				return aDiscount.save({"deleted": true}, {sessionToken: request.user.get("sessionToken")});
			}).then(function(){
				response.success({})
			}, function(error){
				response.error(error)
			});

		} catch(error){
			response.error(error);
		}	
	}

    return {
        vendorDiscountsGet : vendorDiscountsGet,
        vendorDiscountDelete:vendorDiscountDelete,
        vendorDiscountSave:vendorDiscountSave


    };
}

exports.trkDiscount = trkDiscount;