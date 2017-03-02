define(
	function(appModel){
		return kendo.observable({
		    init:function(){

		    },
		    setViewState:function(){
		        //default the duration drop down list to 'Custom'
		        var dropdownlist = $("#srptDuration").data("kendoDropDownList");
		        dropdownlist.value("1"); //custom
		        //default todays dates

		        start = moment().startOf('day');
		        this.set("startDateTime", start.toDate());

		        end = moment().endOf('day');
		        this.set("endDateTime", end.toDate());

		        //this default sort field is quantity
		        this.set("currentSortField", 'quantity');

		    },
		    onDurationChange:function(eventObj){
		        switch( parseInt(eventObj.sender.value()) ){
		            case 1:
		                //today
		                start = moment().startOf('day');
		                this.set("startDateTime", start.toDate());

		                end = moment().endOf('day');
		                this.set("endDateTime", end.toDate());
		                
		                break;
		            case 2:
		                //yesterday
		                start = moment().subtract('day', 1).startOf('day');
		                this.set("startDateTime", start.toDate());

		                end = moment().subtract('day', 1).endOf('day');
		                this.set("endDateTime", end.toDate());
		                
		                break;
		            case 3:
		                //this week
		                start = moment().startOf('week');
		                this.set("startDateTime", start.toDate());

		                end = moment().endOf('week');
		                this.set("endDateTime", end.toDate());
		                break;
		            case 4:
		                //last week
		                start = moment().subtract('week', 1).startOf('week');
		                this.set("startDateTime", start.toDate());

		                end = moment().subtract('week', 1).endOf('week');
		                this.set("endDateTime", end.toDate());
		                break;
		            case 5:
		                //this month
		                start = moment().startOf('month');
		                this.set("startDateTime", start.toDate());

		                end = moment().endOf('month');
		                this.set("endDateTime", end.toDate());
		                break;
		            case 6:
		                //last month
		                start = moment().subtract('month', 1).startOf('month');
		                this.set("startDateTime", start.toDate());

		                end = moment().subtract('month', 1).endOf('month');
		                this.set("endDateTime", end.toDate());
		                break;
		            case 7:
		                this.set("startDateTime", null);
		                this.set("endDateTime", null);
		        }
		    },
		    onFromDateChange: function(eventObj){
		        if (!this.endDateTime){
		            //if the user has not selected a date time you should default
		            var eod = new Date(this.startDateTime);
		            eod.setHours(23,59,59);

		            this.set("endDateTime", eod);
		        };
		        //set dropdown list to custom
		        var dropdownlist = $("#srptDuration").data("kendoDropDownList");
		        dropdownlist.value("7"); //custom
		    },

		    onToDateChange:function(eventObj){
		        //set dropdown list to custom
		        var dropdownlist = $("#srptDuration").data("kendoDropDownList");
		        dropdownlist.value("7"); //custom  
		    },

		    sortResults: function(e){
		        var nodeClicked = e.currentTarget;
		        console.log(nodeClicked.text);

		        switch (nodeClicked.id){

		            case 'colHeaderQty':
		                var listView = $("#tableResults").data("kendoListView");

		                this.set("isSortedByAmountDesc", false); 
		                this.set("isSortedByAmountAsc", false); 
		                this.set("isSortedByPercentDesc", false); 
		                this.set("isSortedByPercentAsc", false);                         
		                
		                if (this.isSortedByQtyDesc == false && this.isSortedByQtyAsc == false)
		                    this.set("isSortedByQtyDesc", true); 
		                else {
		                    this.set("isSortedByQtyDesc", !this.isSortedByQtyDesc); 
		                    this.set("isSortedByQtyAsc", !this.isSortedByQtyAsc); 
		                };
		                //_.sortBy always returns in Ascending
		                var array =  _.sortBy(listView.dataItems(), 'quantity');
		                
		                if (this.isSortedByQtyDesc == true)
		                    array.reverse();

		                var dataSource = new kendo.data.DataSource({
		                    data: array
		                });

		                listView.setDataSource(dataSource);
		                this.set("currentSortField", 'quantity');
		                
		                break;
		            case 'colHeaderAmount':
		                var listView = $("#tableResults").data("kendoListView");

		                this.set("isSortedByPercentDesc", false); 
		                this.set("isSortedByPercentAsc", false);  
		                this.set("isSortedByQtyDesc", false); 
		                this.set("isSortedByQtyAsc", false); 

		                if (this.isSortedByAmountDesc == false && this.isSortedByAmountAsc == false)
		                    this.set("isSortedByAmountDesc", true); 
		                else {
		                    this.set("isSortedByAmountDesc", !this.isSortedByAmountDesc); 
		                    this.set("isSortedByAmountAsc", !this.isSortedByAmountAsc); 
		                }
		                //_.sortBy always returns in Ascending
		                var array =  _.sortBy(listView.dataItems(), 'amount');
		                
		                if (this.isSortedByAmountDesc == true)
		                    array.reverse();

		                var dataSource = new kendo.data.DataSource({
		                    data: array
		                });

		                listView.setDataSource(dataSource);
		                this.set("currentSortField", 'amount');
		                break;
		            case 'colHeaderRevenuePercent':
		                var listView = $("#tableResults").data("kendoListView");

		                this.set("isSortedByAmountDesc", false); 
		                this.set("isSortedByAmountAsc", false); 
		                this.set("isSortedByQtyDesc", false); 
		                this.set("isSortedByQtyAsc", false); 

		                if (this.isSortedByPercentDesc == false && this.isSortedByPercentAsc == false)
		                    this.set("isSortedByPercentDesc", true); 
		                else {
		                    this.set("isSortedByPercentDesc", !this.isSortedByPercentDesc); 
		                    this.set("isSortedByPercentAsc", !this.isSortedByPercentAsc); 
		                }
		                //_.sortBy always returns in Ascending
		                var array =  _.sortBy(listView.dataItems(), 'percentOfTotal');
		                
		                if (this.isSortedByPercentDesc == true)
		                    array.reverse();

		                var dataSource = new kendo.data.DataSource({
		                    data: array
		                });

		                listView.setDataSource(dataSource);

		                this.set("currentSortField", 'percentOfTotal');
		                break;
		        };
		    },

		    executeTop5Report: function(){
		        //validate the reports params
		        self = this;
		        var validator = $("#reportParams").kendoValidator().data('kendoValidator');
		        if (validator.validate()) {

		            var testMoment = new moment(this.startDateTime);
		            
		            if (testMoment.isValid() == false){
		                kendoNotification.show({title:"Top 5",message:"Please specify valid From Date"},"error");
		                return;
		            }
		                
		            var testMoment = new moment(this.endDateTime);
		            
		            if (testMoment.isValid() == false){
		                kendoNotification.show({title:"Top 5",message:"Please specify valid To Date"},"error");
		                return;
		            };

		            var data = {};
		            $('.userPrompt').hide();
		            $('#pleaseWait').show();
		            $('#summaryView').hide();
		            // $('#terminalSummaryView').hide();

		            this.set("runReportEnabled", false);

		            data.startDateTime = this.startDateTime;
		            data.endDateTime = this.endDateTime;

		            data.vendor=appModel.getParsePointer(appModel.parse._vendor, "Vendor");
		            if (this.selectedTruck)
		                data.truck=appModel.getParsePointer({objectId:this.selectedTruck}, "Truck");

		            data.sortBy = this.get("currentSortField");

		            switch (data.sortBy){
		                case 'quantity':
		                        this.set("isSortedByQtyAsc", false);
		                        this.set("isSortedByQtyDesc", true);
		                    break;
		                case 'amount':
		                        this.set("isSortedByAmountAsc", false);
		                        this.set("isSortedByAmountDesc", true);
		                    break;
		                case 'percentOfTotal':
		                        this.set("isSortedByPercentDesc", true);
		                        this.set("isSortedByPercentAsc", false);
		                    break;
		            }

		            var ajaxURL= "/parse/functions/executeTop5Report";

		            $.ajax({
		                url: ajaxURL,
		                dataType: "json",
		                type:'POST',
		                headers: appModel.parse._headers,

		                data: kendo.stringify(data),
		                
		                success: function(httpResponse) {
		                    if (httpResponse.result.items.length == 0){
		                        $('.userPrompt').show();
		                        $('#summaryView').hide();
		                        kendoNotification.show({title:"Menu Item Performance",message: 'No Sales Data Found'},"info");
		                        return true;
		                    }

		                    self.set("resultObject", httpResponse.result);
		                    $('#summaryView').show();

		                    var chartData = {labels:[], series:[]};
		                    var options = {
		                      seriesBarDistance: 5,
		                      onlyInteger: true,
		                      axisY:{
		                        onlyInteger: true
		                      },
		                      offset:30,
		                      stretch:true,
		                      distributeSeries: true,
		                      width:"100%",
		                      height:"100%",
		                      chartPadding: {
		                        top: 0,
		                        right: 15,
		                        bottom: 0,
		                        left: 15
		                      },
		                    };

		                    var responsiveOptions = [
		                          ['screen and (min-width: 641px) and (max-width: 1024px)', {
		                            seriesBarDistance: 10,
		                            width:"100%",
		                            height:"100%",
		                            axisX: {
		                              labelInterpolationFnc: function (value) {
		                                return value;
		                              }
		                            }
		                          }],
		                          ['screen and (max-width: 640px)', {
		                            seriesBarDistance: 1,
		                            width:"100%",
		                            height:"100%",
		                            axisX: {
		                              labelInterpolationFnc: function (value) {
		                                return value[0];
		                              }
		                            }
		                          }]
		                        ];

		                    var valuesArray = [];
		                    _.each(self.get("resultObject").items, function(anItemRecord, index){
		                        //only display the top 5 in the chart
		                        if (index < 5){
		                            chartData.labels.push(anItemRecord.description);
		                            if (data.sortBy == 'percentOfTotal'){
		                                chartData.series.push(kendo.toString(anItemRecord[data.sortBy]*100,"n2")); //convert to %
		                            }
		                            else
		                                chartData.series.push(anItemRecord[data.sortBy]); //
		                        }
		                    });

		                    self.set("top5Chart", new Chartist.Bar('.ct-chart', chartData, options, responsiveOptions));
		                    
		                },

		                error: function(jqXHR,textStatus,errorThrown) {
		                    var errorObj = jqXHR.responseJSON;
		                    kendoNotification.show({title:"Item Menu Performance",message: errorObj.error.error},"error");
		                    $('.userPrompt').show();
		                    $('#summaryView').hide();
		                    // $('#terminalSummaryView').hide();
		                },

		                complete: function() {
		                    $('#pleaseWait').hide();
		                    self.set("runReportEnabled", true);
		                }


		            });
		        };
		    },
		    truckList: appModel.parse.truckList,
		    selectedTruck:null,
		    top5Chart:null,
		    durationSelection:[
		        {id:1, text:"Today"},
		        {id:2, text:"Yesterday"},
		        {id:3, text:"This Week"},
		        {id:4, text:"Last Week"},
		        {id:5, text:"This Month"},
		        {id:6, text:"Last Month"},
		        {id:7, text:"Custom"}
		    ],
		    startDateTime:null,
		    endDateTime:null,
		    runReportEnabled:true,
		    resultObject:{
		        items:[]
		    },
		    currentSortField : 'quantity',
		    isSortedByQtyDesc: true,
		    isSortedByQtyAsc: false,
		    isSortedByAmountDesc: false,
		    isSortedByAmountAsc: false,
		    isSortedByPercentDesc:false,
		    isSortedByPercentAsc:false

		});
	}
);