// require('./app.js');

var moment = require('moment');
var _ = require('lodash');

Parse.Cloud.define("heartBeat", function(request, response) {

	var vendorQuery = new Parse.Query("Vendor");
	vendorQuery.first({useMasterKey:true})
	.then(function(aResult){
		response.success({});
	}, function(error){
		response.error(error);
	});
});

/** 
 ** QBO
*/
Parse.Cloud.define("qboCustomerCreate", function(request, response) {
 	var TrkVendor = require('./vendor.js').trkVendor;	
 	var trkVendor = new TrkVendor();
 
 	trkVendor.qboCustomerCreate(request, response);
 });

Parse.Cloud.define("qboOrdersPush", function(request, response) {
 	var TrkVendor = require('./vendor.js').trkVendor;	
 	var trkVendor = new TrkVendor();
 
 	trkVendor.qboOrdersPush(request, response);
 });

Parse.Cloud.define("getExternalTaxCodes", function(request, response) {
	var TrkVendor = require('./vendor.js').trkVendor;	
	var trkVendor = new TrkVendor();

	trkVendor.getExternalTaxCodes(request, response);
});

Parse.Cloud.define("qboGetAuthUrl", function(request, response) {
	var TrkVendor = require('./vendor.js').trkVendor;	
	var trkVendor = new TrkVendor();

	trkVendor.qboGetAuthUrl(request, response);
});

Parse.Cloud.define("qboCompleteConnection", function(request, response) {
	var TrkVendor = require('./vendor.js').trkVendor;	
	var trkVendor = new TrkVendor();

	trkVendor.qboCompleteConnection(request, response);
});

Parse.Cloud.define("qboIsConnected", function(request, response) {
	var TrkVendor = require('./vendor.js').trkVendor;	
	var trkVendor = new TrkVendor();

	trkVendor.qboIsConnected(request, response);
});

Parse.Cloud.define("qboInterfaceDisconnect", function(request, response) {
	var TrkVendor = require('./vendor.js').trkVendor;	
	var trkVendor = new TrkVendor();

	trkVendor.qboInterfaceDisconnect(request, response);
});

/** 
 ** Users
*/

 

Parse.Cloud.define("migrateAllUsersToStandardUsers", function(request, response) {

	// Parse.Cloud.useMasterKey();  
	
	Parse.Promise.as()
	.then(function(){
	  query = new Parse.Query(Parse.Role);
	  query.equalTo("name", "standardUser");
	  return query.first({useMasterKey:true});
	}).then(function(standardUserRole){
		// console.log('Role is ' + standardUserRole.id);

		var userQuery = new Parse.Query(Parse.User);
		// var aPromise = new Parse.Promise(); 

		return userQuery.each(function(aUser){
			standardUserRole.getUsers().add(aUser);
			console.log('Adding User: ' + aUser.get("username") + ' to role ' + standardUserRole.get("name"));
			return standardUserRole.save({}, {useMasterKey:true});				
		}, {useMasterKey:true});
		// return aPromise;
	}).then(function(){
		response.success();
	},function(error){
		response.error(error);
	});

});

Parse.Cloud.define("userLogin", function(request, response) {
	TrkUser = require('./user.js').trkUser;
	var trkUser = new TrkUser();
	trkUser.userLogin(request, response);
});


Parse.Cloud.define("newUserVerify", function(request, response) {
	TrkUser = require('./user.js').trkUser;
	var trkUser = new TrkUser();
	trkUser.newUserVerify(request, response);
});

Parse.Cloud.define("newUserRegister", function(request, response) {
	TrkUser = require('./user.js').trkUser;
	var trkUser = new TrkUser();
	trkUser.newUserRegister(request, response);
});

Parse.Cloud.define("userVerifyEmailResend", function(request, response) {
	TrkUser = require('./user.js').trkUser;
	var trkUser = new TrkUser();
	trkUser.userVerifyEmailResend(request, response);
});


Parse.Cloud.define("userPwdResetRequest", function(request, response) {
	TrkUser = require('./user.js').trkUser;
	var trkUser = new TrkUser();
	trkUser.userPwdResetRequest(request, response);
});

Parse.Cloud.define("userPwdResetComplete", function(request, response) {
	TrkUser = require('./user.js').trkUser;
	var trkUser = new TrkUser();
	trkUser.userPwdResetComplete(request, response);
});

/** 
 ** Menu
*/

Parse.Cloud.define("orderGetInfo", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;

	trkMenu.orderGetInfo(request, response);
});
//
Parse.Cloud.define("menuOrderCreateAnon", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;

	trkMenu.menuOrderCreateAnon(request, response);
});

Parse.Cloud.define("menuOrderCalcTotals", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;

	trkMenu.menuOrderCalcTotals(request, response);
});

Parse.Cloud.define("menuOrderCreate", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;

	trkMenu.menuOrderCreate(request, response);
});

Parse.Cloud.define("getDigitalMenu", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;

	trkMenu.getDigitalMenu(request, response);
});	


Parse.Cloud.define("menuGetDetail", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;

	trkMenu.menuGetDetail(request, response);
});	

Parse.Cloud.define("menuCategoryGetForMenu", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;

	trkMenu.menuCategoryGetForMenu(request, response);
});	

Parse.Cloud.define("menuCategoryGetForMenuItem", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;

	trkMenu.menuCategoryGetForMenuItem(request, response);
});	

Parse.Cloud.define("menuListGet", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;

	trkMenu.menuListGet(request, response);
});	

Parse.Cloud.define("menuDeleteById", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.menuDeleteById(request, response);
});	

Parse.Cloud.define("menuCategoryDeleteById", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.menuCategoryDeleteById(request, response);
});	

Parse.Cloud.define("menuCategoryCreate", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.menuCategoryCreate(request, response);
});	

Parse.Cloud.define("menuCreate", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.menuCreate(request, response);
});

