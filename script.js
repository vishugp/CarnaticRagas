const width = 600;
const height = 600;
const radius = Math.min(width, height) / 2 - 50;
let selectedNode = null;
let isPlayingSequence = false; // Add flag to track if sequence is playing

const baseColors = [
    "#8A2BE2", // Violet
    "#4B0082", // Indigo
    "#0000FF", // Blue
    "#008000", // Green
    "#FFD500", // Yellow
    "#FFA500", // Orange
    "#FF0000"  // Red
];

function getColorByDepth(d) {
    const baseColor = baseColors[(d.depth-1) % baseColors.length];
    const lightenFactor = 0.1;
    return d3.color(baseColor).brighter(lightenFactor);
}

let colormap = {};
function loadColormap() {
    return d3.csv("colormap.csv").then(data => {
        data.forEach(row => {
            colormap[row.name] = row.color;
        });
    });
}

function getColorByName(d) {
    return colormap[d.data.name] || "#ccc";
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function playSequence(notes, depths, ascending = true) {
    const noteDelay = 500; // 500ms between notes
    const trailElements = d3.select("#trail").selectAll(".trailpart");
    
    for (let i = 0; i < notes.length; i++) {
        // Highlight current note
        trailElements
            .style("transform", (d, index) => {
                const isCurrentNote = d.data.name === notes[i] && 
                    ((ascending && index === i) || (!ascending && index === notes.length - 1 - i));
                return isCurrentNote ? "scale(1.1)" : "scale(1)";
            })
            .style("box-shadow", (d, index) => {
                const isCurrentNote = d.data.name === notes[i] && 
                    ((ascending && index === i) || (!ascending && index === notes.length - 1 - i));
                return isCurrentNote ? "0 0 18px #FFA500" : "none";
            })
            .style("z-index", (d, index) => {
                const isCurrentNote = d.data.name === notes[i] && 
                    ((ascending && index === i) || (!ascending && index === notes.length - 1 - i));
                return isCurrentNote ? "1" : "0";
            });

        // Play the note
        playAudio(notes[i], depths[i]);
        await sleep(noteDelay);
    }

    // Reset all highlights after sequence
    trailElements
        .style("transform", "scale(1)")
        .style("box-shadow", "none")
        .style("z-index", "0");
}

function createSunburst(json) {
    d3.select("#explanation")
        .style("cursor", "pointer")
        .on("click", async function(event) {
            event.stopPropagation();
            
            if (selectedNode && !isPlayingSequence) {
                isPlayingSequence = true;
                const sequence = selectedNode.ancestors().reverse().slice(1);
                const notes = sequence.map(d => d.data.name);
                const depths = sequence.map(d => d.depth);
                
                // Play ascending sequence
                await playSequence(notes, depths, true);
                await sleep(1000);
                // Play descending sequence
                await playSequence(notes.reverse(), depths.reverse(), false);
                isPlayingSequence = false;
            }
        });

    document.addEventListener('click', handleOutsideClick);

    const svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height)
        .on("click", function(event) {
            event.stopPropagation();
        })
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    function handleOutsideClick(event) {
        const chartElement = document.querySelector('#chart svg');
        const explanationElement = document.querySelector('#explanation');
        const trailElement = document.querySelector('#trail');
        
        if (selectedNode && 
            !chartElement.contains(event.target) && 
            !explanationElement.contains(event.target) &&
            !trailElement.contains(event.target)) {
            resetVisualization();
        }
    }

    function resetVisualization() {
        if (!isPlayingSequence) {
            selectedNode = null;
            paths.style("opacity", 1);
            labels.style("visibility", "visible");
            d3.select("#trail").selectAll("*").remove();
            d3.select("#explanation").style("visibility", "hidden");
        }
    }

    function cleanup() {
        document.removeEventListener('click', handleOutsideClick);
    }

    const partition = d3.partition().size([2 * Math.PI, radius * radius]);

    const root = d3.hierarchy(json)
        .sum(d => d.value || 0)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

    partition(root);

    const maxDepth = root.height;
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => (d.depth / maxDepth) * radius)
        .outerRadius(d => ((d.depth + 1) / maxDepth) * radius);

    const paths = svg.selectAll("path")
        .data(root.descendants())
        .enter().append("path")
        .attr("display", d => d.depth ? null : "none")
        .attr("d", arc)
        .style("stroke", "#fff")
        .style("fill", d => getColorByName(d))
        .style("fill-opacity", 0.7)
        .on("mouseover", mouseover)
        .on("click", click)
        .on("mouseleave", mouseleave);

    const labels = svg.selectAll("text")
        .data(root.descendants())
        .enter().append("text")
        .attr("transform", function (d) {
            const angle = (d.x0 + d.x1) / 2 * (180 / Math.PI) - 90;
            const r = ((d.depth + 0.27) / maxDepth) * radius;
            return `rotate(${angle}) translate(${r},0) rotate(${angle > 90 ? 180 : 0})`;
        })
        .attr("text-anchor", d => ((d.x0 + d.x1) / 2) > Math.PI ? "end" : "start")
        .style("font-size", "8px")
        .style("fill", "black")
        .style("visibility", "visible")
        .text(d => d.data.name);

    function mouseover(event, d) {
        if (selectedNode || isPlayingSequence) return;

        const raagaName = d.data.raaga || "";
        d3.select("#explanation")
            .html(`${raagaName}`)
            .style("visibility", "");

        paths.style("opacity", 0.3);
        
        const sequenceArray = d.ancestors().reverse().slice(1);
        paths.filter(pathD => sequenceArray.some(seqD => seqD === pathD))
            .style("opacity", 1);

        labels.style("visibility", l => {
            const isInPath = sequenceArray.includes(l);
            const isDescendant = l.ancestors().includes(d);
            return (isInPath || isDescendant) ? "visible" : "hidden";
        });

        updateBreadcrumbs(sequenceArray);
    }

    function click(event, d) {
        event.stopPropagation();
        
        if (!d.children && !d._children && !isPlayingSequence) {
            if (selectedNode === d) {
                resetVisualization();
            } else {
                selectedNode = d;
                paths.style("opacity", 0.3);
                const sequenceArray = d.ancestors().reverse().slice(1);
                paths.filter(pathD => sequenceArray.some(seqD => seqD === pathD))
                    .style("opacity", 1);
                
                labels.style("visibility", l => {
                    const isInPath = sequenceArray.includes(l);
                    const isDescendant = l.ancestors().includes(d);
                    return (isInPath || isDescendant) ? "visible" : "hidden";
                });
                
                updateBreadcrumbs(sequenceArray);
                
                const raagaName = d.data.raaga || "";
                d3.select("#explanation")
                    .html(`<b>${raagaName}</b>`)
                    .style("visibility", "");
            }
        }
        
        playAudio(d.data.name, d.depth);
    }

    function mouseleave() {
        if (!selectedNode && !isPlayingSequence) {
            paths.style("opacity", 1);
            labels.style("visibility", "visible");
            d3.select("#trail").selectAll("*").remove();
            d3.select("#explanation").style("visibility", "hidden");
        }
    }

    function updateBreadcrumbs(nodeArray) {
        const trail = d3.select("#trail").selectAll("div")
            .data(nodeArray);

        trail.exit().remove();

        trail
            .style("color", "white")
            .style("background-color", d => getColorByDepth(d))
            .text(d => d.data.name);

        trail.enter()
            .append("div")
            .attr("class", "trailpart")
            .style("cursor", "pointer")
            .style("color", "white")
            .style("background-color", d => getColorByDepth(d))
            .style("transition", "all 0.2s ease-in-out")  // Add smooth transition
            .text(d => d.data.name)
            .on("click", function(event, d) {
                event.stopPropagation();
                if (!isPlayingSequence) {
                    // Add temporary highlight effect when clicked individually
                    d3.select(this)
                        .style("transform", "scale(1.1)")
                        .style("box-shadow", "0 0 14px #FFD700")
                        .style("z-index", "1");
                    
                    setTimeout(() => {
                        if (!isPlayingSequence) {
                            d3.select(this)
                                .style("transform", "scale(1)")
                                .style("box-shadow", "none")
                                .style("z-index", "0");
                        }
                    }, 300);
                    
                    playAudio(d.data.name, d.depth);
                }
            });
    }
}

