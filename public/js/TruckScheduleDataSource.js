    var TruckScheduleDataSource = function(appModel) {
        return new kendo.data.DataSource({

        transport: {
           
            read: function(options) {
                    if (!options.data.fromTimeStamp || !options.data.toTimeStamp)
                        options.error('Start and End Dates are not defined')
                    else 
                        $.ajax({
                            url: "/parse/functions/truckScheduleGet",
                            dataType: "json",
                            type:"POST",
                            headers: appModel.parse._headers,

                            data:kendo.stringify({
                                vendorId: appModel.userInfo.vendorID,
                                fromTimeStamp: options.data.fromTimeStamp,
                                toTimeStamp: options.data.toTimeStamp,
                                truckId:options.data.truckId
                            }),
                            
                            success: function(response) {
                                options.success(response.result);
                                
                            },

                            error: function(jqXHR,textStatus,errorThrown) {
                                options.error(jqXHR.responseJSON);
                                
                            }

                        });

            },

        },

        requestStart: function () {
            kendo.ui.progress($('body'), true);
        },
        requestEnd: function () {
            kendo.ui.progress($('body'), false);

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
                                        editable:false,
                                        type:'string'
                                        
                                },

                                StartDateTime: {
                                    editable: false
                                },

                                endDateTime:{
                                    editable: false
                                },

                                overrideMenu: {
                                    editable:false
                                }
                    }

                }
            }
        });
    }