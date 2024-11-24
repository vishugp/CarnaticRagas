const width = 600;
const height = 600;
const radius = Math.min(width, height) / 2 - 50;
let selectedNode = null;
let isPlayingSequence = false;
let currentBreadcrumbNodes = []; // Store current breadcrumb nodes
let raagamsData = [];
let tone = "0490_Chaos_sf2_file"


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
        playAudioWithOctave(notes[i], depths[i], 0);
        await sleep(noteDelay);
    }

    // Reset all highlights after sequence
    trailElements
        .style("transform", "scale(1)")
        .style("box-shadow", "none")
        .style("z-index", "0");
}

function updateDerivedRaagams(raga_rank) {
    const derivedRaagams = raagamsData.filter(row => row.Raga_Rank === raga_rank);
    const tableBody = d3.select("#derived-raagams-body");
    
    // Clear existing rows
    tableBody.html("");
    
    // Add new rows with click functionality
    derivedRaagams.forEach(raagam => {
        const row = tableBody.append("tr")
            .style("cursor", "pointer")
            .on("click", async function() {
                if (!isPlayingSequence) {
                    isPlayingSequence = true;
                    
                    // Parse the paths into arrays of notes
                    const aarohanam = raagam.path.split("-");
                    const avarohanam = raagam.avro_path.split("-");
                    
                    // Map depths for the notes (1-based indexing)
                    const aarohanamDepths = aarohanam.map((_, i) => i + 1);
                    const avarohanamDepths = avarohanam.map((_, i) => avarohanam.length - i);
                    
                    // Highlight the clicked row
                    d3.select(this)
                        .style("background-color", "#f0f0f0")
                        .style("transition", "background-color 0.3s");

                    // Update breadcrumb trail if it exists
                    const trailElements = d3.select("#trail").selectAll(".trailpart");
                    if (!trailElements.empty()) {
                        // Play ascending sequence (aarohanam)
                        for (let i = 0; i < aarohanam.length; i++) {
                            // Reset all highlights
                            trailElements
                                .style("transform", "scale(1)")
                                .style("box-shadow", "none")
                                .style("z-index", "0");
                            
                            // Find and highlight matching note in breadcrumb
                            trailElements.each(function(d, index) {
                                if (d.data.name === aarohanam[i]) {
                                    // Special handling for Sa (S)
                                    if (d.data.name === 'S') {
                                        // In aarohanam, use first S for all occurrences except the last
                                        const isLastSa = i === aarohanam.length - 1;
                                        const isFirstSaInBreadcrumb = index === 0;
                                        
                                        if ((isLastSa && !isFirstSaInBreadcrumb) || 
                                            (!isLastSa && isFirstSaInBreadcrumb)) {
                                            d3.select(this)
                                                .style("transform", "scale(1.1)")
                                                .style("box-shadow", "0 0 14px #FFA500")
                                                .style("z-index", "1");
                                        }
                                    } else {
                                        // For all other notes, highlight as normal
                                        d3.select(this)
                                            .style("transform", "scale(1.1)")
                                            .style("box-shadow", "0 0 14px #FFA500")
                                            .style("z-index", "1");
                                    }
                                }
                            });
                            
                            playAudioWithOctave(aarohanam[i], aarohanamDepths[i], 0);
                            await sleep(500);
                        }
                        
                        await sleep(1000); // Pause between ascending and descending
                        
                        // Play descending sequence (avarohanam)
                        for (let i = 0; i < avarohanam.length; i++) {
                            // Reset all highlights
                            trailElements
                                .style("transform", "scale(1)")
                                .style("box-shadow", "none")
                                .style("z-index", "0");
                            
                            // Find and highlight matching note in breadcrumb
                            trailElements.each(function(d, index) {
                                if (d.data.name === avarohanam[i]) {
                                    // Special handling for Sa (S)
                                    if (d.data.name === 'S') {
                                        // In avarohanam, use second S for all occurrences except the first
                                        const isFirstSa = i === 0;
                                        const isFirstSaInBreadcrumb = index === 0;
                                        
                                        if ((isFirstSa && !isFirstSaInBreadcrumb) || 
                                            (!isFirstSa && isFirstSaInBreadcrumb)) {
                                            d3.select(this)
                                                .style("transform", "scale(1.1)")
                                                .style("box-shadow", "0 0 14px #FFA500")
                                                .style("z-index", "1");
                                        }
                                    } else {
                                        // For all other notes, highlight as normal
                                        d3.select(this)
                                            .style("transform", "scale(1.1)")
                                            .style("box-shadow", "0 0 14px #FFA500")
                                            .style("z-index", "1");
                                    }
                                }
                            });
                            
                            playAudioWithOctave(avarohanam[i], avarohanamDepths[i], 0);
                            await sleep(500);
                        }
                        
                        // Reset all highlights at the end
                        trailElements
                            .style("transform", "scale(1)")
                            .style("box-shadow", "none")
                            .style("z-index", "0");
                    }
                    
                    // Reset row highlighting
                    d3.select(this)
                        .style("background-color", "")
                        .style("transition", "background-color 0.3s");
                    
                    isPlayingSequence = false;
                }
            })
            .on("mouseover", function() {
                if (!isPlayingSequence) {
                    d3.select(this)
                        .style("background-color", "#f5f5f5")
                        .style("transition", "background-color 0.3s");
                }
            })
            .on("mouseout", function() {
                if (!isPlayingSequence) {
                    d3.select(this)
                        .style("background-color", "")
                        .style("transition", "background-color 0.3s");
                }
            });
            
        // Add cells to the row
        row.selectAll("td")
            .data([raagam.raaga, raagam.path, raagam.avro_path])
            .enter()
            .append("td")
            .text(d => d);
    });
    
    // Show the table
    d3.select("#derived-raagams").style("display", "block");
}

