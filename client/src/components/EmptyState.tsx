import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

export default function EmptyState() {
  return (
    <div id="emptyState" className="py-20 text-center">
      <div className="max-w-md mx-auto">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="pt-6 py-12">
            <ImageIcon className="h-20 w-20 mx-auto text-gray-400 mb-6" />
            <h3 className="text-2xl font-semibold mb-3 text-gray-800">No comparisons yet</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Enter a prompt above to generate a comparison between DALL·E 2 and DALL·E 3.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