Parse.Cloud.define("menuCreateFromCopy", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.menuCreateFromCopy(request, response);
});	

Parse.Cloud.define("setMenuItemsStockStatus", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.setMenuItemsStockStatus(request, response);

});	

Parse.Cloud.define("displayOrderSet", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.displayOrderSet(request, response);
});	

Parse.Cloud.define("displayOrderUnset", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.displayOrderUnset(request, response);
});	

Parse.Cloud.define("reorderDisplayOrder", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.reorderDisplayOrder(request, response);
});	

Parse.Cloud.define("menuItemSave", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.menuItemSave(request, response);
});	

Parse.Cloud.define("emailReceipt", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.emailReceipt(request, response);
});	

Parse.Cloud.define("emailOrderTicket", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu._emailOrderTicket(request, response);
});	

Parse.Cloud.define("menuItemDelete", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.menuItemDelete(request, response);
});	

Parse.Cloud.define("menuItemsGet", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.menuItemsGet(request, response);
});	

Parse.Cloud.define("menuItemOptionsGet", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.menuItemOptionsGet(request, response);
});	

Parse.Cloud.define("menuItemOptionsDelete", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.menuItemOptionsDelete(request, response);
});	

Parse.Cloud.define("menuItemOptionsSave", function(request, response) {
	var TrkMenu = require('./menu.js').trkMenu;	
	var trkMenu = new TrkMenu;
	trkMenu.menuItemOptionsSave(request, response);
});	

/** Inventory **/

Parse.Cloud.define("getAssignedMenuItems", function(request, response) {
	var TrkInventory = require('./inventory.js').trkInventory;

	var trkInventory = new TrkInventory;
	trkInventory.getAssignedMenuItems(request, response);
});	


Parse.Cloud.define("inventoryItemsGet", function(request, response) {
	var TrkInventory = require('./inventory.js').trkInventory;

	var trkInventory = new TrkInventory;
	trkInventory.inventoryItemsGet(request, response);
});	

Parse.Cloud.define("inventoryItemCreate", function(request, response) {
	var TrkInventory = require('./inventory.js').trkInventory;

	var trkInventory = new TrkInventory;
	trkInventory.inventoryItemCreate(request, response);
});	

Parse.Cloud.define("inventoryItemUpdate", function(request, response) {
	var TrkInventory = require('./inventory.js').trkInventory;

	var trkInventory = new TrkInventory;
	trkInventory.inventoryItemUpdate(request, response);
});	


/** 
 ** Truck
*/

Parse.Cloud.define("truckDeleteById", function(request, response){
	var TrkTruck = require('./truck.js').trkTruck;
	var trkTruck = new TrkTruck; 
	trkTruck.truckDeleteById(request, response);
});

Parse.Cloud.define("truckScheduleGet", function(request, response){

	var TrkTruck = require('./truck.js').trkTruck;
	var trkTruck = new TrkTruck; 
	trkTruck.truckScheduleGet(request, response);
});

Parse.Cloud.define("sendCrewPinRequest", function(request, response){

	var TrkTruck = require('./truck.js').trkTruck;
	var trkTruck = new TrkTruck; 
	trkTruck.sendCrewPinRequest(request, response);
});

Parse.Cloud.define("completeCrewPinRequest", function(request, response){

	var TrkTruck = require('./truck.js').trkTruck;
	var trkTruck = new TrkTruck; 
	trkTruck.completeCrewPinRequest(request, response);
});


Parse.Cloud.define("truckSetStatus", function(request, response){
	var TrkTruck = require('./truck.js').trkTruck;
	var trkTruck = new TrkTruck; 
	trkTruck.truckSetStatus(request, response);
});

/** 
 ** Vendor & Social
*/

Parse.Cloud.define("vendorGetInfo", function(request, response){
	var TrkVendor = require('./vendor.js').trkVendor;
	var trkVendor = new TrkVendor();
	console.log('request is ' + JSON.stringify(request));
	trkVendor.vendorGetInfo(request, response);
});

Parse.Cloud.define("bamsApplicationSend", function(request, response){
	var TrkVendor = require('./vendor.js').trkVendor;
	var trkVendor = new TrkVendor();
	trkVendor.bamsApplicationSend(request, response);
});

Parse.Cloud.define("bamsGetDefaults", function(request, response){
	var TrkVendor = require('./vendor.js').trkVendor;
	var trkVendor = new TrkVendor();
	trkVendor.bamsGetDefaults(request, response);
});

Parse.Cloud.define("stripeConnectForVendor", function(request, response) {
	var TrkVendor = require('./vendor.js').trkVendor;	
	var trkVendor = new TrkVendor();

	trkVendor.stripeConnectForVendor(request, response);
});

Parse.Cloud.define("bamsConnectForVendor", function(request, response) {
	var TrkVendor = require('./vendor.js').trkVendor;	
	var trkVendor = new TrkVendor();

	trkVendor.bamsConnectForVendor(request, response);
});

Parse.Cloud.define("vendorGetInfoMessages", function(request, response){
	var TrkVendor = require('./vendor.js').trkVendor;
	var trkVendor = new TrkVendor();
	trkVendor.vendorGetInfoMessages(request, response);
});

Parse.Cloud.define("vendorCancelAccount", function(request, response){
	var TrkVendor = require('./vendor.js').trkVendor;
	var trkVendor = new TrkVendor();
	trkVendor.vendorCancelAccount(request, response);
});

Parse.Cloud.define("vendorSettingsUpdate", function(request, response){
	var TrkVendor = require('./vendor.js').trkVendor;
	var trkVendor = new TrkVendor();
	trkVendor.vendorSettingsUpdate(request, response);
});

Parse.Cloud.define("socialNetworkVerify", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial;

	trkSocial.socialNetworkVerify(request, response);
});

