// Based on jQuery.ganttView v.0.8.8 Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com - MIT License
var Reschart = function() {
    this.data = [];
    this.user = [];
    this.userout = [];

    this.notaskusers = 0;

    this.options = {
        container: "#rescource-chart",
        showWeekends: true,
        showToday: true,
        allowMoves: true,
        allowResizes: true,
        cellWidth: 21,
        cellHeight: 31,
        slideWidth: 1000,
        vHeaderWidth: 200
    };
};

// Save record after a resize or move
Reschart.prototype.saveRecord = function(record) {
    $.ajax({
        cache: false,
        url: $(this.options.container).data("save-url"),
        contentType: "application/json",
        type: "POST",
        processData: false,
        data: JSON.stringify(record)
    });
};

// Build the Gantt chart
Reschart.prototype.show = function() {
    this.data = this.prepareData($(this.options.container).data('records'));
    this.user = this.prepareUser($(this.options.container).data('members'));
    this.userout = this.prepareCounter($(this.options.container).data('members'));
    
    var minDays = Math.floor((this.options.slideWidth / this.options.cellWidth) + 5);
    var range = this.getDateRange(minDays);
    var startDate = range[0];
    var endDate = range[1];
    var container = $(this.options.container);
    var chart = jQuery("<div>", { "class": "ganttview" });

    chart.append(this.renderVerticalHeader());
    chart.append(this.renderSlider(startDate, endDate));
    container.append(chart);

    jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", container).addClass("last");
    jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", container).addClass("last");
    jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", container).addClass("last");

    if (! $(this.options.container).data('readonly')) {
        this.listenForBlockResize(startDate);
        this.listenForBlockMove(startDate);
    }
    else {
        this.options.allowResizes = false;
        this.options.allowMoves = false;
    }
};

Reschart.prototype.infoTooltip = function(content) {
    var markdown = $("<div>", {"class": "markdown"}).append(content);
    var script = $("<script>", {"type": "text/template"}).append(markdown);
    var icon = $('<i>', {"class": "fa fa-info-circle"});
    return $('<span>', {"class": "tooltip"}).append(icon).append(script);
};

// Render record list on the left
Reschart.prototype.renderVerticalHeader = function() {
    var headerDiv = jQuery("<div>", { "class": "ganttview-vtheader" });
    var itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
    var seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });

    var assigneeLabel = $(this.options.container).data("label-no-job");

    //append no task users
    var count = 0;
    $.each(this.user, function(i, n){
        if(n == 0){

            count++;

            var content = jQuery("<span>");
            content.append(jQuery("<a>", {"title": "Assignee"}).append('<i class="fa fa-user"></i>')).append("&nbsp;");
            content.append(jQuery("<a>").text(i)).append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");

            content.append(jQuery("<a>", {"title": "No Working Task"}).append('<i class="fa fa-calendar-times-o"></i>')).append("&nbsp;");
            content.append(jQuery('<strong>').text(assigneeLabel));
    
            seriesDiv.append(jQuery("<div>", {"class": "ganttview-vtheader-series-name"}).append(content));
        }
    });

    this.notaskusers = count;

    //append tasks with users
    for (var i = 0; i < this.data.length; i++) {

        var content = jQuery("<span>");

        //first time
        if(this.userout[this.data[i].assignee] == 0){
            content.append(jQuery("<a>", {"title": "Assignee"}).append('<i class="fa fa-user"></i>')).append("&nbsp;");
        }else{
            content.append(jQuery("<a>", {"title": "Plan"}).append('<i class="fa fa-chevron-right"></i>')).append("&nbsp;");
        }

        this.userout[this.data[i].assignee]++;
            
        content.append(jQuery("<a>").text(this.data[i].assignee)).append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
        
        //task total status
        content.append(jQuery("<a>", {"title": "Total status"}).append('<i class="fa fa-calendar-plus-o"></i>')).append("&nbsp;");

        content.append(jQuery('<strong>').text('[ ' + this.userout[this.data[i].assignee] + ' / ' + this.user[this.data[i].assignee] + ' ]')).append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");

        //target task info
        content.append(jQuery("<a>", {"title": "Task ID"}).append('<i class="fa fa-tasks"></i>')).append("&nbsp;");

        content.append(jQuery('<a>',{"href": this.data[i].link, "title": this.data[i].title}).text('#'+this.data[i].id+' ')).append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");

        content.append(this.infoTooltip(this.getVerticalHeaderTooltip(this.data[i]))).append("&nbsp;");

        seriesDiv.append(jQuery("<div>", {"class": "ganttview-vtheader-series-name"}).append(content));
    }

    itemDiv.append(seriesDiv);
    headerDiv.append(itemDiv);

    return headerDiv;
};

