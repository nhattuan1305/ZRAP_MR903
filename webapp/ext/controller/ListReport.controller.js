sap.ui.define([
  "sap/ui/core/mvc/ControllerExtension",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "sap/ui/model/json/JSONModel",
  "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
  "sap/m/Column",
  "sap/m/ColumnListItem",
  "sap/m/Label",
  "sap/m/Text",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (
  ControllerExtension,
  Fragment,
  MessageBox,
  JSONModel,
  ValueHelpDialog,
  Column,
  ColumnListItem,
  Label,
  Text,
  Filter,
  FilterOperator
) {
  "use strict";

  return ControllerExtension.extend("zsbu4repmr903.ext.controller.ListReport", {
    override: {
      onInit: function () {
        const oView = this.base.getView();

        oView.setModel(new JSONModel({
          PrinterName: "",
          FormName: "",
          SignerName: "",
          PONotes: "",
          PONo: "",
          PrintPosition1: "",
          PrintPosition2: "",
          PrintPosition3: "",
          PopUpInfoText: ""
        }), "svfModel");

        oView.setModel(new JSONModel({
          value: [],
          currentField: ""
        }), "valueHelpModel");
      }
    },

    CustomSVF: function () {
      const aCtx = this.base.getExtensionAPI().getSelectedContexts();

      if (!aCtx || aCtx.length === 0) {
        MessageBox.warning("Please select at least one item to process.");
        return;
      }

      this._fetchDefaultValues(aCtx).finally(() => {
        this._openSVFDialog(aCtx[0]);
      });
    },

    _openSVFDialog: function (oSelectedContext) {
      const oView = this.base.getView();

      if (!this._oSVFDialog) {
        Fragment.load({
          id: oView.getId(),
          name: "zsbu4repmr903.ext.fragments.SVFDialog",
          controller: this
        }).then((oDialog) => {
          this._oSVFDialog = oDialog;
          this._setupDialogModels(oView, oSelectedContext);
          oView.addDependent(this._oSVFDialog);
          this._oSVFDialog.open();
        });
      } else {
        this._setupDialogModels(oView, oSelectedContext);
        this._oSVFDialog.open();
      }
    },

    _setupDialogModels: function (oView, oSelectedContext) {
      this._oSVFDialog.setModel(oView.getModel());
      this._oSVFDialog.setModel(oView.getModel("svfModel"), "svfModel");
      this._oSVFDialog.setModel(oView.getModel("svfModel"), "svf");
      this._oSVFDialog.setBindingContext(oSelectedContext);
    },

    onPrintPositionVH: async function (oEvent) {
      const oView = this.base.getView();
      const oInput = oEvent.getSource();
      const sFieldType = this._getFieldType(oInput.getId());

      if (this._ppvhFieldType && this._ppvhFieldType !== sFieldType) {
        await this._resetValueHelpFilters();
        if (this._oPPVHD) {
          const oTable = await this._oPPVHD.getTableAsync();
          if (oTable?.removeSelections) oTable.removeSelections(true);
          if (oTable?.clearSelection) oTable.clearSelection();
        }
      }

      this._ppvhTargetInput = oInput;
      this._ppvhFieldType = sFieldType;

      const oValueHelpModel = oView.getModel("valueHelpModel");
      oValueHelpModel.setProperty("/currentField", sFieldType);

      if (!this._oPPVHD) {
        await this._createValueHelpDialog(oView);
      } else {
        this._oPPVHD.setModel(oValueHelpModel);
      }

      await this._fetchValueHelpData();

      // ❌ KHÔNG attachBeforeOpen ở đây nữa
      this._oPPVHD.open();
    },


    _getFieldType: function (sFieldId) {
      if (sFieldId.includes("PrintPosition1")) return "PrintPosition1";
      if (sFieldId.includes("PrintPosition2")) return "PrintPosition2";
      if (sFieldId.includes("PrintPosition3")) return "PrintPosition3";
      return "";
    },

    _createValueHelpDialog: async function (oView) {
      this._oPPVHD = await Fragment.load({
        id: oView.getId(),
        name: "zsbu4repmr903.ext.fragments.PrintPositionVH",
        controller: this
      });

      this._oPPVHD.setModel(oView.getModel("valueHelpModel"));
      oView.addDependent(this._oPPVHD);

      this._oPPVHD.getTableAsync().then((oTable) => {
        this._configureTable(oTable);

        if (oTable.setSelectionMode) oTable.setSelectionMode("Single");
        if (oTable.setMode) oTable.setMode("SingleSelectLeft");

        this._oPPVHD.update();
      });

      // ✅ Attach beforeOpen duy nhất 1 lần
      this._oPPVHD.attachBeforeOpen(async () => {
        if (this._oPPVHD.setTokens) {
          this._oPPVHD.setTokens([]);
        }
        if (this._oPPVHD.clearSelection) {
          this._oPPVHD.clearSelection();
        }

        const oTable = await this._oPPVHD.getTableAsync();
        if (oTable?.removeSelections) oTable.removeSelections(true);
        if (oTable?.clearSelection) oTable.clearSelection();

        const oView = this.base.getView();
        const oSVFModel = oView.getModel("svfModel");
        const sCurrentValue = oSVFModel.getProperty("/" + this._ppvhFieldType);

        if (sCurrentValue) {
          const oBinding = oTable.getBinding(oTable.bindItems ? "items" : "rows");
          if (oBinding) {
            const aContexts = oBinding.getContexts();
            const iIndex = aContexts.findIndex(
              ctx => ctx.getObject()?.POItemName === sCurrentValue
            );

            if (iIndex >= 0) {
              if (oTable.setSelectedIndex) {
                oTable.setSelectedIndex(iIndex);
              } else if (oTable.setSelectedItem) {
                const oItem = oTable.getItems()[iIndex];
                if (oItem) oTable.setSelectedItem(oItem, true);
              }
            }
          }

          if (this._oPPVHD.setTokens) {
            const oBinding = oTable.getBinding(oTable.bindItems ? "items" : "rows");
            const aContexts = oBinding.getContexts();
            const oSelectedObj = aContexts.find(ctx => ctx.getObject()?.POItemName === sCurrentValue)?.getObject();

            if (oSelectedObj) {
              const sText = `${oSelectedObj.Text} (${oSelectedObj.POItemName})`;

              this._oPPVHD.setTokens([
                new sap.m.Token({
                  key: oSelectedObj.POItemName,
                  text: sText
                })
              ]);
            }
          }

        }
      });
    },

    _configureTable: function (oTable) {
      if (oTable.bindItems) {
        oTable.addColumn(new Column({ header: new Label({ text: "POItemName" }) }));
        oTable.addColumn(new Column({ header: new Label({ text: "Text" }) }));

        oTable.bindItems({
          path: "/value",
          template: new ColumnListItem({
            type: "Active",
            cells: [
              new Text({ text: "{POItemName}" }),
              new Text({ text: "{Text}" })
            ]
          })
        });

        if (oTable.setMode) oTable.setMode("SingleSelectLeft");

      } else if (oTable.addColumn) {
        oTable.addColumn(new sap.ui.table.Column({
          label: new Label({ text: "POItemName" }),
          template: new Text({ text: "{POItemName}" })
        }));
        oTable.addColumn(new sap.ui.table.Column({
          label: new Label({ text: "Text" }),
          template: new Text({ text: "{Text}" })
        }));
        oTable.bindRows({ path: "/value" });

        if (oTable.setSelectionMode) oTable.setSelectionMode("Single");
      }
    },

    _resetValueHelpFilters: async function () {
      if (!this._oPPVHD) return;

      const oView = this.base.getView();

      // Reset model field
      const oValueHelpModel = oView.getModel("valueHelpModel");
      if (oValueHelpModel) {
        oValueHelpModel.setProperty("/currentField", "");
        console.log("📌 Reset valueHelpModel.currentField");
      }

      // Clear filters in FilterBar
      const oFilterBar = this._oPPVHD.getFilterBar && this._oPPVHD.getFilterBar();
      if (oFilterBar) {
        oFilterBar.getFilterGroupItems().forEach(fgi => {
          const oControl = fgi.getControl();
          if (oControl?.setValue) {
            oControl.setValue("");
          }
          if (oControl?.setSelectedKey) {
            oControl.setSelectedKey(""); // Trường hợp Dropdown
          }
          if (oControl?.setTokens) {
            oControl.setTokens([]); // Trường hợp MultiInput
          }
        });
        console.log("📌 Cleared FilterBar controls");
      }

      // Clear table filters
      if (typeof this._clearTableFilters === "function") {
        await this._clearTableFilters();
        console.log("📌 Cleared table filters");
      }

      // Fetch data again
      if (typeof this._fetchValueHelpData === "function") {
        await this._fetchValueHelpData();
        console.log("📌 Reloaded ValueHelp data");
      }
    },

    _clearTableFilters: async function () {
      const oTable = await this._oPPVHD.getTableAsync();
      if (oTable?.getBinding) {
        const oBinding = oTable.getBinding(oTable.bindItems ? "items" : "rows");
        if (oBinding?.filter) {
          oBinding.filter([]);
        }
      }
    },

    _fetchValueHelpData: async function () {
      try {
        const oView = this.base.getView();
        const oODataModel = oView.getModel();
        const sServiceUrl = oODataModel.getServiceUrl();
        const oHeaders = oODataModel.getHttpHeaders();

        const response = await fetch(`${sServiceUrl}valueHelp`, {
          method: "GET",
          headers: {
            ...oHeaders,
            "Accept": "application/json;odata.metadata=minimal"
          }
        });

        if (!response.ok) {
          const errText = await response.text();
          MessageBox.error("Error fetching value help:\n" + errText);
          return;
        }

        const result = await response.json();
        const aData = result.value || [];

        oView.getModel("valueHelpModel").setData({ value: aData });
      } catch (error) {
        MessageBox.error("Error fetching value help data: " + error.message);
      }
    },

    onPPVHDOk: async function (oEvent) {
      try {
        const oDialog = oEvent.getSource();
        const oTable = await oDialog.getTableAsync();
        let oObj;

        // lấy object từ selection table
        if (oTable.getSelectedIndex) {
          const iIndex = oTable.getSelectedIndex();
          if (iIndex >= 0 && oTable.getContextByIndex) {
            oObj = oTable.getContextByIndex(iIndex)?.getObject();
          }
        } else if (oTable.getSelectedItem) {
          const oItem = oTable.getSelectedItem();
          oObj = oItem?.getBindingContext()?.getObject();
        } else if (oTable.getSelectedItems) {
          const aSel = oTable.getSelectedItems();
          oObj = aSel && aSel[0]?.getBindingContext()?.getObject();
        }

        let sKey = oObj?.POItemName;

        // ✅ nếu user không chọn gì → lấy giá trị hiện tại trong model
        if (!sKey && this._ppvhFieldType) {
          const oView = this.base.getView();
          const oSVFModel = oView.getModel("svfModel");
          sKey = oSVFModel.getProperty("/" + this._ppvhFieldType) || "";
        }

        if (sKey && this._ppvhTargetInput && this._ppvhFieldType) {
          this._setValueToModel(sKey);
        } else {
          MessageBox.warning("Please select one item or keep the current default.");
          return;
        }

      } catch (err) {
        MessageBox.error("Error reading selection: " + err.message);
      }

      oEvent.getSource().close();
    },


    _setValueToModel: function (sKey) {
      let oModel = this._ppvhTargetInput.getModel("svf");
      const sPath = "/" + this._ppvhFieldType;

      if (oModel) {
        oModel.setProperty(sPath, sKey);
      } else {
        oModel = this._ppvhTargetInput.getModel("svfModel");
        if (oModel) {
          oModel.setProperty(sPath, sKey);
        } else {
          this._ppvhTargetInput.setValue(sKey);
        }
      }
    },

    onPPVHDCancel: function (oEvent) {
      oEvent.getSource().close();
    },

    onPPVHDAfterClose: function () {
      // giữ fragment instance cho reuse
    },

    onPPVHDSearch: function (oEvent) {
      const oFB = oEvent.getSource();
      let sCode = "", sText = "";

      if (typeof oFB.getControlByKey === "function") {
        sCode = oFB.getControlByKey("POItemName")?.getValue();
        sText = oFB.getControlByKey("Text")?.getValue();
      } else {
        oFB.getFilterGroupItems().forEach(fgi => {
          if (fgi.getName() === "POItemName") sCode = fgi.getControl()?.getValue();
          if (fgi.getName() === "Text") sText = fgi.getControl()?.getValue();
        });
      }

      this._oPPVHD.getTableAsync().then((oTable) => {
        const aFilters = [];
        if (sCode) aFilters.push(new Filter("POItemName", FilterOperator.Contains, sCode));
        if (sText) aFilters.push(new Filter("Text", FilterOperator.Contains, sText));

        if (oTable.getBinding) {
          const oBinding = oTable.getBinding(oTable.bindItems ? "items" : "rows");
          if (oBinding?.filter) {
            oBinding.filter(aFilters);
          }
        }
      });
    },

    onSVFConfirm: async function () {
      const oExtensionAPI = this.base.getExtensionAPI();
      const oEditFlow = oExtensionAPI.editFlow;
      const aSelectedContexts = oExtensionAPI.getSelectedContexts();

      const sActionName = "com.sap.gateway.srvd.zsd_rep_mr903.v0001.svf_output";
      const sLabel = "SVF Output";

      try {
        const oSVFModel = this._oSVFDialog.getModel("svfModel") || this.base.getView().getModel("svfModel");
        const oData = oSVFModel ? oSVFModel.getData() : {};

        const paramsFromDialog = {
          PrinterName: oData.PrinterName || "",
          FormName: oData.FormName || "",
          SignersName: oData.SignerName || "",
          PONotes: oData.PONotes || "",
          PONo: oData.PONo || "",
          PrintPosition1: oData.PrintPosition1 || "",
          PrintPosition2: oData.PrintPosition2 || "",
          PrintPosition3: oData.PrintPosition3 || "",
          static_text: oData.PopUpInfoText || ""
        };

        const parameterValues = Object.keys(paramsFromDialog).map(key => ({
          name: key, value: paramsFromDialog[key]
        }));

        await oEditFlow.invokeAction(sActionName, {
          contexts: aSelectedContexts,
          label: sLabel,
          invocationGrouping: "ChangeSet",
          skipParameterDialog: true,
          parameterValues: parameterValues
        });

        sap.m.MessageToast.show("SVF Output executed successfully");

      } catch (error) {
        sap.m.MessageToast.show("Error executing SVF Output: " + error.message);
      }
      this._oSVFDialog.close();
    },

    onSVFCancel: function () {
      this._oSVFDialog.close();
    },

    _fetchDefaultValues: async function (aSelectedContexts) {
      try {
        const aSelectedData = aSelectedContexts.map(context => context.getObject());

        const requestBody = aSelectedData.map(item => ({
          "purchaseorder": item.PurchaseOrder || item.purchaseorder || "",
          "purchaseorderitem": item.PurchaseOrderItem || item.purchaseorderitem || ""
        }));

        const response = await fetch("/sap/bc/http/sap/zhttp_rap_rep_mr903", {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const resultData = result[0];

        const oSVFModel = this.base.getView().getModel("svfModel");

        if (resultData && oSVFModel) {
          oSVFModel.setData({
            PrinterName: resultData.PRINTERNAME || "",
            FormName: resultData.FORMNAME || "",
            SignerName: resultData.SIGNERSNAME || "",
            PONotes: resultData.PONOTES || "",
            PONo: resultData.PONO || "",
            PrintPosition1: resultData.PRINTPOSITION1 || "",
            PrintPosition2: resultData.PRINTPOSITION2 || "",
            PrintPosition3: resultData.PRINTPOSITION3 || "",
            PopUpInfoText: resultData.STATICTEXT || ""
          });
          sap.m.MessageToast.show("Default values loaded successfully");
        }
      } catch (error) {
        sap.m.MessageToast.show("Error loading default values: " + error.message);
      }
    }
  });
});