Parse.Cloud.define("installTrckedTabtoFacebook", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial;

	trkSocial.installTrckedTabtoFacebook(request, response);
});

Parse.Cloud.define("twitterGetAccessToken", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial;

	trkSocial.twitterGetAccessToken(request, response);
});


Parse.Cloud.define("facebookGetAccessToken", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial;
	trkSocial.facebookGetAccessToken(request, response);
});

Parse.Cloud.define("facebookSetPageInfo", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial;
	trkSocial.facebookSetPageInfo(request, response);
});

Parse.Cloud.define("socialPlaceIdGet", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial;

	trkSocial.socialPlaceIdGet(request, response);
});

Parse.Cloud.define("socialMediaUpload", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial;

	trkSocial.socialMediaUpload(request, response);
});

Parse.Cloud.define("activationRequestValidate", function(request, response){
	var TrkUser = require('./user.js').trkUser;
	var trkUser = new TrkUser(); 
	trkUser.activationRequestValidate(request, response);
});

Parse.Cloud.define("customerActivationRequest", function(request, response){
	var TrkUser = require('./user.js').trkUser;
	var trkUser = new TrkUser(); 
	trkUser.customerActivationRequest(request, response);
});

Parse.Cloud.define("twitterRequestTokenForVendor", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial; 
	trkSocial.twitterRequestTokenForVendor(request, response);
});

Parse.Cloud.define("twitterGetfollowerList", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial; 
	trkSocial.twitterGetfollowerList(request, response);
});

Parse.Cloud.define("socialPostingsGet", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial; 
	trkSocial.socialPostingsGet(request, response);
});

Parse.Cloud.define("socialPostingCreate", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial; 
	trkSocial.socialPostingCreate(request, response);
});

Parse.Cloud.define("savedSocialPostsGet", function(request, response){
	var TrkSocial = require('./social.js').trkSocial;
	var trkSocial = new TrkSocial; 
	trkSocial.savedSocialPostsGet(request, response);
});


/** 
 ** Orders
*/

// Parse.Cloud.job("completeOustandingOrders", function(request, status){
//   var count = 0;
// 	var promise = Parse.Promise.as();
// 	promise = promise.then(function() {
// 		console.log("*********************************");
// 		var ordersQuery = new Parse.Query("Order");
// 		ordersQuery.lessThan('state', 3);
// 		ordersQuery.equalTo('saleMode', 1);  //only deal with walk-up orders
// 		console.log( moment().utc().subtract('2', 'days').format());
// 		ordersQuery.lessThan("createdAt", moment().utc().subtract('2', 'days').toDate());

// 		return ordersQuery.each(function(anOrder){
// 			anOrder.set("state", 3); //complete
// 			count++;
// 			return anOrder.save();

// 		});
// 	}).then(function(){
// 		//all done
// 		console.log('calling success...');
// 		status.success('Done ' + count + ' records');
// 	}, function(error){
// 		console.log('calling error ' + JSON.stringify(error));
// 		status.error('error');	
// 	});

// });

// Parse.Cloud.job("emailDailySalesReport", function(request, status){
// 	var TrkOrder = require('./order.js').trkOrder;
// 	var trkOrder = new TrkOrder();

// 	trkOrder.emailDailySalesReport(request, status);
// });

Parse.Cloud.define("posOrderCreate", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.posOrderCreate(request, response);
	
});

Parse.Cloud.define("posGetOrders", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.posGetOrders(request, response);
	
});

Parse.Cloud.define("executeTop5Report", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.executeTop5Report(request, response);
	
});

//executeDiscountUsageReport
Parse.Cloud.define("executeDiscountUsageReport", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.executeDiscountUsageReport(request, response);
	
});

//executeTopModifiersReport
Parse.Cloud.define("executeTopModifiersReport", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.executeTopModifiersReport(request, response);
	
});

Parse.Cloud.define("executeSalesReport", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.executeSalesReport(request, response);
	
});

Parse.Cloud.define("executeSalesBreakdownReport", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.executeSalesBreakdownReport(request, response);
	
});

Parse.Cloud.define("executetxVolumeReport", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.executetxVolumeReport(request, response);
	
});

Parse.Cloud.define("posGetOrdersSummaryReport", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.posGetOrdersSummaryReport(request, response);
	
});

Parse.Cloud.define("orderStateModify", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.orderStateModify(request, response);
	
});

Parse.Cloud.define("ordersGetCount", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.ordersGetCount(request, response);
	
});

Parse.Cloud.define("ordersActivitySummary", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.ordersActivitySummary(request, response);
	
});

Parse.Cloud.define("chargeCard", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.chargeCard(request, response);
	
});

Parse.Cloud.define("refundCard", function(request, response){
	var TrkOrder = require('./order.js').trkOrder;
	var trkOrder = new TrkOrder();
	trkOrder.refundCard(request, response);
	
});

/** 
 ** Discounts
**/
Parse.Cloud.define("vendorDiscountsGet", function(request, response){
	var TrkDiscount = require('./discount.js').trkDiscount;
	var trkDiscount = new TrkDiscount();
	trkDiscount.vendorDiscountsGet(request, response);
	
});

Parse.Cloud.define("vendorDiscountSave", function(request, response){
	var TrkDiscount = require('./discount.js').trkDiscount;
	var trkDiscount = new TrkDiscount();
	trkDiscount.vendorDiscountSave(request, response);
});

Parse.Cloud.define("vendorDiscountDelete", function(request, response){
	var TrkDiscount = require('./discount.js').trkDiscount;
	var trkDiscount = new TrkDiscount();
	trkDiscount.vendorDiscountDelete(request, response);
});

/** 
 ** Pusher
*/
Parse.Cloud.define("sendMessageToTruck", function(request, response){
	var TrkPusher = require('./pusher.js').trkPusher;
	var trkPusher = new TrkPusher();
	trkPusher.sendMessageToTruck(request, response);
	
});

