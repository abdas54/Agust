sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/Sorter',
    'sap/m/MessageBox'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,Sorter,MessageBox) {
        "use strict";

        return Controller.extend("com.sap.bankapproverapp.controller.DetailView", {
            onInit: function () {
                this.comments="";
            this.oDataModel = this.getOwnerComponent().getModel();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("DetailView").attachPatternMatched(this._onObjectMatched, this);
            },
            _onObjectMatched: function(oEvent){
                this.BankName=oEvent.getParameter("arguments").BankName;
                this.BankAccount=oEvent.getParameter("arguments").BankAccount;
                this.Currency=oEvent.getParameter("arguments").Currency;
                this.TotalAmount=oEvent.getParameter("arguments").TotalAmount;
                this.Journal=oEvent.getParameter("arguments").Journal;
                this.bukrs = oEvent.getParameter("arguments").Bukrs;

                this.getView().byId("BankTitle").setText(this.BankName + " ( " + this.BankAccount + " ) " );
                this.getView().byId("totalAmount").setText("Total Amount " + this.Currency + " " + this.TotalAmount);
            },
            onNavButtonPress: function(){
                window.history.go(-1);
            },
            onPressSubmit: function () {
                this.triggerSaveReject("A","");
            },
            onPressReject: function(oEvent){
                var that = this;
                this._rejectionDialog = null;
			    this._rejectionDialog = sap.ui.xmlfragment(
				"com.sap.bankapproverapp.view.Comments",
				this
			);
            
            this.getView().addDependent(this._rejectionDialog);
            this._rejectionDialog.open();
            },
            onPressOkButton: function(oEvent){
                this.comments = oEvent.getSource().getParent().getContent()[0].getValue();
                // this.rejectionCall();
                if (this._rejectionDialog) {
                    this._rejectionDialog.destroy(true);
                    this._rejectionDialog = null;
                }
                this.rejectionCall(this.comments);
            },
            rejectionCall: function(comments){
                this.triggerSaveReject("R",comments);
            },
            onPressCancelButton: function(oEvent){
                if (this._rejectionDialog) {
                    this._rejectionDialog.destroy(true);
                    this._rejectionDialog = null;
                }
            },
            onEnterComments: function(oEvent){
                if(oEvent.getParameter("value").length > 0){
                    oEvent.getSource().getParent().getBeginButton().setEnabled(true);
                }
                else{
                    oEvent.getSource().getParent().getBeginButton().setEnabled(false);
                }

            },
            triggerSaveReject: function(status,comment){
                var that = this;
                var headerData = this.getOwnerComponent().getModel("HeaderData").getData();
                // headerData.Comment = comment;
                // headerData.Status = status;
                this.requestPayload = 
                    {
                        "BANKS":headerData.BANKS,
                        "Banka":headerData.Banka,
                        "Bukrs":headerData.Bukrs,
                        "Comment":comment,
                        "DATJOURN":headerData.DATJOURN,
                        "Datum":headerData.Datum,
                        "EXPDATEINAME":headerData.EXPDATEINAME,
                        "KZbnkn":headerData.KZbnkn,
                        "Rbetr":headerData.Rbetr,
                        "Status":status,
                        "Timelo":headerData.Timelo,
                        "Waers":headerData.Waers,
                        "Zbutxt":headerData.Zbutxt,
                        };
                

                // this.requestPayload.Status = status;
                // if(status === "R"){
                //     this.requestPayload.Comment =  comment;
                // }
               
                        this.oDataModel.update("/ZPY_BANK_HEADERSet(DATJOURN='"+this.Journal + "')",this.requestPayload, {
                            success: function (oData) { 
                                if(status === "A"){
                                    MessageBox.success("Record got Approved Successfully",{
                                        action: ["OK"],
                                        onClose : function(){
                                            that.getOwnerComponent().getRouter().navTo("RouteMainView");
                                        }
                                    });
                                }
                                if(status === "R"){
                                    MessageBox.success("Record got Rejected Successfully",{
                                        action: ["OK"],
                                        onClose : function(){
                                            that.getOwnerComponent().getRouter().navTo("RouteMainView");
                                        }
                                    });
                                }
                                
                                console.log(oData); 
                            },
                            error: function (oError) { 
                                console.log(oError); 
                                if(status === "A"){
                                    MessageBox.error("Error while approving the record");
                                }
                                if(status === "R"){
                                    MessageBox.error("Error while rejecting the record");
                                }
                                
                            }
                        })
                
              
            }
            
           
        });
    });
