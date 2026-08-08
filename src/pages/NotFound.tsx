import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function NotFound() {
  usePageTitle("Not found");
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <p className="text-5xl font-bold text-gray-900">404</p>
      <p className="text-gray-500 mt-2 mb-6">That page doesn't exist.</p>
      <Link to="/" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-medium">Back home</Link>
    </div>
  );
}
