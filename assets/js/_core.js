/*
 *  BanManagement © 2015, a web interface for the Bukkit plugin BanManager
 *  by James Mortemore of http://www.frostcast.net
 *  is licenced under a Creative Commons
 *  Attribution-NonCommercial-ShareAlike 2.0 UK: England & Wales.
 *  Permissions beyond the scope of this licence
 *  may be available at http://creativecommons.org/licenses/by-nc-sa/2.0/uk/.
 *  Additional licence terms at https://raw.githubusercontent.com/BanManagement/BanManager-WebUI/master/LICENSE
 */

/* global language */
/* global CanvasLoader */

function showLoading(element) {
  var cl = new CanvasLoader(element);
  cl.setColor('#4e68d9'); // default is '#000000'
  cl.setDiameter(16); // default is 40
  cl.setDensity(59); // default is 40
  cl.setRange(1.6); // default is 1.3
  cl.setSpeed(4); // default is 2
  cl.show(); // Hidden by default
}

function hideLoading() {
  $('#ajaxLoading').remove();
}

$(function() {
  // Construct URI
  var ownScripts = document.getElementsByTagName('script'),
      ownPath = ownScripts[0].src.split('?')[0],
      ownDir = ownPath.split('/').slice(0, -1).join('/') + '/',
      ownURI = ownDir.replace('/assets/js/', ''),
      locale;

  // Load current locale file synchronously
  $.ajax({
    type: 'GET',
    url: ownURI + '/l10n/' + language + '.json',
    dataType: 'json',
    success: function(json) {
      locale = json;
    },
    async: false
  })

  jQuery.validator.setDefaults({
    errorPlacement: function(error, placement) {
      error.wrap('<span class="help-inline" />');
      $(placement).after(error.parent());
      error.parent().parent().parent().removeClass('has-success').addClass('has-error');
    }
    , success: function(label) {
      label.parent().parent().parent().removeClass('has-error').addClass('has-success');
    }
  });
  $('form').validate();
  $('time').each(function() {
    $(this).countdown({
      until: new Date($(this).attr('datetime'))
      , format: 'yowdhms', layout: '{y<} {yn} {yl}, {y>} {o<} {on} {ol}, {o>} {w<} {wn} {wl}, {w>} {d<} {dn} {dl}, {d>} {h<} {hn} {hl}, {h>} {m<} {mn} {ml}, {m>} {s<} {sn} {sl} {s>}'
      , onExpiry: function() {
        location.reload();
      }
    });
  });

  $.extend($.tablesorter.themes.bootstrap, {
    // these classes are added to the table. To see other table classes available,
    // look here: http://twitter.github.com/bootstrap/base-css.html#tables
    table: 'table table-bordered'
    , header: 'bootstrap-header' // give the header a gradient background
    , footerRow: ''
    , footerCells: ''
    , icons: '' // add "icon-white" to make them white; this icon class is added to the <i> in the header
    , sortNone: 'bootstrap-icon-unsorted'
    , sortAsc: 'glyphicon glyphicon-chevron-up'
    , sortDesc: 'glyphicon glyphicon-chevron-down'
    , active: '' // applied when column is sorted
    , hover: '' // use custom css here - bootstrap class may not override it
    , filterRow: '' // filter row class
    , even: '' // odd row zebra striping
    , odd: ''  // even row zebra striping
  });

  $.tablesorter.addParser({
    // set a unique id
    id: 'expires'
    , is: function() {
      // return false so this parser is not auto detected
      return false;
    }
    , format: function(s, table, cell) {
      // format your data for normalization
      return $(cell).data('expires');
    }
    , type: 'numeric' // set type, either numeric or text
  });

  $('table.sortable').tablesorter({
    /*jshint camelcase: false */
    theme: 'bootstrap' // this will
    , widthFixed: true
    , headers: { 4: { sorter: 'expires' } }
    , sortList: [ [ 5,1 ] ]
    , headerTemplate: '{content} {icon}' // new in v2.7. Needed to add the bootstrap icon!
    // widget code contained in the jquery.tablesorter.widgets.js file
    // use the zebra stripe widget if you plan on hiding any rows (filter widget)
    , widgets: [ 'uitheme', 'filter', 'zebra' ]
    , widgetOptions: {
      // using the default zebra striping class name, so it actually isn't included in the theme variable above
      // this is ONLY needed for bootstrap theming if you are using the filter widget, because rows are hidden
      zebra: [ 'even', 'odd' ]
      // reset filters button
      , filter_reset: '.reset'
      // set the uitheme widget to use the bootstrap theme class names
      // uitheme : "bootstrap"
      , filter_searchDelay: 1000
      , filter_saveFilters: false
    }
  }).tablesorterPager(
    // target the pager markup - see the HTML block below
    { container: $('.pager')
    , savePages: false
    , ajaxUrl: 'index.php?action=' + $('#container form input[name="action"]').val() + '&player=' + $('#container form input[name="player"]').val() + '&server=' + $('#container form input[name="server"]').val() + '&excluderecords=' + $('#container form input[name="excluderecords"]:checked').val() + '&ajax=true&size={size}&page={page}&sortby={sortList:column}&filter={filterList:filter}'
    , ajaxObject: {
      dataType: 'json'
      , success: function() {
        hideLoading();
      }
      , error: function() {
        hideLoading();
      }
      , beforeSend: function() {
        $('table.sortable').before('<div id="ajaxLoading"><span id="loadingSmall"></span><br />Fetching...</div>');
        showLoading('loadingSmall');
      }
    }
    , ajaxProcessing: function(data) {
      if (data && data.hasOwnProperty('rows')) {
        var r, row, c, d = data.rows
        // total number of rows (required)
        , total = data.total_rows
        // array of header names (optional)
        , headers = data.headers
        // all rows: array of arrays; each internal array has the table cell data for that row
        , rows = []
        // len should match pager set size (c.size)
        , len = d.length;
        // this will depend on how the json is set up - see City0.json
        // rows
        for ( r = 0; r < len; r++ ) {
          row = []; // new row array
          // cells
          for ( c in d[r] ) {
            if (typeof(c) === 'string') {
              row.push(d[r][c]); // add each table cell data to row array
            }
          }
          rows.push(row); // add new row array to rows array
        }

        if (rows.length === 0) {
          row.push('None');
        }

        return [ total, rows, headers ];
      }
    }

    // target the pager page select dropdown - choose a page
    , cssGoto: '.pagenum'

    // remove rows from the table to speed up the sort of large tables.
    // setting this to false, only hides the non-visible rows; needed if you plan to add/remove rows with the pager enabled.
    , removeRows: false

    // output string - default is '{page}/{totalPages}';
    // possible variables: {page}, {totalPages}, {filteredPages}, {startRow}, {endRow}, {filteredRows} and {totalRows}
    , output: '{startRow} - {endRow} / {filteredRows} ({totalRows})'
  });

  $('.col-lg-4 button[rel="popover"]').popover({ trigger: 'hover', placement: 'left' });

  $('#search li').click(function() {
    var s = $(this);
    if (s.attr('id') === 'ip') {
      var player = $('#player');
      $('#ip').attr('id', 'player').find('a').text(locale.home['search-player']);
      player.attr('id', 'ip').html('IP&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="caret"></span>');
      $('#search input[type=text]').attr('placeholder', locale.home['search-placeholder-ip']);
      $('#search input[name=action]').attr('value', 'searchip');
    } else {
      var ip = $('#ip');
      $('#player').attr('id', 'ip').find('a').text(locale.home['search-ip']);
      ip.attr('id', 'player').html('Player <span class="caret"></span>');
      $('#search input[type=text]').attr('placeholder', locale.home['search-placeholder-player']);
      $('#search input[name=action]').attr('value', 'searchplayer');
    }
  });

  $('#viewall').click(function() {
    var server = $('#search input[name=server]:checked').val();

    if (typeof server === 'undefined') {
      server = 0;
    }

    window.location.href = 'index.php?action=' + $('#search input[name=action]').val() + '&server=' + server + '&player=%25';
  });

  /*
   * Checked list group
   * (http://bootsnipp.com/snippets/featured/checked-list-group)
   */

  $('.list-group.checked-list-box .list-group-item').each(function () {

    // Settings
    var $widget = $(this)
    , $checkbox = $('<input type="checkbox" class="hidden" />')
    , style = ($widget.data('style') === 'button' ? 'btn-' : 'list-group-item-')
    , settings = {
        success: {
          icon: 'glyphicon glyphicon-check'
          , color: 'success'
        }
        , failed: {
          icon: 'glyphicon glyphicon-remove'
          , color: 'danger'
        }
        , none: {
          icon: 'glyphicon glyphicon-unchecked'
          , color: 'default'
        }
      };

    $widget.append($checkbox);

    // Event Handlers
    $checkbox.on('change', function () {
      updateDisplay();
    });

    // Actions
    function updateDisplay() {
      var isChecked = $checkbox.is(':checked')
      , stateStatus;

      // Set the button's state
      if (isChecked) {
        stateStatus = 'success';
      } else {
        if ($widget.data('state')) {
          stateStatus = 'failed';
        } else {
          stateStatus = 'none';
        }
      }

      $widget.data('state', stateStatus);

      // Set the button's icon
      $widget.find('.state-icon')
        .removeClass()
        .addClass('state-icon ' + settings[$widget.data('state')].icon);

      // Update the button's color
      $widget.removeClass(style + 'default').removeClass(style + 'danger').removeClass(style + 'success');
      if ($widget.data('state') === 'failed' || $widget.data('state') === 'success') {
        $widget.addClass(style + settings[$widget.data('state')].color);
      } else {
        $widget.addClass(style + settings.none.color);
      }
    }

    // Initialization
    function init() {
      if ($widget.data('state') === 'success') {
        $checkbox.prop('checked', !$checkbox.is(':checked'));
      }

      updateDisplay();

      // Inject the icon if applicable
      if ($widget.find('.state-icon').length === 0) {
        $widget.prepend('<span class="state-icon ' + settings[$widget.data('state')].icon + '"></span>');
      }
    }
    init();
  });
});
