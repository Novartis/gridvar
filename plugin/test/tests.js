module('Tests for the GridVar plugin', {

    setup: function() {
        $('#qunit-fixture').append('<div id="gridVar"></div>');
        $('#gridVar').gridVar({
            rowOrder : ['TP53', 'PIK3CA', 'AKT1', 'CBFB', 'GATA3', 'MAP3K1'],
            columnOrder : ['transit', 'automobile', 'airplane', 'skateboard', 'bicycle', 'tricycle'],
            dataMapping : {
                data: [
                    ['AKT1', 'transit', ['Missense']],
                    ['AKT1', 'skateboard', ['Missense']],
                    ['TP53', 'transit', ['other non-synonymous']]
                ],
                dataIndex: {
                    rowKey: 0,
                    columnKey: 1,
                    mutation: 2
                }
            }
        });
    },

    teardown: function() {
        $('#gridVar').remove();
    }
});

test("Creation tests", function() {
    var gridVar = $('#gridVar'),
        rowOrder = ['TP53', 'PIK3CA', 'AKT1', 'CBFB', 'GATA3', 'MAP3K1'],
        columnOrder = ['transit', 'automobile', 'airplane', 'skateboard', 'bicycle', 'tricycle'],
        dataMapping = {
            data: [
                ['AKT1', 'transit', ['Missense']],
                ['AKT1', 'skateboard', ['Missense']],
                ['TP53', 'transit', ['other non-synonymous']]
            ],
                dataIndex: {
                rowKey: 0,
                    columnKey: 1,
                    mutation: 2
            }
        };

    ok(!_.isUndefined(gridVar), 'Make sure gridVar is created.');

    deepEqual(gridVar.gridVar('option', 'rowOrder'), rowOrder, 'Make sure the rowOrder is set');
    deepEqual(gridVar.gridVar('option', 'columnOrder'), columnOrder, 'Make sure the columnOrder is set');
    deepEqual(gridVar.gridVar('option', 'dataMapping'), dataMapping, 'Make sure the dataMapping is set');

    notDeepEqual($('.nibr-gridVar-export'), [], 'Make sure gridVar is created.');
    notDeepEqual($('.nibr-gridVar-legend'), [], 'Make sure gridVar is created.');
    notDeepEqual($('.nibr-gridVar-histogram'), [], 'Make sure gridVar is created.');
    notDeepEqual($('.nibr-gridVar-grid-labels'), [], 'Make sure gridVar is created.');
    notDeepEqual($('.nibr-gridVar-container'), [], 'Make sure gridVar is created.');
});

test("Tests for the default options", function() {
    var gridVar = $('#gridVar');

    ok(!_.isUndefined(gridVar.gridVar('option', 'cellWidth')), 'Make sure the default cell width is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'cellHeight')), 'Make sure the default cell height is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'transitionDuration')), 'Make sure the default transition duration is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'legendStyles')), 'Make sure the default legend styles are set');

    ok(!_.isUndefined(gridVar.gridVar('option', 'styles')), 'Make sure the default style is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'styles').glyph), 'Make sure the default glyph style is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'attrs')), 'Make sure the default attr is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'attrs').glyph), 'Make sure the default glyph attr is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'histogramMapping')), 'Make sure the default histogram Mapping is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'histogramMapping').label), 'Make sure the default histogram label is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'histogramMapping').scale), 'Make sure the default histogram scale is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'histogramMapping').totalTicks), 'Make sure the default histogram mapping total ticks is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'multipleLegendLines')), 'Make sure the default multipleLegendLines property is set');
    ok(!_.isUndefined(gridVar.gridVar('option', 'multipleLegendLines').include), 'Make sure the default multipleLegendLines include property is set');

    ok(_.isNumber(gridVar.gridVar('option', 'cellWidth')), 'Make sure the default cell width is a number.');
    ok(_.isNumber(gridVar.gridVar('option', 'cellHeight')), 'Make sure the default cell height is a number.');
    ok(_.isNumber(gridVar.gridVar('option', 'transitionDuration')), 'Make sure the default transition duration is a number.');

    ok(_.isNumber(gridVar.gridVar('option', 'histogramMapping').scale), 'Make sure the default histogram scale is a number.');
    ok(_.isNumber(gridVar.gridVar('option', 'histogramMapping').totalTicks), 'Make sure the default histogram total ticks is a number.');
    ok(_.isBoolean(gridVar.gridVar('option', 'multipleLegendLines').include), 'Make sure the default multipleLegendLines include property is a boolean.');

    deepEqual(gridVar.gridVar('option', 'cellWidth'), 12, 'Make sure the default cell width equals 12.');
    deepEqual(gridVar.gridVar('option', 'cellHeight'), 12, 'Make sure the default cell height equals 12.');
    deepEqual(gridVar.gridVar('option', 'transitionDuration'), 1500, 'Make sure the default transition duration equals 1500.');
    deepEqual(gridVar.gridVar('option', 'histogramMapping').scale, 1, 'Make sure the default histogram scale equals 1.');
    deepEqual(gridVar.gridVar('option', 'histogramMapping').totalTicks, 2, 'Make sure the default histogram total ticks equals 2.');
    deepEqual(gridVar.gridVar('option', 'multipleLegendLines').include, false, 'Make sure the default multipleLegendLines include is false.');
});

