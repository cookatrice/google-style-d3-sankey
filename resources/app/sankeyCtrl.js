/**
 * Created by cookatrice on 2015. 9. 1..
 */

var controllers = angular.module('app.controllers', []);

controllers.controller('sankeyCtrl', function ($scope, $log, APP_VERSION) {
    $scope.init = function () {
        $scope.appVersion = APP_VERSION;
        loadSankeyChartDataSet();
    };

    function moveSankeyStep(toMove){
        var curSankeyStep = $scope.sankeyStep;

        if (toMove == 'next') {
            $log.debug('\n### Go go next step!!!');
            if (++curSankeyStep > getMaxSankeyChartDepth()) {
                curSankeyStep = 1;
            }
        } else {
            $log.debug('\n### Go go previous step!!!');
            if (--curSankeyStep < 1) {
                curSankeyStep = getMaxSankeyChartDepth();
            }
        }

       $scope.sankeyStep = curSankeyStep;

        /** step1. clear svg tag */
        clearSankeyCahrt();

        /** step2. redraw sankey chart */
        drawSankeyChart(extractCurDepthSankeyData(refineSankeyChartData($scope.receiveRawData), $scope.sankeyStep));
    }


    function clearSankeyCahrt() {
        if (d3.select('#sankeyChart').selectAll('svg')) {
            d3.select('#sankeyChart').selectAll('svg').remove();
        }
    }


    function setMaxSankeyChartDepth(maxDepth) {
        $scope.maxSankeyChartDepth = maxDepth;
    }

    function getMaxSankeyChartDepth() {
        return $scope.maxSankeyChartDepth;
    }

    function setMaxNodeLength(maxLength) {
        $scope.maxNodeLength = maxLength;
    }

    function getMaxNodeLength() {
        return $scope.maxNodeLength;
    }

    function getSampleData() {
        return [
            { site: 'http://cookatrice.com', service: 'svc', depth: 1, source: '/kiwi', target: '/banana/menu1', value: 4 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 1, source: '/banana', target: '/kiwi/menu3', value: 2 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 1, source: '/apple', target: '/mango/menu1', value: 120 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 1, source: '/mango', target: '/kiwi/menu3', value: 4 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 1, source: '/mango', target: '/mango/menu1', value: 30 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 1, source: '/mango', target: '/strawberry/menu34', value: 4 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 1, source: '/mango', target: '/melon/menu4', value: 4 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 1, source: '/strawberry', target: '/mango/menu2', value: 7 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 1, source: '/melon', target: '/mango/menu1', value: 6 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 2, source: '/kiwi/menu3', target: '/mango', value: 5 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 2, source: '/banana/menu1', target: '/kiwi/menu33', value: 1 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 2, source: '/banana/menu1', target: '/banana/menu2', value: 2 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 2, source: '/mango/menu1', target: '/kiwi/menu43', value: 3 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 2, source: '/mango/menu1', target: '/apple', value: 120 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 2, source: '/mango/menu1', target: '/mango', value: 10 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 2, source: '/mango/menu1', target: '/melon/menu34', value: 3 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 2, source: '/mango/menu2', target: '/apple', value: 2 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 2, source: '/strawberry/menu34', target: '/kiwi/menu33', value: 2 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 2, source: '/melon/menu4', target: '/melon/menu34', value: 1 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 3, source: '/apple', target: '/kiwi/menu41', value: 17 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 3, source: '/apple', target: '/kiwi/menu99', value: 10 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 3, source: '/apple', target: '/mango/menu1', value: 32 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 3, source: '/apple', target: '/mango/menu88', value: 40 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 3, source: '/apple', target: '/strawberry/menu99', value: 10 },
            { site: 'http://cookatrice.com', service: 'svc', depth: 3, source: '/apple', target: '/melon/menu24', value: 13 }
        ];
    }

    function loadSankeyChartDataSet() {
        clearSankeyCahrt();

        var receiveData = getSampleData();
        if (receiveData && receiveData.length != 0) {
            $scope.receiveRawData = receiveData;
            $scope.sankeyStep = 1;
            drawSankeyChart(
                extractCurDepthSankeyData(
                    refineSankeyChartData($scope.receiveRawData),
                    $scope.sankeyStep)
            );
        } else {
            $log.error('Have no data....!!!');
        }
    }

    function extractCurDepthSankeyData(sankeyData, depth) {
        var oldNodes = sankeyData.nodes;
        var oldLinks = sankeyData.links;
        var newNodes = [];
        var newLinks = [];
        var endNodeIndex = 0;
        var nodeInOutStatus = [];
        var depthInOutStatus = [];

        /** extract nodes */
        _.each(oldNodes, function (element, index, list) {
            if (element.depth <= depth) {
                newNodes.push(element);
                endNodeIndex = element.node + 1;
                nodeInOutStatus.push({node: element.node, in: 0, out: 0});

                if (!depthInOutStatus[element.depth]) {
                    depthInOutStatus.push({depth: element.depth, in: 0, out: 0});
                }
            }
        });

        /** extract links */
        _.each(oldLinks, function (element, index, list) {
            //exist link
            if (element.depth <= depth) {
                newLinks.push(element);
            }

            //out of page calculate to make  OUT of page link
            if (element.depth <= depth + 1) {
                var s = element.source;
                var t = element.target;
                var v = element.value * 1;  //string to number

                if (nodeInOutStatus[t]) {
                    nodeInOutStatus[t].in = nodeInOutStatus[t].in + v;
                }
                if (nodeInOutStatus[s]) {
                    nodeInOutStatus[s].out = nodeInOutStatus[s].out + v;
                }

                //make depthInOutStatus
                if (depthInOutStatus[element.depth]) {
                    depthInOutStatus[element.depth].in = depthInOutStatus[element.depth].in + v;
                    depthInOutStatus[element.depth - 1].out = depthInOutStatus[element.depth - 1].out + v;
                }
            }
        });

        /** append calculated page link */
        if (depth > 1) {
            //add out of page node for pretty sankey chart when depth is bigger than depth 1.
            newNodes.push({node: endNodeIndex, name: "OUT", depth: depth});

            //add out of page link for pretty sankey chart
            _.each(nodeInOutStatus, function (element, index, list) {
                var diffInOut = element.in - element.out;
                var calDepth = (newNodes[element.node].depth < depth);
                if (diffInOut > 0 && calDepth) {
                    newLinks.push({
                        source: element.node,
                        target: endNodeIndex,
                        value: element.in - element.out,
                        depth: depth
                    });
                }
            });
        }

        $scope.globalNodeInOutStatus = nodeInOutStatus;
        $scope.globalDepthInOutStatus = depthInOutStatus;

        return {nodes: newNodes, links: newLinks};
    }

    function refineSankeyChartData(rawData) {

        var maxDepth = 0;

        /** make nodes set step1 - make group by depth */
        var nodes = [];
        _.each(rawData, function (element, index, list) {
            if (!nodes[element.depth - 1]) {
                nodes[element.depth - 1] = [];
            }
            if (!nodes[element.depth]) {
                nodes[element.depth] = [];
            }
            nodes[element.depth - 1].push(element.source);
            nodes[element.depth].push(element.target);

            //to find max depth
            if ((element.depth * 1) > maxDepth) {
                maxDepth = element.depth * 1;
            }
        });

        setMaxSankeyChartDepth(maxDepth);

        /** make nodes set step2 - remove duplicated nodes */
        _.each(nodes, function (element, index, list) {
            nodes[index] = _.uniq(element);
        });

        /** make nodes set step3 - compare and make sankey nodes type, and gain max node-length for sankey-chart height */
        var maxNodeLength = 0;
        var nodeIndex = 0;
        var nodeList = [];
        _.each(nodes, function (element, index, list) {
            if (element.length > maxNodeLength) {
                maxNodeLength = element.length;
            }

            var curDepth = index;
            _.each(element, function (e, i, l) {
                nodeList.push({node: nodeIndex, name: e, depth: curDepth});
                nodeIndex++;
            });
        });

        setMaxNodeLength(maxNodeLength);

        /** make links set */
        var linkList = [];
        _.each(rawData, function (element, index, list) {
            var source = element.source;
            var target = element.target;
            var depth = element.depth;
            _.some(nodeList, function (e, i, l) {
                if (source == e.name && (depth - 1) == e.depth) {
                    source = e.node;
                    return true;
                }
                return false;
            });
            _.some(nodeList, function (e, i, l) {
                if (target == e.name && depth == e.depth) {
                    target = e.node;
                    return true;
                }
            });
            linkList.push({source: source, target: target, value: element.value, depth: depth})
        });

        return {nodes: nodeList, links: linkList};
    }

    function drawSankeyChart(refineSankeyData) {

        var NODE_WIDTH = 200;
        var NODE_PADDING = 40;
        var DEPTH_WIDTH = 350;

        var margin = {top: 70, right: 20, bottom: 20, left: 20};
        var width = 550 + (($scope.sankeyStep - 1) * DEPTH_WIDTH) + 150;
        var sankeyWidth = width - 150;  //for next/previous button
        var height = getMaxNodeLength() * 100 + margin.top;

        /** sankeyChart-area size */
        $('#sankeyChart').css("width", width + margin.left + margin.right).css("height", height + margin.top + margin.bottom);

        var formatNumber = d3.format(",.0f"),
            format = function (d) {
                return formatNumber(d);
            },
            color = d3.scale.category20();

        var svg = d3.select("#sankeyChart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var normalGradient = svg.append("svg:defs")
            .append("svg:linearGradient")
            .attr("id", "normalGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");
        normalGradient.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#F2FFE9")
            .attr("stop-opacity", 1);
        normalGradient.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#84D04D")
            .attr("stop-opacity", 1);

        var pageOutGradient = svg.append("svg:defs")
            .append("svg:linearGradient")
            .attr("id", "pageOutGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");
        pageOutGradient.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#FCE8E8")
            .attr("stop-opacity", 1);
        pageOutGradient.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#FA5858")
            .attr("stop-opacity", 1);

        var sankey = d3.sankey()
            .nodeWidth(NODE_WIDTH)
            .nodePadding(NODE_PADDING)
            .size([sankeyWidth, height]);

        var path = sankey.link();

        /** init sankeyDataSet */
        var sankeyDataSet = refineSankeyData;

        if (sankeyDataSet) {
            $log.debug('sankeyDataSet...');
            $log.debug(sankeyDataSet);
            $log.debug('$scope.globalNodeInOutStatus...');
            $log.debug($scope.globalNodeInOutStatus);
            $log.debug('$scope.globalDepthInOutStatus...');
            $log.debug($scope.globalDepthInOutStatus);

            /** draw sankey chart header info */
            var depthInfo = svg.append("g").selectAll(".depthInfo")
                .data($scope.globalDepthInOutStatus)
                .enter().append("g")
                .attr("class", "depthInfo");
            depthInfo.append("rect")
                .attr("height", 50)
                .attr("width", NODE_WIDTH)
                .attr("x", function (d) {
                    return d.depth * DEPTH_WIDTH;
                })
                .attr("y", -80)
                .style("fill", "#F5F6CE")
                .append("title")
                .text(function (d) {
                    return d.depth + 'STEP';
                });
            depthInfo.append("text")
                .attr("y", -60)
                .append('svg:tspan')
                .attr("x", function (d) {
                    return (d.depth * DEPTH_WIDTH) + 5;//plus padding
                })
                .attr('dy', 5)
                .attr("fill", "red")
                .text(function (d) {
                    return d.depth + 'Step';
                })
                .append('svg:tspan')
                .attr("x", function (d) {
                    return (d.depth * DEPTH_WIDTH) + 5;//plus padding
                })
                .attr('dy', 20)
                .text(function (d) {
                    var returnString = d.in + ' sessions, ' + d.out + ' through, ';
                    if (d.depth > 0) {
                        returnString += (d.in - d.out) + ' drop-offs';
                    }
                    return returnString;
                })
                .attr("fill", "black");

            sankey
                .nodes(sankeyDataSet.nodes)
                .links(sankeyDataSet.links)
                .layout(32);

            var link = svg.append("g").selectAll(".link")
                .data(sankeyDataSet.links)
                .enter().append("path")
                .attr("class", "link")
                .attr("d", path)
                .attr("id", function (d, i) {
                    d.id = i;
                    return "link-" + i;
                })
                //.style("fill", "none")
                .style("stroke", function (d) {
                    if (d.target.name == 'OUT') {
                        return "red";
                    }
                    return '#D8E3E4'; //google link color
                })
                .style("stroke-opacity", "0.4")
                .style("stroke-width", function (d) {
                    return Math.max(1, d.dy);
                })
                .sort(function (a, b) {
                    return b.dy - a.dy;
                });

            link.append("title")
                .text(function (d) {
                    return d.source.name + " → " + d.target.name + "\n" + format(d.value);
                });

            /** d3-tip set */
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function (d) {

                    if (d.depth == 0 || d.name == 'OUT') {
                        return "<strong>* Page :</strong> <span style='color:red'>" + d.name + "</span>";
                    }

                    var inVal = $scope.globalNodeInOutStatus[d.node].in;
                    var outVal = $scope.globalNodeInOutStatus[d.node].out;
                    var outPage = inVal - outVal;

                    return "<strong>* Page :</strong> <span style='color:lightskyblue'>" + d.name + "</span>"
                        + "<br/><br/><strong>* Through traffic :</strong> <span style='color:yellow'>" + outVal + " (" + Math.round((outVal / inVal * 100) * 100) / 100 + "%)" + "</span>"
                        + "<br/><br/><strong>* Drop-offs :</strong> <span style='color:pink'>" + outPage + " (" + Math.round((outPage / inVal * 100) * 100) / 100 + "%)" + "</span>";
                });

            var node = svg.append("g").selectAll(".node")
                .data(sankeyDataSet.nodes)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })
                .on("click", highlight_node_links);

            /** d3-tip event bind on node */
            node.call(tip)
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);

            node.append("rect")
                .attr("height", function (d) {
                    return d.dy;
                })
                .attr("width", sankey.nodeWidth())
                .style("fill", function (d) {
                    if (d.depth == 0) {
                        return '#fff'
                    }
                    if (d.name == 'OUT') {
                        return "url(#pageOutGradient)";
                    }
                    return "url(#normalGradient)";
                })
                .style("stroke", function (d) {
                    return d3.rgb(d.color).darker(2);
                })
                .append("title")
                .text(function (d) {
                    return d.name + "\n" + format(d.value);
                });

            node.append("text")
                .attr("x", 4)
                .attr("y", -5)
                .attr("text-anchor", "left")
                .attr("transform", "rotate(0)")
                .text(function (d) {
                    if (d.name == 'OUT') {
                        return 'Sum of past drop-offs';
                    }
                    return d.name;
                })
                .attr("fill", "black");

            node.append("text")
                .attr("x", 4)
                .attr("y", 18)
                .attr("transform", "rotate(0)")
                .attr("text-anchor", "left")
                .text(function (i) {
                    if (i.dy > 20) {
                        return format(i.value);
                    }
                })
                .attr("fill", "black");

            function highlight_node_links(node, i) {

                var remainingNodes = [],
                    nextNodes = [];

                var stroke_opacity = 0;
                if (d3.select(this).attr("data-clicked") == "1") {
                    d3.select(this).attr("data-clicked", "0");
                    stroke_opacity = 0.4;
                } else {
                    d3.select(this).attr("data-clicked", "1");
                    stroke_opacity = 1.0;
                }

                var traverse = [{
                    linkType: "sourceLinks",
                    nodeType: "target"
                }, {
                    linkType: "targetLinks",
                    nodeType: "source"
                }];

                traverse.forEach(function (step) {
                    node[step.linkType].forEach(function (link) {
                        remainingNodes.push(link[step.nodeType]);
                        highlight_link(link.id, stroke_opacity);
                    });

                    while (remainingNodes.length) {
                        nextNodes = [];
                        remainingNodes.forEach(function (node) {
                            node[step.linkType].forEach(function (link) {
                                nextNodes.push(link[step.nodeType]);
                                highlight_link(link.id, stroke_opacity);
                            });
                        });
                        remainingNodes = nextNodes;
                    }
                });
            }

            function highlight_link(id, opacity) {
                d3.select("#link-" + id).style("stroke-opacity", opacity);
            }

            //go next step button
            if ($scope.sankeyStep < getMaxSankeyChartDepth()) {
                var btnNextStep = svg.append("g")
                    .on("click", goNextStep);
                btnNextStep.append("circle")
                    .attr("cy", (height / 2) - 20)
                    .attr("cx", width - 50)
                    .attr("r", 50)
                    .style("fill", '#D8E3E4');
                btnNextStep.append("text")
                    .text("Next Step!")
                    .attr("dx", width - 50)
                    .attr("dy", (height / 2) + 5 - 20)
                    .attr("text-anchor", "middle")
                    .style("font-size", "20px")
                    .style("font-family", "sans-serif")
                    .attr("fill", "#2A6F82");

                function goNextStep() {
                    moveSankeyStep('next');
                }
            }
            //go previous step button
            if ($scope.sankeyStep > 1) {
                var btnPreviousStep = svg.append("g")
                    .on("click", goPreviousStep);
                btnPreviousStep.append("circle")
                    .attr("cy", height / 2 + 120)
                    .attr("cx", width - 50)
                    .attr("r", 50)
                    .style("fill", '#F6CEEC');
                btnPreviousStep.append("text")
                    .text("Previous Step!")
                    .attr("dx", width - 50)
                    .attr("dy", (height / 2) + 5 + 120)
                    .attr("text-anchor", "middle")
                    .style("font-size", "20px")
                    .style("font-family", "sans-serif")
                    .attr("fill", "#B40404");

                function goPreviousStep() {
                    moveSankeyStep('previous');
                }
            }
        }

    }
});