import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm transition-colors duration-200">
      <div className="container mx-auto px-4 py-5 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="text-primary mr-2 dark:text-primary">DALL·E</span> 
            <span className="text-gray-800 dark:text-gray-200">Wars</span>
          </h1>
        </div>
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