// Render right part of the chart (top header + grid + bars)
Reschart.prototype.renderSlider = function(startDate, endDate) {
    var slideDiv = jQuery("<div>", {"class": "ganttview-slide-container"});
    var dates = this.getDates(startDate, endDate);

    slideDiv.append(this.renderHorizontalHeader(dates));
    slideDiv.append(this.renderGrid(dates));
    slideDiv.append(this.addBlockContainers());
    this.addBlocks(slideDiv, startDate);

    return slideDiv;
};

// Render top header (days)
Reschart.prototype.renderHorizontalHeader = function(dates) {
    var headerDiv = jQuery("<div>", { "class": "ganttview-hzheader" });
    var monthsDiv = jQuery("<div>", { "class": "ganttview-hzheader-months" });
    var daysDiv = jQuery("<div>", { "class": "ganttview-hzheader-days" });
    var totalW = 0;

    for (var y in dates) {
        for (var m in dates[y]) {
            var w = dates[y][m].length * this.options.cellWidth;
            totalW = totalW + w;

            monthsDiv.append(jQuery("<div>", {
                "class": "ganttview-hzheader-month",
                "css": { "width": (w - 1) + "px" }
            }).append($.datepicker.regional[$("body").data('js-lang')].monthNames[m] + " " + y));

            for (var d in dates[y][m]) {
                daysDiv.append(jQuery("<div>", { "class": "ganttview-hzheader-day" }).append(dates[y][m][d].getDate()));
            }
        }
    }

    monthsDiv.css("width", totalW + "px");
    daysDiv.css("width", totalW + "px");
    headerDiv.append(monthsDiv).append(daysDiv);

    return headerDiv;
};

// Render grid
Reschart.prototype.renderGrid = function(dates) {
    var gridDiv = jQuery("<div>", { "class": "ganttview-grid" });
    var rowDiv = jQuery("<div>", { "class": "ganttview-grid-row" });

    for (var y in dates) {
        for (var m in dates[y]) {
            for (var d in dates[y][m]) {
                var cellDiv = jQuery("<div>", { "class": "ganttview-grid-row-cell" });
                if (this.options.showWeekends && this.isWeekend(dates[y][m][d])) {
                    cellDiv.addClass("ganttview-weekend");
                }
                if (this.options.showToday && this.isToday(dates[y][m][d])) {
                    cellDiv.addClass("ganttview-today");
                }
                rowDiv.append(cellDiv);
            }
        }
    }
    var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * this.options.cellWidth;
    rowDiv.css("width", w + "px");
    gridDiv.css("width", w + "px");

    for (var i = 0; i < (this.data.length + this.notaskusers); i++) {
        gridDiv.append(rowDiv.clone());
    }

    return gridDiv;
};

// Render bar containers
Reschart.prototype.addBlockContainers = function() {
    var blocksDiv = jQuery("<div>", { "class": "ganttview-blocks" });

    for (var i = 0; i < (this.data.length + this.notaskusers); i++) {
        blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container" }));
    }

    return blocksDiv;
};

// Render bars
Reschart.prototype.addBlocks = function(slider, start) {
    var rows = jQuery("div.ganttview-blocks div.ganttview-block-container", slider);
    var rowIdx = 0;

    rowIdx = this.notaskusers;

    for (var i = 0; i < this.data.length; i++) {
        var series = this.data[i];
        var size = this.daysBetween(series.start, series.end) + 1;
        var offset = this.daysBetween(start, series.start);
        var text = jQuery("<div>", {
          "class": "ganttview-block-text",
          "css": {
              "width": ((size * this.options.cellWidth) - 19) + "px"
          }
        });

        var block = jQuery("<div>", {
            "class": "ganttview-block" + (this.options.allowMoves ? " ganttview-block-movable" : ""),
            "css": {
                "width": ((size * this.options.cellWidth) - 9) + "px",
                "margin-left": (offset * this.options.cellWidth) + "px"
            }
        }).append(text);

        if (series.type === 'task') {
            this.addTaskBarText(text, series, size);
        }

        block.data("record", series);
        this.setBarColor(block, series);

        jQuery(rows[rowIdx]).append(block);
        rowIdx = rowIdx + 1;
    }
};

Reschart.prototype.addTaskBarText = function(container, record, size) {
    if (size >= 4) {
        container.html($('<span>').text(record.progress + ' - #' + record.id + ' ' + record.title));
    }
    else if (size >= 2) {
        container.html($('<span>').text(record.progress));
    }
};

// Get tooltip for vertical header
Reschart.prototype.getVerticalHeaderTooltip = function(record) {
    if (record.type === 'task') {
        return this.getTaskTooltip(record);
    }

    return this.getProjectTooltip(record);
};

