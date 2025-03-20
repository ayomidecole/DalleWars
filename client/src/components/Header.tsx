import SettingsModal from "./SettingsModal";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-5 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="text-primary mr-2">DALL·E</span> <span className="text-gray-800">Wars</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <SettingsModal />
        </div>
      </div>
    </header>
  );
}