function createSunburst(json) {
    // Track arrow key states
    const keyStates = {
        ArrowUp: false,
        ArrowDown: false
    };

    // Add arrow key listeners
    document.addEventListener('keydown', function(event) {
        if (event.key in keyStates) {
            keyStates[event.key] = true;
        }
    });

    document.addEventListener('keyup', function(event) {
        if (event.key in keyStates) {
            keyStates[event.key] = false;
        }
    });

    // Modified keyboard event listener for number keys
    document.addEventListener('keydown', function(event) {
        if (!isPlayingSequence && currentBreadcrumbNodes.length > 0) {
            // Convert key to number and check if it's between 1-8
            const keyNum = parseInt(event.key);
            if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 8) {
                const index = keyNum - 1; // Convert to 0-based index
                
                // Check if this index exists in current breadcrumb
                if (index < currentBreadcrumbNodes.length) {
                    const node = currentBreadcrumbNodes[index];
                    
                    // Highlight the corresponding breadcrumb
                    const breadcrumbs = d3.select("#trail").selectAll(".trailpart");
                    breadcrumbs.each(function(d, i) {
                        if (i === index) {
                            d3.select(this)
                                .style("transform", "scale(1.1)")
                                .style("box-shadow", "0 0 14px #FFA500")
                                .style("z-index", "1");
                            
                            setTimeout(() => {
                                if (!isPlayingSequence) {
                                    d3.select(this)
                                        .style("transform", "scale(1)")
                                        .style("box-shadow", "none")
                                        .style("z-index", "0");
                                }
                            }, 300);
                        }
                    });
                    
                    // Determine octave shift based on arrow keys
                    let octaveShift = 0;
                    if (keyStates.ArrowUp) {
                        octaveShift = 1;
                    } else if (keyStates.ArrowDown) {
                        octaveShift = -1;
                    }
                    
                    // Play the corresponding note with octave shift
                    playAudioWithOctave(node.data.name, node.depth, octaveShift);
                }
            }
        }
    });

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
            currentBreadcrumbNodes = [];
            paths.style("opacity", 1);
            labels.style("visibility", "visible");
            d3.select("#trail").selectAll("*").remove();
            d3.select("#explanation").style("visibility", "hidden");
            d3.select("#derived-raagams").style("display", "none"); // Add this line
        }
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            d3.selectAll('*').interrupt();
            
            resetVisualization();
        }
    });

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


    // Add a group for labels and ensure it is appended before the paths
    const labelLayer = svg.append("g").attr("class", "label-layer");

    // Add labels to the label layer
    const labels = labelLayer.selectAll("text")
        .data(root.descendants())
        .enter().append("text")
        .attr("transform", function (d) {
            const angle = (d.x0 + d.x1) / 2 * (180 / Math.PI) - 90;
            const r = ((d.depth + 0.27) / maxDepth) * radius;
            return `rotate(${angle}) translate(${r},0) rotate(${angle > 90 ? 180 : 0})`;
        })
        .attr("text-anchor", d => ((d.x0 + d.x1) / 2) > Math.PI ? "end" : "start")
        .style("font-size", "12px")
        .style("fill", "black")
        .style("visibility", "visible")
        .text(d => d.data.name);

    // Append paths after labels to ensure they are on top
    const paths = svg.append("g").attr("class", "path-layer")
        .selectAll("path")
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
                    
                // Add this line to update derived raagams
                const matchingRaagam = raagamsData.find(r => r.raaga === raagaName);
                if (matchingRaagam) {
                    updateDerivedRaagams(matchingRaagam.Raga_Rank);
                }
            }
        }
        
        playAudioWithOctave(d.data.name, d.depth, 0);
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
        // Update the global currentBreadcrumbNodes
        currentBreadcrumbNodes = nodeArray;

        const trail = d3.select("#trail").selectAll("div")
            .data(nodeArray);

        trail.exit().remove();

        trail
            .style("color", "white")
            .style("background-color", d => getColorByDepth(d))
            .text((d, i) => `${d.data.name}`);

        trail.enter()
            .append("div")
            .attr("class", "trailpart")
            .style("cursor", "pointer")
            .style("color", "white")
            .style("background-color", d => getColorByDepth(d))
            .style("transition", "all 0.2s ease-in-out")
            .text((d, i) => `${d.data.name}`)
            .on("click", function(event, d) {
                event.stopPropagation();
                if (!isPlayingSequence) {
                    d3.select(this)
                        .style("transform", "scale(1.1)")
                        .style("box-shadow", "0 0 14px #FFA500")
                        .style("z-index", "1");
                    
                    setTimeout(() => {
                        if (!isPlayingSequence) {
                            d3.select(this)
                                .style("transform", "scale(1)")
                                .style("box-shadow", "none")
                                .style("z-index", "0");
                        }
                    }, 300);
                    
                    playAudioWithOctave(d.data.name, d.depth, 0);
                }
            });
    }
}

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

function playAudioWithOctave(noteName, level, octaveShift = 0) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    const player = new WebAudioFontPlayer();
    player.loader.startLoad(audioContext, "https://surikov.github.io/webaudiofontdata/sound/0460_FluidR3_GM_sf2_file.js", "_tone_0460_FluidR3_GM_sf2_file");
    player.loader.waitLoad(() => {
        const midiNote = mapNoteToMIDI(noteName, level) + (octaveShift * 12);
        player.queueWaveTable(audioContext, audioContext.destination, _tone_0460_FluidR3_GM_sf2_file, 0, midiNote, 1);
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
    d3.csv("Data/Tabular/Raagams.csv"),
    loadColormap()
]).then(([data]) => {
    raagamsData = data; // Store the full data
    const filteredData = data.filter(row => row.Melakarta === "1.0");
    const json = buildHierarchy(filteredData);
    createSunburst(json);
});