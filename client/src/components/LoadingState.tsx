export default function LoadingState() {
  return (
    <div className="mb-12 py-16 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-6"></div>
      <p className="text-accent">Generating images...</p>
    </div>
  );
}
