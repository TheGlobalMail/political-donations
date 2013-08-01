(function($, _, data) {
  'use strict';

  var dates = {
    // <dateString>: { ... }
  };

  var orderedDates = [
    // { ... }
  ];

  var earliestDate;

  var fakeSeriesData = function(length, min, max) {
    var getRandomInt = function() {
      return Math.floor(Math.random() * (max - min + 1) + min);
    };
    return _.map(_.range(length), getRandomInt);
  };

  var processData = function() {

    // TODO
    // Build list of dates
    // Count up donations for each date
    // Count up polling data

    _.each(tgm.data.twoPartyComparison, function(obj) {
      if (!dates[obj.date]) {
        var splitString = obj.date.split('-');
        var date = new Date(splitString[0], splitString[1], splitString[2]);

        dates[obj.date] = {
          date: date,
          dateString: obj.date,
          labourDonations: 0,
          liberalDonations: 0,
          laborPollPercentage: 0,
          laborPollPercentageCount: 0,
          liberalPollPercentage: 0,
          liberalPollPercentageCount: 0
        };
      }

      if (obj.party.toUpperCase() == 'ALP') {
        dates[obj.date].labourDonations += obj.amount;
      }
      if (obj.party.toUpperCase() == 'LIB') {
        dates[obj.date].liberalDonations += obj.amount;
      }
    });

    orderedDates = _.sortBy(dates, function(obj) {
      return +obj.date;
    });

    earliestDate = orderedDates[0].date;
  };

  var getPollCategories = function() {
    return _(tgm.data.polls)
      .map(function(obj) {
        var splitString = obj[1].split('-');
        obj.push(new Date(splitString[0], splitString[1], splitString[2]));
        return obj;
      })
      .filter(function(obj) {
        var party = obj[2].toUpperCase();
        return party === 'ALP' && _.last(obj) >= earliestDate;
      }).sortBy(function(obj) {
        return +_.last(obj);
      }).map(function(obj) {
        return obj[0];
      }).value();
  };

  var getLaborPollData = function() {
    return _(tgm.data.polls)
      .map(function(obj) {
        var splitString = obj[1].split('-');
        obj.push(new Date(splitString[0], splitString[1], splitString[2]));
        return obj;
      })
      .filter(function(obj) {
        return obj[2].toUpperCase() === 'ALP' && _.last(obj) >= earliestDate;
      }).sortBy(function(obj) {
        return +_.last(obj);
      }).map(function(obj) {
        return obj[3];
      }).value();
  };

  var getLiberalPollData = function() {
    return _(tgm.data.polls)
      .map(function(obj) {
        var splitString = obj[1].split('-');
        obj.push(new Date(splitString[0], splitString[1], splitString[2]));
        return obj;
      })
      .filter(function(obj) {
        return obj[2].toUpperCase() === 'COALITION' && _.last(obj) >= earliestDate;
      }).sortBy(function(obj) {
        return +_.last(obj);
      }).map(function(obj) {
        return obj[3];
      }).value();
  };

  var insertTwoPartyComparisonChart = function(data) {
    $('#two-party-comparison-container').highcharts({
      chart: {
        type: 'column'
      },
      credits: {
        enabled: false
      },
      title: {
        text: 'TBC'
      },
      xAxis: [
        {
          categories: _.pluck(orderedDates, 'dateString'),
          labels: {
            rotation: -90,
            step: 3,
            y: 40
          }
        }, {
          opposite: true,
//          categories: _.pluck(orderedDates, 'dateString'),
          categories: getPollCategories(),
          labels: {
            enabled: false
          }
        }
      ],
      yAxis: [
        { // Primary yAxis
          title: {
            text: 'Donations'
          }
        }, { // Secondary yAxis
          gridLineWidth: 0,
          title: {
            text: '2 Party Preferred Poll'
          },
          opposite: true
        }
      ],
      series: [{
        name: 'Total donations to the ALP',
        color: '#4572A7',
        type: 'column',
        data: _.pluck(orderedDates, 'labourDonations')
      }, {
        name: 'Total donations to the Coalition',
        color: '#AA4643',
        type: 'column',
        data: _.pluck(orderedDates, 'liberalDonations')
      }, {
        name: '2 Party Preferred - Labor',
        type: 'spline',
        color: '#7294bc',
        yAxis: 1,
        xAxis: 1,
        data: getLaborPollData(),
        marker: {
          enabled: false
        }
      }, {
        name: '2 Party Preferred - Liberal',
        type: 'spline',
        color: '#be7371',
        yAxis: 1,
        xAxis: 1,
        data: getLiberalPollData(),
        marker: {
          enabled: false
        }
      }]
    });
  };

  var init = function() {
    processData();
    insertTwoPartyComparisonChart(data.twoPartyComparison);
  };

  $(init);

}(jQuery, _, tgm.data));