test("Tests for row order change", function() {
    var gridVar = $('#gridVar'),
        rowOrder = ['TP53', 'PIK3CA', 'AKT1', 'CBFB', 'GATA3', 'MAP3K1'],
        newRowOrder = ['MAP3K1', 'TP53', 'PIK3CA', 'AKT1', 'CBFB', 'GATA3'];

    gridVar.gridVar('option', 'rowOrder', newRowOrder);

    deepEqual(gridVar.gridVar('option', 'rowOrder'), newRowOrder, 'Make sure the row order is updated.');

    notDeepEqual(gridVar.gridVar('option', 'rowOrder'), rowOrder, 'Make sure the row order actually changes.');
    notDeepEqual(gridVar.gridVar('option', 'rowOrder'), [], 'Make sure the row order change does not remove all rows.');
});

test("Tests for column order change", function() {
    var gridVar = $('#gridVar'),
        columnOrder = ['transit', 'automobile', 'airplane', 'skateboard', 'bicycle', 'tricycle'],
        newColumnOrder = ['skateboard', 'transit', 'automobile', 'airplane', 'bicycle', 'tricycle'];

    gridVar.gridVar('option', 'columnOrder', newColumnOrder);

    deepEqual(gridVar.gridVar('option', 'columnOrder'), newColumnOrder, 'Make sure the column order is updated.');

    notDeepEqual(gridVar.gridVar('option', 'columnOrder'), columnOrder, 'Make sure the column order actually changes.');
    notDeepEqual(gridVar.gridVar('option', 'columnOrder'), [], 'Make sure the column order change does not remove all columns.');
});

test("Test _calculateLabelSize", function() {
    var gridVar = $('#gridVar'),
        rowOrder = ['TP53', 'PIK3CA', 'AKT1', 'CBFB', 'GATA3', 'MAP3K1'],
        keyToLabelBlank = {'TP53' : '', 'PIK3CA' : '', 'AKT1' : '', 'CBFB' : '', 'GATA3' : '', 'MAP3K1' : ''},
        keyToLabelFilled = {'TP53' : 'gene01', 'PIK3CA' : 'gene02', 'AKT1' : 'gene03', 'CBFB' : 'gene04', 'GATA3' : 'gene05', 'MAP3K1' : 'gene06'};

    deepEqual(gridVar.data('nibr-gridVar')._calculateLabelSize(rowOrder, undefined, 10), 52, 'Make sure the label size is the longest key size plus ten.');
    deepEqual(gridVar.data('nibr-gridVar')._calculateLabelSize(rowOrder, keyToLabelBlank, 20), 20, 'Make sure the label size equals the padding since the labels are all empty strings.');
    deepEqual(gridVar.data('nibr-gridVar')._calculateLabelSize(rowOrder, keyToLabelFilled, 5), 47, 'Make sure the label size is accurate.');
    deepEqual(gridVar.data('nibr-gridVar')._calculateLabelSize([], keyToLabelFilled, 5), 5, 'Make sure the label size equals the padding since the labels are all empty strings.');
});

test('Test _getDefaultOption', function() {
    var gridVar = $('#gridVar');

    deepEqual(gridVar.data('nibr-gridVar')._getDefaultOptions('styles'), { 'fill': 'none', 'stroke': '#888888', 'stroke-width': 2, 'stroke-opacity': 1}, 'Make sure the styles object is returned.');
    deepEqual(gridVar.data('nibr-gridVar')._getDefaultOptions(), { 'opacity' : 0.6, 'class' : 'nibr-gridVar-glyph'}, 'An object of opacity and class should be returned.');
});

test('Test _getHeight', function() {
    var gridVar = $('#gridVar');

    deepEqual(gridVar.data('nibr-gridVar')._getHeight(), 72, 'Make sure the result is the rowOrder length times the cell height');
    deepEqual(gridVar.data('nibr-gridVar')._getHeight(12), 144, 'Make sure the result is 12 times the cell height');
});

test('Test _getWidth', function() {
    var gridVar = $('#gridVar');

    deepEqual(gridVar.data('nibr-gridVar')._getWidth(), 72, 'Make sure the result is the columnOrder length times the cell width');
    deepEqual(gridVar.data('nibr-gridVar')._getWidth(12), 144, 'Make sure the result is 12 times the cell width');
});

test('Test _getWidgetBaseClass', function() {
    var gridVar = $('#gridVar');

    deepEqual(gridVar.data('nibr-gridVar')._getWidgetBaseClass(), 'nibr-gridVar', 'Make sure the base class is the variable widgetBaseClass');
});

