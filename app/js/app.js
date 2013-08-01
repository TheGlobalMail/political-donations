(function($, _, data) {
  'use strict';

  var dates = {
    // <dateString>: { ... }
  };

  var orderedDates = [
    // { ... }
  ];

  var earliestDate;

  var polls = {};

  var orderedPolls = [];

  var processData = function() {

    _.each(tgm.data.twoPartyComparison, function(obj) {
      if (!dates[obj.date]) {
        var splitString = obj.date.split('-');
        var date = new Date(splitString[0], splitString[1], splitString[2]);

        dates[obj.date] = {
          date: date,
          dateString: obj.date,
          labourDonations: 0,
          liberalDonations: 0,
          laborPollPercentage: null,
          liberalPollPercentage: null
        };
      }

      if (obj.party.toUpperCase() == 'ALP') {
        dates[obj.date].labourDonations += obj.amount;
      }
      if (
        obj.party.toUpperCase() == 'LIB' ||
        obj.party.toUpperCase() == 'NAT'
      ) {
        dates[obj.date].liberalDonations += obj.amount;
      }
    });

    orderedDates = _.sortBy(dates, function(obj) {
      return +obj.date;
    });

    earliestDate = orderedDates[0].date;

    _.each(tgm.data.polls, function(obj) {
      var dateString = obj[1];
      var pollObject = polls[dateString];
      if (!pollObject) {
        var splitString = dateString.split('-');
        var date = new Date(splitString[0], splitString[1], splitString[2]);
        pollObject = {
          date: date,
          labor: 0,
          liberal: 0
        };
      }

      if (pollObject.date >= earliestDate) {
        var party = obj[2].toUpperCase();
        var amount = obj[3];
        if (party === 'ALP') {
          pollObject.labor = amount;
        } else if (party === 'COALITION') {
          pollObject.liberal = amount;
        }

        polls[dateString] = pollObject;
      }
    });

    orderedPolls = _.sortBy(polls, function(obj) {
      return +obj.date;
    });

    // Group the poll data by donation data point
    var previousDate = earliestDate;
    for (var i = 0; i < orderedDates.length; i++) {
      var dateObj = orderedDates[i];
      dateObj.matchingPolls = [];
      for (var j = 0; j < orderedPolls.length; j++) {
        var pollObj = orderedPolls[j];
        if (previousDate.date <= pollObj.date && dateObj.date > pollObj.date) {
          previousDate.matchingPolls.push(pollObj);
        }
      }
      previousDate = dateObj;
    }

    console.log(orderedDates[10].matchingPolls);

    // Calculate the mean poll data for each donation date
    orderedDates = _.map(orderedDates, function(dateObj) {
      if (dateObj.matchingPolls.length) {
        var laborSum = 0;
        var laborCount = 0;
        var liberalSum = 0;
        var liberalCount = 0;

        _.each(dateObj.matchingPolls, function(pollObj) {
          laborSum += pollObj.labor;
          laborCount++;

          liberalSum += pollObj.liberal;
          liberalCount++;

          dateObj.laborPollPercentage = Math.floor(laborSum / laborCount);
          dateObj.liberalPollPercentage = Math.floor(liberalSum / liberalCount);
        });
      }
      return dateObj;
    });
  };

  var insertTwoPartyComparisonChart = function() {
    $('#two-party-comparison-container').highcharts({
      chart: {
        type: 'column'
      },
      credits: {
        enabled: false
      },
      title: {
        text: 'Donations VS Two-party preferred'
      },
      xAxis: [
        {
          categories: _.pluck(orderedDates, 'dateString'),
          labels: {
            rotation: -90,
            step: 3,
            y: 40
          }
        },
        {
          opposite: true,
          categories: _.pluck(orderedDates, 'dateString'),
          labels: {
            enabled: false
          }
        }
      ],
      yAxis: [
        { // Primary yAxis
          title: {
            text: 'Donations'
          },
          max: 10000000
        }, { // Secondary yAxis
          gridLineWidth: 0,
          title: {
            text: '2 Party Preferred Poll'
          },
          max: 50,
          min: 10,
          opposite: true
        }
      ],
      series: [{
        name: 'Total donations to the ALP',
        color: '#4572A7',
        type: 'column',
        data: _.pluck(orderedDates, 'labourDonations')
      },
        {
        name: 'Total donations to the Coalition',
        color: '#AA4643',
        type: 'column',
        data: _.pluck(orderedDates, 'liberalDonations')
      },
        {
          name: '2 Party Preferred - Labor',
          type: 'spline',
          color: '#7294bc',
          yAxis: 1,
          xAxis: 1,
          data: _.pluck(orderedDates, 'laborPollPercentage'),
          marker: {
            enabled: false
          }
        },
        {
        name: '2 Party Preferred - Liberal',
        type: 'spline',
        color: '#be7371',
        yAxis: 1,
        xAxis: 1,
        data: _.pluck(orderedDates, 'liberalPollPercentage'),
        marker: {
          enabled: false
        }
      }
      ]
    });

    $('#labor-container').highcharts({
      chart: {
        type: 'column'
      },
      credits: {
        enabled: false
      },
      title: {
        text: 'LABOR - Donations VS Two-party preferred'
      },
      xAxis: [
        {
          categories: _.pluck(orderedDates, 'dateString'),
          labels: {
            rotation: -90,
            step: 3,
            y: 40
          }
        },
        {
          opposite: true,
          categories: _.pluck(orderedDates, 'dateString'),
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
          max: 50,
          min: 10,
          opposite: true
        }
      ],
      series: [{
        name: 'Total donations to the ALP',
        color: '#4572A7',
        type: 'column',
        data: _.pluck(orderedDates, 'labourDonations')
      },
//        {
//        name: 'Total donations to the Coalition',
//        color: '#AA4643',
//        type: 'column',
//        data: _.pluck(orderedDates, 'liberalDonations')
//      },
        {
        name: '2 Party Preferred - Labor',
        type: 'spline',
        color: '#7294bc',
        yAxis: 1,
        xAxis: 1,
        data: _.pluck(orderedDates, 'laborPollPercentage'),
        marker: {
          enabled: false
        }
      },
//        {
//        name: '2 Party Preferred - Liberal',
//        type: 'spline',
//        color: '#be7371',
//        yAxis: 1,
//        xAxis: 1,
//        data: _.pluck(orderedDates, 'liberalPollPercentage'),
//        marker: {
//          enabled: false
//        }
//      }
      ]
    });

    $('#coalition-container').highcharts({
      chart: {
        type: 'column'
      },
      credits: {
        enabled: false
      },
      title: {
        text: 'COALITION - Donations VS Two-party preferred'
      },
      xAxis: [
        {
          categories: _.pluck(orderedDates, 'dateString'),
          labels: {
            rotation: -90,
            step: 3,
            y: 40
          }
        },
        {
          opposite: true,
          categories: _.pluck(orderedDates, 'dateString'),
          labels: {
            enabled: false
          }
        }
      ],
      yAxis: [
        { // Primary yAxis
          title: {
            text: 'Donations'
          },
          max: 7000000
        }, { // Secondary yAxis
          gridLineWidth: 0,
          title: {
            text: '2 Party Preferred Poll'
          },
          max: 50,
          min: 10,
          opposite: true
        }
      ],
      series: [
//      {
//        name: 'Total donations to the ALP',
//        color: '#4572A7',
//        type: 'column',
//        data: _.pluck(orderedDates, 'labourDonations')
//      },
        {
        name: 'Total donations to the Coalition',
        color: '#AA4643',
        type: 'column',
        data: _.pluck(orderedDates, 'liberalDonations')
      },
//        {
//          name: '2 Party Preferred - Labor',
//          type: 'spline',
//          color: '#7294bc',
//          yAxis: 1,
//          xAxis: 1,
//          data: _.pluck(orderedDates, 'laborPollPercentage'),
//          marker: {
//            enabled: false
//          }
//        },
        {
        name: '2 Party Preferred - Liberal',
        type: 'spline',
        color: '#be7371',
        yAxis: 1,
        xAxis: 1,
        data: _.pluck(orderedDates, 'liberalPollPercentage'),
        marker: {
          enabled: false
        }
      }
      ]
    });
  };

  var init = function() {
    processData();
    insertTwoPartyComparisonChart(data.twoPartyComparison);
  };

  $(init);

}(jQuery, _, tgm.data));