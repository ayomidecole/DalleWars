import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

export default function EmptyState() {
  return (
    <div id="emptyState" className="py-20 text-center">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6 py-10">
            <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-medium mb-2">No comparisons yet</h3>
            <p className="text-accent mb-6">
              Enter a prompt above to generate a comparison between DALL·E 2 and DALL·E 3.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