test('Test _calculateTextSize', function() {
    var gridVar = $('#gridVar');

    deepEqual(gridVar.data('nibr-gridVar')._calculateTextSize('TP53'), 28, 'Make sure the text size is calculated properly.');
    deepEqual(gridVar.data('nibr-gridVar')._calculateTextSize('transit'), 49, 'Make sure the text size is calculated properly.');
    deepEqual(gridVar.data('nibr-gridVar')._calculateTextSize('m'), 7, 'Make sure the text size is calculated properly.');
    deepEqual(gridVar.data('nibr-gridVar')._calculateTextSize(''), 0, 'Make sure the text size is calculated properly.');
});

test('Test _getHistogramScale with an auto scale', function() {
    var gridVar = $('#gridVar'),
        histogramMapping = {
            data : {'TP53' : 0.9, 'PIK3CA' : 0.8, 'AKT1' : 0.78, 'CBFB' : 0.76, 'GATA3' : 0.54, 'MAP3K1' : 0.21},
            label: 'Histogram',
            scale: 'auto',
            totalTicks: 2
        };

    gridVar.gridVar('option', 'histogramMapping', histogramMapping);

    deepEqual(gridVar.data('nibr-gridVar')._getHistogramScale(), 0.9, 'Make sure the auto scale equals the highest gene frequency provided.');
});

test('Test _getHistogramScale with a defined scale', function() {
    var gridVar = $('#gridVar'),
        histogramMapping = {
            data : {'TP53' : 0.9, 'PIK3CA' : 0.8, 'AKT1' : 0.78, 'CBFB' : 0.76, 'GATA3' : 0.54, 'MAP3K1' : 0.21},
            label: 'Histogram',
            scale: 0.15,
            totalTicks: 2
        };

    gridVar.gridVar('option', 'histogramMapping', histogramMapping);

    deepEqual(gridVar.data('nibr-gridVar')._getHistogramScale(), 0.15, 'Make sure the scale changed to 0.15.');
});

test("Test _getTickValues if tickValues and scale are set to 1", function() {
    var gridVar = $('#gridVar'),
        histogramMapping = {
            data : {'TP53' : 0.9, 'PIK3CA' : 0.8, 'AKT1' : 0.78, 'CBFB' : 0.76, 'GATA3' : 0.54, 'MAP3K1' : 0.21},
            label: 'Histogram',
            scale: 0.5,
            totalTicks: 1
        };

    gridVar.gridVar('option', 'histogramMapping', histogramMapping);

    deepEqual(gridVar.data('nibr-gridVar')._getTickValues(), [0.5], 'Make sure there is one tick value with the same value as the scale.');
});

test('Test _getTickValues if tickValues is set to 3 and scale is set to 1', function() {
    var gridVar = $('#gridVar'),
        histogramMapping = {
            data : {'TP53' : 0.9, 'PIK3CA' : 0.8, 'AKT1' : 0.78, 'CBFB' : 0.76, 'GATA3' : 0.54, 'MAP3K1' : 0.21},
            label: 'Histogram',
            scale: 1,
            totalTicks: 3
        };

    gridVar.gridVar('option', 'histogramMapping', histogramMapping);

    deepEqual(gridVar.data('nibr-gridVar')._getTickValues(), [0, 0.5, 1], 'Make sure there is one tick value with the same value as the scale.');
});

test('Test _createCssClass', function() {
    var gridVar = $('#gridVar');

    deepEqual(gridVar.data('nibr-gridVar')._createCssClass(''), 'nibr-gridVar-', 'The widget base class should be returned with a dash appended to the end.');
    deepEqual(gridVar.data('nibr-gridVar')._createCssClass('histogram'), 'nibr-gridVar-histogram', 'Make sure the proper class is returned.');
    deepEqual(gridVar.data('nibr-gridVar')._createCssClass(), 'nibr-gridVar-', 'The widget base class should be returned with a dash appended to the end.');
});

test('Tests for _hasHistogram with no histogram', function() {
    var gridVar = $('#gridVar');

    deepEqual(gridVar.data('nibr-gridVar')._hasHistogram(), false, 'Make sure gridvar can detect if there is no histogram');
});

test('Tests for _hasHistogram with a histogram and no data', function() {
    var gridVar = $('#gridVar'),
        histogramMapping = {
            label: 'Histogram',
            scale: 1,
            totalTicks: 3
        };

    gridVar.gridVar('option', 'histogramMapping', histogramMapping);

    deepEqual(gridVar.data('nibr-gridVar')._hasHistogram(), false, 'Make sure gridvar can detect if there is a histogram and no data');
});

test('Tests for _hasHistogram with a histogram and data', function() {
    var gridVar = $('#gridVar'),
        histogramMapping = {
            data : {'TP53' : 0.9, 'PIK3CA' : 0.8, 'AKT1' : 0.78, 'CBFB' : 0.76, 'GATA3' : 0.54, 'MAP3K1' : 0.21},
            label: 'Histogram',
            scale: 1,
            totalTicks: 3
        };

    gridVar.gridVar('option', 'histogramMapping', histogramMapping);

    deepEqual(gridVar.data('nibr-gridVar')._hasHistogram(),true, 'Make sure gridvar can detect if there is a histogram and data');
});

