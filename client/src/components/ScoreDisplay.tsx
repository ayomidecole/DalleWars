import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Score } from "@shared/schema";

export default function ScoreDisplay() {
  const { data: scores } = useQuery<Score>({
    queryKey: ['/api/scores'],
  });
  
  if (!scores) {
    return null;
  }
  
  const { dalle2, dalle3, totalVotes } = scores;
  const dalle2Percentage = totalVotes > 0 ? Math.round((dalle2 / totalVotes) * 100) : 0;
  const dalle3Percentage = totalVotes > 0 ? Math.round((dalle3 / totalVotes) * 100) : 0;
  
  return (
    <section className="mb-12">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-gray-50 border border-gray-200">
          <CardContent className="py-4">
            <h3 className="text-lg font-medium mb-2">Current Score</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-semibold text-secondary">{dalle2}</div>
                <div className="text-accent text-sm mt-1">DALL·E 2</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-semibold text-primary">{dalle3}</div>
                <div className="text-accent text-sm mt-1">DALL·E 3</div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
              <div 
                className="bg-secondary h-2.5 rounded-full" 
                style={{ width: `${dalle2Percentage}%` }}
              ></div>
              <div 
                className="bg-primary h-2.5 rounded-full ml-auto -mt-2.5" 
                style={{ width: `${dalle3Percentage}%` }}
              ></div>
            </div>
            
            <div className="text-xs text-accent text-center mt-2">
              Based on {totalVotes} total votes
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
