     // Menu Item
    var MenuItemDataSource = function(appModel) { 
        return new kendo.data.DataSource({
            transport: {
                read: function(options) {
                        $.ajax({           
                            // url: "/parse/classes/MenuItem/",
                            url: "/parse/functions/menuItemsGet",
                            dataType: "json",
                            type:"POST",
                            //type:"POST",
                            headers: appModel.parse._headers,
                            data: kendo.stringify({vendor: appModel.getParsePointer(appModel.parse._vendor, "Vendor")}),
                            
                            success: function(jsonResponse) {
                                options.success(jsonResponse.result);
                            },

                            error: function(jqXHR,textStatus,errorThrown) {
                                options.error(options.data);
                            }
                        });
                },

                create: function(options) {
                    
                    var _options=this.prepareDataForSave($.extend({},options.data));

                    $.ajax({
                        // url: "/parse/classes/MenuItem/",
                        url: "/parse/functions/menuItemSave",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,

                        data:kendo.stringify(_options),
                        
                        success: function(httpResponse) {
                            
                            options.data.objectId=httpResponse.result.objectId;
                            options.data.vendor = httpResponse.result.vendor;
                            options.data.createdAt = httpResponse.result.createdAt;
                            options.data.updatedAt = httpResponse.result.updatedAt;
                            options.success(options.data);
                            
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            options.error(options.data);
                        }
                    });
                },

                update: function(options) {
                    var _options=this.prepareDataForSave($.extend({},options.data));
                    var self = this;
                    self._options = _options;
                    
                    $.ajax({
                        url: "/parse/functions/menuItemSave",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,

                        data:kendo.stringify(_options),
                        
                        success: function(httpResponse) {
                            
                            options.data.objectId=httpResponse.result.objectId;
                            options.data.vendor = httpResponse.result.vendor;
                            options.data.createdAt = httpResponse.result.createdAt;
                            options.data.updatedAt = httpResponse.result.updatedAt;
                            options.success(options.data);
                            
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            options.error(options.data);
                        }
                    });
                },

                destroy: function(options) {
                    
                     var url="/parse/functions/menuItemDelete";//+options.data["objectId"];

                    $.ajax({
                        url: url,
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,
                        data:kendo.stringify(options.data),
                        success: function(response) {
                            options.success(response.result);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            options.error(options.data);
                        }
                    });
                },

                prepareDataForSave: function(options) {
                    
                    // $(options).removeProp("objectId").removeProp("createdAt").removeProp("updatedAt");
                    $(options).removeProp("createdAt").removeProp("updatedAt");
                    if (options.menuCategory && options.menuCategory.objectId != "0")
                        options.menuCategory={"__type":"Pointer","className":"MenuCategory","objectId":options.menuCategory.objectId}
                    options["vendor"]=appModel.getParsePointer(appModel.parse._vendor, "Vendor");

                    return options;
                }
            },

            schema:{

                parse: function(data) {
                    
                    
                    for(var i=0;i<data.length;i++) {
                        if(!data[i].modifiers) data[i].modifiers=[];
                        if(!data[i].taxes) data[i].taxes=[];
                        // if(!data[i].assocCategory) data[i].assocCategory=[];
                    }

                    return data;
                },

                 model: {
                  id:"objectId",

                  fields: {
                    "objectId": {
                            nullable:true,
                            editable:true
                        },

                    "name": {
                        from:"name",
                        editable: true,
                        type: "string"
                    },

                    "description" : {
                        from: "description",
                        editable: true,
                        type: "string"
                        
                    },

                    // "price" : {
                    //     from: "price",
                    //     editable: true
                        
                    // },

                    // "assocCategory":{
                    //     from: "assocCategory",
                    //     editable: true
                    // },

                    "minTotalOrderAmount":{
                        from:"minTotalOrderAmount",
                        editable:true
                    },
                    
                    "optionGroups" : {
                        from: "optionGroups",
                        editable: true
                        
                    },

                    "modifiers" : {
                        from: "modifiers",
                        editable: true
                        
                    },

                    "prices" : {
                        from: "prices",
                        editable: true
                        
                    },

                    "taxes" : {
                        from: "taxes",
                        editable: true
                        
                    },

                    "picture" : {
                        from: "picture",
                        editable: true
                    },

                    "vendor" : {
                        from: "vendor",
                        editable: true
                    },

                    "globalTaxExempt":{
                        from:"globalTaxExempt",
                        editable:true
                    },

                    "printToKT":{
                        from:"printToKT",
                        editable:true
                    },

                    "onlineOrderingAvailable":{
                        from:"onlineOrderingAvailable",
                        editable:true
                    },

                    "displayOrder" : {
                        from: "displayOrder",
                        type: "number",
                        editable: true
                    },

                    "createdAt" : {
                        from: "createdAt",
                        editable: false
                    },

                    "updatedAt" : {
                        from: "updatedAt",
                        editable: false
                    },

                  }
                }
            },

            sort: { field: "name", dir: "asc" },

        });
    }