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
          coalitionDonations: 0,
          laborPollPercentage: null,
          coalitionPollPercentage: null
        };
      }

      if (obj.party.toUpperCase() == 'ALP') {
        dates[obj.date].labourDonations += obj.amount;
      }
      if (
        obj.party.toUpperCase() == 'LIB' ||
        obj.party.toUpperCase() == 'NAT'
      ) {
        dates[obj.date].coalitionDonations += obj.amount;
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
          coalition: 0
        };
      }

      if (pollObject.date >= earliestDate) {
        var party = obj[2].toUpperCase();
        var amount = obj[3];
        if (party === 'ALP') {
          pollObject.labor = amount;
        } else if (party === 'COALITION') {
          pollObject.coalition = amount;
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
        var coalitionSum = 0;
        var coalitionCount = 0;

        _.each(dateObj.matchingPolls, function(pollObj) {
          laborSum += pollObj.labor;
          laborCount++;

          coalitionSum += pollObj.coalition;
          coalitionCount++;

          dateObj.laborPollPercentage = Math.floor(laborSum / laborCount);
          dateObj.coalitionPollPercentage = Math.floor(coalitionSum / coalitionCount);
        });
      }
      return dateObj;
    });
  };

  var insertTwoPartyComparisonChart = function() {
    var red = '#AA4643';
    var paleRed = '#be7371';
    var blue = '#4572A7';
    var paleBlue = '#7294bc';

    var defaultOptions = {
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
        color: red,
        type: 'column',
        data: _.pluck(orderedDates, 'labourDonations')
      }, {
        name: 'Total donations to the Coalition',
        color: blue,
        type: 'column',
        data: _.pluck(orderedDates, 'coalitionDonations')
      }, {
        name: '2 Party Preferred - Labor',
        type: 'spline',
        color: paleRed,
        yAxis: 1,
        xAxis: 1,
        data: _.pluck(orderedDates, 'laborPollPercentage'),
        marker: {
          enabled: false
        }
      }, {
        name: '2 Party Preferred - Coalition',
        type: 'spline',
        color: paleBlue,
        yAxis: 1,
        xAxis: 1,
        data: _.pluck(orderedDates, 'coalitionPollPercentage'),
        marker: {
          enabled: false
        }
      }]
    };

    $('#two-party-comparison-container').highcharts(defaultOptions);

    $('#labor-container').highcharts(_.extend(defaultOptions, {
      title: {
        text: 'LABOR - Donations VS Two-party preferred'
      },
      series: [{
        name: 'Total donations to the ALP',
        color: red,
        type: 'column',
        data: _.pluck(orderedDates, 'labourDonations')
      }, {
        name: '2 Party Preferred - Labor',
        type: 'spline',
        color: paleRed,
        yAxis: 1,
        xAxis: 1,
        data: _.pluck(orderedDates, 'laborPollPercentage'),
        marker: {
          enabled: false
        }
      }]
    }));

    $('#coalition-container').highcharts(_.extend(defaultOptions, {
      title: {
        text: 'COALITION - Donations VS Two-party preferred'
      },
      series: [{
        name: 'Total donations to the Coalition',
        color: blue,
        type: 'column',
        data: _.pluck(orderedDates, 'coalitionDonations')
      }, {
        name: '2 Party Preferred - Coalition',
        type: 'spline',
        color: paleBlue,
        yAxis: 1,
        xAxis: 1,
        data: _.pluck(orderedDates, 'coalitionPollPercentage'),
        marker: {
          enabled: false
        }
      }]
    }));
  };

  var init = function() {
    processData();
    insertTwoPartyComparisonChart(data.twoPartyComparison);
  };

  $(init);

}(jQuery, _, tgm.data));