import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Sword, Eye, Minus, AlertTriangle } from "lucide-react";

interface CallToAction {
  timestamp: string;
  text: string;
  type: string;
}

interface PoliticalPositioningCardProps {
  positioning: string;
  callToActions: CallToAction[];
}

const POSITIONING_CONFIG = {
  'Aggressor': {
    icon: Sword,
    color: 'text-red-500 bg-red-50 border-red-200',
    description: 'Takes offensive stance, challenges opponents directly'
  },
  'Defender': {
    icon: Shield,
    color: 'text-blue-500 bg-blue-50 border-blue-200', 
    description: 'Defensive posture, justifies actions and policies'
  },
  'Visionary': {
    icon: Eye,
    color: 'text-purple-500 bg-purple-50 border-purple-200',
    description: 'Forward-looking, focuses on future possibilities'
  },
  'Neutral': {
    icon: Minus,
    color: 'text-gray-500 bg-gray-50 border-gray-200',
    description: 'Balanced approach, avoids extreme positions'
  }
};

const ACTION_TYPES = {
  'electoral': { color: 'bg-blue-100 text-blue-800', label: 'Electoral' },
  'participation': { color: 'bg-green-100 text-green-800', label: 'Participation' },
  'support': { color: 'bg-purple-100 text-purple-800', label: 'Support' },
  'awareness': { color: 'bg-yellow-100 text-yellow-800', label: 'Awareness' },
  'protest': { color: 'bg-red-100 text-red-800', label: 'Protest' },
  'default': { color: 'bg-gray-100 text-gray-800', label: 'Action' }
};

export function PoliticalPositioningCard({ positioning, callToActions }: PoliticalPositioningCardProps) {
  const config = POSITIONING_CONFIG[positioning as keyof typeof POSITIONING_CONFIG] || {
    icon: AlertTriangle,
    color: 'text-gray-500 bg-gray-50 border-gray-200',
    description: 'Position analysis pending'
  };

  const IconComponent = config.icon;

  const getActionTypeStyle = (type: string) => {
    return ACTION_TYPES[type as keyof typeof ACTION_TYPES] || ACTION_TYPES.default;
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="w-5 h-5" />
          Political Positioning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Positioning Badge */}
        <div className="text-center py-4">
          <Badge className={`${config.color} text-lg font-bold px-4 py-2 mb-2`}>
            {positioning}
          </Badge>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        {/* Call to Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Call-to-Action Statements ({callToActions?.length || 0})
          </h4>
          
          {callToActions && callToActions.length > 0 ? (
            <div className="space-y-3">
              {callToActions.map((action, index) => {
                const typeStyle = getActionTypeStyle(action.type);
                return (
                  <div key={index} className="p-3 rounded-lg border bg-card/50">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`${typeStyle.color} text-xs`}>
                        {typeStyle.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        @ {action.timestamp}
                      </span>
                    </div>
                    <p className="text-sm italic">"{action.text}"</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No explicit calls-to-action detected</p>
            </div>
          )}
        </div>

        {/* Action Type Distribution */}
        {callToActions && callToActions.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground">Action Types</h5>
            <div className="flex flex-wrap gap-1">
              {Object.entries(
                callToActions.reduce((acc, action) => {
                  acc[action.type] = (acc[action.type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => {
                const typeStyle = getActionTypeStyle(type);
                return (
                  <Badge key={type} className={`${typeStyle.color} text-xs`}>
                    {typeStyle.label} ({count})
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}