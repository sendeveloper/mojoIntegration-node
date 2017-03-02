    var InventoryDataSource = function(appModel) {
        return new kendo.data.DataSource({

        transport: {
            create:function(options){
                var _options = this.prepareDataForSave(options.data);

                // var _options=this.prepareDataForSave($.extend({},options.data));
                
                $.ajax({
                    url: "/parse/functions/inventoryItemCreate",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify(_options),
                    
                    success: function(response) {
                        options.success(response.result);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(jqXHR.responseJSON);
                    }

                });                
            },
            update:function(options){
                $.ajax({
                    url: "/parse/functions/inventoryItemUpdate",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify(options.data),
                    
                    success: function(response) {
                        options.success(response.result);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(jqXHR.responseJSON);
                    }

                });                
            },
            read: function(options) {
                $.ajax({
                    url: "/parse/functions/inventoryItemsGet",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify({
                        vendor: appModel.getParsePointer(appModel.parse._vendor, "Vendor"),
                        truck:options.data.truck
                    }),
                    
                    success: function(response) {
                        options.success(response.result);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(jqXHR.responseJSON);
                        
                    }

                });

            },

            prepareDataForSave: function(options) {
                
                // $(options).removeProp("objectId").removeProp("createdAt").removeProp("updatedAt");
                $(options).removeProp("createdAt").removeProp("updatedAt");
                if (options.assignedItems)
                    for(var i=0;i<options.assignedItems.length;i++) {
                        options.assignedItems[i].menuItem = {"__type":"Pointer","className":"MenuItem","objectId":options.assignedItems[i].menuItem.objectId}

                    }
                                   
                options["vendor"]=appModel.getParsePointer(appModel.parse._vendor, "Vendor");

                return options;
            }

        },

        requestStart: function () {
            kendo.ui.progress($('body'), true);
        },
        requestEnd: function () {
            kendo.ui.progress($('body'), false);

        }, 
        sort: { field: "text", dir: "asc" },       
        schema: {
                 // parse: function(data) {
                 //            for (var i = 0; i < data.length; i++) {

                 //                if(!data[i].menuHeader) {
                 //                    data[i].menuHeader={};
                 //                    data[i].menuHeader.__type="Pointer";
                 //                    data[i].menuHeader.objectId=null;
                 //                    data[i].menuHeader.className="MenuHeader";
                 //                }

                 //                if (!data[i].centralKitchen){
                 //                    data[i].centralKitchen={};
                 //                    data[i].centralKitchen.__type="Pointer";
                 //                    data[i].centralKitchen.objectId=null;
                 //                    data[i].centralKitchen.className="Truck";
                 //                }

                 //                // if(!data[i].hasOwnProperty("assignedStockList")) {
                 //                //     data[i].assignedStockList={};
                 //                //     data[i].assignedStockList._id=null;
                 //                //     data[i].assignedStockList.className="stockListHeader";
                 //                // }    
                                
                 //            }
                            
                 //            return data;
                 //        },

                model: {
                    id: "objectId",      //model identifier

                    fields: {
                               "objectId": {
                                        nullable:true,
                                        editable:false
                               },

                                text: {
                                        from:"text",
                                        editable:false,
                                        type:'string'
                                        
                                },

                                truck: {
                                    editable: false
                                },

                                vendor:{
                                    editable: false
                                },

                                menuItem: {
                                    editable:false
                                },
                                currentLevel: {
                                    editable:true,
                                    type:'number'
                                },
                                alertLevel: {
                                    editable:true,
                                    type:'number'
                                }
                    }

                }
            }
        });
    }