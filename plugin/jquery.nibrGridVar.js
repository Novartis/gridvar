/*global _:false */
/*global d3:false */
/*global window:false */
/**
 * GridVar is a jQuery plugin that visualizes multi-dimensional datasets as 
 * layers organized in a row-column format. At each cell (i.e., rectangle at 
 * the intersection of a row and column), GridVar displays your data as a 
 * background color (like a color/heat map) and/or a glyph (shape). This 
 * enables different characteristics of your dataset to be layered on top of 
 * each other.
 * 
 * For documentation, see the GitHub: https://github.com/Novartis/gridvar
 */
(function ($) {
    'use strict';

    $.widget('nibr.gridVar', {

        /**
         * These options will be used as defaults
         */
        options: {
            cellWidth: 12,
            cellHeight: 12,
            transitionDuration: 1500,
            legendStyles: {'stroke-width' : 1, 'stroke' : '#aaaaaa', 'swatchDimension' : 10},
            styles: {
                'glyph': { 'fill': 'none', 'stroke': '#888888', 'stroke-width': 2, 'stroke-opacity': 1}
            },
            attrs: {
                'glyph': { 'opacity': 0.6, 'cssClass': 'glyph' }
            },
            histogramMapping: {
                label: 'Histogram',
                scale: 1,
                totalTicks: 2
            },
            multipleLegendLines: {
                include : false
            }
            /**
             * exportOptions: {
             *   style: 'http://localhost/GridVar/plugin/gridvar.css',
             *   server: 'http://localhost/upload.php'
             * }
             *
             * GridVar Export API **
             *
             * Download links appear above the legend, if and only if the above options are defined.
             * style: a hard link to a user-defined stylesheet for the labels, legend, histogram and layout.
             *         setting this option enables SVG export.
             * server: a hard link to an SVG->PNG rasterizing service.
             *         setting this option enables PNG export.
             *         service must accept an SVG file upload, rasterize it, and return a link to where the PNG can be retrieved.
             */
        },

        /**
         * Set up the widget
         */
        _create: function () {
            var self = this,
                sampleNamesMargin = self._calculateLabelSize(self.options.columnOrder, self.options.columnKeysToLabel, 15);
            // store some instance variables, such as our y axis
            self.yAxisMapping  = self._updateYAxisMapping(self.options.rowOrder);
            self.xAxisMapping = self._updateXAxisMapping(self.options.columnOrder);
            self.textScaleFactor = 15;
            self.yAxisBuffer = 5;
            self.yAxisWidth = self.yAxisBuffer + self._calculateLabelSize(self.options.rowOrder, self.options.rowKeysToLabel, self.yAxisBuffer);
            self.margin = {
                top: 10,
                right: self.yAxisWidth,
                // minimum or the preferred margin
                bottom: _.max([sampleNamesMargin, 60]),
                left: 0
            };

            // assemble renderers must be called before calculateDisplayStyles
            // add your new renderer here. It will add the renderer
            self.renderers = self._assembleRenderers(['dotRenderer', 'minusRenderer', 'plusRenderer', 'circleRenderer', 'xRenderer', 'rectRenderer']);
            self.displayStyles = self._calculateDisplayStyles(self.options.dataDisplayMapping);

            self.render();
        },

        /**
         * Returns the preferred width/height needed for the column or row labels.
         *
         * @param keys: The row or column keys.
         * @param keysToLabel: This is the optional mapping of the keys to labels.
         * @param padding: a padding value to add at the end
         * @returns {Number}
         */
        _calculateLabelSize: function (keys, keysToLabel, padding) {
            var self = this,
                width = 0;
            _(keys).each(function (key) {
                var label = (!_.isUndefined(keysToLabel) && _.has(keysToLabel, key)) ? keysToLabel[key] : key,
                    labelSize = self._calculateTextSize(label);
                if (labelSize > width) {
                    width = labelSize;
                }
            });
            // make it just a little larger
            width += padding;
            return width;
        },

        /**
         * This puts together all the renderers that the API user will have access to. If you
         * make a new renderer in this plug-in, add it to the list here.
         *
         * @returns the renderers
         */
        _assembleRenderers: function (renderNames) {
            var self = this,
                renderers = {};
            // the renderer name will be added to the map of renderers and the
            // renderer function must start with an underscore followed by the
            // same name
            _(renderNames).each(function (name) {
                renderers[name] = self['_' + name];
            });
            return renderers;
        },
        
        /**
         * The default renderer options for styles and attrs
         * @returns  {fill: '#FEC44F', stroke: '#a9a9a9', stroke-width: 0, stroke-opacity: 1} ||
         *           {opacity: 0.6, class: 'nibr-gridVar-glyph'}
         */
        _getDefaultOptions: function (optionType) {
            var self = this;
            //styles is simple, just return them
            if (optionType === 'styles') {
                return self.options.styles.glyph;
            }
            //attribs are a bit more complicated, we need to calculate the class
            //adjusting the paramters which are passed for height and width.
            return {
                'opacity': self.options.attrs.glyph.opacity,
                'class': self._createCssClass(self.options.attrs.glyph.cssClass)
            };
        },
        
        /**
         * mix the renderer default options and the simple renderer options into a standard one
         *  @returns {fill: '#FEC44F', stroke: '#a9a9a9', stroke-width: 0, stroke-opacity: 1}  ||
         *  {opacity: 1, height: 11, width: 11, class: 'nibr-gridVar-cell-box'}
         */
        _getRenderOpts: function (options, optionType) {
            var self = this,
                newOptions = {},
                attrFunctions = {},
                defaultOptions = self._getDefaultOptions(optionType);
            //populate newOptions by merging defaultOptions with passed options
            _.extend(newOptions, defaultOptions, options);
            _.each(newOptions, function (value, key) {
                var newFunction = {};
                if (_.isFunction(value)) {
                    //if we have a function wrap it passing in the d3NodeData which d3 will do
                    //we need to wrap it to pass in the width and height of the cell in addition to the d3 value
                    newFunction = function (d3NodeData) {
                        var d3Obj = d3.select(this),
                            width = d3Obj.attr('width'),
                            height = d3Obj.attr('height');
                        //d3 will add the "this" as a context as well as a added parameter
                        return value.call(this, d3NodeData, width, height);
                    };
                } else {
                    //just a simple value no need to wrap it
                    newFunction = value;
                }
                //add the function or value to the options
                attrFunctions[key] = newFunction;
            });
            return attrFunctions;
        },
        
        /**
         * normalize the simple user provided renderers into the more complete standard renderers
         * return the standard renderers for supplied standard renderers
         * @returns {'renderOpts': { 'attrs': {}, 'styles': {fill: '#ADDD8E'}, 'renderType': 'background'} ||
         *  {'renderOpts': { 'attrs': {'d' : function (value, width, height){return 'M0,0L' + width + ',' + height;} }, 'styles': {} }, 'renderType' : 'glyph'}
         */
        _normalizeRenderers: function (renderer) {
            var self = this,
                styleAndAttr = {};
            //check for the simple value renderer options, background or built-in
            if (!(_.isFunction(renderer) || _.isObject(renderer))) {
                //is this s simple bg color?
                if (renderer.substring(0, 1) === '#') {
                    styleAndAttr.styles = {'stroke-width' : 0, 'opacity': 1, 'fill': renderer, 'stroke' : self.options.styles.stroke};
                    styleAndAttr.attrs = {'d' : self.renderers.rectRenderer};
                    return {'renderOpts': styleAndAttr, 'renderType': 'background' };
                }
                //is this a built-in renderer
                if (_.has(self.renderers, renderer)) {
                    styleAndAttr.styles = {};
                    styleAndAttr.attrs = {'d': self.renderers[renderer]};
                    return {'renderOpts': styleAndAttr, 'renderType': 'glyph'};
                }
                //could not parse this, should have been a bg color or a built-in renderer
                throw self.name + 'Error: I could not find the built-in renderer ' + renderer + ' .' +
                    '  Avaliable renderers are: ' + _.keys(self.renderers) +
                    ' if you wish to use a background color it must start with a #';

            }
            //see if we have a simple function, this assumes the funtion will return a path string for d3
            if (_.isFunction(renderer)) {
                styleAndAttr.styles = {};
                styleAndAttr.attrs = {'d': renderer};
                return { 'renderOpts': styleAndAttr, 'renderType': 'glyph'};
            }
            //this is the extended object of attrs and/or styles
            //make sure we have a attrs or styles object
            if (_.has(renderer, 'attrs') || _.has(renderer, 'styles')) {
                //check if the 'd' is a built-in renderer or not
                //make sure attrs exists
                if (_.has(renderer, 'attrs')) {
                    //see if attrs has a 'd' value
                    if (_.has(renderer.attrs, 'd')) {
                        //check if the 'd' value is a built-in renderer
                        if (_.has(self.renderers, renderer.attrs.d)) {
                            renderer.attrs.d = self.renderers[renderer.attrs.d];
                        }
                    }
                }
                //return the renderOpts merged with empty objects, so we have both styles and attrs objects
                return { 'renderOpts': _.extend({ 'styles': {}, 'attrs': {}}, renderer), 'renderType': 'glyph' };
            }
            //the renderObject had neither styles nor attribs, this is wrong
            throw self.name + ' the render object is of the wrong format; you should have at least a attrs or styles object at a minimum';
        },

        /**
         * walks down dataDisplayMappings and stores swatch colors, renderers, label mappings into self.style
         *
         * @param displayMappings
         * @returns {"mutation": {
         *              "Missense": {
         *                  "renderType": "glyph",
         *                  "styles": {
         *                      "fill": "#bb88bb",
         *                      "stroke-width": 0,
         *                      "stroke-opacity": 1,
         *                      "opacity": 1
         *                  },
         *                  "attrs": {
         *                      "opacity": 0.6,
         *                      "height": 30,
         *                      "width": 9,
         *                      "class": "nibr-gridVar-glyph"
         *                  }
         *              },
         *              "other non-synonymous": {
         *                  "renderType": "glyph",
         *                  "styles": {
         *                      "fill": "#777777",
         *                      "stroke-width": 0,
         *                      "stroke-opacity": 1,
         *                      "opacity": 1
         *                  },
         *                  "attrs": {
         *                      "opacity": 0.6,
         *                      "height": 30,
         *                      "width": 9,
         *                      "class": "nibr-gridVar-glyph"
         *                  }
         *                  },
         *                  "labels": {
         *                      "Missense": "Missense",
         *                      "other non-synonymous": "other non-synonymous"
         *                  }
         *              }
         *          }
         * @private
         */
        _calculateDisplayStyles: function (displayMappings) {
            var self = this,
                styles = {};
            _(displayMappings).each(function (mapping) {
                var newStyle = {};
                _(mapping.mappings).each(function (value, key) {
                    //put the simple renderers into the default format
                    var renderObj = self._normalizeRenderers(value),
                    //merge the default renderOptions with the provided ones
                        normalStyles = self._getRenderOpts(renderObj.renderOpts.styles, 'styles'),
                        normalAttrs = self._getRenderOpts(renderObj.renderOpts.attrs, 'attrs');
                    //create the normalized merged renderers, attrs and styles
                    newStyle[key] = {'renderType': renderObj.renderType,
                        'styles': normalStyles,
                        'attrs': normalAttrs};
                    //we have to unwrap the builtin renderers, get to the core function
                });
                //if we did not get a label Mapping from the users, go with the default names
                if (!_(mapping).has('labelMapping')) {
                    mapping.labelMapping = self._createLabelMapping(mapping.mappings);
                }
                // copy the labelMappings over, copy by REFERENCE
                newStyle.labels = mapping.labelMapping;
                // store the labels
                styles[mapping.dataType] = newStyle;
            });
            return styles;
        },
        
        /**
         * //create a label mapping from all the data type keys
         * @param mappings
         * @returns {"Missense":"Missense","other non-synonymous":"other non-synonymous"}
         * @private
         */
        _createLabelMapping: function (mappings) {
            var labelMapping = {};
            _(mappings).each(function (value, key) {
                labelMapping[key] = key;
            });
            return labelMapping;
        },
        
        /**
         * get the height of the gridVar cells display
         * @param numberOfKeys
         * @returns {number}
         * @private
         */
        _getHeight: function (numberOfKeys) {
            var self = this;
            if (numberOfKeys === undefined) {
                numberOfKeys = self.options.rowOrder.length;
            }
            return numberOfKeys * self.options.cellHeight;
        },
        
        /**
         * get the width of the gridVar cells display
         * @param numberOfKeys
         * @returns {number}
         * @private
         */
        _getWidth: function (numberOfKeys) {
            var self = this;
            if (numberOfKeys === undefined) {
                numberOfKeys = self.options.columnOrder.length;
            }
            return numberOfKeys * self.options.cellWidth;
        },

        /**
         * get widget base class name
         * jquery 1.9 and higher have a different variable name for this value
         * @returns {string}
         * @private
         */
        _getWidgetBaseClass: function() {
            var self = this,
                uiVersion = $.ui.version.split('.'),
                baseClass;

            if (uiVersion[0] > 1) {
                baseClass = self.widgetFullName;
            }
            else if (uiVersion[1] > 8) {
                baseClass = self.widgetFullName;
            }
            else {
                baseClass = self.widgetBaseClass;
            }

            return baseClass;
        },

        /**
         * @param keys
         * @returns {function n(t){return o[((s.get(t)||s.set(t,e.push(t)))-1)%o.length]}}
         * @private
         */
        _updateXAxisMapping: function (keys) {
            var self = this,
                width = self._getWidth(keys.length);
            //changed to not reference internal vars but to return the value
            return d3.scale.ordinal().domain(keys).rangeRoundBands([0, width], 0);
        },
        
        /**
         * @param keys
         * @returns {function n(t){return o[((s.get(t)||s.set(t,e.push(t)))-1)%o.length]}}
         * @private
         */
        _updateYAxisMapping: function (keys) {
            var self = this,
                height = self._getHeight(keys.length);
            //change to not referenece internal vars but to return the value
            return d3.scale.ordinal().domain(keys).rangeRoundBands([0, height], 0);
        },
        
        /**
         * Use the _setOption method to respond to changes to options.
         * @param key
         * @param value
         * @private
         */
        _setOption: function (key, value) {
            var self = this;

            // In jQuery UI 1.8, you have to manually invoke the _setOption
            // method from the base widget
            $.Widget.prototype._setOption.apply(this, arguments);

            if (key === 'columnOrder') {
                // update the column ordering
                self._updateColumnOrdering(value);
            } 
            else if (key === 'rowOrder') {
                self._updateRowOrdering(value);
            }
            else if (key === 'histogramMapping') {
                self._updateHistogram();
            }   
        },

        /**
         * Called when the column ordering needs updating.  A side effect is that a
         * new xAxisMapping is created.
         * @param ordering
         * @private
         */
        _updateColumnOrdering: function (ordering) {
            var self = this,
                y = self.yAxisMapping,
                columnIdToName = self.options.columnKeysToLabel || {},
                t = d3.select(self._getHeatmapSelector())
                    .transition()
                    .duration(self.options.transitionDuration),
                dataIndex = self.options.dataMapping.dataIndex,
                xAxis;

            // update the x axis mapping
            self.xAxisMapping = self._updateXAxisMapping(ordering);
            t.selectAll('.' + self._createCssClass('cell'))
                .attr('transform', function (d) {
                    var translation = [self.xAxisMapping(d[dataIndex.columnKey]), y(d[dataIndex.rowKey])];
                    return 'translate(' + translation.join(',') + ')';
                });

            // update the labels
            xAxis = d3.svg.axis()
                .scale(self.xAxisMapping)
                .ticks(self.xAxisMapping.length).orient('bottom');
            t.select('.x.' + self._createCssClass('axis'))
                .delay(function (d, i) {
                    return i * 4;
                })
                .call(xAxis);

            // update the display names too
            t.select('.x.' + self._createCssClass('axis'))
                .selectAll('text')
                .attr('class', self._getWidgetBaseClass())
                .style('text-anchor', 'end')
                .text(function (d) {
                    // display the label
                    return columnIdToName[d] || d;
                });

        },
        
        /**
         * Called when the row ordering needs updating.  A side effect is that a
         * new yAxisMapping is created.
         *
         * @param ordering The new order of column keys to use.
         */
        _updateRowOrdering: function (ordering) {
            var self = this,
                x = self.xAxisMapping,
                t = d3.select(self._getHeatmapSelector())
                    .transition()
                    .duration(self.options.transitionDuration),
                gridLabels = d3.select('.' + self._createCssClass('grid-label-rows')),
                rowKeysToLabel = self.options.rowKeysToLabel || {},
                dataIndex = self.options.dataMapping.dataIndex,
                yAxis;

            // update the x axis mapping
            self.yAxisMapping  = self._updateYAxisMapping(ordering);

            // move the individual cells
            t.selectAll('.' + self._createCssClass('cell'))
                .attr('transform', function (d) {
                    var translation = [x(d[dataIndex.columnKey]), self.yAxisMapping(d[dataIndex.rowKey])];
                    return 'translate(' + translation.join(',') + ')';
                });

            // update the labels
            yAxis = d3.svg.axis()
                .scale(self.yAxisMapping)
                .ticks(self.yAxisMapping.length).orient('right');
            // having the labels messes up the x positioning--something about the
            // transition, so lets just flash (change the opacities) instead for now
            gridLabels.select('.y.' + self._createCssClass('axis'))
                .call(yAxis)
                .selectAll('text')
                .text(function (d) {
                    // display the label or key
                    return rowKeysToLabel[d] || d;
                })
                .style('text-anchor', 'end')
                .attr('x', self.yAxisWidth - self.yAxisBuffer)
                .attr('opacity', 0)
                .transition()
                .attr('opacity', 1)
                .duration(self.options.transitionDuration)
                .delay(function (d, i) {
                    return i * 4;
                });

            // update the histogram if the data exists
            if (self._hasHistogram()) {
                // set the new order to the histogram bars
                d3.selectAll('rect.' + self._createCssClass('bar')).data(self.options.rowOrder); //FIXME: consider removing

                self._updateHistogram();
            }

        },

        /**
         * Use the destroy method to clean up any modifications your widget has
         * made to the DOM.
         */
        destroy: function () {
            var self = this;

            // In jQuery UI 1.8, you must invoke the destroy method from the
            // base widget
            self.remove();

            $.Widget.prototype.destroy.call(this);
            // In jQuery UI 1.9 and above, you would define _destroy instead of destroy and not call the base method
        },

        _calculateTextSize: function (text) {
            return text.length * 7;
        },

        /**
         * Returns the position of where each legend element should go according
         * to it's order, swatch size, and text length.
         */
        _calculateLegendPositions: function (swatchDimension, labels) {
            var self = this,
                padding = 20,
                legendPositions = [],
                multipleLines = self.options.multipleLegendLines,
                // if no titles are supplied, legend items should start where the titles would have
                currentTextX = 0,
                legendTitles;

            // if adding titles for legend categories, currentTextX needs to accommodate that
            if(multipleLines.include && !_.isUndefined(multipleLines.labels)) {
                legendTitles = _.clone(multipleLines.labels);
                currentTextX = 5 * _(legendTitles).max(function(label) {
                    return label.length;
                }).length;
            }

            _(labels).each(function (label) {
                legendPositions.push(currentTextX);
                currentTextX += label.length * 6 + swatchDimension + padding;
            });
            return legendPositions;
        },

        _createLegend: function (ds) {
            var self = this,
                textY = 13,
                swatchDimension = self.options.legendStyles.swatchDimension,
                legendHeight = swatchDimension * 2 + 5,
                swatchesOffset = 5,
                multipleLines = self.options.multipleLegendLines,
                legendSVG,
                ty,
                labels;

            if(_.isUndefined(ds)) {
                ds = self.displayStyles;
            }

            // legend elements one line per type
            if(multipleLines.include) {
                labels = _.clone(multipleLines.labels),
                ty = 5;

                // create a default if the labels are unset
                if(_.isUndefined(labels)) {
                    labels = [];
                    _(ds).each(function() {
                        labels.push('');
                    });
                }

                // redefine constants to accommodate multiple lines
                textY = 5;
                legendHeight *= _.size(ds);
                swatchesOffset = 5 + _(labels).max(function(label) {
                    return label.length;
                }).length;

                legendSVG = d3.select(self._getLegendSelector()).append('svg')
                    .attr('width', '100%')
                    .attr('height', legendHeight)
                    .append('g');

                // go through each display style and render the legend
                _(ds).each(function (displayStyle) {
                    var label = labels.shift(),
                        legendGroup;

                    legendGroup = legendSVG
                        .append('g')
                        .attr('class', self._createCssClass('renderings'))
                        .attr('transform', 'translate(' + swatchesOffset + ',' + ty + ')');

                    self._renderLegends(displayStyle, legendGroup, textY, swatchDimension, displayStyle.labels);

                    // add the label
                    legendGroup = d3.select(self._getLegendSelector()).select('g')
                        .insert('text', '.' + self._createCssClass('renderings'))
                        .attr('transform', 'translate(0,' + (ty + 10) + ')')
                        .text(label)
                        .attr('class', self._createCssClass('legend-category-label'));

                    // increment for separate line
                    ty += (legendHeight / _.size(ds));
                });
            }
            // legend elements all in one line
            else {
                legendSVG = d3.select(self._getLegendSelector()).append('svg')
                    .attr('width', '100%')
                    .attr('height', legendHeight)
                    .append('g');

                // go through each display style and render the legend
                _(ds).each(function (displayStyle) {
                    var legendGroup = legendSVG.append('g')
                        .attr('class', self._createCssClass('renderings'))
                        .attr('transform', 'translate(' + swatchesOffset + ',0)');

                    self._renderLegends(displayStyle, legendGroup, textY, swatchDimension, displayStyle.labels);
                    //
                    swatchesOffset += legendGroup[0][0].getBBox().width + 10;
                });
            } 
        },
        
        _renderLegends: function (displayStyle, legend, textY, swatchDimension, labels) {
            var self = this,
                swatchY = swatchDimension * 0.5,
            //these could / should be passed in?
                legendLabels = _.values(labels),
                orderedKeys = _.keys(labels),
                legendPositions = [],
                multipleLines = self.options.multipleLegendLines;

            // redefine constants to accommodate multiple lines
            if(!_.isUndefined(multipleLines) && multipleLines.include) {
                swatchY = 0;
                textY = textY * 1.5;
            }

            // figure out where each swatch label grouping starts
            legendPositions = self._calculateLegendPositions(swatchDimension, legendLabels);
            // go through the legend in order and draw the swatches
            legend.selectAll(self._createCssClass('legend-glyph'))
                .data(orderedKeys)
                .enter()
                .append('path')
                .attr('width', swatchDimension)
                .attr('height', swatchDimension)
                .call(self._applyStylesGroup, displayStyle, orderedKeys, self)
                .call(self._applyAttrsGroup, displayStyle, orderedKeys, self)
                .attr('class', self._createCssClass('legend-glyph'))
                .attr('transform', function (element, index) {
                    var translation = [legendPositions[index], swatchY];
                    return 'translate(' + translation.join(',') + ')';
                });
           //outline the legends
            legend.selectAll(self._createCssClass('legend-glyph'))
                .data(orderedKeys)
                .enter()
                .append('rect')
                .attr('fill', 'none')
                .attr('stroke', self.options.legendStyles.stroke)
                .attr('stroke-width', function(d){
                    if (displayStyle[d].renderType === 'background') {
                        return 2;
                    } else {
                        return 0;
                    }
                })
                .attr('width', swatchDimension + self.options.legendStyles['stroke-width'])
                .attr('height', swatchDimension + self.options.legendStyles['stroke-width'])
                .attr('transform', function (element, index) {
                    var translation = [legendPositions[index] - self.options.legendStyles['stroke-width'], swatchY - (self.options.legendStyles['stroke-width'])];
                    return 'translate(' + translation.join(',') + ')';
                });

            // go through the labels and render them
            legend.selectAll(self._createCssClass('legend-label'))
                .data(legendLabels)
                .enter()
                .append('svg:text')
                .text(function (element) {
                    return element;
                })
                .attr('class', self._createCssClass('legend-label'))
                .attr('transform', function (element, index) {
                    // move the label over to be next to the swatch
                    var translation = [legendPositions[index] + swatchDimension + 5, textY];
                    return 'translate(' + translation.join(',') + ')';
                });
        },
        _minusRenderer: function (value, cellWidth, cellHeight) {
            var cellSize = _([cellWidth, cellHeight]).min(),
                halfCell = cellSize * 0.5,
                r = halfCell * (1 / 3);
            // draw a '-' sign
            return 'M' + r + ',' + halfCell + 'H' + (cellSize - r);
        },

        //returns a path for rendering a plus for a 'd' attr in d3
        _plusRenderer: function (value, cellWidth) {
            var halfCell = (cellWidth) * 0.50,
                r = halfCell * (1 / 3);
            // draw a plus sign
            return 'M' + halfCell + ',' + r + 'V' + (cellWidth - r) + 'M' + r + ',' + halfCell + 'H' + (cellWidth - r);
        },

        //returns a path for rendering a dot for a 'd' attr in d3
        _dotRenderer: function (value, cellWidth, cellHeight) {
            var cellSize = _([cellWidth, cellHeight]).min(),
                diameter = 1 * 2,
                halfCell = cellSize * 0.5;
            return 'M ' + halfCell + ',' + halfCell +
                'm -' + 1 + ', 0' +
                'a ' + 1 + ',' + 1 + ' 0 1,0  ' + diameter + ',0' +
                'a ' + 1 + ',' + 1 + ' 0 1,0 -' + diameter + ',0';
        },
        //returns a path for rendering a circle for a 'd' attr in d3
        _circleRenderer: function (value, cellWidth, cellHeight) {
            var halfCell = _([cellWidth, cellHeight]).min() * 0.5,
                r = halfCell * (1 / 3),
                diameter = r * 2;
            // draw a circle
            return 'M ' + halfCell +
                ',' + halfCell + 'm -' +
                r + ', 0' + 'a ' + r + ',' +
                r + ' 0 1,0  ' + diameter +
                ',0' + 'a ' + r + ',' + r +
                ' 0 1,0 -' + diameter + ',0';
        },
        
        /**
         *returns a SVG path for d3
         * @param value
         * @param width
         * @param height
         * @returns {'M0,0L11,0,L11,11,L0,11,L0,0'}
         * @private
         */
        _rectRenderer: function (value, width, height) {
            return 'M0,0L' + (width - 1) + ',0' +
                'L' + (width - 1) + ',' + (height - 1) +
                'L0' + ',' + (height - 1) +
                'L0,0';
        },
        
        /**
         * Returns a path for rendering a X for a 'd' attr in d3
         */
        _xRenderer: function (value, cellWidth, cellHeight) {
            var center = (_([cellWidth, cellHeight]).min() - 1)* 0.5,
                r = center * (1 / 2),
                ul = [ center - r,
                    center - r ].join(','),
                lr = [ center - r,
                    center + r ].join(','),
                ur = [ center + r,
                    center - r ].join(','),
                ll = [ center + r,
                    center + r ].join(',');
            // this is the path for the x glyph
            return 'M' + ul + 'L' + ll + 'M' + lr + 'L' + ur;
        },

        /**
         * Creates qtip tooltips.  This should only be called after checking to make sure that
         * qtip is loaded.
         *
         * @param tipSelect
         * @param isDisabled
         */
        _createToolTip: function (tipSelect, isDisabled) {
            $(tipSelect).qtip({
                position: {
                    my: 'bottom left',
                    target: 'mouse',
                    viewport: $(window), // Keep it on-screen at all times if possible
                    adjust: {
                        x: 5, y: -5
                    }
                },
                hide: {
                    fixed: true, // Helps to prevent the tooltip from hiding ocassionally when tracking!
                    effect: function () {
                        // we don't want a duration b/c if we move too fast, the tooltip
                        // won't hide/show because it's already animating
                        $(this).animate({ opacity: 0 }, { duration: 0 });
                    }
                },
                show: {
                    effect: function () {
                        // we don't want a duration b/c if we move too fast, the tooltip
                        // won't hide/show because it's already animating
                        $(this).show().css({ opacity: 0 }).animate({ opacity: 1 }, { duration: 0 });
                    }
                },
                style: 'ui-tooltip-shadow'
            });

            if (isDisabled) {
                $(tipSelect).qtip('hide').qtip('disable');
            }
        },

        /**
         * Draws the left side histogram.  Mapping is an object with data and
         * a histrogram label.  This shares some state with the updateHistogram() method.
         * Keep it in synch.
         */
        _drawHistogram: function (mapping) {
            var self = this,
                data = mapping.data,
                y = self.yAxisMapping,
                x,
                margin = {top: self.margin.top, right: 60, bottom: self.margin.bottom, left: 10},
                width = 120 - margin.left - margin.right,
                height = self._getHeight(),
                scale = self._getHistogramScale(),
                tickValues = self._getTickValues(),
                histogram, 
                yAxis, 
                xAxis;

            x = d3.scale.linear()
                .domain([scale, 0])
                .range([0, width]);

            xAxis = d3.svg.axis()
                .scale(x)
                .tickValues(tickValues)
                .orient('bottom')
                .tickPadding(8);

            yAxis = d3.svg.axis()
                .scale(y)
                .orient('right')
                .tickSize(0)
                .tickPadding(8);

            histogram = d3.select(self._getHistogramSelector()).append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            histogram.selectAll(self._createCssClass('bar'))
                .data(self.options.rowOrder)
                .enter()
                .append('rect')
                .attr('class', self._createCssClass('bar'))
                .attr('y', function (rowKey) {
                    return y(rowKey);
                })
                .attr('height', y.rangeBand())
                .attr('x', width)
                .attr('width', 0)
                .transition()
                .delay(function (d, i) {
                    return i * 4;
                })
                .duration(self.options.transitionDuration)
                .attr('x', function (rowKey) {
                    return x(data[rowKey]);
                })
                .attr('width', function (rowKey) {
                    return width - x(data[rowKey]);
                });

            histogram.append('g')
                .attr('class', self._createCssClass('xaxis'))
                .attr('transform', 'translate(0,' + y.rangeExtent()[1] + ')')
                .call(xAxis);

            // rotate the x axis labels
            histogram.select('.' + self._createCssClass('xaxis')).selectAll('text')
                .attr('transform', 'translate(-18,15)rotate(-90)')
                .text(function (d) {
                    return (d * 100).toFixed(0) + '%';
                })
                .style('text-anchor', 'end');

            histogram.append('g')
                .attr('class', self._createCssClass('yaxis'))
                .attr('transform', 'translate(' + width + ',0)')
                .call(yAxis)
                .selectAll('text')
                .text(function (d) {
                    return (data[d] * 100).toFixed(1) + '%';
                });

            // the label is optional
            if (_(mapping).has('label')) {
                histogram.append('text')
                    .attr('class', self._createCssClass('x label'))
                    .attr('y', height + margin.top + margin.bottom - 20)
                    .attr('x', width + margin.left + margin.right - 30)
                    .text(mapping.label);
            }
        },

        _getTickValues: function () {
            var self = this,
                scale = self._getHistogramScale(),
                totalTicks = self.options.histogramMapping.totalTicks,
                tickValues = [],
                i;

            if (totalTicks === 1) {
                tickValues.push(scale);
            }
            else if(totalTicks > 0) {
                for(i=0; i < totalTicks; i += 1) {
                    tickValues.push(scale * (i / (totalTicks - 1)) );
                }
            }

            return tickValues;
        },

        _getHistogramScale: function () {
            var self = this,
                scale = self.options.histogramMapping.scale;

            if (scale === 'auto') {
                scale = _(self.options.histogramMapping.data).max(function(d) {
                    return d;
                });
            }

            return scale;
        },

        /**
         * This shares some state with the drawHistogram() method.  Keep it in synch.
         */
        _updateHistogram: function () {
            var self = this,
                histogramData = self.options.histogramMapping.data,
                margin = {top: self.margin.top, right: 60, bottom: self.margin.bottom, left: 10},
                histoWidth = 120 - margin.left - margin.right,
                histogramYAxis = d3.svg.axis()
                    .scale(self.yAxisMapping)
                    .orient('right')
                    .tickSize(0)
                    .tickPadding(8),
                scale = self._getHistogramScale(),
                tickValues = self._getTickValues(),
                histoX,
                histogramXAxis;

            histoX = d3.scale.linear()
                .domain([scale, 0])
                .range([0, histoWidth]);

            histogramXAxis = d3.svg.axis()
                .scale(histoX)
                .tickValues(tickValues)
                .orient('bottom')
                .tickPadding(8);

            d3.selectAll('rect.' + self._createCssClass('bar'))
                .transition()
                .duration(self.options.transitionDuration)
                .attr('y', function (rowKey) {
                    return self.yAxisMapping(rowKey);
                })
                .attr('x', function (rowKey) {
                    return histoX(histogramData[rowKey]);
                })
                .attr('width', function (rowKey) {
                    return histoWidth - histoX(histogramData[rowKey]);
                })
                .delay(function (d, i) {
                    return i * 4;
                });

            d3.select('.' + self._createCssClass('yaxis'))
                .transition()
                .duration(self.options.transitionDuration)
                .call(histogramYAxis)
                .selectAll('text')
                .text(function (d) {
                    return (histogramData[d] * 100).toFixed(1) + '%';
                })
                .delay(function (d, i) {
                    return i * 4;
                });

            d3.select('.' + self._createCssClass('xaxis'))
                .call(histogramXAxis)
                .selectAll('text')
                .attr('transform', 'translate(-18,15)rotate(-90)')
                .text(function (d) {
                    return (d * 100).toFixed(0) + '%';
                })
                .style('text-anchor', 'end');
        },

        /**
         * This is where the meat of the work is done and needs to be implemented
         * by the concrete rendering classes.
         */
        _renderCells: function (heatmap, cells) {
            var self = this,
                dataIndex = self.options.dataMapping.dataIndex,
                displayStyles = self.displayStyles,
                displayMappings = self.options.dataDisplayMapping;

            // for each cell, you'd like to do something
            cells.each(function (cellData) {
                var cell = this;
                _(displayMappings).each(function (mapping) {
                    var dataType = mapping.dataType,
                        nStyles = displayStyles[dataType],
                        validData = _(nStyles).keys(),
                        cleanedData = [];

                    // filter out anything that you don't have mappings for
                    cleanedData = _(cellData[dataIndex[dataType]]).filter(function (questionableData) {
                        return _(validData).contains(questionableData);
                    });

                    // draw the cell
                    d3.select(cell).selectAll()
                        .data(cleanedData)
                        .enter()
                        .append('path')
                        .attr('width', self.options.cellWidth)
                        .attr('height', self.options.cellHeight)
                        .call(self._applyStyles, nStyles, cleanedData)
                        .call(self._applyAttrs, nStyles, cleanedData);
                });
            });
        },
        
        _attrWrapper: function (theStyles) {
            return function (d) {
                var theThis = this,
                    ts = theStyles;
                _.each(ts[d].attrs, function (value, key) {
                    d3.select(theThis).attr(key, value);
                });
            };
        },
        
        _styleWrapper: function (theStyles) {
            return function (d) {
                var theThis = this,
                    ts = theStyles;
                _.each(ts[d].styles, function (value, key) {
                    d3.select(theThis).style(key, value);
                });
            };
        },
        
        _applyAttrsGroup: function (selection, styles, theData, self) {
            _.each(theData, function () {
                selection.each(self._attrWrapper(styles));
            });
        },
        
        _applyStylesGroup: function (selection, styles, theData, self) {
            selection.each(self._styleWrapper(styles));
        },
        
        /**
         * Applies the styles to the d3 selection from an array of style objects
         */
        _applyStyles: function (selection, styles, cleanData) {
            if (!_.isUndefined(styles[cleanData])) {
                var theStyles = styles[cleanData].styles;
                _.each(theStyles, function (value, key) {
                    selection.style(key, value);
                });
            }
        },
        
        /**
         * applies the attributes to the d3 selection from an array of attribute objects
         */
        _applyAttrs: function (selection, styles, cleanData) {
            if (!_.isUndefined(styles[cleanData])) {
                var theAttrs = styles[cleanData].attrs;
                _.each(theAttrs, function (value, key) {
                    selection.attr(key, value);
                });
            }
        },

        /**
         * This is a convenience function for creating a name for a class in the namespace
         * of the plugin.
         */
        _createCssClass: function (baseClass) {
            var self = this;

            return [self._getWidgetBaseClass(), '-', baseClass].join('');
        },

        _createCells: function (heatmap) {
            var self = this,
                xByFrequency = self.xAxisMapping,
                y = self.yAxisMapping,
                data = self.options.dataMapping.data,
                dataIndex = self.options.dataMapping.dataIndex,
                // position the cells and add tooltips to them
                cells = heatmap.selectAll('.' + self._createCssClass('cell'))
                    .data(data)
                    .enter()
                    .append('g')
                    .attr('class', self._createCssClass('cell'))
                    .attr('transform', function (d) {
                        var translation = [xByFrequency(d[dataIndex.columnKey]), y(d[dataIndex.rowKey])];
                        return 'translate(' + translation.join(',') + ')';
                    })
                    .attr('title', function (cellData) {
                        var html = '';
                        if (self.options.cellTip) {
                            html = self.options.cellTip(cellData);
                        }
                        return html;
                    })
                    .on('click', function (d) {
                        self._trigger('cellClicked', undefined, [d]);
                    });
            return cells;
        },

        /**
         * Returns the jquery selector for the heatmap. Render must be called before this returns the
         * selector.
         */
        _getHeatmapSelector: function () {
            var self = this;
            return $(self.element.children()[4]).children()[0];
        },

        _getGridLabelsSelector: function () {
            var self = this;
            return self.element.children()[3];
        },

        _getHistogramSelector: function () {
            var self = this;
            return self.element.children()[2];
        },

        _getLegendSelector: function () {
            var self = this;
            return self.element.children()[1];
        },

        _getExportSelector: function () {
            var self = this;
            return self.element.children()[0];
        },

        /**
         * This is called at some point.
         */
        render: function () {
            var self = this,
                rowIdToName = self.options.rowKeysToLabel || {},
                columnIdToName = self.options.columnKeysToLabel || {},
                // if this changes, adjust _getHeatmapSelector() and _getGridLabelsSelector
                canvases = ['<div class="' + self._createCssClass('export') + '"></div>',
                    '<div class="' + self._createCssClass('legend') + '"></div>',
                    '<div class="' + [self._createCssClass('histogram'), self._createCssClass('left')].join(' ') + '"></div>',
                    '<div class="' + [self._createCssClass('grid-labels'), self._createCssClass('left')].join(' ') + '"></div>',
                    '<div class="' + self._createCssClass('container') + '">',
                    '<div class="' + self._createCssClass('heatmap') + '"></div>',
                    '</div>'],
                margin = self.margin,
                width = self._getWidth(),
                height = self._getHeight(),
                xOrder = self.xAxisMapping,
                y = self.yAxisMapping,
                cells,
                // renders D3 data to SVG
                xAxis = d3.svg.axis().scale(xOrder).ticks(xOrder.length).orient('bottom'),
                yAxis = d3.svg.axis().scale(y).ticks(y.length).orient('right'),
                yAxisWidth = self.yAxisWidth,    //find longest gene name, calculate width
                xAxisHeight = margin.bottom;  //15 char max on xAxis labels

            // creating the DOM elements here, but this needs a good deal of refactoring
            // to append the proper namespace and proper IDs
            self.element.append(canvases.join(''));

            // creates the heatmap SVG element
            var heatmap = d3.select(self._getHeatmapSelector()).append('svg')
                .attr('class', self._createCssClass('heatmapCanvas'))
                .attr('width', width)
                .attr('height', height + xAxisHeight)
                .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // grid contains the cells and x-axis,
            var grid = heatmap.append('g');
            grid.append('g')
                .attr('class', 'x ' + self._createCssClass('axis'))
                .attr('transform', 'translate(0,' + height + ')')
                .call(xAxis);

            // put the y-axis in it's own container
            var gridLabels = d3.select(self._getGridLabelsSelector()).append('svg')
                .attr('class', self._createCssClass('gridLabels-canvas'))
                .attr('width', yAxisWidth)
                .attr('height', height + xAxisHeight)
                .append('g')
                .attr('class', self._createCssClass('grid-label-rows'))
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            gridLabels.append('g')
                .attr('class', 'y ' + self._createCssClass('axis'))
                .call(yAxis);

            // add a mouse event for when you hover over the gene labels
            gridLabels.select('.y.' + self._createCssClass('axis'))
                .selectAll('text')
                .attr('class', self._getWidgetBaseClass())
                .text(function (d) {
                    // display the label
                    return rowIdToName[d] || d;
                })
                // right-align the yAxis labels within their canvas
                .style('text-anchor', 'end')
                .attr('x', yAxisWidth - self.yAxisBuffer)
                // mouse over & mouse clicked events
                .on('click', function (d) {
                    self._trigger('rowLabelClicked', undefined, d);
                })
                .on('mouseover', function () {
                    // change the color on hover
                    d3.select(this).style('fill', 'rgb(50,50,220)');
                })
                .on('mouseout', function () {
                    // restore the color on hover
                    d3.select(this).style('fill', 'black');
                });

            // add a mouse event for when you hover over the tissue sample labels
            grid.select('.x.' + self._createCssClass('axis'))
                .selectAll('text')
                .attr('class', self._getWidgetBaseClass())
                .text(function (d) {
                    // display the label
                    return columnIdToName[d] || d;
                })
                // mouse over & mouse clicked events
                .on('click', function (d) {
                    self._trigger('columnLabelClicked', undefined, d);
                })
                .on('mouseover', function () {
                    // change the color on hover
                    d3.select(this).style('fill', 'rgb(50,50,220)');
                })
                .on('mouseout', function () {
                    // restore the color on hover
                    d3.select(this).style('fill', 'black');
                });

            heatmap.select('.x.' + self._createCssClass('axis'))
                .selectAll('text')
                .attr('transform', 'translate(-14,10)rotate(-90)');

            heatmap.select('.x.' + self._createCssClass('axis'))
                .selectAll('text')
                .attr('class', self._getWidgetBaseClass())
                .style('text-anchor', 'end')
                .text(function (d) {
                    // display the label
                    return columnIdToName[d] || d;
                });

            // position the cells themselves to be draw on
            cells = self._createCells(grid);

            // ask the concrete cell renderer to render itself
            self._renderCells(grid, cells);
            self._createLegend();
            // only render the histogram if you have this optional data
            if (self._hasHistogram()) {
                self._drawHistogram(self.options.histogramMapping);
            }

            // check to see if qtip exists and turn on the tooltips for each cell
            if ($().qtip) {
                self._createToolTip('.' + self._createCssClass('cell'));
            }

            // add the export buttons (if applicable)
            if (self.options.exportOptions) {
                if (self.options.exportOptions.style) {
                    // if FileSaver.js is not included, do not create an 'export svg' button
                    if(!_.isUndefined(window.saveAs)) {
                        $(self._getExportSelector()).append('<a class="' +
                                self._createCssClass('exportButtons') + '">[Export SVG]</a>');

                            $(self._getExportSelector().children[0]).on('click', function() {
                            self._exportGridVar({
                                //$('.study-name')[0].innerHTML.substring(0, $('.study-name')[0].innerHTML.indexOf("[") - 1) + '.svg';
                                filename: Math.random().toString(36).substring(7) + '.svg',
                                renderSVG: true,
                                renderPNG: false
                            });
                        });
                    }
                    if (self.options.exportOptions.server) {
                        $(self._getExportSelector()).append('<a class="' +
                                self._createCssClass('exportButtons') + '">[Export PNG]</a>');
                        $(self._getExportSelector().children[1]).on('click', function() {
                            if ($(this).html() === '[Export PNG]') {
                                $(this).html('Rendering...');
                                self._exportGridVar({
                                    filename: Math.random().toString(36).substring(7) + '.svg', //some entropy
                                    renderSVG: false,
                                    renderPNG: true
                                });
                            }
                        });
                    }
                }
            }
        },

        _hasHistogram: function () {
            var self = this;
            return _.has(self.options, 'histogramMapping') && (! _.isUndefined(self.options.histogramMapping.data));
        },

        _exportGridVar: function (options) {
            var self = this;

            if (_.isUndefined(options) || _.isUndefined(self.options.exportOptions)) {
                return;
            }

            var SVG,
                blobSVG,
                XML = new XMLSerializer(),
                formData = new FormData(),
                saveAsFunction = window.saveAs || window.navigator.msSaveOrOpenBlob,
                header = '<?xml version="1.0" standalone="no"?>' +
                        '\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
                        '\n<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ',

                // serialization
                legend = XML.serializeToString($(self._getLegendSelector().children[0]).children()[0]),
                histogram = XML.serializeToString($(self._getHistogramSelector().children[0]).children()[0]),
                gridlabels = XML.serializeToString($(self._getGridLabelsSelector().children[0]).children()[0]),
                heatmap = XML.serializeToString($(self._getHeatmapSelector().children[0]).children()[0]),

                // organization
                buffer = 10,
                histogramWidth = Math.ceil($(self._getHistogramSelector().children[0]).children()[0].getBBox().width),
                histogramHeight = Math.ceil($(self._getHistogramSelector().children[0]).children()[0].getBBox().height),
                gridLabelsWidth = Math.ceil($(self._getGridLabelsSelector().children[0]).children()[0].getBBox().width),
                heatmapWidth = Math.ceil($(self._getHeatmapSelector().children[0]).children()[0].getBBox().width),
                legendHeight = Math.ceil($(self._getLegendSelector().children[0]).children()[0].getBBox().height),
                legendWidth = Math.ceil($(self._getLegendSelector().children[0]).children()[0].getBBox().width),
                totalHeight = legendHeight + histogramHeight + buffer,
                totalWidth = histogramWidth + gridLabelsWidth + buffer + (heatmapWidth > legendWidth ? heatmapWidth : legendWidth + buffer);

            // styling
            $.ajax({
                type: 'GET',
                url: self.options.exportOptions.style,	// here is where we can set a user-defined SVG stylesheet, as I will define in the API
                error: function (request, status, error) {
                    $(self._getExportSelector().children[1]).html('[Export PNG]');
                    throw('Error in obtaining the export styling: ' + error);
                },
                success: function(response) {
                    // build the SVG from all its components
                    header += 'width="' + totalWidth + 'px" height="' + totalHeight + 'px">\n';
                    SVG = header +
                    '<defs><style type="text/css">\n' + response + '</style></defs>\n' +
                    '<g transform="translate(3,0)">' + legend + '</g>' +
                    '<g transform="translate(0,' + legendHeight + ')">' + histogram + '</g>' +
                    '<g transform="translate(' + histogramWidth + ',' + legendHeight + ')">' + gridlabels + "</g>" +
                    '<g transform="translate(' + (histogramWidth + gridLabelsWidth + buffer) + ',' + legendHeight + ')">' + heatmap + "</g>" +
                    "</svg>";

                    // pack the image into a Blob and offer download...
                    // I can't believe this actually works in IE10
                    blobSVG = new Blob([SVG], {type: 'image/svg+xml'});

                    // use saveAs() to offer an SVG download
                    if (options.renderSVG) {
                        saveAsFunction(blobSVG, options.filename);
                    }

                    // make the call to rasterize SVG -> PNG
                    if (options.renderPNG) {
                        formData.append('data', blobSVG);
                        formData.append('filename', options.filename);

                        $.ajax({
                            type: 'POST',
                            url: self.options.exportOptions.server,	
                            data: formData,
                            processData: false,
                            contentType: false,
                            error: function (request, status, error) {
                                $(self._getExportSelector().children[1]).html('[Export PNG]');
                                throw('Error is rasterizing the PNG: ' + error);
                            },
                            success: function(response) {
                                document.location.href = response;
                                $(self._getExportSelector().children[1]).html('[Export PNG]');
                            }
                        });
                    }
                }
            });
        }
    });
}(jQuery));