Parse.Cloud.define("sendMessageToVendor", function(request, response){
	var TrkPusher = require('./pusher.js').trkPusher;
	var trkPusher = new TrkPusher();
	trkPusher.sendMessageToVendor(request, response);
	
});

Parse.Cloud.define("registerNotificationClient", function(request, response){
	var TrkPusher = require('./pusher.js').trkPusher;
	var trkPusher = new TrkPusher();
	trkPusher.registerNotificationClient(request, response);
	
});

Parse.Cloud.define("confirmPendingNotification", function(request, response){
	var TrkPusher = require('./pusher.js').trkPusher;
	var trkPusher = new TrkPusher();
	trkPusher.confirmPendingNotification(request, response);
	
});

 // Parse.Cloud.job("billVendors", function(request, status){
 //   	console.log("*********************************");
 //   	var count = 0;
 // 	var promise = Parse.Promise.as();
 // 	var configSet = null;
 // 	var moment = require('./moment.js');
 // 	var effectiveMoment = null;

 // 	var jssha = require('./pusher/jssha256.js');
 // 	var Buffer = require('buffer').Buffer;
 // 	var accounting = require('./accounting.js');

 // 	if (request.effectiveDate)
 // 		effectiveMoment = moment.utc(request.effectiveDate) 
 // 	else
 // 		effectiveMoment = moment.utc();

 // 	console.log('Effective Date is ' + effectiveMoment.format());

 // 	return Parse.Config.get()
 // 	.then(function(aConfigSet){
 // 		configSet = aConfigSet;

	//  	promise = promise.then(function() {
	 		
	//  		var vendorQuery = new Parse.Query("Vendor");
	//  		var finalCount = 0;
	//  		vendorQuery.exists("vendorToken");
	//  		vendorQuery.lessThanOrEqualTo("nextBillDate", effectiveMoment.toDate());

	//  		return vendorQuery.each(function(aVendor){
	//  			console.log('******************************** - ' + aVendor.id);

	//  			var truckCount = 0;
	//  			count++;
	// 			var truckQuery = new Parse.Query("Truck");

	// 			truckQuery.equalTo("vendor", aVendor);
			
	// 			truckQuery.equalTo("deleted", false);
	// 		 	return truckQuery.count()
	// 		 	.then(function(aTruckCount){
	// 		 		truckCount = aTruckCount;

	// 		 		console.log('Truck count for ' + aVendor.id + ' is ' + truckCount);
	// 		 		if (truckCount > 0){
	// 					vendorRateQuery = new Parse.Query("vendorRate");
	// 					vendorRateQuery.equalTo("vendor", aVendor);
	// 					vendorRateQuery.lessThanOrEqualTo("startDate", new Date());
	// 					vendorRateQuery.greaterThanOrEqualTo("endDate", new Date());
	// 					// console.log('Getting vendor rate');
	// 					return vendorRateQuery.first()
	// 				} else 
	// 					return Parse.Promise.as(null, 'Vendor has 0 trucks/locations configured');	
	// 		 	}).then(function(aVendorRate, noBillReason){
	// 		 		if (aVendorRate){
	// 		 			console.log('Vendor Rate for ' + aVendor.id + ' is ' + aVendorRate.id);
	// 		 			//check if the vendor has received their free days
	// 		 			var freeDays = aVendorRate.get("freeDays");
	// 		 			console.log('No of free days for ' + aVendor.id + ' is ' + freeDays);
	// 		 			var diff = effectiveMoment.diff(moment(aVendor.toJSON().createdAt), 'days');
	// 		 			console.log('difference for ' + aVendor.id + ' is ' + diff);

	// 		 			if (diff < freeDays)
	// 		 				return Parse.Promise.as(0, 'Vendor is still in free period');
	// 		 			else{
	// 		 				console.log('calcualting amount owed');
	// 			 			//calculate the total amount owed
	// 						var vendorTotal = truckCount * aVendorRate.get("truckRate");
	// 						var taxTotal = vendorTotal * (aVendorRate.get('taxRate')/100);
							
	// 						vendorTotal = vendorTotal + taxTotal;
	// 						var accounting = require('./accounting.js');
	// 						vendorTotal = accounting.toFixed(vendorTotal, 2);
							
	// 						// console.log('VendorTotal to be charged to ' + aVendor.id + ' is ' + vendorTotal);
	// 						return Parse.Promise.as(vendorTotal);

	// 					}	 			
	// 		 		} else {
	// 		 			console.log('No Vendor Rate found for ' + aVendor.id);
	// 		 			// return Parse.Promise.reject({'Message':'No Rate found for ' + aVendor.id});
	// 		 			if (noBillReason)
	// 		 				return Parse.Promise.as(0, noBillReason);
	// 		 			else
	// 		 				return Parse.Promise.as(0, 'No Vendor Rate Found!');
	// 		 		};
			 		
	// 		 	}).then(function(aVendorTotal, noBillReason){
	// 		 		console.log('total to be charged to ' + aVendor.id + ' is ' + aVendorTotal);
			 		
	// 		 		if (aVendorTotal > 0){
	// 					var params = {
	// 	  								merchant_ref : 'Trucks & Mortar POS',
	// 					  				transaction_type : 'purchase',
	// 					  				method : 'token',
	// 					  				amount : aVendorTotal * 100, //convert into cents
	// 					  				currency_code : aVendor.get("isoCurrency"),
	// 					  				token : {
	// 	  									token_type : 'FDToken',
	// 	  									token_data : aVendor.get("vendorToken")
	// 	  								}
	// 	  					}

	// 		      		var headers = {};

	// 		      		headers.apikey = configSet.get("payEezyApiKey");
	// 		      		headers.token = configSet.get("payEezyMerchantToken");
	// 		      		headers['Content-type'] = 'application/json';
		      		
	// 		      		headers.nonce = function(length){
	// 						    var text = "";
	// 						    // var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	// 						    var possible = '0123456789';
	// 						    for(var i = 0; i < length; i++) {
	// 						        text += possible.charAt(Math.floor(Math.random() * possible.length));
	// 						    }
	// 						    return text;
	// 		      		}(19); //call the method passing in 19 as the length (19 is the length in the PayEezy example)

	// 		      		headers.timestamp = new Date().getTime();

	// 		      		headers.Authorization = function(){
	// 		      			var hmacPayload = {};
	// 		      			hmacPayload.apikey = headers.apikey;
	// 		      			hmacPayload.nonce = headers.nonce;
	// 		      			hmacPayload.timestamp = headers.timestamp;
	// 		      			hmacPayload.token = headers.token;
	// 		      			hmacPayload.payload = params;
	// 	      				// console.log('HMac payload is ' + JSON.stringify(hmacPayload));

	// 	      				var concatString = hmacPayload.apikey + hmacPayload.nonce + hmacPayload.timestamp + hmacPayload.token + JSON.stringify(hmacPayload.payload);
							
	// 						// var hash = jssha.HMAC_SHA256_MAC(hmacPayload.apiSecret, JSON.stringify(hmacPayload));
	// 						var hash = jssha.HMAC_SHA256_MAC(configSet.get("payEezyAPISecret"), concatString);
	// 						// return hash;
	// 						var buffer1 = new Buffer(hash);
	// 						// console.log('HMAC auth Key is ' + hash);

	// 						return buffer1.toString('base64');

	// 		      		}();

	// 		      		console.log('Calling PayEezy Server...');
	// 					return Parse.Cloud.httpRequest({
	// 							method: 'POST',
	// 							url: configSet.get("payEezyUrl") + '/v1/securitytokens',
	// 							headers: headers,
	// 							body: params
	// 					});

	// 		 		} else 
	// 		 			return Parse.Promise.as(false, noBillReason);
	// 		 	}).then(function(payEezyResponse, noBillReason){
	// 		 		// console.log('Payeezy response is ' + JSON.stringify(payEezyResponse));
	// 		 		// console.log('Payeezy response TEXT is ' + payEezyResponse.text);
	// 		 		// console.log('Payeezy response STATUS is ' + payEezyResponse.status);

	// 		 		//for some INSANE resaon, PEZE CAN returns text which is not valid JSON so we have to strip it out so we can convert to JSON
	// 		 		var revisedText = payEezyResponse.text;
	// 		 		revisedText = String(revisedText).replace(/\n/g, "").replace(/\r/g, "").replace(/\t/g, "").replace(/[()]/g, '');
			 		 		
	// 		 		// console.log('converting to JSON...' + revisedText);
	// 		 		payEezyResponseJSON = JSON.parse(revisedText);
	// 		 		// console.log('DONE converting to JSON...');
	// 		 		console.log('PEZE response is ' + JSON.stringify(payEezyResponseJSON));

	// 		 		if (payEezyResponseJSON.status && payEezyResponseJSON.status != 200){
	// 		 			// console.log('returning error');
	// 		 			return Parse.Promise.as(payEezyResponseJSON, JSON.stringify(payEezyResponseJSON));
	// 		 		} else if (payEezyResponse != false){
	// 		 			// console.log(payEezyResponse.data);
	// 		 			console.log('Vendor: ' + aVendor.id + ' Response: ' + payEezyResponse.data.transaction_status);
	// 		 			if (payEezyResponse.data.transaction_status == 'approved'){
	// 		 				//update the token data (in case it has changed)
	// 		 				if (!aVendor.get("final")){
	// 							aVendor.set("vendorToken", payEezyResponse.data.token.token_data);
	// 							var nextBillDateMoment = effectiveMoment.clone();
	// 							nextBillDateMoment.add(1, 'months');
							
	// 							aVendor.set("lastBillDate", effectiveMoment.toDate());
	// 							aVendor.set("nextBillDate", nextBillDateMoment.toDate());
	// 						} else {
	// 							//this is the final bill
	// 							aVendor.unset('vendorToken');
	// 							aVendor.unset('nextBillDate');
	// 						};

	// 						var updateArray = [];
	// 						updateArray.push(aVendor);

	// 		        		console.log('saving billing event')
	// 				  		var BillingEvent = Parse.Object.extend("BillingEvent");
	// 				  		var aBillEvent = new BillingEvent;
	// 				  		aBillEvent.set("vendor", aVendor);
	// 				  		aBillEvent.set("amount", parseFloat((payEezyResponse.data.amount/100)));
	// 						aBillEvent.set("transaction_id", payEezyResponse.data.transaction_id);
	// 						aBillEvent.set("tx_tag", payEezyResponse.data.transaction_tag);
	// 						updateArray.push(aBillEvent);

	// 						console.log('Updating Vendor & Billing Event record for ' + aVendor.id);
	// 						return Parse.Object.saveAll(updateArray)
	// 						.then(function(){
	// 							return Parse.Promise.as(payEezyResponse.data);
	// 						});
	// 		 			} else 
	// 		 				return Parse.Promise.as(payEezyResponse.data);

	// 		 		};
	// 		 	}).then(function(payEezyPacket, noBillReason){
	// 		 		console.log('payEezyPacket is' + JSON.stringify(payEezyPacket));
	// 		 		//regardless of what the response was sent an email with the result
	// 		 		var wasBillAttempted;

	// 		 		if (payEezyPacket == false){
	// 		 			wasBillAttempted = 'No';
			 			
	// 		 		} else {
	// 		 			wasBillAttempted = 'Yes';
			 			
	// 		 			if (payEezyPacket.amount)
	// 		 				payEezyPacket.amount = accounting.formatMoney(payEezyPacket.amount/100);
	// 		 		};

	// 		 		console.log('no bill reason is ' + noBillReason);

	// 				var mailParams = {
	// 					async:true, 
	// 					template_name: configSet.get("billErrorEmailTemplate"),
	// 					template_content:{},
	// 					message: {
	// 						merge_language: 'handlebars',
	// 						from_email:"info@getyomojo.com",
	// 						from_name: 'Billing',
	// 						to: [{
	// 					  		email: 'info@getyomojo.com',
	// 					  		type: 'to'
	// 					  	}],
	// 					  	merge_vars: [{
	// 					  		rcpt: 'info@getyomojo.com',
	// 					  		vars: 
	// 					  		[
	// 					  			{
	// 					  				name: "PAYEEZYRESPONSE",
	// 					  				content: payEezyPacket
	// 					  			},
	// 					  			{
	// 					  				name:'VENDORNAME',
	// 					  				content:aVendor.get("description")
	// 					  			},
	// 					  			{
	// 					  				name:'WASBILLATTEMPTED',
	// 					  				content:wasBillAttempted
	// 					  			},
	// 					  			{
	// 					  				name:'NOBILLREASON',
	// 					  				content: noBillReason
	// 					  			}
	// 								]
	// 					  	}]
	// 					}
	// 				};

	// 				// console.log('Calling Mandrill with ' + JSON.stringify(mailParams));

	// 				var Mandrill = require('mandrill');
	// 				Mandrill.initialize(configSet.get("MandrillAPIKey"));
				  	
	// 			  	return Mandrill.sendTemplate( mailParams, {
	// 			  		success: function(httpResponse){
	// 			  			//return a response to the user
	// 			  			console.log('Mandril response is ...' + JSON.stringify(httpResponse.data));
	// 			  			// return Parse.Promise.as();
	// 			  		},
	// 			  		error: function(httpResponse){
	// 			  			console.log('Error sending Mandril Email...' + JSON.stringify(httpResponse.data));
	// 			  			//we are going to return a success message anyway, as the user can always
	// 			  			//request a re-send
	// 			  			// return Parse.Promise.error(httpResponse.data);
	// 			  		}
	// 			  	});

	// 				// return Parse.Promise.as();

	// 		 	}, function(error){
	// 		 		console.log('Error for ' + aVendor.id + ': ' + JSON.stringify(error));
	// 		 	});

	//  		}, {useMasterKey: true});

	//  	}).then(function(){
	//  		//all done
	//  		console.log('calling success...');
	//  		status.success('Processed ' + count + ' records');
	//  	}, function(error){
	//  		console.log('calling error ' + JSON.stringify(error));
	//  		status.error('error: ' + JSON.stringify(error));	
	//  	});
 	
 // 	});



 // });


