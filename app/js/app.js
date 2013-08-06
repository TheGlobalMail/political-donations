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
          laborDonations: 0,
          coalitionDonations: 0,
          laborPollPercentage: null,
          coalitionPollPercentage: null
        };
      }

      if (obj.party.toUpperCase() == 'ALP') {
        dates[obj.date].laborDonations += obj.amount;
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

    orderedPolls = _(tgm.data.polls).map(function(obj) {
      var splitString = obj.dateString.split('-');
      obj.date = new Date(splitString[0], splitString[1], splitString[2]);
      return obj;
    }).sortBy(function(obj) {
      return +obj.date;
    }).value();

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


    // Calculate the mean poll data for each donation date
    orderedDates = _.map(orderedDates, function(dateObj) {
      if (dateObj.matchingPolls.length) {
        var laborSum = 0;
        var laborCount = 0;
        var coalitionSum = 0;
        var coalitionCount = 0;

        _.each(dateObj.matchingPolls, function(pollObj) {
          laborSum += pollObj['ALP'];
          laborCount++;

          coalitionSum += pollObj['L-NP'];
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

    var laborDonations = _.pluck(orderedDates, 'laborDonations');
    var coalitionDonations = _.pluck(orderedDates, 'coalitionDonations');
    
    var laborPollSeries = _.pluck(orderedDates, 'laborPollPercentage');
    var coalitionPollSeries = _.pluck(orderedDates, 'coalitionPollPercentage');

    var filteredLaborPollSeries = _.compact(laborPollSeries);
    var filteredCoalitionPollSeries = _.compact(coalitionPollSeries);
    var laborPollMax = _.max(filteredLaborPollSeries);
    var coalitionPollMax = _.max(filteredCoalitionPollSeries);
    var totalMax = _.max([laborPollMax, coalitionPollMax]);

    var laborPollMin = _.min(filteredLaborPollSeries);
    var coalitionPollMin = _.min(filteredCoalitionPollSeries);
    var totalMin = _.min([laborPollMin, coalitionPollMin]);
    console.log(laborPollMax, totalMax, totalMin)

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
            rotation: -45,
            step: 2,
            x: -10,
            y: 30,
            formatter: function() {
              var splitString = this.value.split('-');
              var month = {
                '01': 'Jan',
                '04': 'Apr',
                '07': 'Jul',
                '10': 'Oct'
              }[splitString[1]];
              var year = splitString[0];//.slice(1);
              return month + ' ' + year;
            }
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
          max: 10000000,
          labels: {
            formatter: function() {
              var rounded = parseFloat((this.value / 1000000).toFixed(1));
              if (rounded % 1 === 0) {
                rounded = rounded.toFixed(0);
              }
              if (rounded > 0) {
                return '$' + rounded + 'm';
              } else {
                return '$0';
              }
            }
          }
        }, { // Secondary yAxis
          gridLineWidth: 0,
          title: {
            text: '2 Party Preferred Poll'
          },
          max: totalMax,
          min: totalMin - 5,
          opposite: true,
          labels: {
            formatter: function() {
              return this.value + '%';
            }
          }
        }
      ],
      series: [{
        name: 'Total donations to the ALP',
        color: red,
        type: 'column',
        data: laborDonations
      }, {
        name: 'Total donations to the Coalition',
        color: blue,
        type: 'column',
        data: coalitionDonations
      }, {
        name: '2 Party Preferred - Labor',
        type: 'spline',
        color: paleRed,
        yAxis: 1,
        xAxis: 1,
        data: laborPollSeries,
        marker: {
          enabled: false
        }
      }, {
        name: '2 Party Preferred - Coalition',
        type: 'spline',
        color: paleBlue,
        yAxis: 1,
        xAxis: 1,
        data: coalitionPollSeries,
        marker: {
          enabled: false
        }
      }]
    };

    $('#two-party-comparison-container').highcharts(defaultOptions);

//    $('#labor-container').highcharts(_.extend(defaultOptions, {
//      title: {
//        text: 'LABOR - Donations VS Two-party preferred'
//      },
//      series: [{
//        name: 'Total donations to the ALP',
//        color: red,
//        type: 'column',
//        data: laborDonations
//      }, {
//        name: '2 Party Preferred - Labor',
//        type: 'spline',
//        color: paleRed,
//        yAxis: 1,
//        xAxis: 1,
//        data: laborPollSeries,
//        marker: {
//          enabled: false
//        }
//      }]
//    }));
//
//    $('#coalition-container').highcharts(_.extend(defaultOptions, {
//      title: {
//        text: 'COALITION - Donations VS Two-party preferred'
//      },
//      series: [{
//        name: 'Total donations to the Coalition',
//        color: blue,
//        type: 'column',
//        data: coalitionDonations
//      }, {
//        name: '2 Party Preferred - Coalition',
//        type: 'spline',
//        color: paleBlue,
//        yAxis: 1,
//        xAxis: 1,
//        data: coalitionPollSeries,
//        marker: {
//          enabled: false
//        }
//      }]
//    }));
  };

  var init = function() {
    processData();
    insertTwoPartyComparisonChart(data.twoPartyComparison);
  };

  $(init);

}(jQuery, _, tgm.data));