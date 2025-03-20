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
        <Card className="bg-gray-100 border border-gray-200 shadow-sm">
          <CardContent className="py-6">
            <h3 className="text-xl font-medium mb-4 text-gray-800">Current Score</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-semibold text-gray-800">{dalle2}</div>
                <div className="text-gray-700 text-sm font-medium mt-1">Image A</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-semibold text-primary">{dalle3}</div>
                <div className="text-green-700 text-sm font-medium mt-1">Image B</div>
              </div>
            </div>
            
            <div className="w-full bg-gray-300 rounded-full h-3 mt-6">
              <div 
                className="bg-gray-700 h-3 rounded-full" 
                style={{ width: `${dalle2Percentage}%` }}
              ></div>
              <div 
                className="bg-primary h-3 rounded-full ml-auto -mt-3" 
                style={{ width: `${dalle3Percentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between mt-1 text-xs font-medium">
              <div className="text-gray-700">{dalle2Percentage}%</div>
              <div className="text-primary">{dalle3Percentage}%</div>
            </div>
            
            <div className="text-sm text-gray-700 text-center mt-4 font-medium">
              Based on {totalVotes} total votes
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
