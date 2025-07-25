import { ArrowDown } from "lucide-react";

export default function ArrowDivider() {
  return (
    <div className="flex justify-center relative -my-5.5 z-10">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl  border-5 border-white flex items-center justify-center">
        <ArrowDown className="w-6 h-6 text-gray-600" />
      </div>
    </div>
  );
}
