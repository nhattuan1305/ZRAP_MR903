sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'zsbu4repmr903',
            componentId: 'poListObjectPage',
            contextPath: '/poList'
        },
        CustomPageDefinitions
    );
});