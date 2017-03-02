    var MenuHeaderDataSource = function(appModel) { 
        return new kendo.data.DataSource({
        
        transport: {
            read: function(options) {
                $.ajax({
                    
                    url: "/parse/functions/menuListGet",
                    dataType: "json",
                    type:"POST",
                    
                    headers: appModel.parse._headers,               
                    data:kendo.stringify({"vendor":appModel.getParsePointer(appModel.parse._vendor, "Vendor") }),
                    success: function(jsonResponse) {
                        
                        options.success(jsonResponse.result);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            create: function(options) {
                
                if(!options.data.hasOwnProperty("isCopy")) {

                    var _options=this.prepareDataForSave($.extend({},options.data));

                    $.ajax({
                        url: "/parse/classes/MenuHeader/",
                        dataType: "json",
                        type:"POST",
                        headers:appModel.parse._headers,

                        data:kendo.stringify(_options),
                        
                        success: function(httpResponse) {
                            options.data.objectId=httpResponse.objectId;
                            options.success(options.data);
                        
                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            options.error(jqXHR.responseJSON.errorThrown)
                        }
                    });

                }

                else {
                    $.ajax({
                        url: "/parse/functions/menuCreateFromCopy",
                        dataType: "json",
                        type:"POST",
                        headers:appModel.parse._headers,

                        data:kendo.stringify({
                            menuId: options.data.copyID,
                            menuDesc: options.data.Description,
                            copyOverridePricing: options.data.copyOverridePricing

                        }),
                        
                        success: function(httpResponse) {
                            
                            options.data.objectId=httpResponse.result.newId;
                            //menu was copied succesfully. It is no longer a copy
                            options.data.isCopy = false;

                            options.success(options.data);

                        },

                        error: function(jqXHR,textStatus,errorThrown) {
                            options.error(jqXHR.responseJSON.error)
                        }
                    });
                }
            },

            update: function(options) {
                
                var url="/parse/classes/MenuHeader/"+options.data["objectId"];
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
                
                var url="/parse/functions/menuDeleteById";

                $.ajax({
                    url: url,
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,

                    data: kendo.stringify({
                        menuId: options.data["objectId"],
                        
                    }),
                    
                    success: function(httpResponse) {
                        
                        options.success(httpResponse.result);
                        
                    },
                    
                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            prepareDataForSave: function(options) {
                
                $(options).removeProp("id").removeProp("createdAt")
                .removeProp("updatedAt").removeProp("addType").removeProp("dirty")
                .removeProp("copyID").removeProp("isCopy").removeProp("copyOverridePricing");

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
        change: function(e) {
              
        },

        schema:{

            parse: function(data) {
                
                return data;
            },

             model: {
              id:"objectId",

              isActive: function() {
                return false;
              },


              fields: {
                "objectId": {
                        nullable:true,
                        editable:true
                    },

                "name": {
                    from:"name",
                    editable: true
                },

                "isBulk":{
                    editable: true
                },

                "minOrderAmt":{
                    editable:true
                },

                "minOrderNotice":{
                    editable:true
                },

                "vendor": {
                    from:"vendor",
                    editable:true
                }
              }
            }
        }
        });

    }