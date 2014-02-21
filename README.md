[GridVar][examples]
=======================

![GridVar screenshot](/docs/img/gridVarExample.png "GridVar screenshot")

GridVar is a jQuery plugin that visualizes multi-dimensional datasets as layers organized in a row-column format. At each cell (i.e., rectangle at the intersection of a row and column), GridVar displays your data as a background color (like a color/heat map) and/or a glyph (shape). This enables different characteristics of your dataset to be layered on top of each other. 

Please view our [examples page][examples] to see GridVar in action.

Features
--------

* Display of multi-dimensional data through colors and/or glyphs.
* Animated transitions when reordering rows and columns.
* Histogram for aggregate data analysis.
* Tooltips for more information about the cell.
* Export visualization to SVG.

Getting Started
---------------

Download the javascript and css:
* [GridVar Zip][zipball] 
 
GridVar has a few **dependencies** that need to be included:

* [d3][d3] 2.0+
* [jQuery][jquery] 1.8+
* [jQuery UI][jquery-ui] 1.8+
* [Underscore][underscore] 1.0+

**Additional functionality** can be activated by including the following libraries:

* [QTip][qtip]: if this is not included, you don't get the qtip-styled tooltips
* [Filesaver][filesaver]: if this is not included, export to SVG option will be disabled
* [Blob.js][blob]: some older browser versions need Blob.js for FileSaver.js to function properly

Usage
-----

### Renderers

Renderers come in two forms, [Built-in Renderers][built-in-renderers] and [Custom Renderers][custom-renderers].

#### Built-in Renderers

Built-in renderers consist of two types, backgrounds and glyphs. You can specify a background renderer by providing a
RGB hex color code preceded by a '#' like '#AAFFAA'. You can specify a built-in glyph render by providing renderer type
(for example, 'xRenderer'). The built-in renderers provide default styles and attributes. Override these with values or
functions of your own choosing by providing styles and/or attribute data. Provide a function for dynamically generated
attributes and styles. The format for the styles and attributes take the following base form:

```javascript
{ attrs : { d : 'builtInRendererName'}, styles : { stroke : '#0000ff' }}
```

Change the stroke color of the xRenderer render like so:

```javascript
{ attrs : { d : 'xRenderer'}, styles : { stroke :'#0000ff' }}
```

This set of attributes and styles results in a blue xRenderer:

Style functions will be passed the data, width, and height of the cell. For example, if you wish to scale the
stroke-width according to the size of the cell, define the following parameters:

```javascript
{
  attrs : {
    d : 'xRenderer'
    },
  styles : {
    'stroke-width' : function (data,width,height) {
            return Math.floor(Math.sqrt( width * height) / 10);
          }
    }
}
```

This will result in the following dynamic stroke-width of the xRender defined by the the cell size for example:

* 20x20 cell scaled: ![xRenderer 20x20 Scaled](/docs/img/xRenderer20Scaled.png)
* 40x40 cell scaled: ![xRenderer 40x40 Scaled](/docs/img/xRenderer40Scaled.png)
* 40x40 cell default: ![xRenderer 40x40 Normal](/docs/img/xRenderer40Normal.png)

#### Custom Renderers

There are two ways to provide a custom renderer to the GridVar plugin:

* Simple custom renderer: a function that returns an SVG path
* Complete custom renderer: a function and set of attributes and or styles

Simple custom renderers are functions which return the 'd' value for an [SVG path][svg-path]. A function will be passed the data for
the cell, the width of the cell, and the height of the cell. For example, to draw a simple diagonal line from the top
left corner of the cell to the bottom right corner of the cell, provide the following simple custom renderer:

```javascript
DataTypeValue: function(value,width,height) {return 'M0,0L' + width + ',' + height;}
```

This will result in the following custom renderer: ![Simple Custom Renderer](/docs/img/simpleCustom.png)

##### Simple Custom Renderer Example

