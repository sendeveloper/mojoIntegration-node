    var AssignedMenuItemDataSource = function (appModel){
        return new kendo.data.DataSource({
            transport: {
                read: function(options) {
                        if (options.data.menuCategory)
                            return $.ajax({           
                                url: "/parse/functions/menuItemsGet",
                                dataType: "json",
                                type:"POST",
                                headers: appModel.parse._headers,
                                data: kendo.stringify(options.data),
                                
                                success: function(jsonResponse) {
                                    options.success(jsonResponse.result);
                                },

                                error: function(jqXHR,textStatus,errorThrown) {
                                    console.log('Datasource Error : ' + JSON.stringify(errorThrown));
                                    options.error(options.data);
                                }
                            });
                        else 
                            options.success({});
                },
                update: function(options){
                    // var menuModel = options.data.menuModel;
                    // delete options.data.menuModel;
                    
                    // options.data.menuCategory = {__type:"Pointer", className:"MenuCategory", objectId: options.data.targetMenuCategory};
                    // delete options.data.targetMenuCategory;

                    return $.ajax({
                        // url: "/parse/functions/displayOrderSet",
                        url:"/parse/functions/menuItemSave",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,

                        data:kendo.stringify(options.data),
                        
                        success: function(httpResponse) {
                            
                            // options.data.objectId=httpResponse.result.objectId;
                            // options.success(httpResponse.result);
                            //loop through each item in the response and manually update the object

                            // var updateArray = [];
                            // _.each(httpResponse.result, function(resultRecord){
                            //     updateArray.push({
                            //             objectId: resultRecord.objectId,
                            //             displayOrder:resultRecord.displayOrder
                            //     });
                            // });
                            // if (updateArray.length > 0 && menuModel)
                            //     menuModel.assignedMenuItems.pushUpdate(updateArray);

                            options.success(options.data);
                            // options.success(updateArray);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            console.log('Datasource Error : ' + JSON.stringify(errorThrown));
                            options.error(options.data);
                        }
                    });

                },
                destroy: function(options){
                    // var menuModel = options.data.menuModel;
                    // delete options.data.menuModel;

                    return $.ajax({
                        url: "/parse/functions/displayOrderUnset",
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,

                        data:kendo.stringify(options.data),
                        
                        success: function(httpResponse) {
                            
                            var updateArray = [];
                            //update the DisplayOrder of subsequent menu Items in that category
                            _.each(httpResponse.result, function(resultRecord){
                                updateArray.push({
                                        objectId: resultRecord.objectId,
                                        displayOrder:resultRecord.displayOrder,
                                        description:resultRecord.description,
                                        name: resultRecord.name
                                });
                            });
                            // if (updateArray.length > 0 && menuModel)
                            //     menuModel.assignedMenuItems.pushUpdate(updateArray);

                            options.success(updateArray); 
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            console.log('Datasource Error : ' + JSON.stringify(errorThrown));
                            options.error(options.data);
                        }
                    });
                },
                sort:{field:"displayOrder", dir:"asc"}
            },
            requestStart: function () {
                kendo.ui.progress($('body'), true);
            },
            requestEnd: function () {
                kendo.ui.progress($('body'), false);

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

                    "onlineOrderingAvailable":{
                        from: "onlineOrderingAvailable",
                        type: "boolean",
                        editable: true
                    },

                    "displayOrder" : {
                        from: "displayOrder",
                        type: "number",
                        editable: true
                    }

                  }
                }
            }
        });       
    }