Reschart.prototype.getTaskTooltip = function(record) {
    var assigneeLabel = $(this.options.container).data("label-assignee");
    var tooltip = $('<span>')
        .append($('<strong>').text(record.column_title + ' (' + record.progress + ')'))
        .append($('<br>'))
        .append($('<span>').text('#' + record.id + ' ' + record.title))
        .append($('<br>'))
        .append($('<span>').text(assigneeLabel + ' ' + (record.assignee ? record.assignee : '')));

    return this.getTooltipFooter(record, tooltip);
};

Reschart.prototype.getProjectTooltip = function(record) {
    var tooltip = $('<span>');

    if ('project-manager' in record.users) {
        var projectManagerLabel = $(this.options.container).data('label-project-manager');
        var list = $('<ul>');

        for (var user_id in record.users['project-manager']) {
            list.append($('<li>').append($('<span>').text(record.users['project-manager'][user_id])));
        }

        tooltip.append($('<strong>').text(projectManagerLabel));
        tooltip.append($('<br>'));
        tooltip.append(list);
    }

    return this.getTooltipFooter(record, tooltip);
};

Reschart.prototype.getTooltipFooter = function(record, tooltip) {
    var notDefinedLabel = $(this.options.container).data("label-not-defined");
    var startDateLabel = $(this.options.container).data("label-start-date");
    var startEndLabel = $(this.options.container).data("label-end-date");

    if (record.not_defined) {
        tooltip.append($('<br>')).append($('<em>').text(notDefinedLabel));
    } else {
        tooltip.append($('<br>'));
        tooltip.append($('<strong>').text(startDateLabel + ' ' + $.datepicker.formatDate('yy-mm-dd', record.start)));
        tooltip.append($('<br>'));
        tooltip.append($('<strong>').text(startEndLabel + ' ' + $.datepicker.formatDate('yy-mm-dd', record.end)));
    }

    return tooltip;
};

// Set bar color
Reschart.prototype.setBarColor = function(block, record) {
    block.css("background-color", record.color.background);
    block.css("border-color", record.color.border);

    if (record.not_defined) {
        if (record.date_started_not_defined) {
            block.css("border-left", "2px solid #000");
        }

        if (record.date_due_not_defined) {
            block.css("border-right", "2px solid #000");
        }
    }

    if (record.progress != "0%") {
        var progressBar = $(block).find(".ganttview-progress-bar");

        if (progressBar.length) {
            progressBar.css("width", record.progress);
        } else {
            block.append(jQuery("<div>", {
                "class": "ganttview-progress-bar",
                "css": {
                    "background-color": record.color.border,
                    "width": record.progress,
                }
            }));
        }
    }
};

// Setup jquery-ui resizable
Reschart.prototype.listenForBlockResize = function(startDate) {
    var self = this;

    jQuery("div.ganttview-block", this.options.container).resizable({
        grid: this.options.cellWidth,
        handles: "e,w",
        delay: 300,
        stop: function() {
            var block = jQuery(this);
            self.updateDataAndPosition(block, startDate);
            self.saveRecord(block.data("record"));
        }
    });
};

// Setup jquery-ui drag and drop
Reschart.prototype.listenForBlockMove = function(startDate) {
    var self = this;

    jQuery("div.ganttview-block", this.options.container).draggable({
        axis: "x",
        delay: 300,
        grid: [this.options.cellWidth, this.options.cellWidth],
        stop: function() {
            var block = jQuery(this);
            self.updateDataAndPosition(block, startDate);
            self.saveRecord(block.data("record"));
        }
    });
};

// Update the record data and the position on the chart
Reschart.prototype.updateDataAndPosition = function(block, startDate) {
    var container = jQuery("div.ganttview-slide-container", this.options.container);
    var scroll = container.scrollLeft();
    var offset = block.offset().left - container.offset().left - 1 + scroll;
    var record = block.data("record");

    // Restore color for defined block
    record.not_defined = false;
    this.setBarColor(block, record);

    // Set new start date
    var daysFromStart = Math.round(offset / this.options.cellWidth);
    var newStart = this.addDays(this.cloneDate(startDate), daysFromStart);
    if (!record.date_started_not_defined || this.compareDate(newStart, record.start)) {
        record.start = this.addDays(this.cloneDate(startDate), daysFromStart);
        record.date_started_not_defined = true;
    }
    else if (record.date_started_not_defined) {
        delete record.start;
    }

    // Set new end date
    var width = block.outerWidth();
    var numberOfDays = Math.round(width / this.options.cellWidth) - 1;
    var newEnd = this.addDays(this.cloneDate(newStart), numberOfDays);
    if (!record.date_due_not_defined || this.compareDate(newEnd, record.end)) {
        record.end = newEnd;
        record.date_due_not_defined = true;
    }
    else if (record.date_due_not_defined) {
        delete record.end;
    }

    if (record.type === "task" && numberOfDays > 0) {
        this.addTaskBarText(jQuery("div.ganttview-block-text", block), record, numberOfDays);
    }

    block.data("record", record);

    // Remove top and left properties to avoid incorrect block positioning,
    // set position to relative to keep blocks relative to scrollbar when scrolling
    block
        .css("top", "")
        .css("left", "")
        .css("position", "relative")
        .css("margin-left", offset + "px");
};

