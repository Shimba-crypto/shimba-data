import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function NotFound() {
  usePageTitle("Not found");
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-[#0a2540]">404</p>
      <p className="text-gray-600 mt-2 mb-6">That page doesn't exist.</p>
      <Link to="/" className="bg-yellow-400 text-[#0a2540] font-bold px-5 py-2.5 rounded-lg hover:bg-yellow-300">Back home</Link>
    </div>
  );
}
