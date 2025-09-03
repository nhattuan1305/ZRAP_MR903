sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'zsbu4repmr903',
            componentId: 'poListList',
            contextPath: '/poList'
        },
        CustomPageDefinitions
    );
});