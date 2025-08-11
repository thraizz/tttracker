import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users } from 'lucide-react';
import { Match, Player } from '@/types/tournament';

interface TournamentGraphProps {
  matches: Match[];
  players: Player[];
}

const TournamentGraph = ({ matches, players }: TournamentGraphProps) => {
  // Group matches by rounds
  const matchesByRound = useMemo(() => {
    const rounds: { [round: number]: Match[] } = {};
    matches.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = [];
      }
      rounds[match.round].push(match);
    });
    return rounds;
  }, [matches]);

  const maxRound = Math.max(...Object.keys(matchesByRound).map(Number));

  // Create nodes and edges for the bracket
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Calculate spacing
    const nodeWidth = 200;
    const nodeHeight = 80;
    const horizontalSpacing = 300;
    const verticalSpacing = 120;

    Object.entries(matchesByRound).forEach(([roundStr, roundMatches]) => {
      const round = parseInt(roundStr);
      const roundSize = roundMatches.length;
      const startY = -(roundSize * (nodeHeight + verticalSpacing)) / 2;

      roundMatches.forEach((match, index) => {
        const x = round * horizontalSpacing;
        const y = startY + index * (nodeHeight + verticalSpacing);

        // Create match node
        nodes.push({
          id: match.id,
          type: 'default',
          position: { x, y },
          data: {
            label: (
              <div className="text-center p-2">
                <div className="text-xs text-muted-foreground mb-1">Round {round}</div>
                <div className="font-medium text-sm mb-1">
                  {match.player1.name}
                </div>
                <div className="text-xs text-muted-foreground">vs</div>
                <div className="font-medium text-sm mb-1">
                  {match.player2.name}
                </div>
                {match.status === 'completed' && match.score && (
                  <Badge variant="secondary" className="text-xs">
                    {match.score.player1Score} - {match.score.player2Score}
                  </Badge>
                )}
                {match.status === 'pending' && (
                  <Badge variant="outline" className="text-xs">Pending</Badge>
                )}
                {match.winner && (
                  <div className="text-xs text-table-green mt-1">
                    Winner: {match.winner.name}
                  </div>
                )}
              </div>
            ),
          },
          style: {
            width: nodeWidth,
            height: nodeHeight + 20,
            backgroundColor: match.status === 'completed' ? 'hsl(var(--muted))' : 'white',
            border: match.status === 'completed' ? '2px solid hsl(var(--table-green))' : '1px solid hsl(var(--border))',
            borderRadius: '8px',
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });

        // Create edges to next round if this isn't the final
        if (round < maxRound) {
          const nextRoundMatches = matchesByRound[round + 1] || [];
          const nextMatchIndex = Math.floor(index / 2);
          const nextMatch = nextRoundMatches[nextMatchIndex];

          if (nextMatch) {
            edges.push({
              id: `${match.id}-to-${nextMatch.id}`,
              source: match.id,
              target: nextMatch.id,
              type: 'smoothstep',
              animated: match.status === 'completed',
              style: {
                stroke: match.status === 'completed' ? 'hsl(var(--table-green))' : 'hsl(var(--muted-foreground))',
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: match.status === 'completed' ? 'hsl(var(--table-green))' : 'hsl(var(--muted-foreground))',
              },
            });
          }
        }
      });
    });

    // Add final winner node if tournament is complete
    const finalMatch = matches.find(m => m.round === maxRound && m.status === 'completed');
    if (finalMatch && finalMatch.winner) {
      const winnerX = maxRound * horizontalSpacing + horizontalSpacing;
      nodes.push({
        id: 'winner',
        type: 'default',
        position: { x: winnerX, y: -nodeHeight / 2 },
        data: {
          label: (
            <div className="text-center p-3">
              <Trophy className="w-8 h-8 text-victory-gold mx-auto mb-2" />
              <div className="font-bold text-lg text-victory-gold">Champion</div>
              <div className="font-semibold">{finalMatch.winner.name}</div>
            </div>
          ),
        },
        style: {
          width: nodeWidth,
          height: nodeHeight + 20,
          backgroundColor: 'hsl(var(--victory-gold) / 0.1)',
          border: '2px solid hsl(var(--victory-gold))',
          borderRadius: '12px',
        },
        targetPosition: Position.Left,
      });

      edges.push({
        id: `${finalMatch.id}-to-winner`,
        source: finalMatch.id,
        target: 'winner',
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: 'hsl(var(--victory-gold))',
          strokeWidth: 3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--victory-gold))',
        },
      });
    }

    return { nodes, edges };
  }, [matches, matchesByRound, maxRound]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  if (matches.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Tournament Structure</h3>
        <p className="text-muted-foreground">Add players and start a tournament to see the bracket visualization.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="w-5 h-5 text-ping-pong" />
        <h2 className="text-xl font-semibold">Tournament Bracket</h2>
        <Badge variant="secondary">{matches.length} matches</Badge>
      </div>
      
      <div className="h-96 w-full border rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          style={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}
        >
          <Controls />
          <Background color="hsl(var(--muted-foreground))" gap={16} />
        </ReactFlow>
      </div>
    </Card>
  );
};

export default TournamentGraph;