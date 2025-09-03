document.addEventListener('DOMContentLoaded', function () {
    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();
    
    let nodeIdCounter = 1; 
    const nodeMap = new Map();

    const colors = {
        person: {
            border: '#2B7CE9',
            background: '#97C2FC',
            highlight: { border: '#2B7CE9', background: '#D2E5FF' }
        },
        spouse: {
            border: '#E0417E',
            background: '#F5B7CE',
            highlight: { border: '#E0417E', background: '#FAD5E3' }
        }
    };
    
    function processPerson(person, parentId) {
        if (!person || !person.name) return;
        const personKey = person.name + (person.birth_date || '');
        let currentPersonId;
        if (nodeMap.has(personKey)) {
            currentPersonId = nodeMap.get(personKey);
        } else {
            currentPersonId = nodeIdCounter++;
            let label = person.name;
            if (person.birth_date) {
                label += `\n(${person.birth_date.split('-')[0]})`;
            }
            nodes.add({
                id: currentPersonId,
                label: label,
                color: colors.person,
                title: `Click for details on ${person.name}`,
                fullData: person
            });
            nodeMap.set(personKey, currentPersonId);
        }
        if (parentId) {
            edges.add({ from: parentId, to: currentPersonId, arrows: 'to' });
        }
        const spouses = person.spouse ? [person.spouse] : (person.spouses || []);
        spouses.forEach(spouse => {
            if (!spouse || !spouse.name) return;
            const spouseKey = spouse.name + (spouse.birth_date || '');
            let spouseId;
            if (nodeMap.has(spouseKey)) {
                spouseId = nodeMap.get(spouseKey);
            } else {
                spouseId = nodeIdCounter++;
                let spouseLabel = spouse.name;
                if (spouse.birth_date) {
                    spouseLabel += `\n(${spouse.birth_date.split('-')[0]})`;
                }
                nodes.add({
                    id: spouseId,
                    label: spouseLabel,
                    shape: 'box',
                    color: colors.spouse,
                    title: `Click for details on ${spouse.name}`,
                    fullData: spouse
                });
                nodeMap.set(spouseKey, spouseId);
            }
            edges.add({ from: currentPersonId, to: spouseId, dashes: true, color: { color: '#cccccc' } });
            if (spouse.children && spouse.children.length > 0) {
                spouse.children.forEach(child => processPerson(child, currentPersonId));
            }
        });
        if (person.children && person.children.length > 0) {
            person.children.forEach(child => processPerson(child, currentPersonId));
        }
    }

    processPerson(familyData, null);

    const container = document.getElementById('mynetwork');
    const data = { nodes: nodes, edges: edges };
    
    // UPDATED: Options now use an optimized physics layout
    const options = {
        interaction: {
            hover: true,
            navigationButtons: true,
            keyboard: true
        },
        physics: {
            enabled: true,
            // Using a solver designed to spread out nodes and prevent overlap
            forceAtlas2Based: {
                gravitationalConstant: -45,
                centralGravity: 0.005,
                springLength: 230,
                springConstant: 0.18,
                avoidOverlap: 0.7
            },
            // Stabilize the graph after it loads for much better performance
            stabilization: {
                enabled: true,
                iterations: 200, // Lower iteration count for faster loading
                fit: true
            }
        },
        nodes: {
            shape: 'ellipse',
            font: { size: 14, face: 'Arial' }
        }
    };

    const network = new vis.Network(container, data, options);

    network.on("click", (params) => {
        const detailsContainer = document.getElementById('details');
        const clickedNodeId = params.nodes[0];
        if (clickedNodeId) {
            const nodeData = nodes.get(clickedNodeId).fullData;
            let detailsHtml = `<h3>Details for ${nodeData.name}</h3><ul>`;
            if (nodeData.birth_date) detailsHtml += `<li><strong>Born:</strong> ${nodeData.birth_date}</li>`;
            if (nodeData.death_date) detailsHtml += `<li><strong>Died:</strong> ${nodeData.death_date}</li>`;
            const spouses = nodeData.spouse ? [nodeData.spouse] : (nodeData.spouses || []);
            spouses.forEach(s => {
                if (s.name) detailsHtml += `<li><strong>Spouse:</strong> ${s.name}</li>`;
            });
            detailsHtml += `</ul>`;
            detailsContainer.innerHTML = detailsHtml;
        } else {
            detailsContainer.innerHTML = '<h3>Details</h3><p>Click on a node in the graph to see details here.</p>';
        }
    });
    
    document.getElementById('search-button').addEventListener('click', () => {
        const query = document.getElementById('search-input').value.toLowerCase();
        if (!query) return;
        const matchingNode = nodes.get({
            filter: function (item) {
                return item.label.toLowerCase().includes(query);
            }
        });
        if (matchingNode.length > 0) {
            const nodeId = matchingNode[0].id;
            network.focus(nodeId, {
                scale: 1.2,
                animation: { duration: 1000, easingFunction: 'easeInOutQuad' }
            });
            network.selectNodes([nodeId]);
        } else {
            alert('No person found with that name.');
        }
    });

    document.getElementById('search-input').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            document.getElementById('search-button').click();
        }
    });
});