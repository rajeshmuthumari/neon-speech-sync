import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Mic, Video, TrendingUp, BarChart3, Users, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect unauthenticated users to auth page
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-speech-primary"></div>
      </div>
    );
  }

  // Don't render content if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-speech-primary" />
            <h1 className="text-xl font-bold gradient-text">AI Speech Analysis</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-5xl font-bold gradient-text">
            Advanced Political Speech Analysis
          </h1>
          <p className="text-xl text-muted-foreground">
            Analyze political speeches with AI-powered insights including sentiment analysis, 
            empathy scoring, topic classification, and visual behavioral analysis
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => navigate("/dashboard")}
          >
            Start Analysis
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-speech-primary" />
                Video Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Upload video files for comprehensive analysis of both audio content and visual cues including facial expressions and body language.
              </p>
            </CardContent>
          </Card>

          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-speech-primary" />
                Speech-to-Text
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced transcription supporting Hindi and Marathi with high accuracy using OpenAI Whisper technology.
              </p>
            </CardContent>
          </Card>

          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-speech-primary" />
                Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Real-time sentiment detection and emotional analysis with confidence scoring and detailed breakdowns.
              </p>
            </CardContent>
          </Card>

          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-speech-primary" />
                Empathy Scoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Measure empathy levels by analyzing inclusive language patterns versus ego-centric expressions.
              </p>
            </CardContent>
          </Card>

          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-speech-primary" />
                Topic Classification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automatically classify speech content into political domains: development, health, education, employment, and more.
              </p>
            </CardContent>
          </Card>

          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-speech-primary" />
                Visual Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analyze facial micro-expressions, eye contact, and body language to understand authenticity and engagement levels.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
