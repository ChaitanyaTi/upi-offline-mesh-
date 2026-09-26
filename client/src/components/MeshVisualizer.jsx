import React, { useEffect, useState, useRef } from 'react';

const MeshVisualizer = ({ socket, nodes, onReachBridge }) => {
  const [packets, setPackets] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('meshGossipVisual', (data) => {
      // data: { tx, path: ['A', 'C', 'Bridge'] }
      animatePacket(data.path, data.tx);
    });

    return () => socket.off('meshGossipVisual');
  }, [socket, nodes]);

  const animatePacket = async (path, tx) => {
    if (path.length < 2) return;
    
    const packetId = Math.random().toString(36).substr(2, 9);
    
    // Add packet at starting node
    setPackets(prev => [...prev, {
      id: packetId,
      currentNode: path[0],
      nextNode: path[1],
      progress: 0,
      pathIndex: 0,
      path,
      tx
    }]);

    let currentIndex = 0;

    const moveNext = () => {
      setTimeout(() => {
        currentIndex++;
        if (currentIndex < path.length - 1) {
          setPackets(prev => prev.map(p => {
            if (p.id === packetId) {
              return { ...p, currentNode: path[currentIndex], nextNode: path[currentIndex + 1], pathIndex: currentIndex };
            }
            return p;
          }));
          moveNext();
        } else {
          // Reached end (bridge)
          setTimeout(() => {
            setPackets(prev => prev.filter(p => p.id !== packetId));
            onReachBridge(tx);
          }, 600); // travel time
        }
      }, 600);
    };

    moveNext();
  };

  const getNodePosition = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { left: '50%', top: '50%' };
    return { left: `${node.x}%`, top: `${node.y}%` };
  };

  return (
    <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
      <h2 className="panel-title">Mesh Network Simulator</h2>
      <div className="mesh-canvas" ref={canvasRef}>
        {/* Draw Edges */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}>
          {nodes.map((node, i) => (
             nodes.slice(i+1).map((target, j) => {
                // draw connections between close nodes
                const dist = Math.sqrt(Math.pow(node.x - target.x, 2) + Math.pow(node.y - target.y, 2));
                if (dist < 40) {
                    return (
                        <line 
                            key={`${node.id}-${target.id}`}
                            x1={`${node.x}%`} y1={`${node.y}%`}
                            x2={`${target.x}%`} y2={`${target.y}%`}
                            stroke="rgba(255, 255, 255, 0.05)"
                            strokeWidth="2"
                        />
                    )
                }
                return null;
             })
          ))}
        </svg>

        {/* Draw Nodes */}
        {nodes.map(node => (
          <div 
            key={node.id} 
            className={`node ${node.isBridge ? 'bridge' : ''}`}
            style={getNodePosition(node.id)}
          >
            {node.id}
          </div>
        ))}

        {/* Draw Packets */}
        {packets.map(packet => {
           const startPos = getNodePosition(packet.currentNode);
           const endPos = getNodePosition(packet.nextNode);
           
           return (
             <div 
               key={packet.id}
               className="packet"
               style={{
                 left: startPos.left,
                 top: startPos.top,
                 transform: `translate(-50%, -50%)`, // Add transition logic for real animation or use CSS animations
                 animation: `movePacket 0.6s linear forwards`
               }}
             >
                <style>
                    {`
                    @keyframes movePacket {
                        0% { left: ${startPos.left}; top: ${startPos.top}; }
                        100% { left: ${endPos.left}; top: ${endPos.top}; }
                    }
                    `}
                </style>
             </div>
           )
        })}
      </div>
    </div>
  );
};

export default MeshVisualizer;
