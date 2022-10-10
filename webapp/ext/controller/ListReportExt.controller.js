sap.ui.define(
  [
    "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/comp/smartfilterbar/SmartFilterBar",
    "sap/m/MultiComboBox",
  ],
  function (
    Export,
    ExportTypeCSV,
    JSONModel,
    Filter,
    SmartFilterBar,
    MultiComboBox
  ) {
    "use strict";

    let _aFilters = [];

    return {
      onInit: function () {
        try {
          const oSmartTable = this.getView().byId(
            this.getView().getId() + "--listReport"
          );
          oSmartTable.setUseExportToExcel(true);

          oSmartTable.attachBeforeExport((oEvent) => {
            debugger;
            var oConfig = oEvent.getParameter("exportSettings");
            // Obtain the actual count
            oConfig.dataSource.count = 100; // Enter the count here - 100 is just a sample value
          });

          this.getView()
            .byId(this.getView().getId() + "--exportButton")
            .setVisible(True);
        } catch (error) {
          // un caught exception
        }
      },

      ExportToCSV: async function () {
        // start busy indicator
        this.getView().setBusy(true);

        const dataSource = await this._readData();
        const fileName = "PO_Consolidated_Report";
        const models = new JSONModel(dataSource);
        const oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
          pattern: "dd.MM.yyyy",
        });

        var oExport = new Export({
          exportType: new ExportTypeCSV({
            separatorChar: "|",
            charset: "utf-8",
          }),
          models,
          rows: { path: "/" },
          columns: [
            {
              name: "Business Division",
              template: {
                content: "{BusinessDivision}",
              },
            },
            {
              name: "Material Number",

              template: {
                content: "{Material}",
              },
            },
            {
              name: "Material Description",
              template: {
                content: "{ProductDescription}",
              },
            },
            {
              name: "Vendor Description",
              template: {
                content: "{VendorName}",
              },
            },
            {
              name: "Vendor Name",
              template: {
                content: "{VendorNumber}",
              },
            },
            {
              name: "Plant",
              template: {
                content: "{Plant}",
              },
            },
            {
              name: "Country of Origin",
              template: {
                content: "{VendorCountry}",
              },
            },
            {
              name: "Delivery Date",
              template: {
                content: {
                  parts: ["PoDeliveryDate"],
                  formatter: function (sDate) {
                    let sValue = "";
                    if (sDate) {
                      sValue = oDateFormat.format(sDate);
                    }
                    return sValue;
                  },
                },
              },
            },
            {
              name: "Calculated Date",
              template: {
                content: "{PoCalcDeliveryDate}",
              },
            },
            {
              name: "PO Number",
              template: {
                content: "{PurchaseOrder}",
              },
            },
            {
              name: "PO Line Item",
              template: {
                content: "{PurchaseOrderItem}",
              },
            },
            {
              name: "Quantity",
              template: {
                content: "{OrderQuantity}",
              },
            },
            {
              name: "Unit of Measure",
              template: {
                content: "{PurchaseOrderQuantityUnit}",
              },
            },
            {
              name: "Weight in KG",
              template: {
                content: "{PoWeight}",
              },
            },
            {
              name: "Impression Number",
              template: {
                content: "{ImpressionNumber}",
              },
            },
          ],
        });

        oExport
          .saveFile(fileName)
          .catch((oError) => {
            MessageBox.error("Error when downloading data. ..." + oError);

            // stop busy indicator
            this.getView().setBusy(false);
          })
          .then(() => {
            oExport.destroy();

            // stop busy indicator
            this.getView().setBusy(false);
          });
      },

      _readData: function () {
        return new Promise((reslove, reject) => {
          this.getView()
            .getModel()
            .read("/ZPTP_C_PO_CONS_REPT", {
              urlParameters: {
                $top: 999999999,
                $skip: 0,
              },
              filters: _aFilters,
              success: (oDataResponse) => {
                reslove(oDataResponse.results || []);
              },
              error: (_) => {
                reject();
              },
            });
        });
      },

      getCustomAppStateDataExtension: function (oCustomData) {
        //the content of the custom field will be stored in the app state, so that it can be restored later, for example after a back navigation.
        //The developer has to ensure that the content of the field is stored in the object that is passed to this method.
        if (oCustomData) {
          const oCustomField1 = this.oView.byId("business-division-id");
          if (oCustomField1) {
            oCustomData.BusinessDivision = oCustomField1.getSelectedKeys();
          }
        }
      },

      restoreCustomAppStateDataExtension: function (oCustomData) {
        //in order to restore the content of the custom field in the filter bar, for example after a back navigation,
        //an object with the content is handed over to this method. Now the developer has to ensure that the content of the custom filter is set to the control
        if (oCustomData) {
          if (oCustomData.BusinessDivision) {
            const oComboBox = this.oView.byId("business-division-id");
            oComboBox.setSelectedKeys(oCustomData.BusinessDivision);
          }
        }
      },

      onBeforeRebindTableExtension: function (oEvent) {
        const oBindingParams = oEvent.getParameter("bindingParams");
        oBindingParams.parameters = oBindingParams.parameters || {};

        const oSmartTable = oEvent.getSource();
        const oSmartFilterBar = this.byId(oSmartTable.getSmartFilterId());
        if (oSmartFilterBar instanceof SmartFilterBar) {
          const sCustomFilter = "BusinessDivision";
          const oCustomControl = oSmartFilterBar.getControlByKey(sCustomFilter);
          if (oCustomControl instanceof MultiComboBox) {
            const sKeys = oCustomControl.getSelectedKeys();
            for (const sKey of sKeys) {
              oBindingParams.filters.push(
                new Filter(sCustomFilter, "EQ", sKey)
              );
            }
          }
        }

        // save filter for export csv
        _aFilters = oBindingParams.filters;
      },
    };
  }
);
