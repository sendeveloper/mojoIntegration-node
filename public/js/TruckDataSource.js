    var TruckDataSource = function(appModel) {
        return new kendo.data.DataSource({

        transport: {
           
            read: function(options) {
                $.ajax({
                    
                    url: "/parse/classes/Truck",
                    dataType: "json",
                    type:"GET",
                    headers: appModel.parse._headers,
                    
                    data:{where:    kendo.stringify({"vendor":appModel.getParsePointer(appModel.parse._vendor, "Vendor") , deleted:false}),
                                    order:"name",
                    },
                    success: function(jsonResponse) {
                        options.success(jsonResponse.results);
                    }
                });

            },

            create: function(options) {
                
                var _options=this.prepareDataForSave($.extend({},options.data));

                $.ajax({
                    url: "/parse/classes/Truck/",
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,
                    data:kendo.stringify(_options),
                    
                    success: function(result) {
                        options.data.objectId=result.objectId;
                        options.success(options.data);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            update: function(options) {
                
                var url="/parse/classes/Truck/"+options.data["objectId"];
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
                
                var url="/parse/functions/truckDeleteById";

                $.ajax({
                    url: url,
                    dataType: "json",
                    type:"POST",
                    headers: appModel.parse._headers,
                    data: kendo.stringify({
                        truckId: options.data.objectId,
                    }),
                    
                    success: function(result) {
                        
                        options.success(options.data);
                        
                    },

                    error: function(jqXHR,textStatus,errorThrown) {
                        options.error(options.data);
                    }
                });
            },

            prepareDataForSave: function(options) {
                
                $(options).removeProp("objectId").removeProp("createdAt").removeProp("updatedAt")
                .removeProp("lastLocation").removeProp("locationUpdateStamp")
                .removeProp('dirty').removeProp('id');

                options["vendor"]=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
                
                if(!options.menuHeader.objectId) {
                    $(options).prop("menuHeader", null);
                };

                if(!options.bulkMenuHeader.objectId) {
                    $(options).prop("bulkMenuHeader", null);
                };

                if(!options.centralKitchen.objectId) {
                    $(options).prop("centralKitchen", null);
                };               
               
                return options;
            },

        },

        requestStart: function () {
            kendo.ui.progress($('body'), true);
        },
        requestEnd: function () {
            kendo.ui.progress($('body'), false);

        },
                
        change: function(e) {
                
        },

        schema: {
                 parse: function(data) {
                            for (var i = 0; i < data.length; i++) {

                                if(!data[i].menuHeader) {
                                    data[i].menuHeader={};
                                    data[i].menuHeader.__type="Pointer";
                                    data[i].menuHeader.objectId=null;
                                    data[i].menuHeader.className="MenuHeader";
                                }

                                if(!data[i].bulkMenuHeader) {
                                    data[i].bulkMenuHeader={};
                                    data[i].bulkMenuHeader.__type="Pointer";
                                    data[i].bulkMenuHeader.objectId=null;
                                    data[i].bulkMenuHeader.className="MenuHeader";
                                }

                                if (!data[i].centralKitchen){
                                    data[i].centralKitchen={};
                                    data[i].centralKitchen.__type="Pointer";
                                    data[i].centralKitchen.objectId=null;
                                    data[i].centralKitchen.className="Truck";
                                }

                                // if(!data[i].hasOwnProperty("assignedStockList")) {
                                //     data[i].assignedStockList={};
                                //     data[i].assignedStockList._id=null;
                                //     data[i].assignedStockList.className="stockListHeader";
                                // }    
                                
                            }
                            
                            return data;
                        },

                model: {
                    id: "objectId",      //model identifier

                    fields: {
                               "objectId": {
                                        nullable:true,
                                        editable:false
                               },

                                name: {
                                        from:"name",
                                        editable:true,
                                        type:'string'
                                        
                                },

                                currentStatus: {
                                    from:"currentStatus",
                                    editable:true,
                                    type:'string',
                                    defaultValue:"OPEN"
                                },

                                menuHeader: {
                                    from: "menuHeader",
                                    editable:true
                                },


                                bulkMenuHeader: {
                                    from: "bulkMenuHeader",
                                    editable:true
                                },

                                delivery:{
                                    from:"delivery",
                                    editable:true
                                },

                                centralKitchen: {
                                    from: "centralKitchen",
                                    editable:true
                                },

                                stockListHeader: {
                                    from: "stockListHeader",
                                    editable:true
                                },

                                vendor: {
                                    from:"vendor",
                                    editable:true
                                },

                                lastLocation:{
                                    from:"lastLocation",
                                    editable:false
                                },

                                locationUpdateStamp: {
                                    editable: false
                                },

                                retailLocation:{
                                    from: "retailLocation",
                                    editable:true
                                }

                        }

                }
            }
        });
    }