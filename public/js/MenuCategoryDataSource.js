    // Menu Category
    var MenuCategoryDataSource = function(appModel) { 
        return new kendo.data.DataSource({
        
        transport: {
            read: function(options) {
                if (options.data.menuHeader)
                    $.ajax({
                        url: '/parse/functions/menuCategoryGetForMenu',
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,        
                        data:  kendo.stringify(options.data),                   
                        
                        success: function(jsonResponse) {
                            options.success(jsonResponse.result);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            options.error(options.data);
                        }
                    });
                else if (options.data.menuItem){
                    $.ajax({
                        url: '/parse/functions/menuCategoryGetForMenu',
                        dataType: "json",
                        type:"POST",
                        headers: appModel.parse._headers,        
                        data:  kendo.stringify(options.data),                   
                        
                        success: function(jsonResponse) {
                            options.success(jsonResponse.result);
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            options.error(options.data);
                        }
                    });
                } else {
                    options.success([]);
                }
            },

            create: function(options) {
                
                var _options=this.prepareDataForSave($.extend({},options.data));

                $.ajax({
                    url: "/parse/classes/MenuCategory/",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data:kendo.stringify(_options),
                    
                    success: function(jsonResponse) {
                        
                        options.data.objectId=jsonResponse.objectId;
                        options.success(options.data);

                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            update: function(options) {
                
                var url="/parse/classes/MenuCategory/"+options.data["objectId"];
                var _options=this.prepareDataForSave($.extend({},options.data));

                $.ajax({
                    url: url,
                    dataType: "json",
                    type:"PUT",
                    headers: appModel.parse._headers,

                    data:kendo.stringify(_options),
                    
                    success: function(result) {
                        
                        options.success(options.data);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            destroy: function(options) {
                
                var url="/parse/functions/menuCategoryDeleteById";

                $.ajax({
                    url: url,
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data: kendo.stringify({
                        menuCategoryId: options.data.objectId,
                        
                    }),
                    
                    success: function(result) {
                        options.success(result);
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            prepareDataForSave: function(options) {
                
                $(options).removeProp("id").removeProp("createdAt").removeProp("updatedAt").removeProp("dirty");
                // options.menuHeader={"__type":"Pointer","className":"MenuHeader","objectId":menuModel.get("selectedMenuHeader")};
                if (options.menuHeader)
                    options.menuHeader={"__type":"Pointer","className":"MenuHeader","objectId":options.menuHeader};

                //copy the menu category object into the main options and then remove it
                if (options.menuCategory){
                    //copy all the properties
                    for(var k in options.menuCategory) options[k]=options.menuCategory[k];

                    delete options.menuCategory
                }
                return options;
            }   
        },

        requestStart: function () {
            kendo.ui.progress($('body'), true);
        },
        requestEnd: function () {
            kendo.ui.progress($('body'), false);

        },
        
        schema:{

            parse: function(data) {
                
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
                    editable: true
                },

                "description": {
                    from:"description",
                    editable: true
                },

                "visible" : {
                    from: "visible",
                    editable: true,
                    defaultValue:true
                },

                "displayOrder" : {
                    from: "displayOrder",
                    type: "number",
                    editable: true
                },
                "menuHeader":{
                    from: "menuHeader",
                    editable: true
                }
              }
            }
        }
        });

    }