// Define the hierarchical data for the Raga progression
const data = {
    name: "Sa",
    children: [
      {
        name: "Re",
        children: [
          { name: "Re1", children: [{ name: "Ga1" }] },
          { name: "Re2", children: [{ name: "Ga2" }] },
          { name: "Re3", children: [{ name: "Ga3" }] }
        ]
      },
      {
        name: "Ma",
        children: [
          { name: "Pa", children: [{ name: "Dha" }] },
          { name: "Ni", children: [{ name: "Sa" }] }
        ]
      }
    ]
  };
  
  // Define the partition and arc functions for the sunburst
  const width = 600, radius = width / 2;
  const partition = d3.partition().size([2 * Math.PI, radius]);
  
  // Create a root hierarchy with the data
  const root = d3.hierarchy(data)
    .sum(d => 1) // This defines the size of each segment
    .sort((a, b) => b.value - a.value);
  
  partition(root);
  
  // Define the arc for each segment in the sunburst chart
  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1);
  
  // Set up the color scale for segments
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  
  // Create the SVG container
  const svg = d3.create("svg")
    .attr("viewBox", `${-radius} ${-radius} ${width} ${width}`)
    .style("max-width", `${width}px`)
    .style("font", "12px sans-serif");
  
  // Add the path for each segment
  const path = svg
    .append("g")
    .selectAll("path")
    .data(root.descendants().filter(d => d.depth && d.x1 - d.x0 > 0.001))
    .join("path")
    .attr("fill", d => color(d.data.name))
    .attr("d", arc);
  
  // Add label text for the hovered sequence
  const label = svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("fill", "#888")
    .style("visibility", "hidden");
  
  label
    .append("tspan")
    .attr("class", "percentage")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "-0.1em")
    .attr("font-size", "3em")
    .text("");
  
  label
    .append("tspan")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "1.5em")
    .text("of visits begin with this sequence");
  
  // Create the interactive functionality to update the chart on hover
  const element = svg.node();
  element.value = { sequence: [], percentage: 0.0 };
  
  svg
    .append("g")
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseleave", () => {
      path.attr("fill-opacity", 1);
      label.style("visibility", "hidden");
      element.value = { sequence: [], percentage: 0.0 };
      element.dispatchEvent(new CustomEvent("input"));
    })
    .selectAll("path")
    .data(root.descendants().filter(d => d.depth && d.x1 - d.x0 > 0.001))
    .join("path")
    .attr("d", arc)
    .on("mouseenter", (event, d) => {
      const sequence = d.ancestors().reverse().slice(1); // Get the sequence path
      path.attr("fill-opacity", node => sequence.indexOf(node) >= 0 ? 1.0 : 0.3);
  
      const percentage = ((100 * d.value) / root.value).toPrecision(3);
      label.style("visibility", null).select(".percentage").text(percentage + "%");
  
      // Update the value of this view with the current sequence and percentage
      element.value = { sequence, percentage };
      element.dispatchEvent(new CustomEvent("input"));
    });
  
  // Return the element for interactive use in Observable
  return element;
  