// Parse.Cloud.job("convertInventoryItems", function(request, status){
// 	var promise = Parse.Promise.as();
// 	promise = promise.then(function() {
// 		var truckQuery = new Parse.Query("Truck");
// 		truckQuery.include("vendor");
// 	 	return truckQuery.each(function(aTruck){
// 	 		console.log('processing truck' + aTruck.id);
// 	 		//for each truck get all the menu items associated with that vendor
// 			var menuItemQuery = new Parse.Query("MenuItem");
// 			menuItemQuery.equalTo("vendor", aTruck.get("vendor"));
// 			return menuItemQuery.each(function(aMenuItem){
// 				var theMenuItem = aMenuItem;

// 				var InventoryItem = Parse.Object.extend("InventoryItem");
// 				var anInventoryItem = new InventoryItem();
// 				anInventoryItem.set("text", theMenuItem.get("name"));
// 				anInventoryItem.set("truck", aTruck);
// 				anInventoryItem.set("vendor", aTruck.get("vendor"));

// 				return anInventoryItem.save()
// 				.then(function(anInventoryItem){
// 					//the inventory item has been save
// 					//now save the assignment
// 					// console.log('processing ivnetory item assignment');
// 					var InventoryItemAssign = Parse.Object.extend("InventoryItemAssign");
// 					var inventoryItemAssign = new InventoryItemAssign();
// 					inventoryItemAssign.set("inventoryItem", anInventoryItem);
// 					inventoryItemAssign.set("menuItem", theMenuItem);
// 					inventoryItemAssign.set("decQty", 1);
// 					inventoryItemAssign.set("truck", anInventoryItem.get("truck"));
// 					return inventoryItemAssign.save();
// 				});
// 			});

