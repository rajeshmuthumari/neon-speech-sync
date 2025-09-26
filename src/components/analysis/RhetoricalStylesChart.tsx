import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Target, Users, Eye } from "lucide-react";

interface RhetoricalStyle {
  count: number;
  examples: string[];
}

interface RhetoricalStyles {
  promises?: RhetoricalStyle;
  blame_opponents?: RhetoricalStyle;
  calls_to_unity?: RhetoricalStyle;
  visionary_statements?: RhetoricalStyle;
}

interface RhetoricalStylesChartProps {
  rhetoricalStyles: RhetoricalStyles;
  urgencyLevel: string;
}

const COLORS = {
  promises: '#10b981',
  blame_opponents: '#ef4444', 
  calls_to_unity: '#3b82f6',
  visionary_statements: '#8b5cf6',
};

const ICONS = {
  promises: Target,
  blame_opponents: MessageSquare,
  calls_to_unity: Users,  
  visionary_statements: Eye,
};

export function RhetoricalStylesChart({ rhetoricalStyles, urgencyLevel }: RhetoricalStylesChartProps) {
  const data = Object.entries(rhetoricalStyles || {}).map(([style, data]) => ({
    name: style.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: data?.count || 0,
    examples: data?.examples || [],
    color: COLORS[style as keyof typeof COLORS],
  })).filter(item => item.value > 0);

  const totalCount = data.reduce((sum, item) => sum + item.value, 0);

  const getUrgencyColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-red-500 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Rhetorical Analysis</span>
          <Badge className={`${getUrgencyColor(urgencyLevel)} text-xs font-semibold`}>
            {urgencyLevel} Urgency
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.length > 0 ? (
          <>
            {/* Pie Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg max-w-xs">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">{data.value} instances ({((data.value/totalCount)*100).toFixed(1)}%)</p>
                            {data.examples.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Example:</p>
                                <p className="text-xs italic">"{data.examples[0]}"</p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-3">
              {data.map((item) => {
                const IconComponent = ICONS[item.name.toLowerCase().replace(/ /g, '_') as keyof typeof ICONS];
                return (
                  <div key={item.name} className="p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {IconComponent && <IconComponent className="w-4 h-4" style={{ color: item.color }} />}
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold" style={{ color: item.color }}>
                          {item.value}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {((item.value/totalCount)*100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    {item.examples.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Examples:</p>
                        {item.examples.slice(0, 2).map((example, idx) => (
                          <p key={idx} className="text-xs italic text-muted-foreground pl-2 border-l-2" 
                             style={{ borderColor: item.color }}>
                            "{example}"
                          </p>
                        ))}
                        {item.examples.length > 2 && (
                          <p className="text-xs text-muted-foreground pl-2">
                            +{item.examples.length - 2} more examples
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No rhetorical patterns detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}