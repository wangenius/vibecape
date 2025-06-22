import { useState } from 'react';
import { CiMail } from 'react-icons/ci';
import { Examples } from './Examples';
import Hero from './Hero';
import ToolKit from './ToolKit';
import { Input } from './ui/input';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  return (
    <div className="bg-gradient-to-b from-background to-background/95 min-h-screen">
      <Hero setIsScrolled={setIsScrolled} />
      <ToolKit />
    </div>
  );
}
