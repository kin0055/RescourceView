KB.on('dom.ready', function () {
    function goToLink (selector) {
        if (! KB.modal.isOpen()) {
            var element = KB.find(selector);

            if (element !== null) {
                window.location = element.attr('href');
            }
        }
    }

    KB.onKey('v+s', function () {
        goToLink('a.view-Rescource');
    });

    if (KB.exists('#rescource-chart')) {
        var reschart = new Reschart();
        reschart.show();

        KB.tooltip();
    }
});