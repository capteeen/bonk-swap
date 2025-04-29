import Image from "next/image";
import HeaderBar from './components/HeaderBar';
import SwapPanel from './components/SwapPanel';
import SwapDetails from './components/SwapDetails';

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-400 via-yellow-200 to-yellow-100 flex flex-col">
      <HeaderBar />
      <main className="flex-1 flex flex-col items-center justify-start px-4 md:px-0 py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SwapPanel />
        <SwapDetails />
        </div>
      </main>
    </div>
  );
}