// Creates a 3 dimensional array [year][month][day] of every day
// between the given start and end dates
Reschart.prototype.getDates = function(start, end) {
    var dates = [];
    dates[start.getFullYear()] = [];
    dates[start.getFullYear()][start.getMonth()] = [start];
    var last = start;

    while (this.compareDate(last, end) == -1) {
        var next = this.addDays(this.cloneDate(last), 1);

        if (! dates[next.getFullYear()]) {
            dates[next.getFullYear()] = [];
        }

        if (! dates[next.getFullYear()][next.getMonth()]) {
            dates[next.getFullYear()][next.getMonth()] = [];
        }

        dates[next.getFullYear()][next.getMonth()].push(next);
        last = next;
    }

    return dates;
};

// Convert data to Date object
Reschart.prototype.prepareData = function(data) {
    for (var i = 0; i < data.length; i++) {
        var start = new Date(data[i].start[0], data[i].start[1] - 1, data[i].start[2], 0, 0, 0, 0);
        data[i].start = start;

        var end = new Date(data[i].end[0], data[i].end[1] - 1, data[i].end[2], 0, 0, 0, 0);
        data[i].end = end;
    }

    return data;
};

// Convert user to local object
Reschart.prototype.prepareUser = function(data) {

    var usertmp = {};

    $.each(data, function(i, n){
        usertmp[i] = n;
    });
    
    return usertmp;
};

// create user count object
Reschart.prototype.prepareCounter = function(data) {

    var usertmp = {};

    $.each(data, function(i, n){
        usertmp[i] = 0;
    });
    
    return usertmp;
};


// Get the start and end date from the data provided
Reschart.prototype.getDateRange = function(minDays) {
    var minStart = new Date();
    var maxEnd = new Date();

    for (var i = 0; i < this.data.length; i++) {
        var start = new Date();
        start.setTime(Date.parse(this.data[i].start));

        var end = new Date();
        end.setTime(Date.parse(this.data[i].end));

        if (i == 0) {
            minStart = start;
            maxEnd = end;
        }

        if (this.compareDate(minStart, start) == 1) {
            minStart = start;
        }

        if (this.compareDate(maxEnd, end) == -1) {
            maxEnd = end;
        }
    }

    // Insure that the width of the chart is at least the slide width to avoid empty
    // whitespace to the right of the grid
    if (this.daysBetween(minStart, maxEnd) < minDays) {
        maxEnd = this.addDays(this.cloneDate(minStart), minDays);
    }

    // Always start one day before the minStart
    minStart.setDate(minStart.getDate() - 1);

    return [minStart, maxEnd];
};

// Returns the number of day between 2 dates
Reschart.prototype.daysBetween = function(start, end) {
    if (! start || ! end) {
        return 0;
    }

    var count = 0, date = this.cloneDate(start);

    while (this.compareDate(date, end) == -1) {
        count = count + 1;
        this.addDays(date, 1);
    }

    return count;
};

// Return true if it's the weekend
Reschart.prototype.isWeekend = function(date) {
    return date.getDay() % 6 == 0;
};

// Return true if it's today
Reschart.prototype.isToday = function(date) {
   var today = new Date();
   return today.toDateString() == date.toDateString();
 };

// Clone Date object
Reschart.prototype.cloneDate = function(date) {
    return new Date(date.getTime());
};

// Add days to a Date object
Reschart.prototype.addDays = function(date, value) {
    date.setDate(date.getDate() + value * 1);
    return date;
};

/**
 * Compares the first date to the second date and returns an number indication of their relative values.
 *
 * -1 = date1 is lessthan date2
 * 0 = values are equal
 * 1 = date1 is greaterthan date2.
 */
Reschart.prototype.compareDate = function(date1, date2) {
    if (isNaN(date1) || isNaN(date2)) {
        throw new Error(date1 + " - " + date2);
    } else if (date1 instanceof Date && date2 instanceof Date) {
        return (date1 < date2) ? -1 : (date1 > date2) ? 1 : 0;
    } else {
        throw new TypeError(date1 + " - " + date2);
    }
};