// Rest of the code remains the same...
function buildHierarchy(csvData) {
    const root = { name: "", children: [] };
    csvData.forEach(row => {
        const parts = row.path.split("-");
        let currentNode = root;
        for (let i = 0; i < parts.length; i++) {
            const nodeName = parts[i];
            let childNode = currentNode.children.find(child => child.name === nodeName);
            if (!childNode) {
                childNode = { name: nodeName, children: [] };
                currentNode.children.push(childNode);
            }
            currentNode = childNode;
        }
        currentNode.value = +row.value;
        currentNode.raaga = row.raaga;
    });
    return root;
}

function playAudio(noteName, level) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    const player = new WebAudioFontPlayer();
    player.loader.startLoad(audioContext, "https://surikov.github.io/webaudiofontdata/sound/0010_Chaos_sf2_file.js", "_tone_0010_Chaos_sf2_file");
    player.loader.waitLoad(() => {
        const midiNote = mapNoteToMIDI(noteName, level);
        player.queueWaveTable(audioContext, audioContext.destination, _tone_0010_Chaos_sf2_file, 0, midiNote, 1);
    });
}

function mapNoteToMIDI(noteName, level) {
    const noteMapping = {
        "S": 60,
        "R1": 61,
        "R2": 62,
        "R3": 63,
        "G1": 62,
        "G2": 63,
        "G3": 64,
        "M1": 65,
        "M2": 66,
        "P": 67,
        "D1": 68,
        "D2": 69,
        "D3": 70,
        "N1": 69,
        "N2": 70,
        "N3": 71
    };

    midiNote = noteMapping[noteName] 

    if (noteName === "S" && level > 1) {
        midiNote = 72;
    }

    return midiNote;
}

Promise.all([
    d3.csv("Data/Tabular/Melakarta_Raagams.csv"),
    loadColormap()
]).then(([data]) => {
    const json = buildHierarchy(data);
    createSunburst(json);
});