// 	 	});
// 	}).then(function(){
// 		status.success();
// 	}, function(error){
// 		status.error(JSON.stringify(error));
// 	});
// });

// Parse.Cloud.job("convertModifiersToOptions", function(request, status){
// 	var promise = Parse.Promise.as();
// 	promise = promise.then(function() {
// 		console.log("*********************************");
// 		var menuItemQuery = new Parse.Query("MenuItem");
// 		menuItemQuery.exists("modifiers");
// 		return menuItemQuery.each(function(aMenuItem){
// 			console.log('processing ' + aMenuItem.get("name"));
// 			var modifierArray = aMenuItem.get("modifiers");
// 			if (modifierArray && modifierArray.length > 0){

// 				var MenuItemOptions = Parse.Object.extend("MenuItemOptions");
// 				var defaultOptionItem = new MenuItemOptions;
					
// 					console.log('setting name for new option group');

// 					defaultOptionItem.set("name", "Modifiers for " + aMenuItem.get("name"));
// 					var tempOptionsArray = [];
					
// 					_.each(modifierArray, function(aModifier, index){
// 						tempOptionsArray.push(
// 													{
// 													id:index+1,
// 													description: aModifier.modifierText,
// 													price: aModifier.cost,
// 													legacy:true
// 												}
// 											);
// 					});