Simple custom renderers are created using a function that returns a SVG path. 
Using an SVG editor (e.g. Google's [svg-edit][svg-edit]) is an easy solution for editing an SVG path.

Copy the SVG path to the results of a function in the mappings object (see example below). This function will be passed three arguments, the data associated with the cell for the renderer data type, along with the width and height of the cell.

```javascript
{
 dataType: 'cloudy',
 mappings: {
    cloudy: function(data, width, height) {
        return "m3.2863,7.40575c-0.72778,0 -1.31805,-0.68071 -1.31805,-1.52l0,0c ...";
       }
     }
}
```

##### Complete Custom Renderers

Complete custom renderers provide additional functionality for customizing the styles and attributes of the glyph, such as stroke color, stroke width, opacity, etc. At a minimum, the complete custom renderer must provide the path function as part of the attributes object. For example, the complete form of the diagonal line from above becomes:

```javascript
DataTypeValue: {
    attrs : {
        d: function(value,width,height) {
            return 'M0,0L' + width + ',' + height;
        }
    }
}
```

To customize styles, such as stroke color, provide the styles object with the stroke value:

```javascript
DataTypeValue: {
    attrs : {
        d : function (value, width, height) {
            return 'M0,0L' + width + ',' + height;
        }
    },
    styles : {
        stroke : '#0000ff'
    }
}
```

This results in the following custom glyph: ![Custom Glyph](/docs/img/completeCustomRendererDefault.png)

You can override any style attribute. For example, to adjust the stroke-width:

```javascript
DataTypeValue: {
    attrs: {
        d: function (value, width, height) {
            return 'M0,0L' + width + ',' + height;
        }
    },
    styles: {
        stroke: '#0000ff',
        'stroke-width': 3
    }
}
```

This results in the following custom glyph: ![Custom Glyph Thick](/docs/img/completeCustomThick.png)

To dynamically generate glyphs, provide a function for attributes or styles. For example, to scale the stroke-width by the size of the cell:

```javascript
DataTypeValue: {
    attrs: {
        d: function (value, width, height) {
            return 'M0,0L' + width + ',' + height;
        }
    },
    styles: {
        stroke: '#0000ff',
        'stroke-width': function (data, width, height) {
            return Math.floor(Math.sqrt(width * height) / 10);
        }
    }
}
```

This results in the following scalable custom glyph: ![Custom Glyph Scaled](/docs/img/completeRendererScaled.png)

#### Server-Side SVG Rastering

Server-side scripts should handle SVG file uploads, use a tool such as Apache Batik or CairoSVG to rasterize them, and return a link where the new image can be retrieved.
A simple PHP implementation:

```php
< ?php
	$fileName = $_FILES['data']['tmp_name'];
	$batikPath = 'batik/batik-rasterizer.jar';
	$downloadLink = 'retrieve.php?token=' . $fileName;

	if (is_uploaded_file($fileName)) {
		exec('java -jar ' . $batikPath . ' -d /tmp/' . $fileName . '.png ' . $fileName);
		echo $downloadLink;
	} else {
		header('400 Bad Request', true, 400);
	}
?>
```

...and:

```php
< ?php
	$fileName = '/tmp/' . $_GET['token'];
	if (file_exists($fileName)) {
		header('Content-Type: image/png');
		header('Content-Disposition: attachment; filename=' . $fileName);
		header('Pragma: no-cache');
		readfile($fileName);
	} else {
	 	header('410 File Not Found', true, 410);
	}
?>
```

### Options
GridVar built using the [jQuery UI Widget Factory][jquery-ui-widget-factory].  The following options are provided for supplying data to and customizing GridVar.

#### `cellHeight` (optional)

* type: Number
* default: 12px

Height in pixels of each cell and height of the rows.

#### `cellTip` (optional)

* type: Function
* default: undefined

Function that is called to fill in the 'title' field of each cell. This function will have one parameter, function(cellData), that contains a row of data as provided by the dataMapping option. For example, this may look like:

```javascript
function(cellData) {
	return ['<strong>',cellData.join(', '),'</strong>'].join('');
}
```

If qtip is available, then this is displayed as a tooltip when the user hovers over the cell.

#### `cellWidth` (optional)
* type: Number
* default: 12

Width in pixels of each cell and width of the columns.

#### `columnKeysToLabel` (optional)
* type: Object
* default: undefined

Object that maps column key to the column display name. If this isn't provided, the column key will be displayed.

```javascript
var columnKeysToLabel = {
	4235: 'This is a column label',
	myKey: 'Column Label'
};
```

#### `columnOrder`
* type: Array of Strings
* default: undefined

Ordered array of the keys of the column data. These should be consistent across the dataset itself and the data mappings. Updating this option animates the reordering. Example:

```javascript
$('#gridVar').gridVar('option', 'columnOrder',
	['firstColumnKey', 'secondColumnKey', 'thirdColumnKey']);
```

#### `dataDisplayMapping`
* type: Object
* default: undefined

An array of objects that maps the data type to either a user-provided glyph drawing function, built-in glyph, or a color mapping--the visual encoding. Each of these objects has 3 fields: `dataType`, `mappings`, and `labelMapping`.

The `dataType` field corresponds to the dataIndex (see the dataMapping option) and this indicates for which data this mapping encodes.

The `mappings` field translates the data value to either a color or a glyph. Colors are the hex encoding and start with a #. Glyphs defined by a string value, shown in the Renderers table below (ex. 'xRenderer'), or a user function that returns an SVG path given the value, cell width, and cell height. For example:

```javascript
mappings: {
	highValue: function(value, width, height){
		return 'M0,0L' + width + ',' + height;
	}
};
```

The 'labelMapping' is optional and is used for displaying text on the legend. If you find that the data value would be better displayed in a different format, you can specify the translation in a map from key to field. For example:

```javascript
var labelMapping = {
	low: 'Low Value',
	high: 'High',
	unknown: 'Unknown'
};
```

Altogether, this might look like:

```javascript
var mappings = [{
    dataType: 'mutation',
    mappings: {
        missense: '#FEC44F',
        nonsense: '#ADDD8E',
        unknown: '#b1b1b1'
    },
    labelMapping: {
    	missense: 'Missense Mutation',
    	nonsense: 'Nonsense Mutation',
    	unknown: 'Unknown'
    }
},
{
    dataType: 'copyNumber',
    mappings: {
        amplified: function(value, width, height){
        	return 'M0,0L' + width + ',' + height;
       	},
        deleted: 'minusRenderer',
        none: { attrs: {d : 'circleRenderer'} , styles : { stroke: 'black'}}
    },
    labelMapping: {
    	amplified: 'Amplified',
    	deleted: 'Deleted',
    	none: 'Unknown'
    }
}
];
```

For more details see Renderers

#### `dataMapping`
* value: Object
* default: undefined

This object holds a data index mapping and the dataset. `dataIndex` maps `dataType` to the array position of the
arrays provided to `data`. The data index must have `rowKey` and `columnKey` fields. For example:

```javascript
var dataIndex = {
	rowKey: 0, // position 0
 	columnKey: 1,
 	copyNumber: 2,
 	mutation: 3
};
```

The `data` field points to an array of arrays of data. The innermost array corresponds to a row of data with row and
column keys along with the actual data fields that you, for example, paired with the 'dataIndex' above, the data might look like:

```javascript
var data = [
 	['23123', 'TCGA-23123', ['amplified'], ['missense']],
 	['94982', 'TCGA-SAMPL', ['deleted'], ['nonsense']],
 	['55555', 'TCGA-DSJEN', ['neutral'], ['missense']]
];
```

The `dataMapping` wraps the above variables into the fields `dataIndex` and `data`.

```javascript
var dataMapping = {
	data: data,
	dataIndex: dataIndex
};
```

#### `exportOptions` (optional)
* type: Object
* default: undefined

Parameters that specify GridVar's internal SVG rendering and external PNG rasterizing capabilities. Supply a CSS
stylesheet to enable SVG export and a server-side script to enable PNG transcoding in addition to the optional libraries
in the panel to the right. Download links appear above the legend, if and only if the following options are defined.

```javascript
exportOptions: {
	style: 'GridVar/plugin/gridvar.css',
	server: 'upload.php'
}
```

#### `histogramMapping` (optional)
* type: Object
* default: undefined

Like the `dataMapping` option, this option maps the optional histogram data to the rows. It also includes an
optional `label` that will be displayed at the bottom of the histogram. The `data` field maps a row key to a
percent value. For example:

```javascript
var histogramMapping = {
    data: {
    	myRowKey: 0.24, // 24%
    	anotherRowKey: 1.0 // 100%
   	},
    label: 'Frequency'
};
```

#### `multipleLegendLines` (optional)
* type: Object
* default: undefined

Object with two values: a boolean to determine if the legend will be split into multiple lines, one for each category,
and an array of labels for each of those categories.

```javascript
var multipleLegendLines = {
    include: true,
    labels: ['Temperature: ', 'Cloud Levels: ']
};
```

#### `rowKeysToLabel` (optional)
* type: Object
* default: undefined

Object that maps row key to the column display name. If this isn't provided, the row key will be displayed.

```javascript
var rowKeysToLabel = {
	4235: 'This is a row label',
	myRowKey: 'Row Label'
};
```

#### `rowOrder`
* type: Array of Strings
* default: undefined

Ordered array of the keys of the row data. These should be consistent across the dataset itself and the data mappings. Updating this option animates the reordering. Example:

```javascript
$('#gridVar').gridVar('option', 'rowOrder', ['firstRowKey', 'firstRowKey', 'firstRowKey']);
```

### Events

#### `columnLabelClicked`
* parameters: `event`:Event, `columnKey`:String

This is fired when a column label is clicked. `event` is a jQuery Event. `columnKey` is the key that identifies that column.

#### `rowLabelClicked`
* parameters: `event`:Event, `rowKey`:String

This is fired when a row label is clicked. `event` is a jQuery Event. `rowKey` is the key that identifies that row.

### Renderers

The following built-in renderers are available for displaying glyphs within cells.

* `circleRenderer`: ![Circle Glyph](/docs/img/circleGlyph.png)
* `dotRenderer`: ![Dot Glyph](/docs/img/dotGlyph.png)
* `minusRenderer`: ![Minus Glyph](/docs/img/minusGlyph.png)
* `plusRenderer`: ![Plus Glyph](/docs/img/plusGlyph.png)
* `rectRenderer`: ![Rectangle Glyph](/docs/img/rectGlyph.png)
* `xRenderer`: ![X Glyph](/docs/img/xGlyph.png)

Issues
------

If you find bugs or have feature requests, please create [issues][issues] on GitHub.

Testing
-------

Tests are written using [QUnit][qunit]. Open the test page (/src/tests/qunit-test.html) in a web browser to run the tests in the browser, or run `$ grunt test` to run the test suite with PhantomJS. Visual tests can be inspected by opening the visual test page (/src/tests/visual-test.html) in a browser.

Developers
----------

Before building and testing GridVar, install dependencies using `$ npm install`. The following tasks can be run using [Grunt][grunt]:

* `grunt build` – Builds GridVar from source, generates a minified source, generates CSS using [Compass][compass], runs linting, and runs tests.
* `grunt lint` – Runs source and test files through JSHint.
* `grunt test` – Runs the test suite with PhantomJS.

License
-------

Copyright 2014 [Novartis Institutes for BioMedical Research, Inc.][nibr].

Licensed under the BSD 3-Clause License.

<!-- NIBR links -->
[examples]: http://opensource.nibr.com/gridvar/
[nibr]: http://nibr.com

<!-- assets -->
[zipball]: https://github.com/Novartis/gridvar/releases/download/v1.0.0/jquery.nibrGridVar.zip

<!-- github links -->
[issues]: http://github.com/Novartis/gridvar/issues

<!-- deep links -->
[built-in-renderers]: #built-in-renderers
[custom-renderers]: #custom-renderers

<!-- links to third party projects -->
[jQuery]: http://jquery.com/
[jquery-ui-widget-factory]: http://jqueryui.com/widget/
[jquery-ui]: http://jqueryui.com/
[d3]: https://github.com/mbostock/d3
[qunit]: http://qunitjs.com/
[underscore]: http://underscorejs.org/
[qtip]: http://qtip2.com/download
[filesaver]: https://github.com/eligrey/FileSaver.js/
[blob]: https://github.com/eligrey/Blob.js/
[compass]: http://compass-style.org/
[svg-path]: http://www.w3schools.com/svg/svg_path.asp
[svg-edit]: https://code.google.com/p/svg-edit/
[grunt]: http://gruntjs.com/
