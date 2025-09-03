sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'zsbu4repmr903/test/integration/FirstJourney',
		'zsbu4repmr903/test/integration/pages/poListList',
		'zsbu4repmr903/test/integration/pages/poListObjectPage'
    ],
    function(JourneyRunner, opaJourney, poListList, poListObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('zsbu4repmr903') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onThepoListList: poListList,
					onThepoListObjectPage: poListObjectPage
                }
            },
            opaJourney.run
        );
    }
);