sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/library",
    "sap/ui/core/library",
    "sap/m/Button",
    "sap/m/Text"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Sorter, JSONModel,MessageBox,Dialog,mobileLibrary,coreLibrary,Button,Text) {
        "use strict";
        var ButtonType = mobileLibrary.ButtonType;
	    var DialogType = mobileLibrary.DialogType;
	    var ValueState = coreLibrary.ValueState;

        return Controller.extend("com.sap.bankapproverapp.controller.MainView", {
            onInit: function () {
                this.oDataModel = this.getOwnerComponent().getModel();
                this.oDataModel.setUseBatch(false);
                this.comments = "";
                // this.getView().byId("approveRecordsTable")._getSelectAllCheckbox().setVisible(false);
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteMainView").attachPatternMatched(this._onObjectMatched, this);

            },
            _onObjectMatched: function () {
                this.getOwnerComponent().getModel().refresh(true);
                this.getView().byId("approveRecordsTable").updateBindings();
            },
            onUpdateFinished: function () {
                var oTable = this.getView().byId("approveRecordsTable");
                oTable.removeSelections(true);
            },
            handleSorting: function (oEvent) {
                var that = this;
                this._sortingDialog = null;
                this._sortingDialog = sap.ui.xmlfragment(
                    "com.sap.bankapproverapp.view.Sorting",
                    this
                );
                this.getView().addDependent(this._sortingDialog);
                that._sortingDialog.open();
            },
            handleConfirm: function (oEvent) {
                var oTable = this.getView().byId("approveRecordsTable");
                var mParams = oEvent.getParameters();
                var oBinding = oTable.getBinding("items");
                var sPath = "";
                var bDescending;
                var aSorters = [];

                sPath = mParams.sortItem.getKey();
                bDescending = mParams.sortDescending;
                aSorters.push(new Sorter(sPath, bDescending));

                // apply the selected sort and group settings
                oBinding.sort(aSorters);

            },
            onApproverItemPressed: function (oEvent) {
                var that = this;
                var datJourn = oEvent.getSource().getBindingContext().getProperty("DATJOURN");
                var butxt = oEvent.getSource().getBindingContext().getProperty("Zbutxt");
                var bank = oEvent.getSource().getBindingContext().getProperty("Banka");
                var bnkn = oEvent.getSource().getBindingContext().getProperty("KZbnkn");
                var currency = oEvent.getSource().getBindingContext().getProperty("Waers");
                var totalAmount = oEvent.getSource().getBindingContext().getProperty("Rbetr");
                var bukrs = oEvent.getSource().getBindingContext().getProperty("Bukrs");
                var completeObject = oEvent.getSource().getBindingContext().getObject();
                var jsonModel = new JSONModel;
                jsonModel.setData(completeObject);
                this.getOwnerComponent().setModel(jsonModel, "HeaderData");

                this.oDataModel.read("/ZPY_BANK_ITEMSet", {
                    urlParameters: {
                        "$filter": "DATJOURN eq '" + datJourn + "'",
                        "$expand": "results"
                    },
                    success: function (oData) {
                        console.log(oData);
                        var tempArray = [];
                        if (oData.results.length > 0) {

                            for (var a = 0; a < oData.results.length; a++) {
                                tempArray = oData.results[a].results.results;
                                delete oData.results[a].results;
                                oData.results[a].results = tempArray;
                            }
                            var jsonModel = new JSONModel();
                            jsonModel.setData({ BankDataView: oData })
                            that.getOwnerComponent().setModel(jsonModel, "BankDetailModel");
                            if (oData.results.length > 0) {

                                that.getOwnerComponent().getRouter().navTo("DetailView", {
                                    BankName: bank,
                                    BankAccount: bnkn,
                                    Currency: currency,
                                    TotalAmount: totalAmount,
                                    Journal: datJourn,
                                    Bukrs: bukrs
                                })
                            }

                        }
                        else {
                            sap.m.MessageBox.information("Payment Details Not Available");
                        }




                    },
                    error: function (oError) {
                        console.log(oError);
                    }
                })
                // this.getOwnerComponent().getRouter().navTo("DetailView",{
                //     itemData : oEvent.getSource().getAggregation("cells")[7].getProperty("text")

                // });
            },
            onPressReject: function (oEvent) {
                var that = this;
                this._rejectionDialog = null;
                this._rejectionDialog = sap.ui.xmlfragment(
                    "com.sap.bankapproverapp.view.Comments",
                    this
                );

                this.getView().addDependent(this._rejectionDialog);
                this._rejectionDialog.open();
            },
            onEnterComments: function (oEvent) {
                if (oEvent.getParameter("value").length > 0) {
                    oEvent.getSource().getParent().getBeginButton().setEnabled(true);
                }
                else {
                    oEvent.getSource().getParent().getBeginButton().setEnabled(false);
                }

            },
            onPressOkButton: function (oEvent) {
                this.comments = oEvent.getSource().getParent().getContent()[0].getValue();
                if (this._rejectionDialog) {
                    this._rejectionDialog.destroy(true);
                    this._rejectionDialog = null;
                }
                this.rejectionCall(this.comments);
            },
            rejectionCall: function (comments) {
                this.triggerSaveReject("R", comments);
            },
            onPressCancelButton: function (oEvent) {
                if (this._rejectionDialog) {
                    this._rejectionDialog.destroy(true);
                    this._rejectionDialog = null;
                }
            },
            onPressSubmit: function (oEvent) {
                this.triggerSaveReject("A", "");
            },

            triggerSaveReject: function (status, comment) {
                var that = this;
                var oTable = this.getView().byId("approveRecordsTable").getSelectedItems();
                this.setResults = [];
                var headerData = "";
                this.requestPayload = {};

                if (oTable.length > 0) {
                    for (var a = 0; a < oTable.length; a++) {
                        headerData = oTable[a].getBindingContext().getObject();
                        this.requestPayload =
                        {
                            "BANKS": headerData.BANKS,
                            "Banka": headerData.Banka,
                            "Bukrs": headerData.Bukrs,
                            "Comment": comment,
                            "DATJOURN": headerData.DATJOURN,
                            "Datum": headerData.Datum,
                            "EXPDATEINAME": headerData.EXPDATEINAME,
                            "KZbnkn": headerData.KZbnkn,
                            "Rbetr": headerData.Rbetr,
                            "Status": status,
                            "Timelo": headerData.Timelo,
                            "Waers": headerData.Waers,
                            "Zbutxt": headerData.Zbutxt,
                        };
                        this.oDataModel.update("/ZPY_BANK_HEADERSet(DATJOURN='" + headerData.DATJOURN + "')", this.requestPayload, {
                            success: function (oData, response) {
                                console.log(oData);
                                that.setResults.push(response.statusCode);
                                that.showMessage(oTable, that.setResults, status, that);
                            },
                            error: function (oError, rejresponse) {
                                if (!that.oErrorMessageDialog) {
                                    that.oErrorMessageDialog = new Dialog({
                                        type: DialogType.Message,
                                        title: "Error",
                                        state: ValueState.Error,
                                        content: new Text({ text: JSON.parse(oError.responseText).error.message.value }),
                                        beginButton: new Button({
                                            type: ButtonType.Emphasized,
                                            text: "OK",
                                            press: function () {
                                                that.oErrorMessageDialog.close();
                                            }.bind(this)
                                        })
                                    });
                                }
                    
                                that.oErrorMessageDialog.open();
                                console.log(oError);

                            }
                        })
                    }
                }
                else {
                    if (!this.oErrorMessageDialog) {
                        this.oErrorMessageDialog = new Dialog({
                            type: DialogType.Message,
                            title: "Error",
                            state: ValueState.Error,
                            content: new Text({ text: "Select record either to Approve or Reject" }),
                            beginButton: new Button({
                                type: ButtonType.Emphasized,
                                text: "OK",
                                press: function () {
                                    this.oErrorMessageDialog.close();
                                }.bind(this)
                            })
                        });
                    }
        
                    this.oErrorMessageDialog.open();
                }




            },
            showMessage: function (oTable, resultsTable, action, that) {
                if (oTable.length === resultsTable.length) {

                    if (action === "R") {
                        if (!this.oSuccessMessageDialog) {
                            this.oSuccessMessageDialog = new Dialog({
                                type: DialogType.Message,
					            title: "Success",
					            state: ValueState.Success,
                                content: new Text({ text: "Records Got Rejected Successfully." }),
                                beginButton: new Button({
                                    text: "OK",
                                    press: function () {
                                        this.oSuccessMessageDialog.close();
                                    }.bind(this)
                                })
                            });
                        }
            
                        this.oSuccessMessageDialog.open();
                        that.oDataModel.refresh(true);
                        //that.getView().byId("approveRecordsTable").updateBindings();
                    }
                    else if (action === "A") {
                        if (!this.oSuccessMessageDialog) {
                            this.oSuccessMessageDialog = new Dialog({
                                type: DialogType.Message,
					            title: "Success",
					            state: ValueState.Success,
                                content: new Text({ text: "Records Got Approved Successfully." }),
                                beginButton: new Button({
                                    text: "OK",
                                    press: function () {
                                        this.oSuccessMessageDialog.close();
                                    }.bind(this)
                                })
                            });
                        }
            
                        this.oSuccessMessageDialog.open();
                        that.oDataModel.refresh(true);
                        //that.getView().byId("approveRecordsTable").updateBindings();
                    }

                }
            }
        });
    });
