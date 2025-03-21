import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

export default function EmptyState() {
  return (
    <div id="emptyState" className="py-20 text-center">
      <div className="max-w-md mx-auto">
        <Card className="shadow-sm bg-white border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:card-glow transition-all duration-200">
          <CardContent className="pt-6 py-12">
            <ImageIcon className="h-20 w-20 mx-auto text-gray-400 dark:text-gray-500 mb-6 transition-colors" />
            <h3 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-200 transition-colors">No comparisons yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg transition-colors">
              Enter a prompt above to generate a comparison between DALL·E 2 and DALL·E 3.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
