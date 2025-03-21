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
    <section className="my-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none dark:card-glow transition-all duration-200">
          <CardContent className="py-5">
            <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200 dark:heading-glow transition-colors">Current Score</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center group cursor-pointer">
                <div className="text-4xl font-semibold text-gray-800 dark:text-gray-300 score-animate dark:group-hover:text-gray-100 dark:text-shadow-glow transition-all duration-300">{dalle2}</div>
                <div className="text-gray-700 dark:text-gray-400 text-sm font-medium mt-1 transition-colors">DALL·E 2</div>
              </div>
              
              <div className="text-center group cursor-pointer">
                <div className="text-4xl font-semibold text-primary dark:text-primary/90 score-animate dark:group-hover:text-primary dark:text-shadow-glow transition-all duration-300">{dalle3}</div>
                <div className="text-green-700 dark:text-green-500 text-sm font-medium mt-1 transition-colors">DALL·E 3</div>
              </div>
            </div>
            
            <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3 mt-6 transition-colors">
              <div 
                className="bg-gray-700 dark:bg-gray-500 h-3 rounded-full transition-colors dark:shadow-[0_0_5px_rgba(255,255,255,0.15)] dark:hover:shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all duration-200" 
                style={{ width: `${dalle2Percentage}%` }}
              ></div>
              <div 
                className="bg-primary dark:bg-primary/90 h-3 rounded-full ml-auto -mt-3 transition-colors dark:shadow-[0_0_8px_rgba(16,163,127,0.3)] dark:hover:shadow-[0_0_12px_rgba(16,163,127,0.5)] transition-all duration-200" 
                style={{ width: `${dalle3Percentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between mt-1 text-xs font-medium">
              <div className="text-gray-700 dark:text-gray-400 transition-colors">{dalle2Percentage}%</div>
              <div className="text-primary dark:text-primary/90 transition-colors">{dalle3Percentage}%</div>
            </div>
            
            <div className="text-sm text-gray-700 dark:text-gray-400 text-center mt-4 font-medium transition-colors">
              Based on {totalVotes} total votes
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
