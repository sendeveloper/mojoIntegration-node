
    var const_orderState_recvd = 0;
    var const_orderState_conf = 1;
    var const_orderState_ready = 2;
    var const_orderState_comp = 3;
    var const_orderState_canc = 4;

    var kendoNotification=null;      // main window notification object
    var pusher;  //= new Pusher(appDefaults.pusherAPIKey);
    var channel;

    // var ajaxHeader={};
    function logError(details) {

        if(!appDefaults.logErrors) return;

        $.ajax({
            global: false,
            url: "/parse/classes/errorLog",
            dataType: "json",
            type:"POST",
            headers: kdsModel.parse._headers,

            data:kendo.stringify({
                context: navigator.userAgent,
                details: details
            }),
            
            success: function(result) {
               
            },

            error: function(jqXHR,textStatus,errorThrown) {
               
            }
                
        });

    }

    function isUserLoggedIn(){

        var deferred=$.Deferred();

        // var headers={};

        if(amplify.store("trcked.com") ) {

            kdsModel.parse._headers["X-Parse-Session-Token"]=amplify.store("trcked.com").sessionToken;

            // ensure that the user session has not expired
            // make a test call to the database
            $.ajax({
                    url: "/parse/users/"+amplify.store("trcked.com").userID,
                    dataType: "json",
                    type:"GET",
                    headers: kdsModel.parse._headers,
                    
                    success: function(result) {
                        deferred.resolve(result.emailValidated);
                    },

                    error: function(errorObj) {
                        console.log(errorObj);
                        deferred.resolve(false);
                    }
                });
        }

        else
            deferred.resolve(false);

        return deferred.promise();
     }
    
    // App Model
    // static shared model only instantiated once during the life of the app.
    // defines variables and functions used by models
    var kdsModel= kendo.observable({

            truckList: null,
            selectedTruck : null,
            selectedMenuId: null,
            selectedMenu:null,
            menuOrders: [],
            menuCategoryList : null,
            menuCategoryEnabled: false,
            categoryList:null,
            currentOrderList:[],
            pendingOrderList: [],
            scheduledEvents:null,
            preSelectedCategories:null,
            eventScheduleEnabled: false,
            totalMenuItemList: null,
            okThresholdMax:60,
            preSelectedStatus: [],
            statusList:[    {status:0, statusText:"Pending Acceptance"}, 
                            {status:1, statusText:"In Process"},
                            {status:2, statusText:"Ready"}
            ],

            initMasonryTiles:function(){
                    $("#kdsLVOrderList").masonry({
                            itemSelector: '.kdsOrder',
                            columnWidth: '.kdsOrder',
                            percentPosition: true,
                            transitionDuration: 0,
                            // resize: false
                    });
                    kdsModel.set("masonryInitialized", true);
            },

            // _msnry: false,
            // msryLoad: _.debounce(function () {
            //     //console.log("msryLoad", kdsModel._msnry);
            //     if (!kdsModel._msnry) {
            //         $("#kdsLVOrderList").masonry({
            //                 itemSelector: '.kdsOrder',
            //                 columnWidth: '.kdsOrder',
            //                 percentPosition: true,
            //                 transitionDuration: 0,
            //                 resize: false
            //             })
            //             .bind('layoutComplete', function () {
            //                 kdsModel._msnry = true;
            //                 kdsModel.get("currentOrderList")
            //                     .unbind("change", kdsModel.msryLoad)
            //                     .bind("change", kdsModel.msryReLoad);
            //                 $("#kdsLVOrderList").unbind('layoutComplete');
            //             });
            //     }
            // }, 100, true),
            // msryReLoad: _.throttle(function () {
            //     console.log('reload');
            //     //console.log("msryReLoad", kdsModel._msnry);
            //     if (kdsModel._msnry) {
            //         $("#kdsLVOrderList").masonry('reloadItems');
            //         $("#kdsLVOrderList").masonry('layout');
            //     }
            // }, 3 * 1000),

        //parse data & defaults
        // _underscore before property name so that it's not wrapped into a kendo observable
        parse: {
            "_headers":{},
            "_vendor":{}
        },

        userInfo:{},

        menuItemSummary: function(){
            var dataSource = new kendo.data.DataSource();

            _.each(this.get("currentOrderList").data(), function(anOrder){
                //loop through the order items for this array
                _.each(anOrder.orderItems, function(anOrderItem){
                    //we only consider items that are 'In Progress'
                    if (anOrder.state == const_orderState_conf){
                        //see if we all ready have an entry for this menu item
                        //in the result array
                        var anEntry = _.find(dataSource.data(), function(aSummaryEntry){
                            if (aSummaryEntry.objectId == anOrderItem.menuItem.objectId){
                                var itemDescription = "";
                                
                                if (anOrderItem.priceText)
                                    itemDescription = anOrderItem.description + ' ( ' + anOrderItem.priceText + ' )';
                                else 
                                    itemDescription = anOrderItem.description;

                                if (itemDescription == aSummaryEntry.description)
                                    return aSummaryEntry;
                            }
                        });
                        if (anEntry){
                            //there is all ready a summary entry for this menu item
                            anEntry.qty = anEntry.qty + anOrderItem.qty;
                        } else {
                            //this is new, so append it
                            var anEntry = {};
                            anEntry.objectId = anOrderItem.menuItem.objectId;
                            if (anOrderItem.priceText)
                                anEntry.description = anOrderItem.description + ' ( ' + anOrderItem.priceText + ' )';
                            else 
                                anEntry.description = anOrderItem.description;

                            anEntry.qty = anOrderItem.qty;
                            dataSource.add(anEntry);
                        }
                    };
                })
            });
            return dataSource;
        },

        onKDSIDChange:function(e){
            //The KDS ID has been selected/changed. Store this in the local DB
            // and then register with the server
            var localStore=amplify.store("trcked.com");
            if (!localStore.kdsSettings)
                localStore.kdsSettings = {};
            
            localStore.kdsSettings.KDSId = e.sender.value();

            amplify.store("trcked.com",localStore);

        },

        _registerKDS : function(){
            return $.ajax({
                url: "/parse/functions/registerNotificationClient",
                dataType: "json",
                type:"POST",
                headers: kdsModel.parse._headers,
                data:kendo.stringify({
                    "vendor":kdsModel.getParsePointer({objectId:kdsModel.userInfo.vendorID}, "Vendor"),
                    "truck":kdsModel.getParsePointer({objectId:kdsModel.get("selectedTruck")}, "Truck"),
                    "clientId": kdsModel.currentKDSId()
                })
            }); 
        },

        _confirmPushReceipt:function(message){
            console.log('Confirming reference ID' + message.data.internalId);
            console.log(message);

            var referenceId;

            if (message.data.internalId)
                referenceId = message.data.internalId;
            else 
                referenceId = message.data.objectId;

            return $.ajax({
                url: "/parse/functions/confirmPendingNotification",
                dataType: "json",
                type:"POST",
                headers: kdsModel.parse._headers,
                data:kendo.stringify({
                    "referenceId": referenceId,
                    "truck":kdsModel.getParsePointer({objectId:kdsModel.get("selectedTruck")}, "Truck"),
                    "notifClientId": kdsModel.currentKDSId()
                })
            });   
        },

        currentKDSId:function(){
            var localStore=amplify.store("trcked.com");
            if (!localStore || !localStore.kdsSettings)
                return null;
            else {
                return localStore.kdsSettings.KDSId;
            }
        },

        KDSIDArray:function(startAlpha, endAlpha){
                if (!startAlpha)
                    startAlpha = 'A';

                if (!endAlpha)
                    endAlpha = 'Z';

                var a = [], i = startAlpha.charCodeAt(0), j = endAlpha.charCodeAt(0);
                for (; i <= j; ++i) {
                    a.push(String.fromCharCode(i).toUpperCase());
                }
                return a;
        },

        getParsePointer: function(object, className){
            if (object.hasOwnProperty('objectId')){
                return {className:className, __type:"Pointer", objectId:object.objectId};
            } else 
                return null;
        },

        loadMenuItemsForCategories:function(aMenuCategory){
            var deferred= $.Deferred();

            var assignMenuItemsDS = new AssignedMenuItemDataSource(kdsModel);
            assignMenuItemsDS.one("requestEnd", function(httpResponse){
                //now append the items to the list of menu items
                _.each(httpResponse.response, function(aMenuItem){
                    kdsModel.get("totalMenuItemList").push(aMenuItem);
                });
                deferred.resolve();
            });

            assignMenuItemsDS.read({menuCategory: aMenuCategory});
                
            return deferred.promise();            
        },

        selectAllCategories: function(){
            var multiselect = $("#lstMenuCategories").data("kendoMultiSelect");
            //first clear out any thing currently selected
            multiselect.value([]);
            
            var promiseArray = [];
            var arrayVar = [];
            
            //load the menu items for each of the categories
            _.each(multiselect.dataSource.data(), function(dataItem){
                arrayVar.push({name:dataItem.name, objectId:dataItem.objectId});

                var aMenuCategory = kdsModel.getParsePointer({objectId: dataItem.objectId}, "MenuCategory");
                promiseArray.push(kdsModel.loadMenuItemsForCategories(aMenuCategory));
            });
        
            $.when.apply($, promiseArray).then(function(){

                multiselect.value(arrayVar);    
                
                if (kdsModel.get("totalMenuItemList").length == 0)
                    $('#kdsGoBtn').attr('disabled', true)
                else 
                    $('#kdsGoBtn').removeAttr('disabled');

                //save the current state of the multiSelect
                //we use this later on to work out when an item has been added/deleted
                //for more info see function onMenuCategorySelected
                kdsModel.saveCurrent(multiselect);
            });
            



            
            

        },
        // initialize the app model. called only once -
        init: function() {
                var deferred= $.Deferred();
                var self=this;
                                
                self.set("eventScheduleEnabled", false);                
                self.set("truckList", TruckDataSource(self));
                self.set("scheduledEvents", TruckScheduleDataSource(self));
                self.set("menuCategoryList", new MenuCategoryDataSource(self));
                self.set("currentOrderList", POSOrdersDataSource(self));
                self.set("totalMenuItemList", []);

                self.bind("change", function (e) {

                    if (e.field == 'selectedMenuId'){
                        if (kdsModel.selectedMenuId){
                            //Get the menu categories for this menu
                            var data = {};
                            data.menuHeader = kdsModel.getParsePointer({objectId: kdsModel.selectedMenuId}, 'MenuHeader');
                            kdsModel.menuCategoryList.read(data);
                            $('#selectAllCatsBtn').removeAttr('disabled');
                        } else {
                            kdsModel.set("selectedMenu", null);
                            $('#selectAllCatsBtn').attr('disabled', true);
                            // //if there are any categories selected, clear them out
                            var multiselect = $("#lstMenuCategories").data("kendoMultiSelect");
                            multiselect.value([]);
                        }
                    };

                });

                pusher = new Pusher(appDefaults.pusherAPIKey);

                pusher.connection.bind('unavailable', function() {
                    self.hideAllVisibleNotifications();
                    kendoNotification.show({title:"Connection broken",message:'Connection to the internet has been lost.'},"error");
                    kdsModel.set("isDisconnected", true);
                });  

                pusher.connection.bind('connected', function() {
                    if (kdsModel.get("isDisconnected") == true){
                        self.hideAllVisibleNotifications();
                        kendoNotification.show({title:"Connection Restored",message:'Please wait. Synchronizing Orders...'},"success");
                        kdsModel.set("isDisconnected", false);
                        console.log("!!! pusher.connection.bind('connected',");
                        self.getPOSOrders()
                        .then(function(){
                            self.hideAllVisibleNotifications();
                            $("#kdsLVOrderList").masonry('reloadItems');
                            $("#kdsLVOrderList").masonry('layout');
                        });
                    }
                });

                $(window).on("offline", function(){
                    self.hideAllVisibleNotifications();
                    kendoNotification.show({title:"Connection broken",message:'Connection to the internet has been lost.'},"error");
                    kdsModel.set("isDisconnected", true);
                });

                $(window).on("online", function(){
                    self.hideAllVisibleNotifications();
                    kendoNotification.show({title:"Connection Restored",message:'Synchronizing Orders...'},"success");
                    kdsModel.set("isDisconnected", false);
                    console.log('$(window).on("online",');
                    self.getPOSOrders()
                    .then(function(){
                        self.hideAllVisibleNotifications();
                        $("#kdsLVOrderList").masonry('reloadItems');
                        $("#kdsLVOrderList").masonry('layout');
                    });

                });

                //load the last truck user from the local store
                var localStore=amplify.store("trcked.com");
                kdsModel.set("selectedTruck", localStore.kdsLocation);
                
                //if there is a selcted truck then fetch the schedule
                //we do this by triggering the onTruckSelectedEvent
                kdsModel.onTruckLocationSelected(null, localStore.kdsLocation);

                deferred.resolve();
                return deferred.promise();
        },

        hideAllVisibleNotifications:function(){
            var elements = kendoNotification.getNotifications();

            // remove the visibile notifications
            elements.each(function(index, anElement){
                $(anElement).parent().remove();
            });
        },

        getPreselectedCategories: function(){
            var localStore=amplify.store("trcked.com");
            if (!localStore.kdsSettings)
                return [];
            if (!localStore.kdsSettings.menuList)
                return [];

            var returnArray = [];
            _.each(localStore.kdsSettings.menuList, function(aMenuSettingsRecord, index){
                if (aMenuSettingsRecord.objectId == kdsModel.selectedMenuId){
                    _.each(aMenuSettingsRecord.menuCatgories, function(aMenuCategory){
                        returnArray.push(aMenuCategory);    
                    });
                    
                };
            });

            return returnArray;            
        },

        saveCurrent: function (multi) {
            multi._savedOld = multi.value().slice(0);
        },

        onMenuCategorySelected: function(){
            // Retrieve previous value of `multiselect` saved using previous function
            that = this;

            var previous = that._savedOld;
            // These are current values.
            var current = that.value();
            // Let's save it for the next time
            kdsModel.saveCurrent(that);

            // The difference between previous and current are removed elements
            var removedElements = $(previous).not(current).get();

            var newElements = $(current).not(previous).get();

            //the user has selected a menu category
            var localStore=amplify.store("trcked.com"); 
            
            if (!localStore.kdsSettings)
                localStore.kdsSettings = {};

            if (!localStore.kdsSettings.menuList)
                localStore.kdsSettings.menuList = [];

            var menuIndex = -1;

            _.each(localStore.kdsSettings.menuList, function(aMenuSettingsRecord, index){
                if (aMenuSettingsRecord.objectId == kdsModel.selectedMenuId)
                    menuIndex = index;
            });

            var menuSettingsObject = {};

            // menuSettingsObject.menuCatgories = $("#lstMenuCategories").data("kendoMultiSelect").value();
            menuSettingsObject.menuCatgories = that.value();
            menuSettingsObject.objectId = kdsModel.selectedMenuId;

            if (menuIndex == -1){
                localStore.kdsSettings.menuList.push(menuSettingsObject);
            } else {
                localStore.kdsSettings.menuList[menuIndex] = menuSettingsObject;
            };

            amplify.store("trcked.com",localStore);
            
            if (newElements.length > 0 ){
                //now get an instance of the AssignedMenuItemDataSource and get the items
                var assignMenuItemsDS = new AssignedMenuItemDataSource(kdsModel);
                assignMenuItemsDS.bind("requestEnd", function(httpResponse){
                    //now append the items to the list of menu items
                    _.each(httpResponse.response, function(aMenuItem){
                        kdsModel.get("totalMenuItemList").push(aMenuItem);    
                    });

                    if (kdsModel.get("totalMenuItemList").length == 0)
                        $('#kdsGoBtn').attr('disabled', true)
                    else 
                        $('#kdsGoBtn').removeAttr('disabled');
                    });

                var aMenuCategory = kdsModel.getParsePointer({objectId: newElements[0]}, "MenuCategory");
                assignMenuItemsDS.read({menuCategory: aMenuCategory});
            };

            if (removedElements.length > 0){
                var totalMenuItemsArray = _.filter(kdsModel.get("totalMenuItemList"), function(aMenuItem, itemIndex){
                    if (aMenuItem.menuCategory.objectId == removedElements[0])
                        return false
                    else 
                        return true;
                        // kdsModel.get("totalMenuItemList").splice(itemIndex, 1); //remove the elements from the DS
                    
                });
                kdsModel.set("totalMenuItemList", totalMenuItemsArray);
                if (totalMenuItemsArray.length == 0)
                    $('#kdsGoBtn').attr('disabled', true)
                else 
                    $('#kdsGoBtn').removeAttr('disabled');
            };


        },
        onTruckLocationSelected: function(eventObj, overrideValue){
            //1. First write this to the local storage
            var self = this; 

            if (kdsModel._oldTruckValue){
                //unsubscribe from this trucks channel push
                pusher.unsubscribe(kdsModel._oldTruckValue, kdsModel.onChannelMessageEvent);
            }

            var store=amplify.store("trcked.com");
            if (eventObj)
                store.kdsLocation = eventObj.sender.value();
            else 
                store.kdsLocation = overrideValue;

            kdsModel._oldTruckValue = store.kdsLocation;

            amplify.store("trcked.com",store);

            var aStartMoment = new moment(); //default to now

            var aEndMoment = new moment();
            //set to end of the day
            aEndMoment.set("hours", 23);
            aEndMoment.set("minutes", 59);
            aEndMoment.set("seconds", 59);

            //load all the scheduled events for this truck
            if (store.kdsLocation){
                //bind to the request end event and execute the code
                this.get("scheduledEvents").bind("requestEnd", this.onTruckScheduleLoad);


                this.get("scheduledEvents").read({ fromTimeStamp: aStartMoment.toDate(),
                                            toTimeStamp: aEndMoment.toDate(),
                                            truckId:store.kdsLocation });
            } else {
                kdsModel.set("eventScheduleEnabled", false);           
            }

            //the truck value has been changed so any orders and items displayed should be cleared out
            kdsModel.get("currentOrderList").data([]);
            kdsModel.set("totalMenuItemList", []);
            //clear out any categories that are currently selected
            var multiselect = $("#lstMenuCategories").data("kendoMultiSelect");
            if (multiselect)
                multiselect.value([]);

        },

        onTruckScheduleLoad: function(e){
            //if there are no schedule records returned
            //then disable the schedule record drop down
            if (e.type == 'read'){
                if (e.response.length == 0){
                    kdsModel.set("eventScheduleEnabled", false);
                    //since there is no schedule records for this 
                    //truck, just get the default menu (assigned to the truck)
                    //and load it
                    var truckRecord = kdsModel.get("truckList").get(kdsModel.selectedTruck);
                    kdsModel.set("selectedMenuId", truckRecord.menuHeader.objectId);

                } else {
                    kdsModel.set("eventScheduleEnabled", true);
                    //clear out currently selected menu id
                    kdsModel.set("selectedMenuId", null);
                };
            };
        },

        onScheduleEventSelected: function(e){
            //user has selected a scheduled event

            //blank out the currently selected Menu
            kdsModel.set("selectedMenuId", null);

            //get it and see if there is an override menu
            var scheduleEvent = kdsModel.get("scheduledEvents").get(e.sender.value());
            if (scheduleEvent && scheduleEvent.get("overrideMenu")){
                this.set("selectedMenuId", scheduleEvent.get("overrideMenu").objectId);
            } else {
                //since there is no override menu, we should load the default truck menu
                var truckRecord = kdsModel.get("truckList").get(kdsModel.selectedTruck);
                kdsModel.set("selectedMenuId", truckRecord.menuHeader.objectId);
            };
        },

        // sortCurrentOrderList:function(){
        //     //for some reason calling sort triggers a 'read' operation on the datasource
        //     // kdsModel.get("currentOrderList").sort({ field: "acceptanceDateTime.iso", dir: "asc" }); 

        //     //so we manually sort the datasource
        //     // var dataItems = kdsModel.get("currentOrderList").data();
        //     // var sortedArray = _.sortBy(dataItems, 'acceptanceDateTime.iso');
        //     // kdsModel.get("currentOrderList").data(sortedArray);

        // },

        onChannelMessageEvent:function(message){
            console.log('received a POS event');
            console.log(message);

            kdsModel._confirmPushReceipt(message)
            .always(function(){
                //handle new order
                if (message.code == 100 || message.code == 101){
                    //copy the 'items' into a new array called 'orderItems'
                    if (message.data.items)
                        message.data.orderItems = message.data.items.splice(0);

                    if (message.data.internalId)
                        message.data.objectId = message.data.internalId;

                    if (message.data.orderState)
                        message.data.state = message.data.orderState;
                    
                    //this is SO wrong but cant help it for now
                    if (message.code == 101){
                        if (message.data.terminalId)
                            message.data.concatOrderId = message.data.terminalId.charAt(0) + '-' + message.data.orderId
                        else 
                            message.data.concatOrderId = message.data.orderId;
                    } else 
                        if (message.data.terminalId)
                            message.data.concatOrderId = message.data.terminalId.charAt(0) + '-' + message.data.externalId
                        else
                             message.data.concatOrderId = message.data.externalId;
                         
                    _.each(message.data.orderItems, function(anItem){
                        if (anItem.desc)
                            anItem.description = anItem.desc;
                    });

                    if (message.data.acceptanceDateTime && !message.data.acceptanceDateTime.iso)
                        message.data.acceptanceDateTime = {__type:"Date", iso:message.data.acceptanceDateTime};
                    //a new order has been received, check if it is relevant
                    // var isRelevant = true;

                    var isRelevant = false;

                    if (message.code == 101){ //101 is a NEW order being received as opposed to an update for an existing
                        isRelevant = kdsModel.checkifOrderIsRelevant(message.data);
                        //if this is a pending order then add it to the pending order list
                        if (message.data.state == const_orderState_recvd)
                            kdsModel.get("pendingOrderList").push(message.data); //save it as pending since it may become relevant as it moves through its life cycle

                    } else {
                        //for message 100, it is an update to an existing order
                        //check if we have this order in any of our lists
                        var foundOrder = _.find(kdsModel.get("pendingOrderList"), {objectId:message.data.objectId});
                        if (!foundOrder)
                            foundOrder = _.find(kdsModel.get("currentOrderList").data(), {objectId:message.data.objectId});
                        
                        if (foundOrder){
                            //update the state 
                            foundOrder.state = message.data.state;
                            if (foundOrder.terminalId)
                                foundOrder.concatOrderId = foundOrder.terminalId.charAt(0) + '-' + foundOrder.orderId; //aka externalId
                            else
                                foundOrder.concatOrderId = foundOrder.orderId; //aka externalId

                            isRelevant = kdsModel.checkifOrderIsRelevant(foundOrder);
                        } else 
                            isRelevant = false;
                    };

                    if (isRelevant){
                        //depending on teh status, push it on to the right list
                        switch (message.data.state){
                            case const_orderState_recvd: //order received but not yet accepted
                                // message.data.orderStatusText = kdsModel.getOrderStatusText(message.data);
                                // kdsModel.get("pendingOrderList").push(message.data);
                                break;
                            case const_orderState_conf: //order has been accepted
                                //move the order from the pending list 
                                //to the current order list
                                //if it is not in there then it is assumed to be not relevant
                                var foundOrder = _.find(kdsModel.get("pendingOrderList"), {objectId:message.data.objectId});
                                if (foundOrder){
                                    //found the order. Adding it to the current order list
                                    foundOrder.acceptanceDateTime = message.data.acceptanceDateTime;
                                    foundOrder.timeAgo = 0;
                                    foundOrder.timeAgoId = 'timeAgo' + foundOrder.objectId;
                                    foundOrder.set("orderStatusText",  kdsModel.getOrderStatusText(foundOrder));
                                    if (!foundOrder.concatOrderId)
                                        foundOrder.concatOrderId = foundOrder.terminalId.charAt(0) + '-' +  foundOrder.externalId;
                                    
                                    //rather then just pushing this object to the currentOrderList 
                                    //we will actually create a NEW observable with the same data
                                    // var orderClone = new kendo.data.ObservableObject(foundOrder.toJSON());
                                    kdsModel.get("currentOrderList").pushCreate(foundOrder.toJSON());
                                    // kdsModel.sortCurrentOrderList();

                                    //now remove it from pending
                                    var newArray = _.filter(kdsModel.get("pendingOrderList"), function(anOrder){
                                        if (anOrder.objectId == message.data.orderId)
                                            return false  //remove it
                                        else
                                            return true; //leave the entry in the array
                                    });
                                    //new array should contain the pending order list minus this order id
                                    kdsModel.set("pendingOrderList", newArray);   
                                } else {
                                    //it is possible that the order is not in the pending list
                                    //it simply needs to be added to the current order list
                                    message.data.orderStatusText = kdsModel.getOrderStatusText(message.data);
                                    message.data.timeAgo = 0;
                                    message.data.timeAgoId = 'timeAgo' + message.data.objectId;
                                    
                                    if (!message.data.concatOrderId)
                                        message.data.concatOrderId = message.data.terminalId.charAt(0) + '-' +  message.data.externalId;
                                    kdsModel.get("currentOrderList").pushCreate(message.data);
                                };
                                break;
                            case const_orderState_ready:
                                //the order is ready for pick up but this KDS wants to see those
                                //orders so push it back on to the display view
                                var foundOrder = _.find(kdsModel.get("currentOrderList").data(), {objectId:message.data.objectId});
                                
                                if (!foundOrder){
                                    message.data.timeAgo = 0;
                                    message.data.orderStatusText = kdsModel.getOrderStatusText(message.data);
                                    message.data.timeAgoId = 'timeAgo' + message.data.objectId;
                                    if (!message.data.concatOrderId)
                                        message.data.concatOrderId = message.data.terminalId.charAt(0) + '-' + message.data.externalId;
                                    
                                    kdsModel.get("currentOrderList").pushCreate(message.data);

                                } else{
                                    //we have found the order check to see if its status is not Allready 'Ready'
                                    //if it is then there is nothing to do 
                                    // if (foundOrder.state != const_orderState_ready){
                                    foundOrder.timeAgo = 0;
                                    foundOrder.set("orderStatusText", kdsModel.getOrderStatusText(message.data));
                                    foundOrder.set("state", message.data.state);
                                    foundOrder.timeAgoId = 'timeAgo' + foundOrder.objectId;

                                    if (!foundOrder.concatOrderId)
                                        foundOrder.concatOrderId = foundOrder.terminalId.charAt(0) + '-' + foundOrder.externalId;                                    

                                    //there seesm to be a 'bug/feature' on listview where updating a list item
                                    //does not update the UI. The only way to do that is to call listview refresh.                                
                                    var listView = $("#kdsLVOrderList").data("kendoListView");
                                    listView.refresh();
                                }
                                break;
                            default:
                                //all the other states (picked up and cancelled) indicate that we need
                                //to remove the order from our list
                                var newArray = _.filter(kdsModel.get("pendingOrderList"), function(anOrder){
                                    if (anOrder.objectId == message.data.orderId)
                                        return false  //remove it
                                    else
                                        return true; //leave the entry in the array
                                });
                                //new array should contain the pending order list minus this order id
                                kdsModel.set("pendingOrderList", newArray);

                                //also remove the order from the currentorderlist (if it is there)
                                var deleteObject = null;
                                _.each(kdsModel.get("currentOrderList").data(), function(anOrder){
                                    if (anOrder.objectId == message.data.orderId || anOrder.objectId == message.data.objectId)
                                        deleteObject = anOrder;
                                });

                                //remove the order from the data source (this will cause a sync which is what we want)
                                kdsModel.get("currentOrderList").remove(deleteObject);
                                // kdsModel.get("currentOrderList").pushDestroy(deleteArray);

                        };

                        // var listView = $("#kdsLVOrderList").data("kendoListView");
                        // listView.refresh();
                        
                    } else {
                        //the order is not relevant to this KDS so check if it is in the current
                        //order list and remove it
                        var foundOrder = _.find(kdsModel.get("currentOrderList").data(), {objectId:message.data.objectId});
                        if (foundOrder)
                            kdsModel.get("currentOrderList").pushDestroy(foundOrder);

                    };

                };

                $("#kdsLVOrderList").masonry('reloadItems');
                $("#kdsLVOrderList").masonry('layout');                
            });




        },
        setViewData: function(){

            $("#panelBar").kendoPanelBar({
                animation: {
                    // fade-out closing items over 1000 milliseconds
                    collapse: {
                        duration: 500,
                        effects: "fadeOut"
                    },
                   // fade-in and expand opening items over 500 milliseconds
                   expand: {
                       duration: 500,
                       effects: "fadeIn"
                   }
               }
            });

            var panelBar = $("#panelBar").data("kendoPanelBar");

            panelBar.bind('expand', function(){
                //override the standard icons with your own
                var spanIcon = $(panelBar.element).find('.k-panelbar-expand');
                $(spanIcon).removeClass('k-icon k-i-arrow-s k-i-arrow-n').addClass('fa fa-cogs');                
            });

            panelBar.bind('collapse', function(){
                //override the standard icons with your own
                var spanIcon = $(panelBar.element).find('.k-panelbar-collpase');
                $(spanIcon).removeClass('k-icon k-i-arrow-n k-i-arrow-s');          
            });

            panelBar.expand('#settingsBar');

            var multiselect = $("#lstMenuCategories").data("kendoMultiSelect");
            if (multiselect){
                multiselect.autoBind = false;

                multiselect.bind("change", kdsModel.onMenuCategorySelected);

                kdsModel.get("menuCategoryList").bind("requestEnd", function(readResult){
                    if (readResult.response.length >  0){

                        kdsModel.set("menuCategoryEnabled", true);
                        // kdsModel.set("preSelectedCategories" , kdsModel.getPreselectedCategories());
                    };  
                });                
            }


        },

        calcTimeAgoString: function(dateObj){
            countdown.setLabels(
                ' millisecond|s|m|h| day| week| month| year| decade| century| millennium',
                ' milliseconds|s|m|h| days| weeks| months| years| decades| centuries| millennia',
                ':',
                ':',
                '',
                function(n){ return n.toString(); });

            // return countdown(dateObj, null, countdown.HOURS|countdown.MINUTES|countdown.SECONDS).toString();
            return countdown(dateObj, null, countdown.HOURS|countdown.MINUTES).toString();
        },

        checkifOrderIsRelevant: function(anOrder){
            var isAMatch = false; //reset the flag for every new order
            
            var orderItems = [];

            if (anOrder.orderItems)
                orderItems = anOrder.orderItems.slice(0);

            //check if the status of the order matches any of the selected
            //status filter
            if (kdsModel.get("preSelectedStatus").length > 0){
                //user has specified a list of status
                //make sure that this order is in one of them
                var index = kdsModel.get("preSelectedStatus").indexOf(anOrder.state);
                if (index == -1){
                    return false;
                }
            }
                
            _.each(orderItems, function(anOrderItem, itemIndex){
                //go through each item and remove it, if it is not part of 
                //our item filter list

                //if any of the items are 'off menu' then we really have no 
                //category so we should just shown them
                if (anOrderItem.offMenuItem == true)
                    isAMatch = true;
                else {
                    var itemId;

                    if (anOrderItem.menuItem && anOrderItem.menuItem.objectId)
                        itemId = anOrderItem.menuItem.objectId;
                    else 
                        itemId = anOrderItem.id;

                    var matchedArray = _.where(kdsModel.get("totalMenuItemList"), {objectId:itemId});
                    if (matchedArray.length > 0)
                        isAMatch = true;
                }
            });

            return isAMatch;
  
        },

        reCalcTimeAgo: function(){
            // refresh the list view
            // var listView = $("#kdsLVOrderList").data("kendoListView");

            _.each(kdsModel.get("currentOrderList").data(), function(anOrder, itemIndex){
                if (anOrder.acceptanceDateTime){
                    anOrder.set("timeAgo", kdsModel.calcTimeAgoString(new Date(anOrder.acceptanceDateTime.iso)));
                    kdsModel.get("currentOrderList").pushUpdate(anOrder);
                    //manually update the field so we dont have to refresh the listview and mess up the scroll bar
                    $('#timeAgo' + anOrder.objectId).html(anOrder.get("timeAgo")); 
                }
            });
        },

        updateOrderStatus:function(eventObj){
            if ($('#kdsNextStateBtn').prop("disabled")){
                console.log('prevent default behavior');
                eventObj.preventDefault();
                return false;
            }

            if (kdsModel.get("isDisconnected") == true){
                kendoNotification.show({title:"Order not updated",message:"KDS is not connected to the Internet"},"error");
                return;
            };

            // var eventData = eventObj.data;
            //disable the button to avoid double touches
            $('#kdsNextStateBtn').prop("disabled", true).addClass("k-state-disabled");
            
            var newState = eventObj.data.state;
            newState++; //move it to the next state         

            eventObj.data.set("state", newState);

            if (eventObj.data.truck)
                eventObj.data.truckId = eventObj.data.truck.objectId;

            if (eventObj.data.orderItems && eventObj.data.items)
                if (eventObj.data.orderItems.length > 0 && eventObj.data.items.length == 0)
                    eventObj.data.items = eventObj.data.orderItems.slice(0);


            //rather then slowing things down we are going to update the KDS now
            //this function will update the status on the order now or remove it if that is what is required
            kdsModel.onChannelMessageEvent({code:100, data:eventObj.data});
            $('#kdsNextStateBtn').prop("disabled", false).removeClass("k-state-disabled");

            $.when(kdsModel.get("currentOrderList").sync(eventObj.data))
            .then(function(resultResponse){
                //do nothing    
            }, function(error){
                kdsModel.get("currentOrderList").cancelChanges();
                console.log(error);
                kendoNotification.show({title:"Oops",message:'Order not updated. Please try again.'},"error");
            });
        },

        getOrderStatusText: function(anOrder){

            var statusEntry = _.find(kdsModel.statusList, {status:anOrder.state});
            return statusEntry.statusText;
   
        },

        onKDSGoBtnClick:function(e){
            //1. Register the KDS
            $('#kdsGoBtn > i').addClass('fa fa-refresh fa-spin');
            kdsModel._registerKDS()
            .then(function(){
                //2. Get orders
                kdsModel.getPOSOrders();
                //subscribe to the newly selected truck
                //now register for the pusher events
                channel = pusher.subscribe(kdsModel.get("selectedTruck"));
                channel.bind(appDefaults.pusherEventName, kdsModel.onChannelMessageEvent);
                channel.bind('POSEventRepush', kdsModel.onChannelMessageEvent);
            }, function(error){
                var msg;

                if (!error.message)
                    msg = 'KDS Could not be registered. Please try again.';
                else
                    msg = error.message;

                kendoNotification.show({title:"KDS Not Registered",message:error.message},"error"); 
            });
        },

        getPOSOrders: function(){
            $('#kdsGoBtn > i').addClass('fa fa-refresh fa-spin');

            var dataObj = {};
            dataObj.vendorId = kdsModel.userInfo.vendorID;
            dataObj.truckId = kdsModel.get("selectedTruck");
            dataObj.orderState = 'C'; //Get all pending and in process orders and ready for pickUp

            this.get("currentOrderList").bind("error", function(e){
                var msg;
                if (e.status)
                    msg = e.status;
                else
                    msg = 'Current orders could not be retrieved. Please try again.';

                kendoNotification.show({title:"Oops",message:msg},"error");
                $('#kdsGoBtn > i').removeClass('fa fa-refresh fa-spin')
                                  .addClass('fa fa-check');

                kdsModel.get("currentOrderList").unbind("requestEnd");
                kdsModel.get("currentOrderList").unbind("error");
            });

            this.get("currentOrderList").bind("requestEnd", function(readResult){
                //now loop through each order returned and make sure that 
                //there is at least one item whose category match the above
                //selected categories
                if (!readResult.response)
                    return;
                
                if (readResult.response.length == 0){
                    //there are no orders for this truck at the moment
                    kendoNotification.show({title:"It's all good.",message:"No current orders found"},"info")
                };
                var isRelevant = false;
                var allSelectedItems = kdsModel.get("totalMenuItemList");
                var ordersToRemove = [];

                _.each(readResult.response, function(anOrder, orderIndex){
                    anOrder.timeAgo = 0;
                    isRelevant = kdsModel.checkifOrderIsRelevant(anOrder);
                    if (isRelevant == false)
                        ordersToRemove.push(orderIndex)
                    
                    //an order may be relevant but still pending acceptance
                    //in that case we put it onto the pending stack and remove it from 
                    //the current order list                    
                    else {
                        if (anOrder.state == 0){
                            ordersToRemove.push(orderIndex);
                            kdsModel.get("pendingOrderList").push(anOrder);
                        }  else {
                            anOrder.timeAgoId = 'timeAgo' + anOrder.objectId;
                            anOrder.orderStatusText=kdsModel.getOrderStatusText(anOrder);
                            if (anOrder.terminalId)
                                anOrder.concatOrderId = anOrder.terminalId.charAt(0) + '-' + anOrder.orderId; //aka the external Id
                            else 
                                anOrder.concatOrderId = anOrder.orderId;
                        }
                    }
                });

                while((i = ordersToRemove.pop()) != null){
                    readResult.response.splice(i, 1);
                };

                kdsModel.get("currentOrderList").unbind("requestEnd");
                kdsModel.get("currentOrderList").unbind("error");

                $('#kdsGoBtn > i').removeClass('fa fa-refresh fa-spin')
                                  .addClass('fa fa-check');

                var panelBar = $("#panelBar").data("kendoPanelBar");
                panelBar.collapse('#settingsBar');

                //calc timeAgo every 60 seconds
                setInterval(kdsModel.reCalcTimeAgo, 1000);

                return readResult;

            });

            return $.when(kdsModel.get("currentOrderList").read(dataObj))
            .then(function(){
                //console.log("read");
                //sort the data source in the correct order
                kdsModel.get("currentOrderList").sort({field: "acceptanceDateTime.iso", dir: "asc"});

                if (kdsModel.get("masonryInitialized") == true){
                    $("#kdsLVOrderList").masonry('reloadItems');
                    $("#kdsLVOrderList").masonry('layout');
                } else 
                    kdsModel.initMasonryTiles();


                //console.log("sort");
                // kdsModel.get("currentOrderList")
                //     .unbind("change", kdsModel.msryReLoad)
                //     .unbind("change", kdsModel.msryLoad)
                //     .bind("change", kdsModel.msryLoad);

            });

        },

        displayKDSOverview:function(){

            kendo.bind($("#kdsOverview"), this);
            
            $('#kdsOverview').on('shown.bs.modal', function () {
                var listView = $("#kdsMenuItemSummary").data("kendoListView");
                // refreshes the list view
                listView.refresh();
                // var heightVal = parseInt(1.75 * listView.dataItems().length);
                // heightVal = String(heightVal) + 'em';
                // $(this).find('.modal-body').css({'height':heightVal}); //this is a hack but it works
            });

            $("#kdsOverview").modal('show');
        },

        closeKDSOverview:function(e){
            $("#kdsOverview").kendoWindow().close();
        }

    });

    var kdsRouter = new kendo.Router({
        init: function () {
            masterView.render("#appMain");
        },

        back: function(e) {
            e.preventDefault();
        }
    });

    var masterView = new kendo.Layout("tmplMasterLayout"); 

    var KDSMainView =  function(model) {
        return new kendo.View("tmplKds", {
                        model: model,
                        
                        show:function(){
                            // model.init()
                            // .then(function(){
                                model.setViewData();    
                            // });
                            
                        }
                    });
    }

    var kdsMainView = null;
    var footerView = new kendo.View("tmplFooter");
    // var navKDSHeader = new kendo.View("tmplKdsHeader");

    // Root View
    kdsRouter.route('/', function () {

        // var kdsModel=KDSModel();

        // $.when(kdsModel.init()).then(function() {
            // masterView.showIn("#appNavBar", navKDSHeader);
            masterView.showIn("#appContent", kdsMainView=KDSMainView(kdsModel));
            masterView.showIn("#appFooter", footerView);
            $(window).trigger('resize');
        // });
        
    });
    $(function() {
    	        //load app defaults
        var trckedConfig;
        if (String(window.location.href).indexOf('//app.') > 0){
            trckedConfig = 'trcked_app.json';
        } else
            trckedConfig = 'trcked_dev.json';
        
        $.ajax({    
            url: trckedConfig,
            type: "GET",
            headers:{"Content-Type":"application/json"},
            
            success:function(result){
                appDefaults = result;

                if (typeof appDefaults == 'string')
                    appDefaults = JSON.parse(appDefaults);

                Parse.initialize(appDefaults.parse.applicationID, appDefaults.parse.JSKey);

                 // application wide error handler
                window.onerror = function(message, file, line) {
                    console.log(file + ':' + line + '\n\n' + message);
                };

                $(document).ajaxError(function(e, xhr, settings) {
                    logError(settings.url + ':' + xhr.status + '\n\n' + xhr.responseText);
                });
                
                // load the templates
                templatesLoader.loadExtTemplates([
                    {path:"templates/_kds.tmpl.htm",tag:"tmplKds"},
                    // {path:"templates/_kds.tmpl.htm",tag:"tmplKdsHeader"},
                    {path:"templates/_footer.tmpl.htm",tag:"tmplFooter"},
                    {path:"templates/_notifications.tmpl.htm",tag:"tmplNotifications",noWrap:true},                         
                ]);


                // start the application after the templates have loaded
                $(document).bind("TEMPLATES_LOADED", function() {

                    //init notifications
                    kendoNotification = $("#kendoNotification").kendoNotification({
                                position: {
                                    pinned: true,
                                    top: 30,
                                    right: 30
                                },
                                autoHideAfter: 0,
                                stacking: "down",
                                templates: [
                                 {
                                    type: "info",
                                    template: $("#infoTemplate").html()
                                },

                                {
                                    type: "error",
                                    template: $("#errorTemplate").html()
                                }, {
                                    type: "success",
                                    template: $("#successTemplate").html()
                                }]
                    }).data("kendoNotification");

                    //set parse data
                    kdsModel.parse._headers["Content-Type"]="application/json";
                    kdsModel.parse._headers["X-Parse-Application-Id"]=appDefaults.parse.applicationID;
                    kdsModel.parse._headers["X-Parse-REST-API-Key"]=appDefaults.parse.restAPIKey;

                    $.when(isUserLoggedIn()).then(function(loggedIn) {
                        console.log('LoggedIn is ' + loggedIn);
                        if (loggedIn) {
                            // kdsModel.userInfo.userID=amplify.store("trcked.com").userID;
                            // kdsModel.set("userInfo.userName",amplify.store("trcked.com").userName);
                            // kdsModel.userInfo.sessionToken=amplify.store("trcked.com").sessionToken;
                            kdsModel.userInfo.vendorID=amplify.store("trcked.com").vendorID;
                            // kdsModel.userInfo.emailValidated=amplify.store("trcked.com").emailValidated;

                            kdsModel.parse._vendor={__type:"Pointer", "objectId":kdsModel.userInfo.vendorID, "className": "Vendor"};

                            //init the app
                            kdsModel.init()
                            .then(function(){
                                // start the kendo router
                                kdsRouter.start();                                
                            });
                        }

                        else {
                            //redirect to the login page
                            // console.log('user is not logged in. Send back to index.htm...');
                            amplify.store("trcked.com",null);
                            window.location.replace('index.htm?retUrl=kds.htm');

                        }

                    });

                });               
            },
            
            error: function(){
                alert( trckedConfig + ' could not be loaded.');
            }
        });
    });
