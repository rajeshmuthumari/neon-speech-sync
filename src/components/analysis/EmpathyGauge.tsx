import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, MessageCircle } from "lucide-react";

interface EmpathyGaugeProps {
  empathyScore: number;
  authenticityScore: number;
  inclusivePhrases: number;
  egoCentricPhrases: number;
}

export function EmpathyGauge({ 
  empathyScore, 
  authenticityScore, 
  inclusivePhrases, 
  egoCentricPhrases 
}: EmpathyGaugeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Needs Improvement';
  };

  const phraseRatio = inclusivePhrases + egoCentricPhrases > 0 
    ? (inclusivePhrases / (inclusivePhrases + egoCentricPhrases)) * 100 
    : 50;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Connection Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Empathy Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Empathy</span>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold ${getScoreColor(empathyScore)}`}>
                {empathyScore}%
              </span>
              <p className="text-xs text-muted-foreground">
                {getScoreLabel(empathyScore)}
              </p>
            </div>
          </div>
          <Progress value={empathyScore} className="h-2" />
        </div>

        {/* Authenticity Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Authenticity</span>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold ${getScoreColor(authenticityScore)}`}>
                {authenticityScore}%
              </span>
              <p className="text-xs text-muted-foreground">
                {getScoreLabel(authenticityScore)}
              </p>
            </div>
          </div>
          <Progress value={authenticityScore} className="h-2" />
        </div>

        {/* Language Analysis */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Language Analysis</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-500">{inclusivePhrases}</div>
              <div className="text-xs text-muted-foreground">Inclusive Phrases</div>
            </div>
            
            <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="text-2xl font-bold text-red-500">{egoCentricPhrases}</div>
              <div className="text-xs text-muted-foreground">Ego-Centric Phrases</div>
            </div>
          </div>

          {/* Inclusive vs Ego-Centric Ratio */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Inclusive Language</span>
              <span>{phraseRatio.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                style={{ width: `${phraseRatio}%` }}
              />
              <div 
                className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-400 transition-all duration-500"
                style={{ width: `${100 - phraseRatio}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>More Inclusive</span>
              <span>More Ego-Centric</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}