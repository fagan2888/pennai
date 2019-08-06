import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Header } from 'semantic-ui-react';
import * as d3 from "d3";

class BarCharts extends Component {
  constructor(props) {
    super(props);
    this.state = {

    };
    this.createBarGraph = this.createBarGraph.bind(this);
  }

  componentDidMount() {
    this.createBarGraph();
  }

  // adapted from https://bl.ocks.org/d3noob/bdf28027e0ce70bd132edc64f1dd7ea4
  // and also using https://www.d3-graph-gallery.com/graph/barplot_stacked_basicWide.html
  // as examples
  createBarGraph(){
    const { depCol, dataPreview, valByRowObj, colKey, keys } = this.props;
    let margin = { top: 10, right: 30, bottom: 50, left: 70 },
        width = 560 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    let chartInnerHTML = "";
    // check DOM to see if graphic already exists
    if(document.getElementById("stacked_bar_charts_" + colKey)) {
      chartInnerHTML = document.getElementById("stacked_bar_charts_" + colKey).innerHTML;
    };
    // only attempt to create graphic once
    if(chartInnerHTML === "") {
      // need to do a bit of processing
      let classTotalCountObj = {}; // obj to keep track of total vals in dataset given a specific column key
      // example: {a: 27, b: 27, c: 26, d: 26}
      // count # of items with valByRowObj - 'flattened' object of dataset
      // where each key is a column in the dataset and each value is every entry
      // in entire dataset given the column key
      let data_sorted = valByRowObj[colKey].sort(d3.ascending);
      data_sorted.forEach(val => {
        classTotalCountObj[val] = classTotalCountObj[val] ? ++classTotalCountObj[val] : 1;
      });

      let columnValueObj = {}; // key: unique value in dataset given colKey, val: list of all depCol values for given colKey
      let proportionObj = {}; // key: unique value in dataset given colKey, val: # of values per unique value in depCol
      let proportionObjList = [];
      // find unique values for the given column key as well as dependent column
      let givenColSet = [... new Set(valByRowObj[colKey])];
      let depColSet = [... new Set(valByRowObj[depCol])].sort();

      /**---- *************** ----**** ---- Color stuff here ----****---- *************** ----**/
      let colorList = ['#55d6be','#7c5ba5'];
      //let d3.interpolateInferno();
      // for every entry in depColSet, map keys to color
      //let colorObj = [{0:'#e41a1c'}, {1:'#377eb8'}];
      let colorObjList = [];
      depColSet.forEach((depVal, i) => {
        // normalize index
        let normI = i / depColSet.length;
        let colorString = d3.interpolateSinebow(normI);
        colorObjList.push({[depVal]: colorString});
         // i % 2 === 0
         //  ? colorObjList.push({[depVal]: colorList[0]})
         //  : colorObjList.push({[depVal]: colorList[1]});
      })
      //window.console.log('colorobjlist', colorObjList);
      /**---- *************** ----****---- *************** ----****---- *************** ----**/

      // count proportion of given column name/key with dataset dependent_col

      // for every unique value of given colKey in dataset, collect all matches
      givenColSet.forEach(tKey => {
        columnValueObj[tKey] = [];
        dataPreview.data.forEach(entry => {
          if(entry[colKey] === tKey) {
            columnValueObj[tKey].push(entry[depCol])
          }
        })
      });

      // unqiue counts of each class occurance per value in given column name/key
      Object.entries(columnValueObj).forEach((entry, index) => {
        proportionObj[entry[0]] = []; // init obj key with empty list
        let tempObj = {};
        depColSet.forEach(depVal => {
          tempObj[colKey] = entry[0];
          let tempLen = entry[1].filter(x => x === depVal).length;
          //proportionObj[entry[0]].push({[depVal]: tempLen})
          tempObj[depVal] = tempLen;
          proportionObj[entry[0]].push(tempLen);
        })
        proportionObjList.push(tempObj);
      })
      // results in list of objects -
      // ex: [ {0: 21, 1: 6, cat: "a"}, {0: 22, 1: 5, cat: "b"} ... ]
      // for this example depCol is 'target_class' which can be '0' or '1'
      // and colKey is 'cat' which can be 'a', 'b' ...

      let stackedData = []; // stack data as per examples to use with d3
      // having data formatted this way helps facilitating use of d3
      depColSet.forEach(classKey => {
        let tempObj = {"class": classKey};
        givenColSet.forEach(tKey => {
          tempObj[tKey] = proportionObj[tKey][classKey];
        })
        stackedData.push(tempObj);
      })

      // Transpose the data into layers
      let stack = d3.stack()
        .keys(depColSet)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);
      let stackThing = stack(proportionObjList);
      let stackColorThing = stack(colorObjList);
      //window.console.log('real data stack', stackThing);

      // x - axis
      let xStuff = d3.scaleBand()
        .range([0, width])
        .domain(givenColSet)
        .padding(0.2);

      let colorStack = d3.scaleOrdinal()
        .domain(depColSet)
        .range(colorList);

      // stacked stuff - svg elem using stacked data
      let stackedSvg = d3.select("#stacked_bar_charts_" + colKey)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      stackedSvg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .style("color", "white")
        .call(d3.axisBottom(xStuff));

      // y-axis
      let stackedY = d3.scaleLinear()
        .domain([0, d3.max(stackThing, (d) => {
          //window.console.log('y stacked thing 1', d);
          return d3.max(d, (d) => {
            //window.console.log('y stacked thing 2', d);
            return d[1];
          });
        })])
        .range([height, 0]);

      stackedSvg.append('g')
        .style("color", "white")
        .call(d3.axisLeft(stackedY));

      let groups = stackedSvg.selectAll("g.stack")
        .data(stackThing)
        .enter().append("g")
        .style("fill", (d) => {
          //window.console.log('color thing', d);
          let normI = d.index / depColSet.length;
          let colorString = d3.interpolateSinebow(normI);
          return colorString;
          //return colorStack(d.key)
        });

      let stackRect = groups.selectAll("rect")
        .data((d) => {
          //window.console.log('stacked thing', d);
          return d;
        })
        .enter()
        .append("rect")
        .attr("x", (d, t, s, a) => {
        //  window.console.log('x stuff', d);
          return xStuff(d.data[colKey]);
        })
        .attr("y", (d, t, s) => {
          return stackedY(d[1]);
        })
        .attr('height', (d) => {
          let y0 = stackedY(d[0]);
          let y1 = stackedY(d[1]);
          //window.console.log('height stuff', y0 - y1);
          return y0 - y1;
        })
        .attr('width', xStuff.bandwidth())
        .on("mouseover", () => { tooltip.style("display", null); }) // tooltip - hover over bars and display value
        .on("mouseout", function() {
          window.setTimeout(() => tooltip.style("display", "none"), 3500);
         })
        .on("mousemove", function(d) {
          let xPosition = d3.mouse(this)[0] - 15;
          let yPosition = d3.mouse(this)[1] - 25; //+ stackedY(d[1] - d[0])
          tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
          tooltip.select("text").text(d[1] - d[0]);
        });

        // legend
        let legend = stackedSvg.selectAll(".legend")
          .data(stackColorThing)
          .enter().append("g")
          .attr("transform", function(d, i) {
            return "translate(20,"+  (i * 19) + ")";
          });

        legend.append("rect")
          .attr("x", -margin.left - 15)
          .attr("y", height)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", function(d, i) {
            //window.console.log('legend color stuff', d);
            let color = d[d.index];
            return color.data[d.key];
          });

        legend.append("text")
          .attr("x", -margin.left + 5)
          .attr("y", height + 9)
          .attr("dy", ".35em")
          .style("text-anchor", "start")
          .style("fill", "white")
          .text(function(d, i) {
            //window.console.log('legend text stuff');
            return d.key;
          });

        // tooltip elem to display on mouseover
        let tooltip = stackedSvg.append("g")
          .attr("class", "tooltip")
          .style("display", "none");

        tooltip.append("rect")
          .attr("width", 30)
          .attr("height", 20)
          .attr("fill", "white")
          .style("opacity", 0.5);

        tooltip.append("text")
          .attr("x", 15)
          .attr("dy", "1.2em")
          .style("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "bold");
     }
  }

  render() {
    const { dataPreview, valByRowObj, colKey } = this.props;
    return (
        <div id={"stacked_bar_charts_" + colKey} />
    );
  }
}

const mapStateToProps = (state) => ({

});

export { BarCharts };
export default connect(mapStateToProps, {})(BarCharts);