// 					console.log('new options array is ' + JSON.stringify(tempOptionsArray));
// 					defaultOptionItem.set("options", tempOptionsArray);
// 					defaultOptionItem.set("legacy", true);
// 					defaultOptionItem.set("vendor", aMenuItem.get("vendor"));
					
// 					console.log('saving new option group');
// 					return defaultOptionItem.save()
// 					.then(function(newOptionGroup){
// 						//now take this newly created option group and save it to the menu item
// 						// aMenuItem.set("optionGroups", [{amount:0,defaultValues:[], numberFree:0, objectId:newOptionGroup.id, legacy:true}]);
// 						console.log('assigning newly saved option group to menu item' + newOptionGroup.id);
// 						aMenuItem.set("legacyOptionGroup", {__type:"Pointer", className:"MenuItemOptions" , objectId:newOptionGroup.id});
// 						// promises.push(aMenuItem.save());
// 						return aMenuItem.save();
// 					});
// 			} else
// 				return Parse.Promise.as();
// 		});
// 	}).then(function(){
// 		//all done
// 		console.log('calling success...');
// 		status.success('Done!');
// 	}, function(error){
// 		console.log('calling error ' + JSON.stringify(error));
// 		status.error('error');	
// 	});

// });

// Parse.Cloud.job("populateTxDate", function(request, status){

// 	console.log("*********************************");
	 
// 	var promise = Parse.Promise.as();
// 	promise = promise.then(function() {
// 		var orderQuery = new Parse.Query("Order");
// 		orderQuery.doesNotExist("txDate");

// 		return orderQuery.each(function(anOrder){
// 			// console.log('created at ' + anOrder.toJSON().createdAt); 
// 			anOrder.set("txDate", new Date(anOrder.toJSON().createdAt));
// 			return anOrder.save();	
// 		});
	
// 	}).then(function(){
// 		status.success('All Done');
// 	}, function(error){
// 		console.log(error);
// 		status.error('error'); 
// 	});
// });

// Parse.Cloud.job("addIdToPrices", function(request, status){
// 	console.log("*********************************");
// 	var menuItemQuery = new Parse.Query("MenuItem");
// 	menuItemQuery.exists("prices");
// 	// menuItemQuery.equalTo("objectId", 'PvkzFzalhw');
// 	menuItemQuery.limit(500);
// 	menuItemQuery.find(function(aMenuItemList){

// 		var promises = [];
// 		console.log('processing ' + aMenuItemList.length + ' records');
// 		_.each(aMenuItemList, function(aMenuItem, counter){
// 			console.log('record no is ' + counter);
// 			// console.log('getting prices array for ' + aMenuItem.id);
// 			var priceArray = aMenuItem.get("prices");

// 			// console.log('Prices array is ' + JSON.stringify(priceArray));
				
// 			if (priceArray && priceArray.length > 0){
// 				_.each(priceArray, function(aPriceEntry, index){
// 					// console.log('For ' + aMenuItem.id + ' price entry is ' + JSON.stringify(aPriceEntry));

// 					aPriceEntry.id = index+1;
// 					priceArray[index] = aPriceEntry;
// 				});

// 				// var aNewArray = priceArray.slice(0);

// 				// console.log('after ID has been set ' + JSON.stringify(priceArray));
// 				aMenuItem.set("prices", priceArray);
// 				console.log(aMenuItem.id + ' is dirty ' + aMenuItem.dirty());
				
// 				promises.push(aMenuItem.save());
// 			} else 
// 				promises.push(Parse.Promise.as());

// 		});

// 		Parse.Promise.when(promises)
// 		.then(function(){
// 			console.log('calling success...');
// 			status.success('Done!');
// 		}, function(error){
// 			console.log('calling error');
// 			status.error(error);
// 		});
// 	});
// });



/** 
 ** Utility Cloud functions
*/
// Parse.Cloud.job("removeOrphanedRecords", function(request, status){
// 	var TrkUtility = require('./utility.js').trkUtility;
// 	var trkUtility = new TrkUtility();
// 	trkUtility.removeOrphanedRecords(request, status);
// });

// Parse.Cloud.job("deleteExpiredUrls", function(request, status){
// 	var TrkUtility = require('./utility.js').trkUtility;
// 	var trkUtility = new TrkUtility();
// 	trkUtility.deleteExpiredUrls(request, status);
// });

//Parse WebHooks
Parse.Cloud.afterDelete("TruckScheduleEvent", function(request) {
	//if there are any linked social posts, they should be deleted too
	//console.log('After Delete...');
	//console.log(request);
	var socialPostingQuery = new Parse.Query("SocialPosting");
	socialPostingQuery.exists("parentColl");
	socialPostingQuery.equalTo("parentColl.id", request.object.id);
	socialPostingQuery.equalTo("parentColl.collName", "truckScheduleEvents");
	//there should only ever be one but it doesnt hurt to clean up if need be
	return socialPostingQuery.find()
	.then(function(aSocialPostRecords){
		return Parse.Object.destroyAll(aSocialPostRecords);
	});
});

Parse.Cloud.afterSave("TruckScheduleEvent", function(request) {
	console.log('After save...');
	// console.log(request);
	//console.log(request.object.dirtyKeys());
	// console.log(request.object);
	// console.log('event id is ' + request.object.id);

	//once the object is saved, the objectId is available
	var vendor = request.object.get("vendor");
	// console.log('loading vendor record for ' + vendor.id);
	vendor.fetch()
	.then(function(vendor){
		var vendorSettings = vendor.get("settings");
		if (vendorSettings.eventPublishOffset && vendorSettings.eventPublishOffset > 0){
			//if this is an existing record, check if there is all ready a schedule record for this event
			//Try to find matching social posting record');
			// console.log('Eureka - Vendor' + vendor.get("description") + 'is auto posting events');
		
			var socialPostingQuery = new Parse.Query("SocialPosting");
			socialPostingQuery.exists("parentColl");
			socialPostingQuery.equalTo("parentColl.id", request.object.id);
			socialPostingQuery.equalTo("parentColl.collName", "truckScheduleEvents");
			return socialPostingQuery.first()
			.then(function(aSocialPostRecord){

				var aEventMoment = new moment(request.object.get("startDateTime"));
				aEventMoment.subtract(vendorSettings.eventPublishOffset, 'minutes');

				if (aSocialPostRecord){
					//it exists so just update the start date/time (even though it may not have changed)
					//if the start date/time has changed, update it
					var socialPostMoment = new moment(aSocialPostRecord.get("postDateTime"));


					if ( socialPostMoment.isSame(aEventMoment) ){
						// console.log('Post date is correct. No update required');
					} else {
						// console.log('Updating Post date...');
						//delete the record and create a new one 
						//since the text in the social post needs to be updated with the new time
						return aSocialPostRecord.destroy()
						.then(function(){
							//create a new social posting record for event
							var TrkSocial = require('./social.js').trkSocial;
							var trkSocial = new TrkSocial;
							// console.log('calling method to create a social post record for event...'); 
							return trkSocial.generateSchedEventSocialRecords(vendor, request.object, aEventMoment);							
						})
					}
				} else {
					// console.log('no existing social posting records were found for vendor: ' + vendor.get("description"));
					//create a new social posting record for event
					var TrkSocial = require('./social.js').trkSocial;
					var trkSocial = new TrkSocial;
					// console.log('calling method generateSchedEventSocialRecords...'); 
					return trkSocial.generateSchedEventSocialRecords(vendor, request.object, aEventMoment);

				}
			});
		} else {
				// console.log('vendor has not enabled auto social posts for events');
				return Parse.Promise.as();
		};
	});


});

Parse.Cloud.beforeSave("Truck", function(request, response){
	var aTruck = request.object;
	// console.log(aTruck.toJSON());
	if (aTruck.get("deleted") == undefined)
		aTruck.set("deleted", false); //default deleted flag to False if not set

	response.success();
});

Parse.Cloud.beforeSave("TruckScheduleEvent", function(request, response) {

	//this gets called before a truckScheduleEvent is saved in the DB
	//it ensures that no overlapping events for the same truck exist.
	
	var aTruck = request.object.get("truck");
	console.log('saving truck schedule event' + JSON.stringify(request.object));
	var aStartDate = request.object.get("startDateTime");
	var aEndDate = request.object.get("endDateTime");
	
	var aStartMoment = moment(aStartDate.toISOString());
	var aEndMoment = moment(aEndDate.toISOString());

	//make sure that the end moment is AFTER the start Moment (common sense checking)
	if (aStartMoment.isAfter(aEndMoment))
		response.error({'code': 101, message:"Start of Event must be before end of Event."});

	aStartMoment.add(1, 'seconds');
	aEndMoment.subtract(1, 'seconds');

	console.log('searching startDate ' + aStartMoment.format());
	console.log('searching endDate ' + aEndMoment.format());

	//console.log('truck is ' + aTruck.id);

	// console.log('getting truck schedule...');
	var TrkTruck = require('./truck.js').trkTruck;
	var trkTruck = new TrkTruck; 
	return trkTruck._truckScheduleGet({
		truckId: aTruck.id,
		fromTimeStamp: aStartMoment.utc().format(),
		toTimeStamp: aEndMoment.utc().format(),
		ignorePrivateSettings: true 	
	})

	// return Parse.Cloud.run("truckScheduleGet",{
	// 	truckId: aTruck.id,
	// 	fromTimeStamp: aStartMoment.utc().format(),
	// 	toTimeStamp: aEndMoment.utc().format(),
	// 	ignorePrivateSettings: true 	
	// })
	.then(function(httpResponse){
		console.log('No of events found are ' + httpResponse.length);
		
		if (httpResponse.length == 0){
			console.log('no other events found! Good to go');
			return Parse.Promise.as();
		} else 
			if (httpResponse.length > 0 && request.object.id){

				if (httpResponse.length == 1){
					//in the case of one event being found we need to ensure that it not the event being saved
					// if it is then that is OK
					console.log('beforeSave: one matching event has been found!!');
					console.log('beforeSave: request object id is ' + request.object.id);
					console.log('beforeSave: httpresponse : ' + httpResponse[0].objectId);
					// console.log('beforeSave: request.object : ' + JSON.stringify(request.object));

					if (httpResponse[0].objectId == request.object.id){
						return Parse.Promise.as();
					} else
						return Parse.Promise.error({'code': 101, message:"An overlapping event all ready exists."});
						
				} else 
					return Parse.Promise.error({'code': 101, message:"An overlapping event all ready exists."});
			} else {

				console.log('IN HERE');
				console.log(httpResponse[0]);
				console.log('Object Id is  ' + request.object.id);
				return Parse.Promise.error({'code': 101, message:"An overlapping event all ready exists."});	
				// return Parse.Promise.as();
			}

	}).then(function(){
		//if this is a recurring event we need to check to see if there are any recurrences which 
		//collide with OTHER recurring event for this truck

		//1. Get all OTHER recurring events
		//2. Ignoring the dates, check the times of the recurring event
		//   and see if there is an overlap with this event
		// if (request.object.get("recurrence") > 0){
		// 	//1. Get all other recurring events for this truck/location

		// }
		// else 
			return Parse.Promise.as();


	}).then(function(){
		//ensure that the crewData is always an empty array if it is undefined
		var assignedCrew = request.object.get("crewData");
		if (typeof assignedCrew === 'undefined')
			request.object.set("crewData", {members:[]});
	
		console.log('calling response success in beforeSave of TruckScheduleEvents');
		response.success();	
	
	}, function(error){
		console.log('returning error...' + JSON.stringify(error));
		response.error(error);
	});

});